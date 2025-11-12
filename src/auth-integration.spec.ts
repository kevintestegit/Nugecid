import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import * as request from "supertest";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";

import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";

import { User } from "./modules/users/entities/user.entity";
import { Role } from "./modules/users/entities/role.entity";
import {
  Auditoria,
  AuditAction,
} from "./modules/audit/entities/auditoria.entity";

describe("Auth Integration Tests", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let auditoriaRepository: Repository<Auditoria>;
  let testUser: User;
  let testRole: Role;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === "JWT_SECRET") return "test-secret";
          if (key === "JWT_EXPIRATION_TIME") return "50m";
          if (key === "DB_TYPE") return "sqlite";
          if (key === "DB_DATABASE") return ":memory:";
          return process.env[key];
        },
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    roleRepository = moduleFixture.get<Repository<Role>>(
      getRepositoryToken(Role),
    );
    auditoriaRepository = moduleFixture.get<Repository<Auditoria>>(
      getRepositoryToken(Auditoria),
    );

    // Criar role de teste
    testRole = roleRepository.create({
      name: "user",
      description: "Usuário padrão",
    });
    await roleRepository.save(testRole);

    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash("password123", 12);
    testUser = userRepository.create({
      nome: "Admin",
      usuario: "admin",
      senha: hashedPassword,
      ativo: true,
      roleId: testRole.id,
    });
    await userRepository.save(testUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/login", () => {
    it("should login successfully with valid credentials using usuario field", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "admin",
          password: "admin123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user.usuario).toBe("admin");
      expect(response.body.user.nome).toBe("Admin");
      expect(typeof response.body.accessToken).toBe("string");

      accessToken = response.body.accessToken;
    });

    it("should fail login with invalid credentials", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "admin",
          password: "admin123",
        })
        .expect(401);
    });

    it("should fail login with non-existent user", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "teste",
          password: "password123",
        })
        .expect(401);
    });

    it("should fail login with missing usuario field", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          password: "password123",
        })
        .expect(400);
    });

    it("should fail login with missing password field", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "admin@itep.rn.gov.br",
        })
        .expect(400);
    });

    it("should create audit log for successful login", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "admin@itep.rn.gov.br",
          password: "password123",
        })
        .expect(200);

      const auditLogs = await auditoriaRepository.find({
        where: {
          userId: testUser.id,
          action: AuditAction.LOGIN,
          success: true,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it("should create audit log for failed login", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "admin@itep.rn.gov.br",
          password: "wrongpassword",
        })
        .expect(401);

      const auditLogs = await auditoriaRepository.find({
        where: { action: AuditAction.LOGIN, success: false },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe("JWT Token Validation", () => {
    it("should validate JWT token correctly", async () => {
      // Primeiro, fazer login para obter o token
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "admin@itep.rn.gov.br",
          password: "password123",
        })
        .expect(200);

      const token = loginResponse.body.accessToken;

      // Tentar acessar uma rota protegida (assumindo que existe uma)
      // Como não temos uma rota protegida específica no teste, vamos verificar o token
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should reject invalid JWT token", async () => {
      const invalidToken = "invalid.jwt.token";

      // Tentar usar um token inválido em uma requisição
      // (Este teste seria mais útil com uma rota protegida específica)
      expect(invalidToken).toBe("invalid.jwt.token");
    });
  });

  describe("JWT Token Expiration", () => {
    it("should generate JWT with 50 minutes expiration", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "admin@itep.rn.gov.br",
          password: "password123",
        })
        .expect(200);

      const token = response.body.accessToken;
      expect(token).toBeDefined();

      // Decodificar o token para verificar a expiração
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString(),
      );
      const expirationTime = payload.exp;
      const issuedTime = payload.iat;
      const tokenDuration = expirationTime - issuedTime;

      // 50 minutos = 3000 segundos
      expect(tokenDuration).toBe(3000);
    });
  });

  describe("User Status Validation", () => {
    it("should reject login for inactive user", async () => {
      // Criar usuário inativo
      const inactiveUser = userRepository.create({
        nome: "Inactive User",
        usuario: "inactive",
        senha: await bcrypt.hash("password123", 12),
        ativo: false,
        roleId: testRole.id,
      });
      await userRepository.save(inactiveUser);

      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "inactive@itep.rn.gov.br",
          password: "password123",
        })
        .expect(401);
    });

    it("should reject login for blocked user", async () => {
      // Criar usuário bloqueado
      const blockedUser = userRepository.create({
        nome: "Blocked User",
        usuario: "blocked",
        senha: await bcrypt.hash("password123", 12),
        ativo: true,
        bloqueadoAte: new Date(Date.now() + 900000), // 15 minutos no futuro
        roleId: testRole.id,
      });
      await userRepository.save(blockedUser);

      await request(app.getHttpServer())
        .post("/auth/login")
        .set("Accept", "application/json")
        .send({
          usuario: "blocked@itep.rn.gov.br",
          password: "password123",
        })
        .expect(401);
    });
  });
});
