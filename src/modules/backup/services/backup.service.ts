import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

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

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly maxBackupDays: number;

  constructor(private configService: ConfigService) {
    this.backupDir = path.resolve(process.cwd(), 'backups');
    this.maxBackupDays = 30; // Manter backups dos últimos 30 dias
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Diretório de backups criado: ${this.backupDir}`);
    }
  }

  /**
   * Backup completo do banco de dados - Executado diariamente às 2h da manhã
   */
  @Cron('0 2 * * *', {
    name: 'daily-full-backup',
    timeZone: 'America/Fortaleza',
  })
  async scheduledFullBackup(): Promise<void> {
    this.logger.log('Iniciando backup automático diário completo...');
    try {
      const result = await this.createFullBackup();
      if (result.success) {
        this.logger.log(
          `✅ Backup automático completo com sucesso: ${result.filename}`,
        );
        await this.cleanOldBackups();
      } else {
        this.logger.error(
          `❌ Falha no backup automático: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao executar backup automático:', error);
    }
  }

  /**
   * Backup incremental da tabela de desarquivamentos - Executado a cada 6 horas
   */
  @Cron('0 */6 * * *', {
    name: 'incremental-desarquivamento-backup',
    timeZone: 'America/Fortaleza',
  })
  async scheduledDesarquivamentoBackup(): Promise<void> {
    this.logger.log('Iniciando backup incremental de desarquivamentos...');
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
      this.logger.error('Erro ao executar backup de desarquivamentos:', error);
    }
  }

  /**
   * Cria um backup completo do banco de dados
   */
  async createFullBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const filename = `backup_full_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      this.logger.log(`Criando backup completo: ${filename}`);

      const dbConfig = this.getDatabaseConfig();
      const command = this.buildBackupCommand(dbConfig, filepath, false);

      await execAsync(command);

      // Verifica se o arquivo foi criado
      if (!fs.existsSync(filepath)) {
        throw new Error('Arquivo de backup não foi criado');
      }

      const stats = fs.statSync(filepath);
      const duration = Date.now() - startTime;

      this.logger.log(
        `✅ Backup completo criado: ${filename} (${this.formatBytes(stats.size)}) em ${duration}ms`,
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
      this.logger.error(`Erro ao criar backup completo: ${error.message}`);
      
      // Remove arquivo parcial se existir
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
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
    const startTime = Date.now();
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const filename = `backup_desarquivamentos_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      this.logger.log(`Criando backup de desarquivamentos: ${filename}`);

      const dbConfig = this.getDatabaseConfig();
      const command = this.buildBackupCommand(dbConfig, filepath, true);

      await execAsync(command);

      if (!fs.existsSync(filepath)) {
        throw new Error('Arquivo de backup não foi criado');
      }

      const stats = fs.statSync(filepath);
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

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
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
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter((file) => file.endsWith('.sql') && file.startsWith('backup_'))
        .map((file) => {
          const filepath = path.join(this.backupDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            filepath,
            size: this.formatBytes(stats.size),
            sizeBytes: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: file.includes('desarquivamentos')
              ? 'desarquivamentos'
              : 'full',
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return backups;
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
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const maxAge = this.maxBackupDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.sql') && file.startsWith('backup_')) {
          const filepath = path.join(this.backupDir, file);
          const stats = fs.statSync(filepath);
          const age = now - stats.mtime.getTime();

          if (age > maxAge) {
            fs.unlinkSync(filepath);
            deletedCount++;
            this.logger.log(`🗑️ Backup antigo removido: ${file}`);
          }
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`🧹 Limpeza concluída: ${deletedCount} arquivo(s) removido(s)`);
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Erro ao limpar backups antigos: ${error.message}`);
      return 0;
    }
  }

  /**
   * Restaura um backup específico
   */
  async restoreBackup(filename: string): Promise<BackupResult> {
    const filepath = path.join(this.backupDir, filename);

    try {
      if (!fs.existsSync(filepath)) {
        throw new Error('Arquivo de backup não encontrado');
      }

      this.logger.warn(`⚠️ Restaurando backup: ${filename}`);

      const dbConfig = this.getDatabaseConfig();
      const command = this.buildRestoreCommand(dbConfig, filepath);

      await execAsync(command);

      this.logger.log(`✅ Backup restaurado com sucesso: ${filename}`);

      return {
        success: true,
        filename,
        filepath,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Erro ao restaurar backup: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Obtém configurações do banco de dados
   */
  private getDatabaseConfig() {
    const isDocker = process.env.DOCKER_CONTAINER === 'true';
    
    return {
      host: isDocker
        ? this.configService.get<string>('DOCKER_DB_HOST', 'db')
        : this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: isDocker
        ? this.configService.get<number>('DOCKER_DB_PORT', 5432)
        : this.configService.get<number>('DATABASE_PORT', 5432),
      username: isDocker
        ? this.configService.get<string>('DOCKER_DB_USERNAME', 'sgc')
        : this.configService.get<string>('DATABASE_USERNAME', 'sgc'),
      password: isDocker
        ? this.configService.get<string>('DOCKER_DB_PASSWORD')
        : this.configService.get<string>('DATABASE_PASSWORD'),
      database: isDocker
        ? this.configService.get<string>('DOCKER_DB_NAME', 'sgc')
        : this.configService.get<string>('DATABASE_NAME', 'sgc'),
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
    const tables = desarquivamentoOnly
      ? '-t desarquivamentos -t desarquivamento_comments'
      : '';

    const containerName = this.configService.get<string>('POSTGRES_CONTAINER', 'db');

    if (config.isDocker) {
      // Comando para executar dentro do container Docker
      return `docker exec ${containerName} pg_dump \
        -U ${config.username} \
        -d ${config.database} \
        ${tables} \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists > ${filepath}`;
    } else {
      // Comando local
      return `PGPASSWORD="${config.password}" pg_dump \
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
   * Constrói comando de restauração
   */
  private buildRestoreCommand(config: any, filepath: string): string {
    const containerName = this.configService.get<string>('POSTGRES_CONTAINER', 'db');

    if (config.isDocker) {
      return `docker exec -i ${containerName} psql \
        -U ${config.username} \
        -d ${config.database} < ${filepath}`;
    } else {
      return `PGPASSWORD="${config.password}" psql \
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
