import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnauthorizedException } from "@nestjs/common";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
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
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let auditoriaRepository: Repository<Auditoria>;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    nome: TEST_USERS.REGULAR.nome,
    usuario: TEST_USERS.REGULAR.email,
    senha: "hashedPassword",
    ativo: true,
    role: {
      id: 1,
      name: "user",
    },
    validatePassword: jest.fn().mockResolvedValue(true),
    isBlocked: jest.fn().mockReturnValue(false),
    isAdmin: jest.fn().mockReturnValue(false),
  };

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
    validateJwtPayload: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue(TEST_TOKENS.MOCK_JWT_TOKEN),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
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
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.spyOn(controller["logger"], "error").mockImplementation(() => {});
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    auditoriaRepository = module.get<Repository<Auditoria>>(
      getRepositoryToken(Auditoria),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      const result = await controller.loginV2(
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
        controller.loginV2(loginDto, "127.0.0.1", "test-agent"),
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
        controller.loginV2(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(new UnauthorizedException("Usuário inativo"));
    });

    it("should throw UnauthorizedException for blocked user", async () => {
      // Arrange
      mockAuthService.loginV2.mockRejectedValue(
        new UnauthorizedException("Usuário bloqueado"),
      );

      // Act & Assert
      await expect(
        controller.loginV2(loginDto, "127.0.0.1", "test-agent"),
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

      const result = await controller.loginV2(
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
        controller.loginV2(loginDto, "127.0.0.1", "test-agent"),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.loginV2).toHaveBeenCalledWith(
        loginDto,
        "127.0.0.1",
        "test-agent",
      );
    });
  });
});
