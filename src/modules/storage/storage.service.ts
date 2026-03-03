import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { Readable } from "stream";

export type StorageDriver = "local" | "s3";

export interface StorageObject {
  key: string;
  buffer: Buffer;
  size: number;
  contentType?: string;
  lastModified?: Date;
}

export interface StorageObjectStat {
  key: string;
  size: number;
  lastModified?: Date;
}

export interface StorageObjectStream extends StorageObjectStat {
  stream: Readable;
  contentType?: string;
}

export interface StorageObjectOptions {
  contentType?: string;
  legacyAbsolutePath?: string;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function inferContentTypeFromFilename(fileName?: string): string {
  const extension = path.extname(fileName || "").toLowerCase();
  return MIME_BY_EXTENSION[extension] || "application/octet-stream";
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: StorageDriver;
  private readonly localRoot: string;
  private readonly bucket: string;
  private readonly autoCreateBucket: boolean;
  private readonly s3Client?: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.driver = this.resolveDriver();
    this.localRoot = path.resolve(
      this.configService.get<string>(
        "UPLOAD_PATH",
        path.resolve(process.cwd(), "uploads"),
      ),
    );
    this.bucket = this.configService.get<string>(
      "STORAGE_S3_BUCKET",
      "sgc-documentos",
    );
    this.autoCreateBucket =
      this.configService.get<string>(
        "STORAGE_S3_AUTO_CREATE_BUCKET",
        "false",
      ) === "true";

    if (this.driver === "s3") {
      this.s3Client = new S3Client({
        region: this.configService.get<string>(
          "STORAGE_S3_REGION",
          "us-east-1",
        ),
        endpoint: this.configService.get<string>("STORAGE_S3_ENDPOINT"),
        forcePathStyle:
          this.configService.get<string>(
            "STORAGE_S3_FORCE_PATH_STYLE",
            "true",
          ) === "true",
        credentials: {
          accessKeyId: this.configService.get<string>(
            "STORAGE_S3_ACCESS_KEY",
            "",
          ),
          secretAccessKey: this.configService.get<string>(
            "STORAGE_S3_SECRET_KEY",
            "",
          ),
        },
      });
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.driver !== "s3" || !this.s3Client || !this.autoCreateBucket) {
      return;
    }

    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (this.isBucketNotFound(error)) {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
        this.logger.log(`Bucket ${this.bucket} criado automaticamente.`);
        return;
      }

      this.logger.warn(
        `Não foi possível validar/criar o bucket ${this.bucket}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  getDriver(): StorageDriver {
    return this.driver;
  }

  async putObject(
    key: string,
    buffer: Buffer,
    options: StorageObjectOptions = {},
  ): Promise<string> {
    const objectKey = this.normalizeObjectKey(key);
    const contentType =
      options.contentType || inferContentTypeFromFilename(objectKey);

    if (this.driver === "local") {
      const absolutePath = this.resolveLocalObjectPath(objectKey);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, buffer);
      return objectKey;
    }

    if (!this.s3Client) {
      throw new BadRequestException("Cliente S3 não configurado.");
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return objectKey;
  }

  async getObject(
    key: string,
    options: StorageObjectOptions = {},
  ): Promise<StorageObject> {
    const legacyAbsolutePath = await this.resolveLegacyAbsolutePath(
      key,
      options.legacyAbsolutePath,
    );

    if (legacyAbsolutePath) {
      const stats = await fs.stat(legacyAbsolutePath);
      const buffer = await fs.readFile(legacyAbsolutePath);
      return {
        key,
        buffer,
        size: stats.size,
        lastModified: stats.mtime,
        contentType:
          options.contentType ||
          inferContentTypeFromFilename(path.basename(legacyAbsolutePath)),
      };
    }

    const objectKey = this.normalizeObjectKey(key);

    if (this.driver === "local") {
      const absolutePath = this.resolveLocalObjectPath(objectKey);
      const stats = await this.readLocalStat(absolutePath);
      const buffer = await fs.readFile(absolutePath);
      return {
        key: objectKey,
        buffer,
        size: stats.size,
        lastModified: stats.mtime,
        contentType:
          options.contentType || inferContentTypeFromFilename(objectKey),
      };
    }

    if (!this.s3Client) {
      throw new BadRequestException("Cliente S3 não configurado.");
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      const buffer = await this.bodyToBuffer(response.Body);

      return {
        key: objectKey,
        buffer,
        size: Number(response.ContentLength ?? buffer.length),
        lastModified: response.LastModified,
        contentType:
          response.ContentType ||
          options.contentType ||
          inferContentTypeFromFilename(objectKey),
      };
    } catch (error) {
      if (this.isObjectNotFound(error)) {
        throw new NotFoundException("Objeto não encontrado no storage.");
      }
      throw error;
    }
  }

  async statObject(
    key: string,
    options: StorageObjectOptions = {},
  ): Promise<StorageObjectStat> {
    const legacyAbsolutePath = await this.resolveLegacyAbsolutePath(
      key,
      options.legacyAbsolutePath,
    );

    if (legacyAbsolutePath) {
      const stats = await fs.stat(legacyAbsolutePath);
      return {
        key,
        size: stats.size,
        lastModified: stats.mtime,
      };
    }

    const objectKey = this.normalizeObjectKey(key);

    if (this.driver === "local") {
      const absolutePath = this.resolveLocalObjectPath(objectKey);
      const stats = await this.readLocalStat(absolutePath);
      return {
        key: objectKey,
        size: stats.size,
        lastModified: stats.mtime,
      };
    }

    if (!this.s3Client) {
      throw new BadRequestException("Cliente S3 não configurado.");
    }

    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      return {
        key: objectKey,
        size: Number(response.ContentLength ?? 0),
        lastModified: response.LastModified,
      };
    } catch (error) {
      if (this.isObjectNotFound(error)) {
        throw new NotFoundException("Objeto não encontrado no storage.");
      }
      throw error;
    }
  }

  async getObjectStream(
    key: string,
    options: StorageObjectOptions = {},
  ): Promise<StorageObjectStream> {
    const legacyAbsolutePath = await this.resolveLegacyAbsolutePath(
      key,
      options.legacyAbsolutePath,
    );

    if (legacyAbsolutePath) {
      const stats = await fs.stat(legacyAbsolutePath);
      return {
        key,
        stream: createReadStream(legacyAbsolutePath),
        size: stats.size,
        lastModified: stats.mtime,
        contentType:
          options.contentType ||
          inferContentTypeFromFilename(path.basename(legacyAbsolutePath)),
      };
    }

    const objectKey = this.normalizeObjectKey(key);

    if (this.driver === "local") {
      const absolutePath = this.resolveLocalObjectPath(objectKey);
      const stats = await this.readLocalStat(absolutePath);
      return {
        key: objectKey,
        stream: createReadStream(absolutePath),
        size: stats.size,
        lastModified: stats.mtime,
        contentType:
          options.contentType || inferContentTypeFromFilename(objectKey),
      };
    }

    if (!this.s3Client) {
      throw new BadRequestException("Cliente S3 não configurado.");
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      return {
        key: objectKey,
        stream: this.bodyToReadable(response.Body),
        size: Number(response.ContentLength ?? 0),
        lastModified: response.LastModified,
        contentType:
          response.ContentType ||
          options.contentType ||
          inferContentTypeFromFilename(objectKey),
      };
    } catch (error) {
      if (this.isObjectNotFound(error)) {
        throw new NotFoundException("Objeto não encontrado no storage.");
      }
      throw error;
    }
  }

  async deleteObject(
    key: string,
    options: StorageObjectOptions = {},
  ): Promise<void> {
    const legacyAbsolutePath = await this.resolveLegacyAbsolutePath(
      key,
      options.legacyAbsolutePath,
    );

    if (legacyAbsolutePath) {
      await fs.unlink(legacyAbsolutePath).catch(() => undefined);
      return;
    }

    const objectKey = this.normalizeObjectKey(key);

    if (this.driver === "local") {
      const absolutePath = this.resolveLocalObjectPath(objectKey);
      await fs.unlink(absolutePath).catch(() => undefined);
      return;
    }

    if (!this.s3Client) {
      throw new BadRequestException("Cliente S3 não configurado.");
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }

  private resolveDriver(): StorageDriver {
    const configured = this.configService.get<string>(
      "STORAGE_DRIVER",
      "local",
    );
    return configured === "s3" ? "s3" : "local";
  }

  private normalizeObjectKey(key: string): string {
    const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "").trim();
    if (!normalized) {
      throw new BadRequestException("Chave de storage inválida.");
    }
    return normalized;
  }

  private resolveLocalObjectPath(key: string): string {
    const objectKey = this.normalizeObjectKey(key);
    const absolutePath = path.resolve(this.localRoot, objectKey);

    if (
      absolutePath !== this.localRoot &&
      !absolutePath.startsWith(`${this.localRoot}${path.sep}`)
    ) {
      throw new BadRequestException("Chave de storage inválida.");
    }

    return absolutePath;
  }

  private async resolveLegacyAbsolutePath(
    key: string,
    legacyAbsolutePath?: string,
  ): Promise<string | null> {
    const candidates = [legacyAbsolutePath, path.isAbsolute(key) ? key : null];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      try {
        const stats = await fs.stat(candidate);
        if (stats.isFile()) {
          return candidate;
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

  private async readLocalStat(absolutePath: string) {
    try {
      return await fs.stat(absolutePath);
    } catch {
      throw new NotFoundException("Objeto não encontrado no storage local.");
    }
  }

  private async bodyToBuffer(
    body: GetObjectCommand["input"] | Readable | unknown,
  ): Promise<Buffer> {
    if (!body) {
      return Buffer.alloc(0);
    }

    const candidate = body as {
      transformToByteArray?: () => Promise<Uint8Array>;
      [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array>;
    };

    if (typeof candidate.transformToByteArray === "function") {
      const bytes = await candidate.transformToByteArray();
      return Buffer.from(bytes);
    }

    if (body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    if (body instanceof Uint8Array) {
      return Buffer.from(body);
    }

    throw new BadRequestException("Não foi possível ler o objeto do storage.");
  }

  private bodyToReadable(
    body: GetObjectCommand["input"] | Readable | unknown,
  ): Readable {
    if (!body) {
      return Readable.from([]);
    }

    if (body instanceof Readable) {
      return body;
    }

    const candidate = body as {
      transformToWebStream?: () => ReadableStream<Uint8Array>;
      [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array>;
    };

    if (typeof candidate.transformToWebStream === "function") {
      return Readable.fromWeb(candidate.transformToWebStream());
    }

    if (typeof candidate[Symbol.asyncIterator] === "function") {
      return Readable.from(candidate as AsyncIterable<Uint8Array>);
    }

    if (body instanceof Uint8Array) {
      return Readable.from([Buffer.from(body)]);
    }

    throw new BadRequestException("Não foi possível ler o objeto do storage.");
  }

  private isBucketNotFound(error: unknown): boolean {
    const httpStatus = this.getHttpStatus(error);
    return httpStatus === 404 || this.getErrorName(error) === "NotFound";
  }

  private isObjectNotFound(error: unknown): boolean {
    const httpStatus = this.getHttpStatus(error);
    const name = this.getErrorName(error);
    return (
      error instanceof NoSuchKey ||
      httpStatus === 404 ||
      name === "NoSuchKey" ||
      name === "NotFound"
    );
  }

  private getHttpStatus(error: unknown): number | undefined {
    return (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode;
  }

  private getErrorName(error: unknown): string | undefined {
    return (error as { name?: string })?.name;
  }
}
