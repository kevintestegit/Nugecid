import { INestApplication, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { firstValueFrom, of } from "rxjs";

import { SyncController } from "./sync.controller";
import { SyncRealtimeService } from "./sync-realtime.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SearchService } from "../search/search.service";

describe("SyncController", () => {
  let app: INestApplication;
  let controller: SyncController;

  const mockSyncRealtimeService = {
    registerConnection: jest.fn().mockReturnValue(
      of({
        scope: "tarefas",
        action: "updated",
        entityId: 10,
      }),
    ),
    removeConnection: jest.fn(),
  };

  const mockSearchService = {
    requestFullReindex: jest.fn().mockReturnValue(true),
  };

  class MockJwtAuthGuard {
    canActivate(context: any) {
      const request = context.switchToHttp().getRequest();
      if (request.headers.authorization === "Bearer valid-token") {
        request.user = { id: 7, usuario: "tester", role: { name: "admin" } };
        return true;
      }

      throw new UnauthorizedException("Token JWT inválido ou expirado");
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncRealtimeService,
          useValue: mockSyncRealtimeService,
        },
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleFixture.get<SyncController>(SyncController);
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
      .get("/sync/stream")
      .set("Accept", "text/event-stream")
      .expect(401);
  });

  it("permite o stream autenticado quando req.user está presente", async () => {
    const firstEvent = await firstValueFrom(
      controller.stream({
        user: { id: 7, usuario: "tester", role: { name: "admin" } },
      }),
    );

    expect(firstEvent).toEqual(
      expect.objectContaining({
        type: "init",
        data: expect.objectContaining({
          userId: 7,
        }),
      }),
    );
    expect(mockSyncRealtimeService.registerConnection).toHaveBeenCalledWith(7);
  });

  it("bloqueia reindexação sem autenticação", async () => {
    await request(app.getHttpServer()).post("/sync/search/reindex").expect(401);
  });

  it("aceita reindexação manual do índice para admin autenticado", async () => {
    const response = await request(app.getHttpServer())
      .post("/sync/search/reindex")
      .set("Authorization", "Bearer valid-token")
      .expect(202);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: "accepted",
        target: "search",
        mode: "full-reindex",
      }),
    );
    expect(mockSearchService.requestFullReindex).toHaveBeenCalledTimes(1);
  });
});
