import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UnauthorizedException } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";
import { RedisService } from "../redis/redis.service";
import { LoginDto } from "./dto/login.dto";

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    nome: "Test User",
    usuario: "testuser",
    senha: "$2b$12$hashedPassword",
    ativo: true,
    tentativasLogin: 0,
    bloqueadoAte: null,
    role: { id: 1, name: "user" },
    validatePassword: jest.fn(),
    isBlocked: jest.fn().mockReturnValue(false),
    isAdmin: jest.fn().mockReturnValue(false),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockAuditoriaRepository = {
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("mock-jwt-token"),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        "auth.jwt.expiresIn": "50m",
        "auth.jwt.refreshExpiresIn": "7d",
        "auth.jwt.secret": "test-secret",
        "auth.jwt.refreshSecret": "test-refresh-secret",
      };
      return values[key] ?? defaultValue;
    }),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Auditoria),
          useValue: mockAuditoriaRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.spyOn(service["logger"], "error").mockImplementation(() => {});
    jest.spyOn(service["logger"], "warn").mockImplementation(() => {});
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      usuario: "test@itep.rn.gov.br",
      senha: "password123",
    };

    it("should login user successfully", async () => {
      mockUser.validatePassword.mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockAuditoriaRepository.create.mockReturnValue({});
      mockAuditoriaRepository.save.mockResolvedValue({});

      const result = await service.login(loginDto, "127.0.0.1", "test-agent");

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("accessToken");
      expect(result.accessToken).toBe("mock-jwt-token");
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          usuario: mockUser.usuario,
          role: mockUser.role.name,
        },
        expect.objectContaining({ expiresIn: "50m" }),
      );
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockAuditoriaRepository.create.mockReturnValue({});
      mockAuditoriaRepository.save.mockResolvedValue({});

      await expect(
        service.login(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should reject SQL injection payloads in login without authenticating", async () => {
      const maliciousLoginDto: LoginDto = {
        usuario: "' OR 1=1 --",
        senha: "' OR '1'='1",
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockAuditoriaRepository.create.mockReturnValue({});
      mockAuditoriaRepository.save.mockResolvedValue({});

      await expect(
        service.login(maliciousLoginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { usuario: maliciousLoginDto.usuario },
          relations: ["role"],
        }),
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe("loginV2", () => {
    const loginDto: LoginDto = {
      usuario: "test@itep.rn.gov.br",
      senha: "password123",
    };

    it("should login user successfully with v2 format", async () => {
      mockUser.validatePassword.mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockAuditoriaRepository.create.mockReturnValue({});
      mockAuditoriaRepository.save.mockResolvedValue({});

      const result = await service.loginV2(loginDto, "127.0.0.1", "test-agent");

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("expiresIn");
      expect(result.expiresIn).toBe("50m");
      expect(result.user).toEqual({
        userId: mockUser.id,
        usuario: mockUser.usuario,
        role: mockUser.role.name,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          usuario: mockUser.usuario,
          role: mockUser.role.name,
        },
        expect.objectContaining({ expiresIn: "50m" }),
      );
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.loginV2(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(new UnauthorizedException("Credenciais inválidas"));
    });

    it("should throw UnauthorizedException for inactive user", async () => {
      jest
        .spyOn(service, "validateUser")
        .mockRejectedValue(new UnauthorizedException("Usuário inativo"));

      await expect(
        service.loginV2(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(new UnauthorizedException("Usuário inativo"));
    });

    it("should throw UnauthorizedException for blocked user", async () => {
      jest
        .spyOn(service, "validateUser")
        .mockRejectedValue(new UnauthorizedException("Usuário bloqueado"));

      await expect(
        service.loginV2(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(new UnauthorizedException("Usuário bloqueado"));
    });
  });

  describe("validateUser", () => {
    it("should validate user with correct credentials", async () => {
      mockUser.validatePassword.mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        "test@itep.rn.gov.br",
        "password123",
      );

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { usuario: "test@itep.rn.gov.br" },
        relations: ["role"],
      });
    });

    it("should return null for non-existent user", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        "nonexistent@itep.rn.gov.br",
        "password123",
      );

      expect(result).toBeNull();
    });

    it("should not bypass validation with SQL injection-like username input", async () => {
      const maliciousUsuario = "' OR 1=1 --";
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(maliciousUsuario, "qualquer");

      expect(result).toBeNull();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { usuario: maliciousUsuario },
        relations: ["role"],
      });
    });

    it("should throw UnauthorizedException for inactive user", async () => {
      const inactiveUser = { ...mockUser, ativo: false };
      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(
        service.validateUser("test@itep.rn.gov.br", "password123"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for blocked user", async () => {
      const blockedUser = {
        ...mockUser,
        isBlocked: jest.fn().mockReturnValue(true),
        bloqueadoAte: new Date(),
      };
      mockUserRepository.findOne.mockResolvedValue(blockedUser);

      await expect(
        service.validateUser("test@itep.rn.gov.br", "password123"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should return null for invalid password", async () => {
      mockUser.validatePassword.mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        "test@itep.rn.gov.br",
        "wrongpassword",
      );

      expect(result).toBeNull();
    });
  });
});
