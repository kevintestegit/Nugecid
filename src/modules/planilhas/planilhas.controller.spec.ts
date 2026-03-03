jest.mock("../../common/utils/file-validator", () => ({
  FileValidator: {
    isAllowedExtension: jest.fn().mockReturnValue(true),
    isAllowedSpreadsheetMimeType: jest.fn().mockReturnValue(true),
  },
}));

import { INestApplication, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { PlanilhasController } from "./planilhas.controller";
import { PlanilhasService } from "./planilhas.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("PlanilhasController", () => {
  let app: INestApplication;

  const mockPlanilhasService = {
    findAll: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    }),
    obterPlanilhaGeral: jest.fn().mockResolvedValue({
      totalPastas: 0,
      totalPlanilhas: 0,
      totalItens: 0,
      colunas: [],
      linhas: [],
      grupos: [],
    }),
    obterArquivo: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  class MockJwtAuthGuard {
    canActivate(context: any) {
      const request = context.switchToHttp().getRequest();
      const auth = request.headers.authorization;

      if (auth === "Bearer valid-admin-token") {
        request.user = {
          id: 1,
          usuario: "admin",
          role: { name: "admin" },
        };
        return true;
      }

      if (auth === "Bearer valid-user-token") {
        request.user = {
          id: 2,
          usuario: "usuario",
          role: { name: "usuario" },
        };
        return true;
      }

      throw new UnauthorizedException("Token JWT inválido ou expirado");
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PlanilhasController],
      providers: [
        {
          provide: PlanilhasService,
          useValue: mockPlanilhasService,
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

  it("bloqueia listagem de planilhas sem autenticação", async () => {
    await request(app.getHttpServer()).get("/planilhas").expect(401);
  });

  it("bloqueia listagem de planilhas para usuário autenticado sem papel administrativo", async () => {
    const response = await request(app.getHttpServer())
      .get("/planilhas")
      .set("Authorization", "Bearer valid-user-token")
      .expect(403);

    expect(response.body.message).toBe("Acesso negado para este recurso");
    expect(mockPlanilhasService.findAll).not.toHaveBeenCalled();
  });

  it("permite listagem de planilhas para administrador", async () => {
    const response = await request(app.getHttpServer())
      .get("/planilhas")
      .set("Authorization", "Bearer valid-admin-token")
      .expect(200);

    expect(response.body).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    });
    expect(mockPlanilhasService.findAll).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
    });
  });
});
