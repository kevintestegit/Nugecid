import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

export interface DatabaseHealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  connection: boolean;
  lastCheck: Date;
  responseTime: number;
  error?: string;
  details: {
    host: string;
    port: number;
    database: string;
    connected: boolean;
    connectionCount?: number;
    queryCount?: number;
    errors?: string[];
  };
}

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);
  private lastHealthCheck: DatabaseHealthStatus | null = null;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async checkHealth(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();
    const host = this.configService.get<string>("DATABASE_HOST", "localhost");
    const port = this.configService.get<number>("DATABASE_PORT", 5432);
    const database = this.configService.get<string>(
      "DATABASE_NAME",
      "sgc_itep",
    );

    this.logger.debug(
      `🔍 [HEALTH_CHECK] Iniciando verificação de saúde do banco...`,
    );

    try {
      // Verificar se o DataSource está inicializado
      if (!this.dataSource.isInitialized) {
        this.logger.error(`❌ [HEALTH_CHECK] DataSource não está inicializado`);
        return this.createUnhealthyStatus(
          startTime,
          host,
          port,
          database,
          "DataSource não inicializado",
        );
      }

      // Teste de conectividade simples
      await this.dataSource.query("SELECT 1 as status, NOW() as current_time");
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `✅ [HEALTH_CHECK] Conexão OK - Tempo de resposta: ${responseTime}ms`,
      );

      // Obter estatísticas da conexão
      const connectionStats = await this.getConnectionStats();

      const healthStatus: DatabaseHealthStatus = {
        status: "healthy",
        connection: true,
        lastCheck: new Date(),
        responseTime,
        details: {
          host,
          port,
          database,
          connected: true,
          ...connectionStats,
        },
      };

      this.lastHealthCheck = healthStatus;
      return healthStatus;
    } catch (error: any) {
      this.logger.error(
        `❌ [HEALTH_CHECK] Erro na conexão com banco: ${error.message}`,
      );
      this.logger.error(`🔍 [HEALTH_CHECK] Stack trace: ${error.stack}`);

      return this.createUnhealthyStatus(
        startTime,
        host,
        port,
        database,
        error.message,
      );
    }
  }

  private async getConnectionStats(): Promise<{
    connectionCount?: number;
    queryCount?: number;
    errors?: string[];
  }> {
    try {
      // Tentar obter estatísticas do PostgreSQL
      const statsQuery = `
        SELECT 
          count(*) as active_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      const stats = await this.dataSource.query(statsQuery);

      return {
        connectionCount: stats[0]?.active_connections || 0,
      };
    } catch (error: any) {
      this.logger.warn(
        `⚠️ [HEALTH_CHECK] Não foi possível obter estatísticas: ${error.message}`,
      );
      return { errors: [error.message] };
    }
  }

  private createUnhealthyStatus(
    startTime: number,
    host: string,
    port: number,
    database: string,
    errorMessage: string,
  ): DatabaseHealthStatus {
    const responseTime = Date.now() - startTime;

    const healthStatus: DatabaseHealthStatus = {
      status: "unhealthy",
      connection: false,
      lastCheck: new Date(),
      responseTime,
      error: errorMessage,
      details: {
        host,
        port,
        database,
        connected: false,
        errors: [errorMessage],
      },
    };

    this.lastHealthCheck = healthStatus;
    return healthStatus;
  }

  getLastHealthCheck(): DatabaseHealthStatus | null {
    return this.lastHealthCheck;
  }

  async testQueries(): Promise<{ [key: string]: any }> {
    this.logger.log(`🧪 [TEST_QUERIES] Executando testes de queries...`);

    const results: { [key: string]: any } = {};

    try {
      // Teste 1: Query básica
      results.basicQuery = await this.dataSource.query("SELECT 1 as test");
      this.logger.log(`✅ [TEST_QUERIES] Query básica: OK`);

      // Teste 2: Verificar tabelas principais
      results.tables = await this.dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      this.logger.log(
        `✅ [TEST_QUERIES] Tabelas encontradas: ${results.tables.length}`,
      );

      // Teste 3: Verificar usuários
      try {
        results.userCount = await this.dataSource.query(
          "SELECT COUNT(*) as count FROM users",
        );
        this.logger.log(
          `✅ [TEST_QUERIES] Usuários na base: ${results.userCount[0]?.count || 0}`,
        );
      } catch (error: any) {
        this.logger.warn(
          `⚠️ [TEST_QUERIES] Erro ao contar usuários: ${error.message}`,
        );
        results.userCountError = error.message;
      }

      // Teste 4: Verificar desarquivamentos
      try {
        results.desarquivamentoCount = await this.dataSource.query(
          "SELECT COUNT(*) as count FROM desarquivamentos",
        );
        this.logger.log(
          `✅ [TEST_QUERIES] Desarquivamentos na base: ${results.desarquivamentoCount[0]?.count || 0}`,
        );
      } catch (error: any) {
        this.logger.warn(
          `⚠️ [TEST_QUERIES] Erro ao contar desarquivamentos: ${error.message}`,
        );
        results.desarquivamentoCountError = error.message;
      }

      // Teste 5: Verificar roles
      try {
        results.roleCount = await this.dataSource.query(
          "SELECT COUNT(*) as count FROM roles",
        );
        this.logger.log(
          `✅ [TEST_QUERIES] Roles na base: ${results.roleCount[0]?.count || 0}`,
        );
      } catch (error: any) {
        this.logger.warn(
          `⚠️ [TEST_QUERIES] Erro ao contar roles: ${error.message}`,
        );
        results.roleCountError = error.message;
      }

      this.logger.log(`🎉 [TEST_QUERIES] Testes concluídos com sucesso`);
    } catch (error: any) {
      this.logger.error(
        `❌ [TEST_QUERIES] Erro geral nos testes: ${error.message}`,
      );
      results.generalError = error.message;
    }

    return results;
  }

  async getDbInfo(): Promise<any> {
    try {
      this.logger.log(`📊 [DB_INFO] Coletando informações do banco...`);

      const dbInfo = await this.dataSource.query(`
        SELECT 
          version() as postgres_version,
          current_database() as database_name,
          current_user as current_user,
          inet_server_addr() as server_address,
          inet_server_port() as server_port
      `);

      const tableInfo = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          tableowner
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

      this.logger.log(
        `📊 [DB_INFO] PostgreSQL Version: ${dbInfo[0]?.postgres_version || "N/A"}`,
      );
      this.logger.log(
        `📊 [DB_INFO] Database: ${dbInfo[0]?.database_name || "N/A"}`,
      );
      this.logger.log(`📊 [DB_INFO] Tabelas encontradas: ${tableInfo.length}`);

      return {
        connection: dbInfo[0] || {},
        tables: tableInfo,
        collectedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [DB_INFO] Erro ao coletar informações: ${error.message}`,
      );
      throw error;
    }
  }
}
