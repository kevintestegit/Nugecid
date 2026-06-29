import {
  Controller,
  Get,
  Logger,
  Optional,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  DatabaseHealthService,
  DatabaseHealthStatus,
} from "./database-health.service";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RuntimeMetricsService } from "../observability/runtime-metrics.service";
import { RedisService } from "../redis/redis.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SearchService } from "../search/search.service";
import { Response } from "express";
import { PrometheusService } from "../observability/prometheus.service";

@ApiTags("health")
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly runtimeMetricsService: RuntimeMetricsService,
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
    @Optional()
    private readonly searchService?: SearchService,
  ) {}

  @Get("health")
  @IsPublic()
  @ApiOperation({ summary: "Liveness: processo HTTP está ativo" })
  @ApiResponse({ status: 200, description: "Aplicação viva (liveness)" })
  async getHealth() {
    return {
      status: "ok",
      type: "liveness",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "2.0",
    };
  }

  @Get("ready")
  @IsPublic()
  @ApiOperation({
    summary: "Readiness: valida dependências críticas (DB e Redis)",
  })
  @ApiResponse({ status: 200, description: "Aplicação pronta para tráfego" })
  @ApiResponse({
    status: 503,
    description: "Aplicação não pronta (DB e/ou Redis indisponível)",
  })
  async getReadiness() {
    this.logger.log("🔍 [READY] Verificação de readiness solicitada");

    const dbHealth = await this.databaseHealthService.checkHealth();
    const redisOk = await this.redisService.ping();
    const ready = dbHealth.status === "healthy" && redisOk;

    const sanitizedDbHealth = {
      status: dbHealth.status,
      connection: dbHealth.connection,
      responseTime: dbHealth.responseTime,
      lastCheck: dbHealth.lastCheck,
    };

    const readiness = {
      status: ready ? "ready" : "not_ready",
      type: "readiness",
      timestamp: new Date().toISOString(),
      database: sanitizedDbHealth,
      redis: {
        connected: redisOk,
      },
    };

    this.logger.log(
      `📊 [READY] Status: ${readiness.status}, DB: ${dbHealth.status}, Redis: ${redisOk ? "up" : "down"}`,
    );

    if (!ready) {
      this.logger.error(
        `❌ [READY] Dependências indisponíveis: DB=${dbHealth.status}, Redis=${redisOk ? "up" : "down"}`,
      );
      throw new ServiceUnavailableException(readiness);
    }

    return readiness;
  }

  @Get("health/database")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Verificação detalhada da conexão com banco de dados",
  })
  @ApiResponse({
    status: 200,
    description: "Status detalhado do banco de dados",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso restrito a administradores",
  })
  async getDatabaseHealth(): Promise<DatabaseHealthStatus> {
    this.logger.log(`🔍 [DB_HEALTH] Verificação detalhada do banco solicitada`);

    const health = await this.databaseHealthService.checkHealth();

    this.logger.log(
      `📊 [DB_HEALTH] Resultado: ${health.status}, Tempo: ${health.responseTime}ms`,
    );

    return health;
  }

  @Get("health/database/test")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Executa testes de queries no banco de dados" })
  @ApiResponse({ status: 200, description: "Resultados dos testes de queries" })
  @ApiResponse({
    status: 403,
    description: "Acesso restrito a administradores",
  })
  async testDatabaseQueries() {
    this.logger.log(`🧪 [DB_TEST] Testes de queries solicitados`);

    try {
      const testResults = await this.databaseHealthService.testQueries();

      this.logger.log(`🎉 [DB_TEST] Testes concluídos`);

      return {
        status: "completed",
        timestamp: new Date().toISOString(),
        results: testResults,
      };
    } catch (error: any) {
      this.logger.error(`❌ [DB_TEST] Erro nos testes: ${error.message}`);

      return {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
        results: null,
      };
    }
  }

  @Get("health/database/info")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Informações detalhadas do banco de dados" })
  @ApiResponse({
    status: 200,
    description: "Informações do PostgreSQL e tabelas",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso restrito a administradores",
  })
  async getDatabaseInfo() {
    this.logger.log(`📊 [DB_INFO] Informações do banco solicitadas`);

    try {
      const dbInfo = await this.databaseHealthService.getDbInfo();

      this.logger.log(`📊 [DB_INFO] Informações coletadas com sucesso`);

      return {
        status: "success",
        timestamp: new Date().toISOString(),
        data: dbInfo,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ [DB_INFO] Erro ao coletar informações: ${error.message}`,
      );

      return {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
        data: null,
      };
    }
  }

  @Get("health/ping")
  @IsPublic()
  @ApiOperation({ summary: "Ping básico do sistema" })
  @ApiResponse({ status: 200, description: "Pong - sistema ativo" })
  async ping() {
    return {
      message: "pong",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get("metrics")
  @IsPublic()
  @ApiOperation({
    summary: "Métricas em formato Prometheus para scrape (/metrics)",
  })
  @ApiResponse({
    status: 200,
    description: "Métricas Prometheus em text/plain",
  })
  async getPrometheusMetrics(@Res() res: Response) {
    const metrics = await this.prometheusService.getMetrics();
    res.type("text/plain; version=0.0.4; charset=utf-8");
    res.send(metrics);
  }

  @Get("health/metrics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Métricas de runtime (event loop, GC, HTTP e cache)",
  })
  @ApiResponse({ status: 200, description: "Snapshot de métricas do backend" })
  @ApiResponse({
    status: 403,
    description: "Acesso restrito a administradores",
  })
  async getRuntimeMetrics() {
    return this.runtimeMetricsService.getSnapshot();
  }

  @Get("health/search")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Status operacional do Meilisearch usado na busca documental",
  })
  @ApiResponse({
    status: 200,
    description: "Estado atual do índice documental",
  })
  @ApiResponse({
    status: 403,
    description: "Acesso restrito a administradores",
  })
  async getSearchHealth() {
    return (
      (await this.searchService?.getHealthStatus()) ?? {
        enabled: false,
        status: "disabled",
        indexUid: "global_documents",
        failOpen: true,
        bootstrapOnStart: false,
      }
    );
  }
}
