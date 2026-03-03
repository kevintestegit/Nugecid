import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";

@Injectable()
export class DatabaseConnectionListener implements OnModuleInit {
  private readonly logger = new Logger(DatabaseConnectionListener.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Log mínimo de inicialização do listener
    this.logger.log(`[DB] Monitor de conexão iniciado.`);

    if (this.dataSource.isInitialized) {
      this.logger.log(`[DB] DataSource inicializado.`);
    } else {
      this.logger.warn(`[DB] DataSource não inicializado.`);
    }

    this.setupEventListeners();
  }

  private setupEventListeners() {
    try {
      const driver = this.dataSource.driver as any;
      if (driver && driver.master) {
        const connection = driver.master;
        if (connection && connection.pool) {
          connection.pool.on("error", (err: any) => {
            this.logger.error(`[DB] Erro na conexão: ${err.message}`);
          });
        }
      }
    } catch (error: any) {
      this.logger.warn(`[DB] Falha ao configurar listeners: ${error.message}`);
    }
  }

  // Mantemos um check silencioso, sem logs de sucesso repetitivos
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        this.logger.warn(`[DB] DataSource não inicializado.`);
        return false;
      }
      await this.dataSource.query("SELECT 1");
      return true;
    } catch (error: any) {
      this.logger.error(`[DB] Falha na conexão: ${error.message}`);
      return false;
    }
  }
}
