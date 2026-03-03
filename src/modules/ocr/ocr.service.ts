import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { StorageService } from "../storage/storage.service";
import { OcrProcessRequest, OcrProcessResult } from "./ocr.types";

const OCR_TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";
const SIGNED_PDF_PATTERNS = [
  /digitally signed/i,
  /digital signatures?/i,
  /signed PDF/i,
  /signature dictionaries/i,
] as const;

export function buildOcrStorageKeys(originalStorageKey: string): {
  searchablePdfKey: string;
  textKey: string;
} {
  const normalized = originalStorageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  const parsed = path.posix.parse(normalized);
  const baseName = parsed.name || "documento";
  const ocrDir = parsed.dir ? `${parsed.dir}/ocr` : "ocr";

  return {
    searchablePdfKey: `${ocrDir}/${baseName}.searchable.pdf`,
    textKey: `${ocrDir}/${baseName}.sidecar.txt`,
  };
}

export function isSignedPdfOcrError(message: string): boolean {
  return SIGNED_PDF_PATTERNS.some((pattern) => pattern.test(message));
}

interface CompletedProcess {
  stdout: string;
  stderr: string;
}

class OcrCommandError extends Error {
  constructor(
    message: string,
    readonly stdout: string,
    readonly stderr: string,
    readonly exitCode: number | null,
  ) {
    super(message);
  }
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  isEnabled(): boolean {
    return this.configService.get<string>("OCR_ENABLED", "false") === "true";
  }

  async processDocument(request: OcrProcessRequest): Promise<OcrProcessResult> {
    const processedAt = new Date();

    if (request.mimeType !== "application/pdf") {
      return { status: "skipped_non_pdf", processedAt };
    }

    if (!this.isEnabled()) {
      return { status: "skipped_disabled", processedAt };
    }

    const { searchablePdfKey, textKey } = buildOcrStorageKeys(
      request.storageKey,
    );
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sgc-ocr-"));
    const inputPath = path.join(tempDir, "input.pdf");
    const outputPath = path.join(tempDir, "output.pdf");
    const sidecarPath = path.join(tempDir, "sidecar.txt");

    try {
      await fs.writeFile(inputPath, request.buffer);

      const args = [
        "--skip-text",
        "--output-type",
        "pdf",
        "--language",
        this.getLanguage(),
        "--sidecar",
        sidecarPath,
        "--tesseract-timeout",
        String(this.getTesseractTimeoutSeconds()),
        inputPath,
        outputPath,
      ];

      await this.runCommand(this.getCommand(), args, this.getTimeoutMs());

      const [ocrPdfBuffer, text] = await Promise.all([
        fs.readFile(outputPath),
        this.readOptionalText(sidecarPath),
      ]);

      await this.storageService.putObject(searchablePdfKey, ocrPdfBuffer, {
        contentType: "application/pdf",
      });

      const hasText = text.trim().length > 0;
      if (hasText) {
        await this.storageService.putObject(
          textKey,
          Buffer.from(text, "utf8"),
          {
            contentType: OCR_TEXT_CONTENT_TYPE,
          },
        );
      }

      this.logger.log(
        `OCR concluído: ${request.fileName} (${request.source || "upload"})`,
      );

      return {
        status: "completed",
        processedAt,
        searchablePdfKey,
        textKey: hasText ? textKey : undefined,
        text: hasText ? text : undefined,
      };
    } catch (error) {
      const details = this.extractErrorDetails(error);

      if (isSignedPdfOcrError(details)) {
        this.logger.warn(
          `OCR ignorado para PDF assinado digitalmente: ${request.fileName}`,
        );
        return {
          status: "skipped_signed",
          processedAt,
          error: "PDF assinado digitalmente; OCR sidecar não gerado.",
        };
      }

      if (this.shouldFailOpen()) {
        this.logger.warn(
          `OCR indisponível; upload liberado por fail-open: ${request.fileName} -> ${details}`,
        );
        return {
          status: "failed",
          processedAt,
          error: details,
        };
      }

      this.logger.error(
        `Falha no OCR do arquivo ${request.fileName}: ${details}`,
      );
      throw new ServiceUnavailableException(
        "Não foi possível concluir o OCR do PDF enviado.",
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  private getCommand(): string {
    return this.configService.get<string>("OCR_COMMAND", "ocrmypdf");
  }

  private getLanguage(): string {
    return this.configService.get<string>("OCR_LANGUAGE", "por");
  }

  private getTimeoutMs(): number {
    return Number.parseInt(
      this.configService.get<string>("OCR_TIMEOUT_MS", "180000"),
      10,
    );
  }

  private getTesseractTimeoutSeconds(): number {
    return Number.parseInt(
      this.configService.get<string>("OCR_TESSERACT_TIMEOUT", "180"),
      10,
    );
  }

  private shouldFailOpen(): boolean {
    return this.configService.get<string>("OCR_FAIL_OPEN", "true") === "true";
  }

  private async readOptionalText(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      return "";
    }
  }

  private extractErrorDetails(error: unknown): string {
    if (error instanceof OcrCommandError) {
      return [error.stderr, error.stdout, error.message]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" | ");
    }

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private async runCommand(
    command: string,
    args: string[],
    timeoutMs: number,
  ): Promise<CompletedProcess> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });

      child.once("close", (code) => {
        clearTimeout(timer);

        if (timedOut) {
          reject(
            new Error(
              `Timeout ao aguardar OCRmyPDF (${timeoutMs}ms): ${command}`,
            ),
          );
          return;
        }

        if (code === 0) {
          resolve({ stdout, stderr });
          return;
        }

        reject(
          new OcrCommandError(
            `OCRmyPDF retornou código ${code ?? "desconhecido"}.`,
            stdout,
            stderr,
            code,
          ),
        );
      });
    });
  }
}
