import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AuthController, AuthV2Controller } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SecurityService } from "../security/security.service";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";
import { LoginDto } from "./dto/login.dto";
import { LoginV2Response } from "./auth.service";
import {
  TEST_CREDENTIALS,
  TEST_TOKENS,
  TEST_USERS,
} from "../../common/constants/test.constants";

describe("AuthController", () => {
  let controller: AuthController;
  let authV2Controller: AuthV2Controller;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockAuditoriaRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuthService = {
    login: jest.fn(),
    loginV2: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    validateJwtPayload: jest.fn(),
  };

  const mockSecurityService = {
    isIpBlocked: jest.fn().mockResolvedValue(false),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue(TEST_TOKENS.MOCK_JWT_TOKEN),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, fallback?: unknown) => {
      if (key === "auth.session.secure") {
        return false;
      }
      if (key === "auth.jwt.secret") {
        return "test-access-secret";
      }
      if (key === "auth.jwt.refreshSecret") {
        return "test-refresh-secret";
      }
      return fallback;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, AuthV2Controller],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
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
          provide: SecurityService,
          useValue: mockSecurityService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authV2Controller = module.get<AuthV2Controller>(AuthV2Controller);
    jest.spyOn(controller["logger"], "error").mockImplementation(() => {});
    jest
      .spyOn(authV2Controller["logger"], "error")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("logout", () => {
    it("should destroy session and clear auth cookies", async () => {
      const req = {
        session: {
          user: { id: 1 },
          destroy: jest.fn((callback: (error?: Error | null) => void) =>
            callback(null),
          ),
        },
        headers: {
          accept: "application/json",
        },
        secure: false,
      } as any;
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn().mockImplementation((payload) => payload),
      } as any;

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(
        req,
        res,
        "127.0.0.1",
        "test-agent",
      );

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        1,
        "127.0.0.1",
        "test-agent",
        undefined,
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "access_token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refresh_token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        "connect.sid",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict",
          path: "/",
        }),
      );
      expect(req.session.destroy).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Logout realizado com sucesso",
          data: null,
        }),
      );
    });

    it("should logout using JWT cookie when there is no session user", async () => {
      const req = {
        session: {
          destroy: jest.fn((callback: (error?: Error | null) => void) =>
            callback(null),
          ),
        },
        cookies: {
          access_token: "jwt-cookie-token",
        },
        headers: {
          accept: "application/json",
        },
        secure: false,
      } as any;
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn().mockImplementation((payload) => payload),
      } as any;

      mockJwtService.verify.mockReturnValue({ sub: 7 });
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(
        req,
        res,
        "127.0.0.1",
        "test-agent",
      );

      expect(mockJwtService.verify).toHaveBeenCalledWith("jwt-cookie-token", {
        secret: "test-access-secret",
      });
      expect(mockAuthService.logout).toHaveBeenCalledWith(
        7,
        "127.0.0.1",
        "test-agent",
        undefined,
      );
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Logout realizado com sucesso",
          data: null,
        }),
      );
    });
  });

  describe("login", () => {
    it("should set access and refresh cookies and omit tokens from json payload", async () => {
      const req = {
        session: {},
        headers: {
          accept: "application/json",
        },
        secure: false,
      } as any;
      const res = {
        cookie: jest.fn(),
        json: jest.fn().mockImplementation((payload) => payload),
      } as any;

      mockAuthService.login.mockResolvedValue({
        user: TEST_USERS.ADMIN,
        accessToken: TEST_TOKENS.MOCK_JWT_TOKEN,
        refreshToken: "refresh-token-cookie",
        expiresIn: "50m",
      });

      const result = await controller.login(
        {
          usuario: TEST_USERS.ADMIN.usuario,
          senha: TEST_CREDENTIALS.DEFAULT_PASSWORD,
        },
        req,
        res,
        "127.0.0.1",
        "test-agent",
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "access_token",
        TEST_TOKENS.MOCK_JWT_TOKEN,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        "refresh-token-cookie",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        path: undefined,
        method: undefined,
        timestamp: expect.any(String),
        data: {
          user: TEST_USERS.ADMIN,
          expiresIn: "50m",
        },
      });
      expect(req.session.user).toEqual(TEST_USERS.ADMIN);
    });
  });

  describe("refreshToken", () => {
    it("should prefer refresh token from cookie", async () => {
      const req = {
        cookies: {
          refresh_token: "refresh-from-cookie",
        },
        headers: {},
        secure: false,
      } as any;
      const res = {
        cookie: jest.fn(),
        json: jest.fn().mockImplementation((payload) => payload),
      } as any;

      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: "new-access-token",
        expiresIn: "50m",
      });

      const result = await controller.refreshToken(req, res);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        "refresh-from-cookie",
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "access_token",
        "new-access-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        path: undefined,
        method: undefined,
        timestamp: expect.any(String),
        data: {
          expiresIn: "50m",
        },
      });
    });
  });

  describe("loginV2", () => {
    const loginDto: LoginDto = {
      usuario: TEST_USERS.REGULAR.usuario,
      senha: TEST_CREDENTIALS.DEFAULT_PASSWORD,
    };

    it("should return JWT token with 50m expiration on successful login", async () => {
      // Arrange
      const mockResponse: LoginV2Response = {
        user: {
          userId: 1,
          usuario: TEST_USERS.REGULAR.usuario,
          role: "user",
        },
        accessToken: TEST_TOKENS.MOCK_JWT_TOKEN_50M,
        expiresIn: "50m",
      };
      mockAuthService.loginV2.mockResolvedValue(mockResponse);

      // Act
      const result = await authV2Controller.login(
        loginDto,
        "127.0.0.1",
        "test-agent",
      );

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockAuthService.loginV2).toHaveBeenCalledWith(
        loginDto,
        "127.0.0.1",
        "test-agent",
      );
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      // Arrange
      mockAuthService.loginV2.mockRejectedValue(
        new UnauthorizedException("Credenciais inválidas"),
      );

      // Act & Assert
      await expect(
        authV2Controller.login(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(new UnauthorizedException("Credenciais inválidas"));

      expect(mockAuthService.loginV2).toHaveBeenCalledWith(
        loginDto,
        "127.0.0.1",
        "test-agent",
      );
    });

    it("should throw UnauthorizedException for inactive user", async () => {
      // Arrange
      mockAuthService.loginV2.mockRejectedValue(
        new UnauthorizedException("Usuário inativo"),
      );

      // Act & Assert
      await expect(
        authV2Controller.login(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(new UnauthorizedException("Usuário inativo"));
    });

    it("should throw UnauthorizedException for blocked user", async () => {
      // Arrange
      mockAuthService.loginV2.mockRejectedValue(
        new UnauthorizedException("Usuário bloqueado"),
      );

      // Act & Assert
      await expect(
        authV2Controller.login(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(new UnauthorizedException("Usuário bloqueado"));
    });

    it("should call authService.loginV2 with correct parameters", async () => {
      const loginDto: LoginDto = {
        usuario: TEST_USERS.REGULAR.usuario,
        senha: TEST_CREDENTIALS.DEFAULT_PASSWORD,
      };

      const mockResponse: LoginV2Response = {
        user: {
          userId: 1,
          usuario: TEST_USERS.REGULAR.usuario,
          role: "USER",
        },
        accessToken: TEST_TOKENS.MOCK_JWT_TOKEN,
        expiresIn: "50m",
      };

      mockAuthService.loginV2.mockResolvedValue(mockResponse);

      const result = await authV2Controller.login(
        loginDto,
        "127.0.0.1",
        "test-agent",
      );

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.loginV2).toHaveBeenCalledWith(
        loginDto,
        "127.0.0.1",
        "test-agent",
      );
    });

    it("should handle service errors properly", async () => {
      const loginDto: LoginDto = {
        usuario: TEST_USERS.REGULAR.usuario,
        senha: TEST_CREDENTIALS.INVALID_PASSWORD,
      };

      mockAuthService.loginV2.mockRejectedValue(
        new UnauthorizedException("Credenciais inválidas"),
      );

      await expect(
        authV2Controller.login(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.loginV2).toHaveBeenCalledWith(
        loginDto,
        "127.0.0.1",
        "test-agent",
      );
    });
  });
});
