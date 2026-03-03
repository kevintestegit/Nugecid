import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { execFile, spawn } from "child_process";
import { promises as fs } from "fs";
import { constants, existsSync, statSync, createReadStream } from "fs";
import * as path from "path";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: string;
  timestamp?: Date;
  error?: string;
  duration?: number;
}

interface ManagedBackupEntry {
  file: string;
  filepath: string;
  isDirectory: boolean;
  mtime: number;
  sizeBytes: number;
}

type EntrySortDirection = "asc" | "desc";

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly maxBackupDays: number;
  private readonly maxBackupFiles: number;
  private readonly maxTotalSizeBytes: number;
  private readonly httpRestoreEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.backupDir = path.resolve(
      process.cwd(),
      this.configService.get<string>("BACKUP_DIR", "./backups"),
    );
    this.maxBackupDays = this.getPositiveNumberEnv("BACKUP_MAX_DAYS", 30);
    this.maxBackupFiles = this.getPositiveNumberEnv("BACKUP_MAX_FILES", 120);
    const maxSizeGb = this.getPositiveNumberEnv("BACKUP_MAX_SIZE_GB", 20);
    this.maxTotalSizeBytes = Math.max(1, maxSizeGb) * 1024 * 1024 * 1024;
    this.httpRestoreEnabled =
      this.configService.get<string>("BACKUP_HTTP_RESTORE_ENABLED", "false") ===
      "true";
  }

  isHttpRestoreEnabled(): boolean {
    return this.httpRestoreEnabled;
  }

  private execFileAsync(
    command: string,
    args: string[],
    env?: Record<string, string | undefined>,
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = execFile(command, args, { env: { ...process.env, ...env } }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
        }
      });
      child.on("error", reject);
    });
  }

  private spawnWithOutput(
    command: string,
    args: string[],
    outputPath: string,
    env?: Record<string, string | undefined>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outStream = createWriteStream(outputPath);
      const child = spawn(command, args, { env: { ...process.env, ...env } });
      child.stdout.pipe(outStream);
      child.stderr.on("data", (data: Buffer) => {
        this.logger.warn(`stderr: ${data.toString()}`);
      });
      child.on("error", (err) => {
        outStream.destroy();
        reject(err);
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          outStream.destroy();
          reject(new Error(`${command} exited with code ${code}`));
        }
      });
    });
  }

  private spawnWithInput(
    command: string,
    args: string[],
    inputPath: string,
    env?: Record<string, string | undefined>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const inStream = createReadStream(inputPath);
      const child = spawn(command, args, { env: { ...process.env, ...env } });
      inStream.pipe(child.stdin);
      child.stderr.on("data", (data: Buffer) => {
        this.logger.warn(`stderr: ${data.toString()}`);
      });
      child.on("error", (err) => {
        inStream.destroy();
        reject(err);
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          inStream.destroy();
          reject(new Error(`${command} exited with code ${code}`));
        }
      });
    });
  }

  private getPositiveNumberEnv(key: string, defaultValue: number): number {
    const raw = this.configService.get<string | number>(key);
    if (raw === undefined || raw === null || raw === "") return defaultValue;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
  }

  private async ensureBackupDirectory(): Promise<void> {
    if (!existsSync(this.backupDir)) {
      await fs.mkdir(this.backupDir, { recursive: true });
      this.logger.log(`Diretório de backups criado: ${this.backupDir}`);
    }

    try {
      await fs.access(
        this.backupDir,
        constants.R_OK | constants.W_OK | constants.X_OK,
      );
    } catch {
      const uid =
        typeof process.getuid === "function" ? String(process.getuid()) : "N/A";
      const gid =
        typeof process.getgid === "function" ? String(process.getgid()) : "N/A";

      throw new Error(
        [
          `Diretório de backups sem permissão de leitura/escrita: ${this.backupDir}.`,
          `Processo atual: uid=${uid}, gid=${gid}.`,
          "Em Docker com bind mount, ajuste no host com:",
          "sudo chown -R 100:101 backups && sudo chmod -R u+rwX,go-rwx backups",
        ].join(" "),
      );
    }
  }

  /**
   * Backup completo do banco de dados - Executado diariamente às 2h da manhã
   */
  @Cron("0 2 * * *", {
    name: "daily-full-backup",
    timeZone: "America/Fortaleza",
  })
  async scheduledFullBackup(): Promise<void> {
    this.logger.log("Iniciando backup automático diário completo...");
    try {
      const result = await this.createFullBackup();
      if (result.success) {
        this.logger.log(
          `✅ Backup automático completo com sucesso: ${result.filename}`,
        );
      } else {
        this.logger.error(`❌ Falha no backup automático: ${result.error}`);
      }
    } catch (error) {
      this.logger.error("Erro ao executar backup automático:", error);
    } finally {
      await this.cleanOldBackups();
    }
  }

  /**
   * Backup incremental da tabela de desarquivamentos - Executado a cada 6 horas
   */
  @Cron("0 */6 * * *", {
    name: "incremental-desarquivamento-backup",
    timeZone: "America/Fortaleza",
  })
  async scheduledDesarquivamentoBackup(): Promise<void> {
    this.logger.log("Iniciando backup incremental de desarquivamentos...");
    try {
      const result = await this.createDesarquivamentoBackup();
      if (result.success) {
        this.logger.log(
          `✅ Backup de desarquivamentos com sucesso: ${result.filename}`,
        );
      } else {
        this.logger.error(
          `❌ Falha no backup de desarquivamentos: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error("Erro ao executar backup de desarquivamentos:", error);
    } finally {
      await this.cleanOldBackups();
    }
  }

  /**
   * Limpeza de segurança (diária) para evitar crescimento contínuo de backup.
   */
  @Cron("30 3 * * *", {
    name: "daily-backup-cleanup",
    timeZone: "America/Fortaleza",
  })
  async scheduledBackupCleanup(): Promise<void> {
    try {
      const deleted = await this.cleanOldBackups();
      this.logger.log(
        `🧹 Limpeza diária de backup concluída: ${deleted} item(ns)`,
      );
    } catch (error) {
      this.logger.error("Erro na limpeza diária de backups:", error);
    }
  }

  /**
   * Cria um backup completo do banco de dados e arquivos
   */
  async createFullBackup(): Promise<BackupResult> {
    await this.ensureBackupDirectory();
    const startTime = Date.now();
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const sqlFilename = `backup_full_${timestamp}.sql`;
    const sqlFilepath = path.join(this.backupDir, sqlFilename);
    const tarFilename = `backup_full_${timestamp}.tar.gz`;
    const tarFilepath = path.join(this.backupDir, tarFilename);

    try {
      this.logger.log(`Criando backup completo: ${tarFilename}`);

      // 1. Backup do banco de dados
      this.logger.log("📦 Exportando banco de dados...");
      const dbConfig = this.getDatabaseConfig();
      const tableArgs = this.buildBackupArgs(dbConfig, false);

      const containerName = this.configService.get<string>(
        "POSTGRES_CONTAINER",
        "db",
      );

      if (dbConfig.isDocker) {
        const dockerArgs = [
          "exec", "-i", containerName,
          "pg_dump",
          "-U", dbConfig.username,
          "-d", dbConfig.database,
          ...tableArgs,
          "--no-owner", "--no-privileges",
          "--clean", "--if-exists",
        ];
        this.logger.log(
          `Executando: docker exec -i ${containerName} pg_dump ...`,
        );
        await this.spawnWithOutput("docker", dockerArgs, sqlFilepath);
      } else {
        const pgArgs = [
          "-h", dbConfig.host,
          "-p", String(dbConfig.port),
          "-U", dbConfig.username,
          "-d", dbConfig.database,
          ...tableArgs,
          "--no-owner", "--no-privileges",
          "--clean", "--if-exists",
        ];
        this.logger.log("Executando: pg_dump ...");
        await this.executeWithPgPassword("pg_dump", pgArgs, dbConfig.password, sqlFilepath);
      }

      // Aguardar um pouco para garantir que o arquivo foi escrito
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!existsSync(sqlFilepath)) {
        throw new Error("Arquivo de backup do banco não foi criado");
      }

      this.logger.log(
        `✅ Arquivo SQL criado: ${sqlFilepath} (${this.formatBytes(statSync(sqlFilepath).size)})`,
      );

      // 2. Backup dos arquivos uploads/
      this.logger.log("📁 Compactando arquivos uploads/...");
      const uploadsPath = path.join(process.cwd(), "uploads");

      if (existsSync(uploadsPath)) {
        // Criar tar.gz com DB + uploads
        // Como BusyBox tar não suporta append (-r), vamos criar um diretório temporário
        const tempDir = path.join(this.backupDir, `temp_${timestamp}`);

        try {
          // Criar diretório temporário
          await fs.mkdir(tempDir, { recursive: true });

          // Copiar arquivo SQL para o diretório temporário
          const tempSqlPath = path.join(tempDir, sqlFilename);
          await fs.copyFile(sqlFilepath, tempSqlPath);

          // Copiar diretório uploads para o diretório temporário
          const tempUploadsPath = path.join(tempDir, "uploads");
          await fs.cp(uploadsPath, tempUploadsPath, { recursive: true });

        // Criar tar.gz do diretório temporário
        const tarArgs = ["-czf", tarFilepath, "-C", tempDir, "."];
        this.logger.log(`Executando tar: tar ${tarArgs.join(" ")}`);
        await this.execFileAsync("tar", tarArgs);

          // Limpar diretório temporário e arquivo SQL original
          await fs.rm(tempDir, { recursive: true, force: true });
          await fs.unlink(sqlFilepath);

          if (!existsSync(tarFilepath)) {
            throw new Error("Arquivo de backup compactado não foi criado");
          }

          const stats = statSync(tarFilepath);
          const duration = Date.now() - startTime;

          this.logger.log(
            `✅ Backup completo criado: ${tarFilename} (${this.formatBytes(stats.size)}) em ${duration}ms`,
          );

          return {
            success: true,
            filename: tarFilename,
            size: this.formatBytes(stats.size),
            timestamp: new Date(),
            duration,
          };
        } catch (error) {
          // Limpar diretório temporário em caso de erro
          if (existsSync(tempDir)) {
            await fs.rm(tempDir, { recursive: true, force: true });
          }
          throw error;
        }
      } else {
        // Se não houver uploads, retorna apenas o SQL
        this.logger.warn(
          "⚠️ Diretório uploads/ não encontrado. Backup apenas do banco de dados.",
        );

        const stats = statSync(sqlFilepath);
        const duration = Date.now() - startTime;

        return {
          success: true,
          filename: sqlFilename,
          size: this.formatBytes(stats.size),
          timestamp: new Date(),
          duration,
        };
      }
    } catch (error) {
      this.logger.error(`Erro ao criar backup completo: ${error.message}`);

      // Limpar arquivos temporários
      if (existsSync(sqlFilepath)) {
        await fs.unlink(sqlFilepath);
      }
      if (existsSync(tarFilepath)) {
        await fs.unlink(tarFilepath);
      }

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Cria backup específico da tabela de desarquivamentos
   */
  async createDesarquivamentoBackup(): Promise<BackupResult> {
    await this.ensureBackupDirectory();
    const startTime = Date.now();
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `backup_desarquivamentos_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      this.logger.log(`Criando backup de desarquivamentos: ${filename}`);

      const dbConfig = this.getDatabaseConfig();
      const tableArgs = this.buildBackupArgs(dbConfig, true);

      const containerName = this.configService.get<string>(
        "POSTGRES_CONTAINER",
        "db",
      );

      if (dbConfig.isDocker) {
        const dockerArgs = [
          "exec", "-i", containerName,
          "pg_dump",
          "-U", dbConfig.username,
          "-d", dbConfig.database,
          ...tableArgs,
          "--no-owner", "--no-privileges",
          "--clean", "--if-exists",
        ];
        await this.spawnWithOutput("docker", dockerArgs, filepath);
      } else {
        const pgArgs = [
          "-h", dbConfig.host,
          "-p", String(dbConfig.port),
          "-U", dbConfig.username,
          "-d", dbConfig.database,
          ...tableArgs,
          "--no-owner", "--no-privileges",
          "--clean", "--if-exists",
        ];
        await this.executeWithPgPassword("pg_dump", pgArgs, dbConfig.password, filepath);
      }

      if (!existsSync(filepath)) {
        throw new Error("Arquivo de backup não foi criado");
      }

      const stats = statSync(filepath);
      const duration = Date.now() - startTime;

      this.logger.log(
        `✅ Backup de desarquivamentos criado: ${filename} (${this.formatBytes(stats.size)}) em ${duration}ms`,
      );

      return {
        success: true,
        filename,
        size: this.formatBytes(stats.size),
        timestamp: new Date(),
        duration,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao criar backup de desarquivamentos: ${error.message}`,
      );

      if (existsSync(filepath)) {
        await fs.unlink(filepath);
      }

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(): Promise<any[]> {
    try {
      await this.ensureBackupDirectory();
      const files = await fs.readdir(this.backupDir);
      const backups = await Promise.all(
        files
          .filter(
            (file) =>
              (file.endsWith(".sql") || file.endsWith(".tar.gz")) &&
              file.startsWith("backup_"),
          )
          .map(async (file) => {
            try {
              const filepath = path.join(this.backupDir, file);
              const stats = await fs.stat(filepath);

              let type = "full";
              let includesFiles = false;

              if (file.includes("desarquivamentos")) {
                type = "desarquivamentos";
              }

              if (file.endsWith(".tar.gz")) {
                includesFiles = true;
              }

              return {
                filename: file,
                size: this.formatBytes(stats.size),
                sizeBytes: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                type,
                includesFiles,
              };
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return null;
              }
              throw error;
            }
          }),
      );

      return backups
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      this.logger.error(`Erro ao listar backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Remove backups mais antigos que o período de retenção
   */
  async cleanOldBackups(): Promise<number> {
    try {
      await this.ensureBackupDirectory();
      const now = Date.now();
      const maxAge = this.maxBackupDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;
      const managedEntries = await this.listManagedBackupEntries("asc");

      // 1) Política por idade
      for (const entry of managedEntries) {
        const age = now - entry.mtime;
        if (age <= maxAge) continue;
        await this.removeBackupEntry(entry.filepath, entry.isDirectory);
        deletedCount++;
        this.logger.log(
          `🗑️ Removido por idade (> ${this.maxBackupDays} dias): ${entry.file}`,
        );
      }

      // Recalcular após remoção por idade
      const refreshedEntries = await this.listManagedBackupEntries("desc");

      // 2) Política por quantidade
      if (
        this.maxBackupFiles > 0 &&
        refreshedEntries.length > this.maxBackupFiles
      ) {
        const overflow = refreshedEntries.slice(this.maxBackupFiles);
        for (const entry of overflow) {
          await this.removeBackupEntry(entry.filepath, entry.isDirectory);
          deletedCount++;
          this.logger.log(
            `🗑️ Removido por quantidade (max ${this.maxBackupFiles}): ${entry.file}`,
          );
        }
      }

      // 3) Política por tamanho total
      const finalEntries = await this.listManagedBackupEntries("asc");

      let totalSize = finalEntries.reduce(
        (sum, item) => sum + item.sizeBytes,
        0,
      );
      while (totalSize > this.maxTotalSizeBytes && finalEntries.length > 0) {
        const oldest = finalEntries.shift();
        if (!oldest) break;
        await this.removeBackupEntry(oldest.filepath, oldest.isDirectory);
        deletedCount++;
        totalSize -= oldest.sizeBytes;
        this.logger.log(
          `🗑️ Removido por tamanho total (${this.formatBytes(totalSize)} / ${this.formatBytes(this.maxTotalSizeBytes)}): ${oldest.file}`,
        );
      }

      if (deletedCount > 0) {
        this.logger.log(
          `🧹 Limpeza concluída: ${deletedCount} arquivo(s) removido(s)`,
        );
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Erro ao limpar backups antigos: ${error.message}`);
      return 0;
    }
  }

  private isManagedBackupFilename(file: string): boolean {
    return (
      (((file.endsWith(".sql") || file.endsWith(".tar.gz")) &&
        file.startsWith("backup_")) ||
        file.startsWith("uploads_old_")) &&
      file.length > 0
    );
  }

  private async listManagedBackupEntries(
    sortDirection: EntrySortDirection,
  ): Promise<ManagedBackupEntry[]> {
    const files = await fs.readdir(this.backupDir);
    const entries = await Promise.all(
      files
        .filter((file) => this.isManagedBackupFilename(file))
        .map(async (file) => {
          const filepath = path.join(this.backupDir, file);
          try {
            const stats = await fs.stat(filepath);
            const isDirectory = stats.isDirectory();
            return {
              file,
              filepath,
              isDirectory,
              mtime: stats.mtime.getTime(),
              sizeBytes: isDirectory
                ? await this.getDirectorySize(filepath)
                : stats.size,
            };
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              return null;
            }
            throw error;
          }
        }),
    );

    const validEntries = entries.filter(
      (entry): entry is ManagedBackupEntry => entry !== null,
    );
    validEntries.sort((a, b) =>
      sortDirection === "asc" ? a.mtime - b.mtime : b.mtime - a.mtime,
    );

    return validEntries;
  }

  /**
   * Restaura um backup específico (banco de dados e arquivos)
   */
  async restoreBackup(filename: string): Promise<BackupResult> {
    await this.ensureBackupDirectory();
    const safeFilename = this.validateBackupFilename(filename);
    const filepath = this.resolveBackupFilePath(safeFilename);
    const startTime = Date.now();
    let extractDir: string | null = null;

    try {
      if (!existsSync(filepath)) {
        throw new Error("Arquivo de backup não encontrado");
      }

      this.logger.warn(`⚠️ Restaurando backup: ${safeFilename}`);

      // Verificar se é um backup completo (.tar.gz) ou apenas banco (.sql)
      if (safeFilename.endsWith(".tar.gz")) {
        this.logger.log("📦 Extraindo backup completo...");

        // Extrair o arquivo tar.gz
        extractDir = path.join(this.backupDir, `temp_restore_${Date.now()}`);
        await fs.mkdir(extractDir, { recursive: true });

      await this.validateTarArchiveEntries(filepath);

      // Extrair tar.gz
      await this.execFileAsync("tar", ["-xzf", filepath, "-C", extractDir]);

        // Procurar o arquivo SQL dentro do extraído
        const extractedFiles = await fs.readdir(extractDir);
        const sqlFile = extractedFiles.find((f) => f.endsWith(".sql"));

        if (!sqlFile) {
          throw new Error("Arquivo SQL não encontrado no backup");
        }

        const tempSqlFile = path.join(extractDir, sqlFile);

        // 1. Truncar tabelas existentes para evitar duplicação
        this.logger.log("🗑️ Preparando banco para restauração...");
        const dbConfig = this.getDatabaseConfig();
        await this.executePreRestoreTruncate(dbConfig);

        // 2. Restaurar banco de dados
        this.logger.log("🔄 Restaurando banco de dados...");
        const containerName = this.configService.get<string>(
          "POSTGRES_CONTAINER",
          "db",
        );

        if (dbConfig.isDocker) {
          const psqlArgs = [
            "exec", "-i", containerName,
            "psql", "-U", dbConfig.username, "-d", dbConfig.database,
          ];
          await this.spawnWithInput("docker", psqlArgs, tempSqlFile);
        } else {
          const psqlArgs = [
            "-h", dbConfig.host,
            "-p", String(dbConfig.port),
            "-U", dbConfig.username,
            "-d", dbConfig.database,
          ];
          await this.spawnWithInput("psql", psqlArgs, tempSqlFile, { PGPASSWORD: dbConfig.password });
        }

        // 3. Restaurar arquivos uploads/ se existirem
        const uploadsInBackup = path.join(extractDir, "uploads");
        if (existsSync(uploadsInBackup)) {
          await this.restoreUploadsDirectory(uploadsInBackup);
        } else {
          this.logger.warn("⚠️ Nenhum arquivo de uploads encontrado no backup");
        }
      } else {
        // Backup apenas do banco de dados (.sql)
        this.logger.log("🗑️ Preparando banco para restauração...");
        const dbConfig = this.getDatabaseConfig();
        await this.executePreRestoreTruncate(dbConfig);

        this.logger.log("🔄 Restaurando apenas banco de dados...");
        const containerName = this.configService.get<string>(
          "POSTGRES_CONTAINER",
          "db",
        );

        if (dbConfig.isDocker) {
          const psqlArgs = [
            "exec", "-i", containerName,
            "psql", "-U", dbConfig.username, "-d", dbConfig.database,
          ];
          await this.spawnWithInput("docker", psqlArgs, filepath);
        } else {
          const psqlArgs = [
            "-h", dbConfig.host,
            "-p", String(dbConfig.port),
            "-U", dbConfig.username,
            "-d", dbConfig.database,
          ];
          await this.spawnWithInput("psql", psqlArgs, filepath, { PGPASSWORD: dbConfig.password });
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Backup restaurado com sucesso: ${safeFilename} em ${duration}ms`,
      );

      return {
        success: true,
        filename: safeFilename,
        timestamp: new Date(),
        duration,
      };
    } catch (error) {
      this.logger.error(`Erro ao restaurar backup: ${error.message}`);

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    } finally {
      if (extractDir && existsSync(extractDir)) {
        try {
          await fs.rm(extractDir, { recursive: true, force: true });
        } catch {
          this.logger.error(
            `Erro ao limpar diretório temporário de restore: ${extractDir}`,
          );
        }
      }
      await this.cleanOldBackups();
    }
  }

  private validateBackupFilename(filename: string): string {
    const normalized = filename.trim();
    if (!normalized) {
      throw new BadRequestException("Nome do backup inválido.");
    }

    if (path.basename(normalized) !== normalized || normalized.includes("..")) {
      throw new BadRequestException("Nome do backup inválido.");
    }

    const allowedPattern = /^backup_[A-Za-z0-9._-]+\.(sql|tar\.gz)$/;
    if (!allowedPattern.test(normalized)) {
      throw new BadRequestException("Formato de nome de backup não permitido.");
    }

    return normalized;
  }

  private resolveBackupFilePath(filename: string): string {
    const backupRoot = path.resolve(this.backupDir);
    const absolutePath = path.resolve(backupRoot, filename);
    if (!absolutePath.startsWith(`${backupRoot}${path.sep}`)) {
      throw new BadRequestException("Caminho de backup inválido.");
    }
    return absolutePath;
  }

  private async validateTarArchiveEntries(archivePath: string): Promise<void> {
    const { stdout } = await this.execFileAsync("tar", ["-tzf", archivePath]);
    const entries = stdout
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const { stdout: verboseOutput } = await this.execFileAsync("tar", [
      "-tvzf", archivePath,
    ]);
    const verboseLines = verboseOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!entries.length) {
      throw new BadRequestException("Arquivo de backup vazio ou inválido.");
    }

    for (const entry of entries) {
      if (!this.isSafeTarEntry(entry)) {
        throw new BadRequestException(
          `Backup contém caminho inseguro: ${entry}`,
        );
      }
    }

    for (const line of verboseLines) {
      const entryType = line[0];
      if (entryType === "l" || entryType === "h") {
        throw new BadRequestException(
          "Backup contém links simbólicos/hard links não permitidos.",
        );
      }
    }
  }

  private isSafeTarEntry(entry: string): boolean {
    if (entry.includes("\0")) {
      return false;
    }

    const normalized = entry.replace(/\\/g, "/");
    if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) {
      return false;
    }

    const normalizedPath = path.posix.normalize(normalized);
    if (normalizedPath === ".." || normalizedPath.startsWith("../")) {
      return false;
    }

    return true;
  }

  private async removeBackupEntry(
    filepath: string,
    isDirectory: boolean,
  ): Promise<void> {
    if (isDirectory) {
      await fs.rm(filepath, { recursive: true, force: true });
      return;
    }
    await fs.unlink(filepath);
  }

  private async clearDirectoryContents(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      return;
    }

    const entries = await fs.readdir(dirPath);
    await Promise.all(
      entries.map((entry) =>
        fs.rm(path.join(dirPath, entry), {
          recursive: true,
          force: true,
        }),
      ),
    );
  }

  private async copyDirectoryContents(
    sourceDir: string,
    destinationDir: string,
  ): Promise<void> {
    await fs.mkdir(destinationDir, { recursive: true });
    const entries = await fs.readdir(sourceDir);

    await Promise.all(
      entries.map((entry) =>
        fs.cp(path.join(sourceDir, entry), path.join(destinationDir, entry), {
          recursive: true,
          force: true,
        }),
      ),
    );
  }

  private async restoreUploadsDirectory(
    uploadsInBackup: string,
  ): Promise<void> {
    this.logger.log("📁 Restaurando arquivos uploads/...");
    const uploadsDestination = path.join(process.cwd(), "uploads");
    const uploadsDestinationExists = existsSync(uploadsDestination);

    if (uploadsDestinationExists) {
      const backupOldUploads = path.join(
        this.backupDir,
        `uploads_old_${Date.now()}`,
      );
      this.logger.log(
        `💾 Fazendo backup do diretório uploads/ atual em ${backupOldUploads}`,
      );
      await fs.cp(uploadsDestination, backupOldUploads, { recursive: true });
    }

    await fs.mkdir(uploadsDestination, { recursive: true });

    this.logger.log("🗑️ Limpando conteúdo atual do diretório uploads/...");
    await this.clearDirectoryContents(uploadsDestination);

    this.logger.log("📋 Copiando arquivos do backup...");
    await this.copyDirectoryContents(uploadsInBackup, uploadsDestination);

    this.logger.log("✅ Arquivos restaurados com sucesso");
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let total = 0;
    const stack = [dirPath];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      const entries = await fs.readdir(current);
      for (const entry of entries) {
        const fullPath = path.join(current, entry);
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          stack.push(fullPath);
        } else {
          total += stats.size;
        }
      }
    }
    return total;
  }

  /**
   * Obtém configurações do banco de dados
   */
  private getDatabaseConfig() {
    const isDocker = process.env.DOCKER_CONTAINER === "true";

    return {
      host: isDocker
        ? this.configService.get<string>("DOCKER_DB_HOST", "db")
        : this.configService.get<string>("DATABASE_HOST", "localhost"),
      port: isDocker
        ? this.configService.get<number>("DOCKER_DB_PORT", 5432)
        : this.configService.get<number>("DATABASE_PORT", 5432),
      username: isDocker
        ? this.configService.get<string>("DOCKER_DB_USERNAME", "sgc")
        : this.configService.get<string>("DATABASE_USERNAME", "sgc"),
      password: isDocker
        ? this.configService.get<string>("DOCKER_DB_PASSWORD")
        : this.configService.get<string>("DATABASE_PASSWORD"),
      database: isDocker
        ? this.configService.get<string>("DOCKER_DB_NAME", "sgc")
        : this.configService.get<string>("DATABASE_NAME", "sgc"),
      isDocker,
    };
  }

  /**
   * Constrói comando de backup
   */
  private buildBackupArgs(
    config: any,
    desarquivamentoOnly: boolean,
  ): string[] {
    const args: string[] = [];

    if (desarquivamentoOnly) {
      args.push("-t", "desarquivamentos", "-t", "desarquivamento_comments");
    } else {
      const criticalTables = [
        "usuarios",
        "roles",
        "user_preferences",
        "desarquivamentos",
        "desarquivamento_comments",
        "desarquivamento_anexos",
        "pastas",
        "pasta_arquivos",
        "projetos",
        "tarefas",
        "tarefa_responsaveis",
        "colunas",
        "membros_projeto",
        "checklists",
        "itens_checklist",
        "anexos",
        "comentarios",
        "historico_tarefas",
        "notificacoes",
        "notification_preferences",
        "planilhas_controle",
        "registros",
        "auditorias",
        "blocked_ips",
        "system_settings",
        "system_announcements",
        "announcement_viewed",
        "vestigios",
      ];
      for (const t of criticalTables) {
        args.push("-t", t);
      }
    }

    return args;
  }

  /**
   * Executa comando com senha do PostgreSQL de forma segura
   */
  private async executeWithPgPassword(
    command: string,
    args: string[],
    password: string,
    outputPath?: string,
  ): Promise<{ stdout: string; stderr: string }> {
    const env = { PGPASSWORD: password };
    if (outputPath) {
      await this.spawnWithOutput(command, args, outputPath, env);
      return { stdout: "", stderr: "" };
    }
    return this.execFileAsync(command, args, env);
  }

  /**
   * Gera SQL para truncar todas as tabelas gerenciadas antes do restore.
   * Usa TRUNCATE ... CASCADE para lidar com dependências de FK,
   * evitando duplicação de dados quando o DROP TABLE do pg_dump falha
   * silenciosamente por causa de foreign keys.
   */
  private buildPreRestoreTruncateSQL(): string {
    const tables = [
      "announcement_viewed",
      "notification_preferences",
      "user_preferences",
      "historico_tarefas",
      "itens_checklist",
      "checklists",
      "comentarios",
      "anexos",
      "tarefa_responsaveis",
      "membros_projeto",
      "colunas",
      "tarefas",
      "desarquivamento_anexos",
      "desarquivamento_comments",
      "desarquivamentos",
      "pasta_arquivos",
      "pastas",
      "projetos",
      "registros",
      "planilhas_controle",
      "vestigios",
      "notificacoes",
      "auditorias",
      "blocked_ips",
      "system_announcements",
      "system_settings",
      "roles",
      "usuarios",
    ];

    // TRUNCATE com CASCADE garante que todas as dependências sejam respeitadas
    // Usa DO block para ignorar erros de tabelas inexistentes (não existe IF EXISTS no TRUNCATE)
    return tables
      .map(
        (t) =>
          `DO $$ BEGIN EXECUTE 'TRUNCATE TABLE ${t} CASCADE'; EXCEPTION WHEN undefined_table THEN NULL; END $$;`,
      )
      .join("\n");
  }

  /**
   * Executa o truncate pré-restore no banco de dados
   */
  private async executePreRestoreTruncate(config: any): Promise<void> {
    const truncateSQL = this.buildPreRestoreTruncateSQL();
    const containerName = this.configService.get<string>(
      "POSTGRES_CONTAINER",
      "db",
    );

    this.logger.log(
      "🗑️ Truncando tabelas existentes antes do restore (evitando duplicatas)...",
    );

    const tempSqlFile = path.join(this.backupDir, `temp_truncate_${Date.now()}.sql`);
    await fs.writeFile(tempSqlFile, truncateSQL, "utf-8");

    try {
      if (config.isDocker) {
        const dockerArgs = [
          "exec", "-i", containerName,
          "psql", "-U", config.username, "-d", config.database,
        ];
        await this.spawnWithInput("docker", dockerArgs, tempSqlFile);
      } else {
        const psqlArgs = [
          "-h", config.host,
          "-p", String(config.port),
          "-U", config.username,
          "-d", config.database,
        ];
        await this.spawnWithInput("psql", psqlArgs, tempSqlFile, { PGPASSWORD: config.password });
      }

      this.logger.log("✅ Tabelas truncadas com sucesso");
    } finally {
      try {
        await fs.unlink(tempSqlFile);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  /**
   * Formata bytes para formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}
