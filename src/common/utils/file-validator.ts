import { BadRequestException } from "@nestjs/common";
import { fileTypeFromBuffer } from "file-type";

export class FileValidator {
  private static readonly ALLOWED_IMAGES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  private static readonly ALLOWED_DOCS = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/msword", // .doc
    "application/vnd.ms-excel", // .xls
  ];

  /**
   * Valida se o arquivo é uma imagem real baseado nos magic bytes
   * @param buffer Buffer do arquivo
   * @throws BadRequestException se o arquivo não for uma imagem válida
   */
  static async validateImage(buffer: Buffer): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    if (!type || !this.ALLOWED_IMAGES.includes(type.mime)) {
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
  static async validateDocument(buffer: Buffer): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    if (!type || !this.ALLOWED_DOCS.includes(type.mime)) {
      throw new BadRequestException(
        `Tipo de documento não permitido. Use: PDF, Word (.doc/.docx) ou Excel (.xls/.xlsx). ` +
          `Arquivo detectado: ${type?.mime || "desconhecido"}`,
      );
    }
  }

  /**
   * Valida se o arquivo é uma imagem ou documento válido
   * @param buffer Buffer do arquivo
   * @throws BadRequestException se o arquivo não for válido
   */
  static async validateImageOrDocument(buffer: Buffer): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    const allAllowed = [...this.ALLOWED_IMAGES, ...this.ALLOWED_DOCS];

    if (!type || !allAllowed.includes(type.mime)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Use: imagens (JPG, PNG, GIF, WebP) ou documentos (PDF, Word, Excel). ` +
          `Arquivo detectado: ${type?.mime || "desconhecido"}`,
      );
    }
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
