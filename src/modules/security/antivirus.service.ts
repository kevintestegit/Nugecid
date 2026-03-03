import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs/promises";
import * as net from "net";

export interface AntivirusScanOptions {
  fileName?: string;
  source?: string;
}

export interface ClamAvResponse {
  status: "clean" | "infected" | "error";
  raw: string;
  signature?: string;
}

export const CLAMAV_STREAM_CHUNK_SIZE = 64 * 1024;

export function buildClamAvInstreamFrames(
  buffer: Buffer,
  chunkSize: number = CLAMAV_STREAM_CHUNK_SIZE,
): Buffer[] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize deve ser maior que zero");
  }

  const frames: Buffer[] = [];

  for (let offset = 0; offset < buffer.length; offset += chunkSize) {
    const chunk = buffer.subarray(offset, Math.min(offset + chunkSize));
    const header = Buffer.alloc(4);
    header.writeUInt32BE(chunk.length, 0);
    frames.push(header, chunk);
  }

  const terminator = Buffer.alloc(4);
  terminator.writeUInt32BE(0, 0);
  frames.push(terminator);

  return frames;
}

export function parseClamAvResponse(response: string): ClamAvResponse {
  const normalized = response.replace(/\0/g, "").trim();

  if (!normalized) {
    return {
      status: "error",
      raw: normalized,
    };
  }

  if (/FOUND$/i.test(normalized)) {
    const match =
      normalized.match(/:\s(.+)\sFOUND$/i) ??
      normalized.match(/^(.*)\sFOUND$/i);

    return {
      status: "infected",
      raw: normalized,
      signature: match?.[1]?.trim() || "ameaça_desconhecida",
    };
  }

  if (/OK$/i.test(normalized)) {
    return {
      status: "clean",
      raw: normalized,
    };
  }

  return {
    status: "error",
    raw: normalized,
  };
}

@Injectable()
export class AntivirusService {
  private readonly logger = new Logger(AntivirusService.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return this.configService.get<string>("CLAMAV_ENABLED", "false") === "true";
  }

  async scanUploadedFile(
    file: Pick<Express.Multer.File, "buffer" | "path" | "originalname">,
    options: Omit<AntivirusScanOptions, "fileName"> = {},
  ): Promise<void> {
    const buffer = await this.readUploadedFileBuffer(file);

    await this.scanBuffer(buffer, {
      ...options,
      fileName: file.originalname,
    });
  }

  async scanBuffer(
    buffer: Buffer,
    options: AntivirusScanOptions = {},
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    if (!buffer.length) {
      throw new BadRequestException("Arquivo inválido ou vazio.");
    }

    const fileLabel = options.fileName || "arquivo";
    const sourceLabel = options.source || "upload";

    try {
      const response = await this.executeScan(buffer);
      const parsed = parseClamAvResponse(response);

      if (parsed.status === "clean") {
        this.logger.debug(
          `Arquivo liberado pelo antivírus: ${fileLabel} (${sourceLabel})`,
        );
        return;
      }

      if (parsed.status === "infected") {
        this.logger.warn(
          `Upload bloqueado por assinatura maliciosa: ${fileLabel} (${sourceLabel}) -> ${parsed.signature}`,
        );
        throw new BadRequestException(
          `Upload bloqueado pela varredura antivírus (${parsed.signature}).`,
        );
      }

      throw new Error(parsed.raw || "Resposta inválida do ClamAV.");
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "falha desconhecida";

      if (this.shouldFailOpen()) {
        this.logger.warn(
          `ClamAV indisponível; upload liberado por fail-open: ${fileLabel} (${sourceLabel}) -> ${message}`,
        );
        return;
      }

      this.logger.error(
        `Falha na varredura antivírus: ${fileLabel} (${sourceLabel}) -> ${message}`,
      );
      throw new ServiceUnavailableException(
        "Não foi possível concluir a varredura antivírus do arquivo.",
      );
    }
  }

  private shouldFailOpen(): boolean {
    return (
      this.configService.get<string>("CLAMAV_FAIL_OPEN", "false") === "true"
    );
  }

  private getHost(): string {
    return this.configService.get<string>("CLAMAV_HOST", "127.0.0.1");
  }

  private getPort(): number {
    return Number.parseInt(
      this.configService.get<string>("CLAMAV_PORT", "3310"),
      10,
    );
  }

  private getTimeoutMs(): number {
    return Number.parseInt(
      this.configService.get<string>("CLAMAV_TIMEOUT_MS", "10000"),
      10,
    );
  }

  private async executeScan(buffer: Buffer): Promise<string> {
    const host = this.getHost();
    const port = this.getPort();
    const timeoutMs = this.getTimeoutMs();

    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      const chunks: Buffer[] = [];
      let settled = false;

      const finish = (handler: (value: string | Error) => void) => {
        return (value: string | Error) => {
          if (settled) {
            return;
          }

          settled = true;
          socket.destroy();
          handler(value);
        };
      };

      const resolveSafely = finish((value) => resolve(String(value)));
      const rejectSafely = finish((value) =>
        reject(value instanceof Error ? value : new Error(String(value))),
      );

      socket.setTimeout(timeoutMs);

      socket.once("connect", () => {
        try {
          socket.write("zINSTREAM\0");
          for (const frame of buildClamAvInstreamFrames(buffer)) {
            socket.write(frame);
          }
        } catch (error) {
          rejectSafely(
            error instanceof Error
              ? error
              : new Error("Falha ao transmitir arquivo ao ClamAV."),
          );
        }
      });

      socket.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      socket.once("timeout", () => {
        rejectSafely(
          new Error(`Timeout ao aguardar resposta do ClamAV (${timeoutMs}ms).`),
        );
      });

      socket.once("error", (error) => {
        rejectSafely(error);
      });

      socket.once("close", () => {
        const response = Buffer.concat(chunks).toString("utf8");
        if (!response.trim()) {
          rejectSafely(new Error("ClamAV não retornou resposta para o scan."));
          return;
        }

        resolveSafely(response);
      });
    });
  }

  private async readUploadedFileBuffer(
    file: Pick<Express.Multer.File, "buffer" | "path">,
  ): Promise<Buffer> {
    if (file.buffer?.length) {
      return file.buffer;
    }

    if (file.path) {
      return fs.readFile(file.path);
    }

    throw new BadRequestException("Arquivo inválido ou vazio.");
  }
}
