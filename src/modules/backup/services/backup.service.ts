import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import { existsSync, statSync } from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface BackupResult {
  success: boolean;
  filename?: string;
  filepath?: string;
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

  constructor(private configService: ConfigService) {
    this.backupDir = path.resolve(
      process.cwd(),
      this.configService.get<string>("BACKUP_DIR", "./backups"),
    );
    this.maxBackupDays = this.getPositiveNumberEnv("BACKUP_MAX_DAYS", 30);
    this.maxBackupFiles = this.getPositiveNumberEnv("BACKUP_MAX_FILES", 120);
    const maxSizeGb = this.getPositiveNumberEnv("BACKUP_MAX_SIZE_GB", 20);
    this.maxTotalSizeBytes = Math.max(1, maxSizeGb) * 1024 * 1024 * 1024;
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
      const command = this.buildBackupCommand(dbConfig, sqlFilepath, false);

      this.logger.log(
        `Executando comando: ${command.replace(/password=\S+/gi, "password=***")}`,
      );

      // Executa com senha via variável de ambiente (mais seguro)
      if (dbConfig.isDocker) {
        await execAsync(command);
      } else {
        await this.executeWithPgPassword(command, dbConfig.password);
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
          await execAsync(`cp -r "${uploadsPath}" "${tempUploadsPath}"`);

          // Criar tar.gz do diretório temporário
          const tarCommand = `tar -czf "${tarFilepath}" -C "${tempDir}" .`;
          this.logger.log(`Executando tar: ${tarCommand}`);
          await execAsync(tarCommand);

          // Limpar diretório temporário e arquivo SQL original
          await execAsync(`rm -rf "${tempDir}"`);
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
            filepath: tarFilepath,
            size: this.formatBytes(stats.size),
            timestamp: new Date(),
            duration,
          };
        } catch (error) {
          // Limpar diretório temporário em caso de erro
          if (existsSync(tempDir)) {
            await execAsync(`rm -rf "${tempDir}"`);
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
          filepath: sqlFilepath,
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
      const command = this.buildBackupCommand(dbConfig, filepath, true);

      // Executa com senha via variável de ambiente (mais seguro)
      if (dbConfig.isDocker) {
        await execAsync(command);
      } else {
        await this.executeWithPgPassword(command, dbConfig.password);
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
        filepath,
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
                filepath,
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
    let tempSqlFile: string | null = null;

    try {
      if (!existsSync(filepath)) {
        throw new Error("Arquivo de backup não encontrado");
      }

      this.logger.warn(`⚠️ Restaurando backup: ${safeFilename}`);

      // Verificar se é um backup completo (.tar.gz) ou apenas banco (.sql)
      if (safeFilename.endsWith(".tar.gz")) {
        this.logger.log("📦 Extraindo backup completo...");

        // Extrair o arquivo tar.gz
        const extractDir = path.join(
          this.backupDir,
          `temp_restore_${Date.now()}`,
        );
        await fs.mkdir(extractDir, { recursive: true });

        await this.validateTarArchiveEntries(filepath);

        // Extrair tar.gz
        await execAsync(`tar -xzf "${filepath}" -C "${extractDir}"`);

        // Procurar o arquivo SQL dentro do extraído
        const extractedFiles = await fs.readdir(extractDir);
        const sqlFile = extractedFiles.find((f) => f.endsWith(".sql"));

        if (!sqlFile) {
          throw new Error("Arquivo SQL não encontrado no backup");
        }

        tempSqlFile = path.join(extractDir, sqlFile);

        // 1. Restaurar banco de dados
        this.logger.log("🔄 Restaurando banco de dados...");
        const dbConfig = this.getDatabaseConfig();
        const restoreCommand = this.buildRestoreCommand(dbConfig, tempSqlFile);

        // Executa com senha via variável de ambiente (mais seguro)
        if (dbConfig.isDocker) {
          await execAsync(restoreCommand);
        } else {
          await this.executeWithPgPassword(restoreCommand, dbConfig.password);
        }

        // 2. Restaurar arquivos uploads/ se existirem
        const uploadsInBackup = path.join(extractDir, "uploads");
        if (existsSync(uploadsInBackup)) {
          this.logger.log("📁 Restaurando arquivos uploads/...");
          const uploadsDestination = path.join(process.cwd(), "uploads");

          // Fazer backup do uploads atual antes de sobrescrever
          const backupOldUploads = path.join(
            this.backupDir,
            `uploads_old_${Date.now()}`,
          );
          if (existsSync(uploadsDestination)) {
            this.logger.log(
              `💾 Fazendo backup do diretório uploads/ atual em ${backupOldUploads}`,
            );
            await execAsync(
              `cp -r "${uploadsDestination}" "${backupOldUploads}"`,
            );
          }

          // Restaurar uploads (limpar conteúdo e copiar novos arquivos)
          // Não remover o diretório em si (pode estar montado como volume)
          this.logger.log(
            "🗑️ Limpando conteúdo atual do diretório uploads/...",
          );
          await execAsync(`find "${uploadsDestination}" -mindepth 1 -delete`);

          this.logger.log("📋 Copiando arquivos do backup...");
          await execAsync(
            `cp -r "${uploadsInBackup}"/* "${uploadsDestination}"/`,
          );

          this.logger.log("✅ Arquivos restaurados com sucesso");
        } else {
          this.logger.warn("⚠️ Nenhum arquivo de uploads encontrado no backup");
        }

        // Limpar diretório temporário
        await fs.rm(extractDir, { recursive: true, force: true });
      } else {
        // Backup apenas do banco de dados (.sql)
        this.logger.log("🔄 Restaurando apenas banco de dados...");
        const dbConfig = this.getDatabaseConfig();
        const command = this.buildRestoreCommand(dbConfig, filepath);

        // Executa com senha via variável de ambiente (mais seguro)
        if (dbConfig.isDocker) {
          await execAsync(command);
        } else {
          await this.executeWithPgPassword(command, dbConfig.password);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Backup restaurado com sucesso: ${safeFilename} em ${duration}ms`,
      );

      return {
        success: true,
        filename: safeFilename,
        filepath,
        timestamp: new Date(),
        duration,
      };
    } catch (error) {
      this.logger.error(`Erro ao restaurar backup: ${error.message}`);

      // Limpar arquivos temporários em caso de erro
      if (tempSqlFile && existsSync(path.dirname(tempSqlFile))) {
        try {
          await fs.rm(path.dirname(tempSqlFile), {
            recursive: true,
            force: true,
          });
        } catch (cleanupError) {
          this.logger.error("Erro ao limpar arquivos temporários");
        }
      }

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    } finally {
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
    const { stdout } = await execAsync(`tar -tzf "${archivePath}"`);
    const entries = stdout
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const { stdout: verboseOutput } = await execAsync(
      `tar -tvzf "${archivePath}"`,
    );
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
      await execAsync(`rm -rf "${filepath}"`);
      return;
    }
    await fs.unlink(filepath);
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
  private buildBackupCommand(
    config: any,
    filepath: string,
    desarquivamentoOnly: boolean,
  ): string {
    let tables = "";

    if (desarquivamentoOnly) {
      // Backup incremental apenas de desarquivamentos
      tables = "-t desarquivamentos -t desarquivamento_comments";
    } else {
      // Backup completo - incluir explicitamente todas as tabelas importantes
      const criticalTables = [
        "users",
        "roles",
        "user_preferences",
        "desarquivamentos",
        "desarquivamento_comments",
        "pastas",
        "pasta_arquivos",
        "projetos",
        "tarefas",
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
      ];

      tables = criticalTables.map((t) => `-t ${t}`).join(" ");
    }

    const containerName = this.configService.get<string>(
      "POSTGRES_CONTAINER",
      "db",
    );

    if (config.isDocker) {
      // Comando para executar dentro do container Docker
      // Usa redirecionamento de stdin com docker exec -i
      return `docker exec -i ${containerName} pg_dump \
        -U ${config.username} \
        -d ${config.database} \
        ${tables} \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists > ${filepath}`;
    } else {
      // Comando local - senha passada via variável de ambiente no processo
      // A senha será injetada via env no momento da execução
      return `pg_dump \
        -h ${config.host} \
        -p ${config.port} \
        -U ${config.username} \
        -d ${config.database} \
        ${tables} \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists > ${filepath}`;
    }
  }

  /**
   * Executa comando com senha do PostgreSQL de forma segura
   */
  private async executeWithPgPassword(
    command: string,
    password: string,
  ): Promise<{ stdout: string; stderr: string }> {
    return execAsync(command, {
      env: {
        ...process.env,
        PGPASSWORD: password,
      },
    });
  }

  /**
   * Constrói comando de restauração
   */
  private buildRestoreCommand(config: any, filepath: string): string {
    const containerName = this.configService.get<string>(
      "POSTGRES_CONTAINER",
      "db",
    );

    if (config.isDocker) {
      return `docker exec -i ${containerName} psql \
        -U ${config.username} \
        -d ${config.database} < ${filepath}`;
    } else {
      // Comando local - senha passada via variável de ambiente no processo
      return `psql \
        -h ${config.host} \
        -p ${config.port} \
        -U ${config.username} \
        -d ${config.database} < ${filepath}`;
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
