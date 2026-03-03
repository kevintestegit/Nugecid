import { ConfigService } from "@nestjs/config";
import { NotFoundException } from "@nestjs/common";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { StorageService } from "./storage.service";

describe("StorageService", () => {
  let rootDir: string;
  let service: StorageService;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "sgc-storage-"));

    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          STORAGE_DRIVER: "local",
          UPLOAD_PATH: rootDir,
        };
        return values[key] ?? fallback;
      }),
    } as unknown as ConfigService;

    service = new StorageService(configService);
  });

  afterEach(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  it("grava, lê, consulta stat e remove objetos no driver local", async () => {
    await service.putObject("pastas/pasta-1/arquivo.txt", Buffer.from("abc"), {
      contentType: "text/plain",
    });

    const stored = await service.getObject("pastas/pasta-1/arquivo.txt");
    expect(stored.buffer.toString("utf8")).toBe("abc");
    expect(stored.size).toBe(3);

    const stats = await service.statObject("pastas/pasta-1/arquivo.txt");
    expect(stats.size).toBe(3);
    expect(stats.lastModified?.getTime()).toBeGreaterThan(0);

    await service.deleteObject("pastas/pasta-1/arquivo.txt");

    await expect(
      service.getObject("pastas/pasta-1/arquivo.txt"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lê objetos locais como stream com metadata", async () => {
    await service.putObject("pastas/pasta-1/arquivo.txt", Buffer.from("abc"), {
      contentType: "text/plain",
    });

    const stored = await service.getObjectStream("pastas/pasta-1/arquivo.txt", {
      contentType: "text/plain",
    });
    const chunks: Buffer[] = [];

    for await (const chunk of stored.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    expect(Buffer.concat(chunks).toString("utf8")).toBe("abc");
    expect(stored.size).toBe(3);
    expect(stored.contentType).toBe("text/plain");
  });
});
