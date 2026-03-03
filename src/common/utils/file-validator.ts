import { BadRequestException } from "@nestjs/common";
import { fileTypeFromBuffer } from "file-type";

export const DEFAULT_DOCUMENT_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const ALLOWED_TEXT_MIME_TYPES = ["text/plain", "text/csv"] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  ...ALLOWED_TEXT_MIME_TYPES,
] as const;

export const ALLOWED_IMAGE_OR_DOCUMENT_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
] as const;

export class FileValidator {
  private static isLikelyTextFile(buffer: Buffer): boolean {
    if (buffer.length === 0) {
      return true;
    }

    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
    if (sample.includes(0)) {
      return false;
    }

    const decoded = sample.toString("utf8");
    const replacementChars = (decoded.match(/\uFFFD/g) || []).length;
    return replacementChars / decoded.length <= 0.05;
  }

  private static isAllowedTextMimeType(mimeType?: string | null): boolean {
    return Boolean(
      mimeType &&
        ALLOWED_TEXT_MIME_TYPES.includes(
          mimeType as (typeof ALLOWED_TEXT_MIME_TYPES)[number],
        ),
    );
  }

  static isAllowedImageOrDocumentMimeType(mimeType?: string | null): boolean {
    return Boolean(
      mimeType &&
        ALLOWED_IMAGE_OR_DOCUMENT_MIME_TYPES.includes(
          mimeType as (typeof ALLOWED_IMAGE_OR_DOCUMENT_MIME_TYPES)[number],
        ),
    );
  }

  /**
   * Valida se o arquivo é uma imagem real baseado nos magic bytes
   * @param buffer Buffer do arquivo
   * @throws BadRequestException se o arquivo não for uma imagem válida
   */
  static async validateImage(buffer: Buffer): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    if (!type || !ALLOWED_IMAGE_MIME_TYPES.includes(type.mime as any)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Apenas imagens são aceitas: JPG, PNG, GIF ou WebP. ` +
          `Arquivo detectado: ${type?.mime || "desconhecido"}`,
      );
    }
  }

  /**
   * Valida se o arquivo é um documento real baseado nos magic bytes
   * @param buffer Buffer do arquivo
   * @throws BadRequestException se o arquivo não for um documento válido
   */
  static async validateDocument(
    buffer: Buffer,
    declaredMimeType?: string | null,
  ): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    if (type && ALLOWED_DOCUMENT_MIME_TYPES.includes(type.mime as any)) {
      return;
    }

    if (
      !type &&
      this.isAllowedTextMimeType(declaredMimeType) &&
      this.isLikelyTextFile(buffer)
    ) {
      return;
    }

    throw new BadRequestException(
      `Tipo de documento não permitido. Use: PDF, Word (.doc/.docx), Excel (.xls/.xlsx) ou texto (.txt/.csv). ` +
        `Arquivo detectado: ${type?.mime || declaredMimeType || "desconhecido"}`,
    );
  }

  /**
   * Valida se o arquivo é uma imagem ou documento válido
   * @param buffer Buffer do arquivo
   * @throws BadRequestException se o arquivo não for válido
   */
  static async validateImageOrDocument(
    buffer: Buffer,
    declaredMimeType?: string | null,
  ): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    if (
      type &&
      ALLOWED_IMAGE_OR_DOCUMENT_MIME_TYPES.includes(type.mime as any)
    ) {
      return;
    }

    if (
      !type &&
      this.isAllowedTextMimeType(declaredMimeType) &&
      this.isLikelyTextFile(buffer)
    ) {
      return;
    }

    throw new BadRequestException(
      `Tipo de arquivo não permitido. Use: imagens (JPG, PNG, GIF, WebP) ou documentos (PDF, Word, Excel, TXT, CSV). ` +
        `Arquivo detectado: ${type?.mime || declaredMimeType || "desconhecido"}`,
    );
  }

  /**
   * Detecta o tipo real do arquivo baseado nos magic bytes
   * @param buffer Buffer do arquivo
   * @returns Tipo MIME detectado ou null se não detectado
   */
  static async detectFileType(buffer: Buffer): Promise<string | null> {
    const type = await fileTypeFromBuffer(buffer);
    return type?.mime || null;
  }
}
