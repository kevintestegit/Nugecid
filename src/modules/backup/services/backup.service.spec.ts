import { ConfigService } from "@nestjs/config";
import * as os from "os";
import * as path from "path";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  promises as fsPromises,
} from "fs";

import { BackupService } from "./backup.service";

describe("BackupService", () => {
  const originalCwd = process.cwd();
  let tempRoot: string;
  let service: BackupService;

  const createConfigService = (): ConfigService =>
    ({
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === "BACKUP_DIR") {
          return "./backups";
        }

        if (key === "BACKUP_HTTP_RESTORE_ENABLED") {
          return "false";
        }

        return defaultValue;
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    tempRoot = mkdtempSync(path.join(os.tmpdir(), "backup-service-"));
    process.chdir(tempRoot);
    mkdirSync(path.join(tempRoot, "backups"), { recursive: true });
    service = new BackupService(createConfigService());
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("não inclui a tabela legado 'tarefa' no comando de backup completo", () => {
    const args = (service as any).buildBackupArgs(
      {
        host: "localhost",
        port: 5432,
        username: "sgc",
        database: "sgc",
        isDocker: false,
      },
      false,
    );

    expect(args).toContain("tarefas");
    expect(args).not.toContain("tarefa");
  });

  it("falha cedo quando o diretório de backups não tem permissão de escrita", async () => {
    const accessSpy = jest
      .spyOn(fsPromises, "access")
      .mockRejectedValueOnce(
        Object.assign(new Error("EACCES"), { code: "EACCES" }),
      );

    await expect((service as any).ensureBackupDirectory()).rejects.toThrow(
      "Diretório de backups sem permissão",
    );

    accessSpy.mockRestore();
  });

  it("não inclui a tabela legado 'tarefa' no truncate pré-restore", () => {
    const truncateSql = (service as any).buildPreRestoreTruncateSQL();

    expect(truncateSql).toContain("TRUNCATE TABLE tarefas CASCADE");
    expect(truncateSql).not.toContain("TRUNCATE TABLE tarefa CASCADE");
  });

  it("restaura uploads mesmo quando o diretório de destino ainda não existe", async () => {
    const uploadsInBackup = path.join(tempRoot, "extract", "uploads");
    mkdirSync(uploadsInBackup, { recursive: true });

    await (service as any).restoreUploadsDirectory(uploadsInBackup);

    const uploadsDestination = path.join(tempRoot, "uploads");
    expect(existsSync(uploadsDestination)).toBe(true);
    expect(readdirSync(uploadsDestination)).toHaveLength(0);
  });

  it("faz backup dos uploads atuais e substitui o conteúdo pelo backup extraído", async () => {
    const uploadsDestination = path.join(tempRoot, "uploads");
    const uploadsInBackup = path.join(tempRoot, "extract", "uploads");
    mkdirSync(uploadsDestination, { recursive: true });
    mkdirSync(path.join(uploadsInBackup, "nested"), { recursive: true });

    writeFileSync(path.join(uploadsDestination, "stale.txt"), "stale");
    writeFileSync(path.join(uploadsInBackup, "fresh.txt"), "fresh");
    writeFileSync(path.join(uploadsInBackup, "nested", "inside.txt"), "inside");

    await (service as any).restoreUploadsDirectory(uploadsInBackup);

    expect(existsSync(path.join(uploadsDestination, "stale.txt"))).toBe(false);
    expect(
      readFileSync(path.join(uploadsDestination, "fresh.txt"), "utf8"),
    ).toBe("fresh");
    expect(
      readFileSync(
        path.join(uploadsDestination, "nested", "inside.txt"),
        "utf8",
      ),
    ).toBe("inside");

    const backupEntries = readdirSync(path.join(tempRoot, "backups")).filter(
      (entry) => entry.startsWith("uploads_old_"),
    );
    expect(backupEntries).toHaveLength(1);
    expect(
      readFileSync(
        path.join(tempRoot, "backups", backupEntries[0], "stale.txt"),
        "utf8",
      ),
    ).toBe("stale");
  });

  it("desabilita restore via HTTP por padrão", () => {
    expect(service.isHttpRestoreEnabled()).toBe(false);
  });

  it("não expõe caminho absoluto ao listar backups", async () => {
    const backupFile = path.join(
      tempRoot,
      "backups",
      "backup_full_2026-04-01.tar.gz",
    );
    writeFileSync(backupFile, "content");

    const [backup] = await service.listBackups();

    expect(backup.filename).toBe("backup_full_2026-04-01.tar.gz");
    expect(backup).not.toHaveProperty("filepath");
  });
});
