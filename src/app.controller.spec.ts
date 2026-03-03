import { INestApplication, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RolesGuard } from "./modules/auth/guards/roles.guard";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { WebAuthGuard } from "./modules/auth/guards/web-auth.guard";
import { ConfigService } from "@nestjs/config";

describe("AppController", () => {
  let app: INestApplication;

  const mockAppService = {
    globalSearch: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    }),
    getDashboardData: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("http://localhost:3001"),
  };

  class MockJwtAuthGuard {
    canActivate(context: any) {
      const req = context.switchToHttp().getRequest();
      const auth = req.headers.authorization;

      if (auth === "Bearer valid-admin-token") {
        req.user = {
          id: 1,
          usuario: "admin",
          role: { name: "admin" },
        };
        return true;
      }

      if (auth === "Bearer valid-user-token") {
        req.user = {
          id: 2,
          usuario: "usuario",
          role: { name: "usuario" },
        };
        return true;
      }

      throw new UnauthorizedException("Token JWT inválido ou expirado");
    }
  }

  class MockWebAuthGuard {
    canActivate(context: any) {
      const req = context.switchToHttp().getRequest();
      req.user = {
        id: 1,
        usuario: "admin",
        role: { name: "admin" },
      };
      return true;
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        RolesGuard,
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(WebAuthGuard)
      .useClass(MockWebAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("bloqueia search sem autenticação", async () => {
    await request(app.getHttpServer()).get("/search?query=teste").expect(401);
  });

  it("redireciona dashboard web para a SPA", async () => {
    const response = await request(app.getHttpServer())
      .get("/dashboard")
      .expect(302);

    expect(response.headers.location).toBe("http://localhost:3001/");
  });

  it("redireciona sobre web para a SPA", async () => {
    const response = await request(app.getHttpServer())
      .get("/sobre")
      .expect(302);

    expect(response.headers.location).toBe("http://localhost:3001/sobre");
  });

  it("permite search para usuário autenticado com papel oficial", async () => {
    const response = await request(app.getHttpServer())
      .get("/search?query=teste&limit=5&offset=0")
      .set("Authorization", "Bearer valid-user-token")
      .expect(200);

    expect(response.body).toEqual({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });
    expect(mockAppService.globalSearch).toHaveBeenCalledWith({
      query: "teste",
      types: undefined,
      limit: 5,
      offset: 0,
      currentUser: expect.objectContaining({ id: 2 }),
    });
  });

  it("restringe test-search para administradores", async () => {
    const response = await request(app.getHttpServer())
      .get("/test-search")
      .set("Authorization", "Bearer valid-user-token")
      .expect(403);

    expect(response.body.message).toBe("Acesso negado para este recurso");
  });

  it("permite test-search para administradores", async () => {
    const response = await request(app.getHttpServer())
      .get("/test-search")
      .set("Authorization", "Bearer valid-admin-token")
      .expect(200);

    expect(response.body.message).toBe("Endpoint de busca está funcionando!");
    expect(response.body.timestamp).toEqual(expect.any(String));
  });
});
