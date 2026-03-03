import { INestApplication, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { HealthController } from "./health.controller";
import { DatabaseHealthService } from "./database-health.service";
import { RuntimeMetricsService } from "../observability/runtime-metrics.service";
import { RedisService } from "../redis/redis.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SearchService } from "../search/search.service";

describe("HealthController", () => {
  let app: INestApplication;

  const mockDatabaseHealthService = {
    checkHealth: jest.fn().mockResolvedValue({
      status: "healthy",
      responseTime: 10,
    }),
    testQueries: jest.fn().mockResolvedValue({
      simpleQuery: true,
    }),
    getDbInfo: jest.fn().mockResolvedValue({
      version: "PostgreSQL 16",
    }),
  };

  const mockRuntimeMetricsService = {
    getSnapshot: jest.fn().mockReturnValue({
      http: { requests: 10 },
    }),
  };

  const mockRedisService = {
    ping: jest.fn().mockResolvedValue(true),
  };

  const mockSearchService = {
    getHealthStatus: jest.fn().mockResolvedValue({
      enabled: true,
      status: "ready",
      indexUid: "global_documents",
      failOpen: true,
      bootstrapOnStart: false,
    }),
  };

  class MockJwtAuthGuard {
    canActivate(context: any) {
      const request = context.switchToHttp().getRequest();
      if (request.headers.authorization === "Bearer valid-admin-token") {
        request.user = {
          id: 1,
          usuario: "admin",
          role: { name: "admin" },
        };
        return true;
      }

      if (request.headers.authorization === "Bearer valid-user-token") {
        request.user = {
          id: 2,
          usuario: "operador",
          role: { name: "usuario" },
        };
        return true;
      }

      throw new UnauthorizedException("Token JWT inválido ou expirado");
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseHealthService,
          useValue: mockDatabaseHealthService,
        },
        {
          provide: RuntimeMetricsService,
          useValue: mockRuntimeMetricsService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
        RolesGuard,
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("mantém liveness público", async () => {
    await request(app.getHttpServer()).get("/health").expect(200);
  });

  it("mantém readiness público", async () => {
    await request(app.getHttpServer()).get("/ready").expect(200);
  });

  it("bloqueia métricas sem autenticação", async () => {
    await request(app.getHttpServer()).get("/health/metrics").expect(401);
  });

  it("bloqueia endpoints detalhados de banco sem autenticação", async () => {
    await request(app.getHttpServer()).get("/health/database").expect(401);
    await request(app.getHttpServer()).get("/health/database/info").expect(401);
    await request(app.getHttpServer()).get("/health/database/test").expect(401);
    await request(app.getHttpServer()).get("/health/search").expect(401);
  });

  it("bloqueia métricas para usuários autenticados sem papel administrativo", async () => {
    const response = await request(app.getHttpServer())
      .get("/health/metrics")
      .set("Authorization", "Bearer valid-user-token")
      .expect(403);

    expect(response.body.message).toBe("Acesso negado para este recurso");
    expect(mockRuntimeMetricsService.getSnapshot).not.toHaveBeenCalled();
  });

  it("permite métricas para administradores autenticados", async () => {
    const response = await request(app.getHttpServer())
      .get("/health/metrics")
      .set("Authorization", "Bearer valid-admin-token")
      .expect(200);

    expect(response.body).toEqual({
      http: { requests: 10 },
    });
    expect(mockRuntimeMetricsService.getSnapshot).toHaveBeenCalled();
  });

  it("bloqueia saúde do índice documental para usuários autenticados sem papel administrativo", async () => {
    const response = await request(app.getHttpServer())
      .get("/health/search")
      .set("Authorization", "Bearer valid-user-token")
      .expect(403);

    expect(response.body.message).toBe("Acesso negado para este recurso");
    expect(mockSearchService.getHealthStatus).not.toHaveBeenCalled();
  });

  it("expõe saúde do índice documental para administradores autenticados", async () => {
    const response = await request(app.getHttpServer())
      .get("/health/search")
      .set("Authorization", "Bearer valid-admin-token")
      .expect(200);

    expect(response.body).toEqual({
      enabled: true,
      status: "ready",
      indexUid: "global_documents",
      failOpen: true,
      bootstrapOnStart: false,
    });
    expect(mockSearchService.getHealthStatus).toHaveBeenCalledTimes(1);
  });
});
