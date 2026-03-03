import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import * as readline from "readline";
import { join } from "path";
import { ConfigService } from "@nestjs/config";
import {
  NotificacoesService,
  CreateNotificacaoDto,
} from "../notificacoes/services/notificacoes.service";
import {
  TipoNotificacao,
  PrioridadeNotificacao,
} from "../notificacoes/entities";
import { EscavadorStatus } from "./types";
import { StartEscavadorDto } from "./dto/start-escavador.dto";
import { HookEscavadorDto } from "./dto/hook-escavador.dto";

@Injectable()
export class EscavadorSeirnService implements OnModuleDestroy {
  private readonly logger = new Logger(EscavadorSeirnService.name);
  private child?: ChildProcessWithoutNullStreams;
  private status: EscavadorStatus = { running: false };
  private stdoutReader?: readline.Interface;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  async getStatus(): Promise<EscavadorStatus> {
    await this.hydrateLastFromDbIfNeeded();
    return this.status;
  }

  async start(
    dto: StartEscavadorDto,
    usuarioId: number,
  ): Promise<EscavadorStatus> {
    await this.stop(); // garante um watcher por vez

    const scriptPath = join(process.cwd(), "webscraping-service", "scrapy.py");
    const cwd = join(process.cwd(), "webscraping-service");

    const env = {
      ...process.env,
      LAUNCH_URL: dto.launchUrl || process.env.LAUNCH_URL,
      SEI_ORGAO_VALOR: "17", // fixo conforme solicitado
      SEI_USUARIO: dto.usuario || process.env.SEI_USUARIO,
      SEI_SENHA: dto.senha || process.env.SEI_SENHA,
      SEI_WATCH_INTERVAL: String(dto.watchInterval ?? 10),
      SEI_WATCH_BEEP: dto.beepOnNew ? "1" : "0",
      SEI_CLICK_LAST: dto.clickLast ? "1" : "0",
    };

    const pythonBin = process.env.ESCAVADOR_PYTHON_BIN || "python3";

    this.logger.log(`Iniciando escavador SEIRN com ${pythonBin} ${scriptPath}`);
    this.child = spawn(pythonBin, [scriptPath], { cwd, env });
    this.status = {
      running: true,
      pid: this.child.pid,
      startedAt: new Date(),
      lastOutput: undefined,
      lastProcess: undefined,
      lastTitle: undefined,
      lastLink: undefined,
      lastChangeAt: undefined,
      lastError: undefined,
      config: {
        orgaoValor: "17",
        usuario: env.SEI_USUARIO,
        watchInterval: Number(env.SEI_WATCH_INTERVAL),
        beepOnNew: env.SEI_WATCH_BEEP === "1",
        clickLast: env.SEI_CLICK_LAST === "1",
        launchUrl: env.LAUNCH_URL,
      },
    };

    this.attachStreams(usuarioId);

    this.child.on("exit", (code, signal) => {
      this.logger.warn(
        `Escavador SEIRN finalizado (code=${code}, signal=${signal})`,
      );
      this.status.running = false;
      this.status.stoppedAt = new Date();
    });

    this.child.on("error", (err) => {
      this.logger.error(`Erro ao iniciar escavador: ${err.message}`, err.stack);
      this.status.lastError = err.message;
      this.status.running = false;
    });

    return this.status;
  }

  async webhook(data: HookEscavadorDto, tokenFromHeader?: string) {
    const expected = process.env.ESCAVADOR_WEBHOOK_TOKEN;
    const provided = tokenFromHeader?.replace(/^Bearer\s+/i, "") || data.token;
    if (!expected || expected !== provided) {
      throw new ForbiddenException("Token inválido para webhook do escavador");
    }

    const usuarioId =
      data.usuarioId ||
      Number(process.env.ESCAVADOR_NOTIFY_USER_ID) ||
      undefined;
    if (!usuarioId) {
      throw new BadRequestException(
        "usuarioId não informado e ESCAVADOR_NOTIFY_USER_ID ausente",
      );
    }

    const sanitizedLink = this.sanitizeExternalHttpUrl(data.link);
    await this.emitNotification(
      data.numero,
      data.titulo,
      sanitizedLink,
      usuarioId,
    );
    this.status.lastProcess = data.numero;
    this.status.lastTitle = data.titulo;
    this.status.lastLink = sanitizedLink;
    this.status.lastChangeAt = new Date();

    return { ok: true };
  }

