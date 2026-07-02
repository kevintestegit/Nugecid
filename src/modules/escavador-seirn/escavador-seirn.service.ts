import { Injectable, Logger } from "@nestjs/common";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { ConfigService } from "@nestjs/config";
import {
  NotificacoesService,
  CreateNotificacaoDto,
} from "../notificacoes/services/notificacoes.service";
import {
  TipoNotificacao,
  PrioridadeNotificacao,
} from "../notificacoes/entities";
import { HookEscavadorDto } from "./dto/hook-escavador.dto";
import { SeiCapturaService } from "../sei/sei-captura.service";

interface EscavadorWebhookHeaders {
  authorization?: string;
  signature?: string;
  timestamp?: string;
}

@Injectable()
export class EscavadorSeirnService {
  private static readonly DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;
  private readonly logger = new Logger(EscavadorSeirnService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly notificacoesService: NotificacoesService,
    private readonly seiCapturaService: SeiCapturaService,
  ) {}

  async webhook(data: HookEscavadorDto, headers: EscavadorWebhookHeaders = {}) {
    this.validateWebhookAuth(data, headers);

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
    const capturaId = await this.registrarCapturaSei(
      data.numero,
      data.titulo,
      sanitizedLink,
      usuarioId,
    );

    return { ok: true, capturaId };
  }

  private validateWebhookAuth(
    data: HookEscavadorDto,
    headers: EscavadorWebhookHeaders,
  ) {
    const secret =
      this.configService.get<string>("ESCAVADOR_WEBHOOK_TOKEN") ||
      process.env.ESCAVADOR_WEBHOOK_TOKEN;

    if (!secret) {
      this.logger.error(
        "ESCAVADOR_WEBHOOK_TOKEN ausente; webhook do escavador não pode ser autenticado",
      );
      throw new ForbiddenException("Webhook do escavador não autorizado");
    }

    const timestamp = headers.timestamp?.trim();
    const signature = headers.signature?.trim();

    if (timestamp && signature) {
      this.assertTimestampWithinTolerance(timestamp);
      const payload = this.buildWebhookCanonicalPayload(data, timestamp);
      const expectedSignature = createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      if (
        this.isSafeEqualHex(signature.toLowerCase(), expectedSignature) ===
        false
      ) {
        throw new ForbiddenException("Assinatura inválida para webhook");
      }

      return;
    }

    throw new ForbiddenException("Webhook do escavador não autorizado");
  }

  private assertTimestampWithinTolerance(timestamp: string) {
    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) {
      throw new ForbiddenException("Timestamp inválido para webhook");
    }

    const toleranceSeconds = Number(
      this.configService.get<string>(
        "ESCAVADOR_WEBHOOK_TOLERANCE_SECONDS",
        String(EscavadorSeirnService.DEFAULT_WEBHOOK_TOLERANCE_SECONDS),
      ) || EscavadorSeirnService.DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
    );
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
      throw new ForbiddenException("Webhook fora da janela de validade");
    }
  }

  private buildWebhookCanonicalPayload(
    data: HookEscavadorDto,
    timestamp: string,
  ): string {
    return [
      "v1",
      timestamp,
      data.numero.trim(),
      data.titulo.trim(),
      data.link?.trim() || "",
      data.usuarioId ? String(data.usuarioId) : "",
    ].join("\n");
  }

  private isSafeEqualHex(providedHex: string, expectedHex: string): boolean {
    if (providedHex.length !== expectedHex.length) {
      return false;
    }

    try {
      return timingSafeEqual(
        Buffer.from(providedHex, "hex"),
        Buffer.from(expectedHex, "hex"),
      );
    } catch {
      return false;
    }
  }

  private async registrarCapturaSei(
    numero: string,
    titulo: string,
    link: string | undefined,
    usuarioId: number,
  ): Promise<string | undefined> {
    try {
      const sanitizedLink = this.sanitizeExternalHttpUrl(link);
      await this.emitNotification(numero, titulo, sanitizedLink, usuarioId);
      const captura = await this.seiCapturaService.criarFromWebhook(
        { numero, titulo, link: sanitizedLink },
        usuarioId,
      );
      this.logger.log(
        `Captura SEI criada para usuário ${usuarioId} sobre processo ${numero}: ${captura.id}`,
      );
      return captura.id;
    } catch (error) {
      this.logger.error(
        `Falha ao criar captura SEI para ${usuarioId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
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
    } catch (error: unknown) {
      this.logger.error(
        `Falha ao criar notificação para ${usuarioId}: ${error instanceof Error ? error.message : String(error)}`,
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
