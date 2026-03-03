import { INestApplication, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { of } from "rxjs";

import { NotificacoesController } from "./notificacoes.controller";
import {
  NotificacoesService,
  NotificacoesSchedulerService,
  NotificationPreferencesService,
  PushNotificationsService,
} from "../services";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

describe("NotificacoesController SSE", () => {
  let app: INestApplication;

  const mockNotificacoesService = {
    create: jest.fn().mockResolvedValue({
      id: 99,
      tipo: "novo_registro",
      titulo: "Notificação de teste",
    }),
    findByUsuario: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    }),
    getUserStream: jest.fn().mockReturnValue(
      of({
        notificacao: {
          id: 1,
          titulo: "Teste",
        },
        timestamp: new Date().toISOString(),
      }),
    ),
    removeUserStream: jest.fn(),
  };

  const mockSchedulerService = {};
  const mockPreferencesService = {
    getPreferences: jest.fn().mockResolvedValue({
      userId: 5,
      inAppEnabled: true,
      desktopEnabled: true,
      enabledTypes: {
        novo_registro: true,
      },
    }),
  };
  const mockPushNotificationsService = {};

  class MockJwtAuthGuard {
    canActivate(context: any) {
      const request = context.switchToHttp().getRequest();
      if (request.headers.authorization === "Bearer valid-token") {
        request.user = { id: 5, usuario: "tester" };
        return true;
      }

      throw new UnauthorizedException("Token JWT inválido ou expirado");
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificacoesController],
      providers: [
        {
          provide: NotificacoesService,
          useValue: mockNotificacoesService,
        },
        {
          provide: NotificacoesSchedulerService,
          useValue: mockSchedulerService,
        },
        {
          provide: NotificationPreferencesService,
          useValue: mockPreferencesService,
        },
        {
          provide: PushNotificationsService,
          useValue: mockPushNotificationsService,
        },
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

  it("bloqueia o stream sem autenticação", async () => {
    await request(app.getHttpServer())
      .get("/notificacoes/stream")
      .set("Accept", "text/event-stream")
      .expect(401);
  });

  it("permite o stream autenticado", async () => {
    const response = await request(app.getHttpServer())
      .get("/notificacoes/stream")
      .set("Accept", "text/event-stream")
      .set("Authorization", "Bearer valid-token")
      .buffer(true)
      .parse((res, callback) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
          if (data.includes("event: init")) {
            callback(null, data);
            (res as any).destroy();
          }
        });
      })
      .expect(200);

    expect(String(response.body)).toContain("event: init");
    expect(mockNotificacoesService.findByUsuario).toHaveBeenCalledWith(5, {
      lida: false,
      limit: 50,
    });
    expect(mockNotificacoesService.getUserStream).toHaveBeenCalledWith(5);
  });

  it("dispara uma notificação de teste para o usuário autenticado", async () => {
    const response = await request(app.getHttpServer())
      .post("/notificacoes/teste")
      .set("Authorization", "Bearer valid-token")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(mockPreferencesService.getPreferences).toHaveBeenCalledWith(5);
    expect(mockNotificacoesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 5,
        titulo: "Notificação de teste",
        link: "/configuracoes",
      }),
    );
  });
});
