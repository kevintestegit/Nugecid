import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AuthController } from "./modules/auth/auth.controller";
import { AuthService } from "./modules/auth/auth.service";

describe("Auth Integration Tests", () => {
  let app: INestApplication;
  const mockAuthService = {
    login: jest.fn(),
    loginV2: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use((req: any, _res: any, next: () => void) => {
      req.session = req.session || {};
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /auth/login deve retornar payload de sucesso quando credenciais são válidas", async () => {
    mockAuthService.login.mockResolvedValue({
      user: { id: 1, nome: "Admin", usuario: "admin", role: { name: "admin" } },
      accessToken: "token",
      refreshToken: "refresh",
      expiresIn: "50m",
    });

    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .set("Accept", "application/json")
      .send({ usuario: "admin", senha: "123456" })
      .expect(200);

    expect(mockAuthService.login).toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ accessToken: "token" }),
      }),
    );
  });

  it("POST /auth/login deve retornar 401 quando AuthService lança erro", async () => {
    mockAuthService.login.mockRejectedValue(new Error("Credenciais inválidas"));

    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .set("Accept", "application/json")
      .send({ usuario: "admin", senha: "errado" })
      .expect(401);

    expect(response.body).toEqual(
      expect.objectContaining({ message: "Credenciais inválidas" }),
    );
  });

  it("POST /auth/api/v2/auth/login deve retornar token v2", async () => {
    mockAuthService.loginV2.mockResolvedValue({
      user: { userId: 1, usuario: "admin", role: "admin" },
      accessToken: "token-v2",
      expiresIn: "50m",
    });

    const response = await request(app.getHttpServer())
      .post("/auth/api/v2/auth/login")
      .send({ usuario: "admin", senha: "123456" })
      .expect(200);

    expect(mockAuthService.loginV2).toHaveBeenCalled();
    expect(response.body).toEqual(
      expect.objectContaining({ accessToken: "token-v2" }),
    );
  });
});