  private async hydrateLastFromDbIfNeeded() {
    if (this.status.lastProcess) return;
    const usuarioId = Number(process.env.ESCAVADOR_NOTIFY_USER_ID) || undefined;
    const latest = await this.notificacoesService.findLatestByTipo(
      TipoNotificacao.NOVO_PROCESSO,
      usuarioId,
    );
    if (latest) {
      const detalhes: any = (latest as any).detalhes || {};
      this.status.lastProcess =
        detalhes.numero || latest.descricao || latest.titulo;
      this.status.lastTitle = detalhes.titulo || latest.titulo;
      this.status.lastLink = this.sanitizeExternalHttpUrl(
        detalhes.link || latest.link,
      );
      this.status.lastChangeAt = latest.createdAt;
    }
  }

  async stop(): Promise<void> {
    if (this.child) {
      this.logger.log("Parando escavador SEIRN...");
      this.child.kill("SIGTERM");
      this.child = undefined;
    }
    if (this.stdoutReader) {
      this.stdoutReader.close();
      this.stdoutReader = undefined;
    }
    this.status.running = false;
    this.status.stoppedAt = new Date();
  }

  onModuleDestroy() {
    this.stop();
  }

  private attachStreams(usuarioId: number) {
    if (!this.child) return;
    this.stdoutReader = readline.createInterface({
      input: this.child.stdout,
    });

    this.stdoutReader.on("line", async (line) => {
      this.status.lastOutput = line;
      this.logger.log(`[escavador] ${line}`);
      const parsed = this.parseProcessLine(line);
      if (parsed) {
        const { numero, titulo, link, isNew } = parsed;
        const sanitizedLink = this.sanitizeExternalHttpUrl(link);
        this.status.lastProcess = numero;
        this.status.lastTitle = titulo;
        this.status.lastLink = sanitizedLink;
        if (isNew) {
          this.status.lastChangeAt = new Date();
          await this.emitNotification(numero, titulo, sanitizedLink, usuarioId);
        }
      }
    });

    this.child.stderr.on("data", (chunk: Buffer) => {
      const msg = chunk.toString();
      this.logger.error(`[escavador][stderr] ${msg.trim()}`);
      this.status.lastError = msg;
    });
  }

  private parseProcessLine(
    line: string,
  ): { numero: string; titulo: string; link?: string; isNew: boolean } | null {
    const match =
      /(?<tipo>Último recebido|Novo recebido):\s*(?<numero>[^|]+?)\s*\|\s*título:\s*(?<titulo>[^|]*)(?:\s*\|\s*link:\s*(?<link>[^|]+))?/i.exec(
        line,
      );
    if (!match || !match.groups) return null;
    return {
      numero: match.groups["numero"].trim(),
      titulo: match.groups["titulo"].trim(),
      link: match.groups["link"]?.trim(),
      isNew: /novo recebido/i.test(match.groups["tipo"]),
    };
  }

  private async emitNotification(
    numero: string,
    titulo: string,
    link: string | undefined,
    usuarioId: number,
  ) {
    try {
      const sanitizedLink = this.sanitizeExternalHttpUrl(link);
      const dto: CreateNotificacaoDto = {
        usuarioId,
        tipo: TipoNotificacao.NOVO_PROCESSO,
        titulo: `Novo processo recebido: ${numero}`,
        descricao: titulo || "Novo processo detectado pelo escavador SEIRN",
        detalhes: { numero, titulo, link: sanitizedLink },
        prioridade: PrioridadeNotificacao.ALTA,
        link: sanitizedLink,
      };
      await this.notificacoesService.create(dto);
      this.logger.log(
        `Notificação criada para usuário ${usuarioId} sobre processo ${numero}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Falha ao criar notificação para ${usuarioId}: ${error?.message || error}`,
      );
    }
  }

  private sanitizeExternalHttpUrl(url?: string): string | undefined {
    if (!url) {
      return undefined;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return undefined;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return undefined;
      }
      return parsed.toString();
    } catch {
      return undefined;
    }
  }
}
