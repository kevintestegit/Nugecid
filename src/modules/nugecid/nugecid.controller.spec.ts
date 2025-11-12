import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpStatus,
} from "@nestjs/common";
import { Response, Request } from "express";
import { NugecidController } from "./nugecid.controller";
import {
  CreateDesarquivamentoUseCase,
  FindAllDesarquivamentosUseCase,
  FindDesarquivamentoByIdUseCase,
  UpdateDesarquivamentoUseCase,
  DeleteDesarquivamentoUseCase,
  GenerateTermoEntregaUseCase,
  GetDashboardStatsUseCase,
  ImportDesarquivamentoUseCase,
  ImportRegistrosUseCase,
} from "./application/use-cases";
import { CreateDesarquivamentoDto } from "./dto/create-desarquivamento.dto";
import { UpdateDesarquivamentoDto } from "./dto/update-desarquivamento.dto";
import { QueryDesarquivamentoDto } from "./dto/query-desarquivamento.dto";
import { TipoDesarquivamentoEnum } from "./domain/value-objects/tipo-desarquivamento.vo";
import { StatusDesarquivamentoEnum } from "./domain/value-objects/status-desarquivamento.vo";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { ImportResultDto } from "./dto/import-result.dto";
import { RoleType } from "../users/enums/role-type.enum";
import { TipoDesarquivamento } from "./domain/value-objects/tipo-desarquivamento.vo";

describe("NugecidController", () => {
  let controller: NugecidController;
  let createDesarquivamentoUseCase: CreateDesarquivamentoUseCase;
  let findAllDesarquivamentosUseCase: FindAllDesarquivamentosUseCase;
  let findDesarquivamentoByIdUseCase: FindDesarquivamentoByIdUseCase;
  let updateDesarquivamentoUseCase: UpdateDesarquivamentoUseCase;
  let deleteDesarquivamentoUseCase: DeleteDesarquivamentoUseCase;
  let importDesarquivamentoUseCase: ImportDesarquivamentoUseCase;

  const mockAdminRole: Role = {
    id: 1,
    name: RoleType.ADMIN,
    description: "Administrator",
    permissions: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    hasPermission: jest.fn().mockReturnValue(true),
    isAdmin: jest.fn().mockReturnValue(true),
    isEditor: jest.fn().mockReturnValue(false),
  };

  const mockEditorRole: Role = {
    id: 2,
    name: RoleType.USUARIO,
    description: "User",
    permissions: [],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    hasPermission: jest.fn().mockReturnValue(true),
    isAdmin: jest.fn().mockReturnValue(false),
    isEditor: jest.fn().mockReturnValue(true),
  };

  const mockAdminUser: User = {
    id: 1,
    nome: "Admin User",
    usuario: "admin",
    role: mockAdminRole,
    roleId: 1,
    senha: "hashedpassword",
    ativo: true,
    ultimoLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tentativasLogin: 0,
    bloqueadoAte: null,
    tokenReset: null,
    tokenResetExpira: null,
    settings: {},
    auditorias: [],
    isAdmin: jest.fn().mockReturnValue(true),
    isCoordenador: jest.fn().mockReturnValue(false),
    isEditor: jest.fn().mockReturnValue(false),
    canManageUser: jest.fn().mockReturnValue(true),
    canViewAllRecords: jest.fn().mockReturnValue(true),
    isBlocked: jest.fn().mockReturnValue(false),
    validatePassword: jest.fn().mockResolvedValue(true),
    hashPassword: jest.fn().mockResolvedValue("hashedpassword"),
    toJSON: jest.fn().mockReturnValue({}),
    serialize: jest.fn().mockReturnValue({}),
  } as any;

  const mockEditorUser: User = {
    id: 2,
    nome: "Editor User",
    usuario: "editor",
    role: mockEditorRole,
    roleId: 2,
    senha: "hashedpassword",
    ativo: true,
    ultimoLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tentativasLogin: 0,
    bloqueadoAte: null,
    tokenReset: null,
    tokenResetExpira: null,
    settings: {},
    auditorias: [],
    isAdmin: jest.fn().mockReturnValue(false),
    isCoordenador: jest.fn().mockReturnValue(false),
    isEditor: jest.fn().mockReturnValue(true),
    canManageUser: jest.fn().mockReturnValue(false),
    canViewAllRecords: jest.fn().mockReturnValue(false),
    isBlocked: jest.fn().mockReturnValue(false),
    validatePassword: jest.fn().mockResolvedValue(true),
    hashPassword: jest.fn().mockResolvedValue("hashedpassword"),
    toJSON: jest.fn().mockReturnValue({}),
    serialize: jest.fn().mockReturnValue({}),
  } as any;

  const mockDesarquivamento: any = {
    id: 1,
    tipoDesarquivamento: TipoDesarquivamentoEnum.FISICO,
    status: "SOLICITADO",
    numeroNicLaudoAuto: "DES202400001",
    urgente: false,
    createdBy: mockEditorUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    nomeCompleto: "João Silva",
    numeroProcesso: "12345",
    tipoDocumento: "Laudo Pericial",
    dataSolicitacao: new Date(),
    setorDemandante: "Setor Teste",
    servidorResponsavel: "Servidor Teste",
    finalidadeDesarquivamento: "Teste",
    solicitacaoProrrogacao: false,
  };

  const mockPaginatedResult = {
    data: [mockDesarquivamento],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockCreateDesarquivamentoUseCase = { execute: jest.fn() };
  const mockFindAllDesarquivamentosUseCase = { execute: jest.fn() };
  const mockFindDesarquivamentoByIdUseCase = { execute: jest.fn() };
  const mockUpdateDesarquivamentoUseCase = { execute: jest.fn() };
  const mockDeleteDesarquivamentoUseCase = { execute: jest.fn() };
  const mockGenerateTermoEntregaUseCase = { execute: jest.fn() };
  const mockGetDashboardStatsUseCase = { execute: jest.fn() };
  const mockImportDesarquivamentoUseCase = { execute: jest.fn() };
  const mockImportRegistrosUseCase = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NugecidController],
      providers: [
        {
          provide: CreateDesarquivamentoUseCase,
          useValue: mockCreateDesarquivamentoUseCase,
        },
        {
          provide: FindAllDesarquivamentosUseCase,
          useValue: mockFindAllDesarquivamentosUseCase,
        },
        {
          provide: FindDesarquivamentoByIdUseCase,
          useValue: mockFindDesarquivamentoByIdUseCase,
        },
        {
          provide: UpdateDesarquivamentoUseCase,
          useValue: mockUpdateDesarquivamentoUseCase,
        },
        {
          provide: DeleteDesarquivamentoUseCase,
          useValue: mockDeleteDesarquivamentoUseCase,
        },
        {
          provide: GenerateTermoEntregaUseCase,
          useValue: mockGenerateTermoEntregaUseCase,
        },
        {
          provide: GetDashboardStatsUseCase,
          useValue: mockGetDashboardStatsUseCase,
        },
        {
          provide: ImportDesarquivamentoUseCase,
          useValue: mockImportDesarquivamentoUseCase,
        },
        {
          provide: ImportRegistrosUseCase,
          useValue: mockImportRegistrosUseCase,
        },
      ],
    }).compile();

    controller = module.get<NugecidController>(NugecidController);
    createDesarquivamentoUseCase = module.get<CreateDesarquivamentoUseCase>(
      CreateDesarquivamentoUseCase,
    );
    findAllDesarquivamentosUseCase = module.get<FindAllDesarquivamentosUseCase>(
      FindAllDesarquivamentosUseCase,
    );
    findDesarquivamentoByIdUseCase = module.get<FindDesarquivamentoByIdUseCase>(
      FindDesarquivamentoByIdUseCase,
    );
    updateDesarquivamentoUseCase = module.get<UpdateDesarquivamentoUseCase>(
      UpdateDesarquivamentoUseCase,
    );
    deleteDesarquivamentoUseCase = module.get<DeleteDesarquivamentoUseCase>(
      DeleteDesarquivamentoUseCase,
    );
    importDesarquivamentoUseCase = module.get<ImportDesarquivamentoUseCase>(
      ImportDesarquivamentoUseCase,
    );

    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto: CreateDesarquivamentoDto = {
      tipoDesarquivamento: "FISICO",
      desarquivamentoFisicoDigital: TipoDesarquivamentoEnum.FISICO,
      nomeCompleto: "João Silva",
      numeroNicLaudoAuto: "NIC-12345",
      numeroProcesso: "12345-PROC",
      tipoDocumento: "Laudo",
      dataSolicitacao: new Date().toISOString(),
      setorDemandante: "Delegacia",
      servidorResponsavel: "Servidor Teste",
      finalidadeDesarquivamento: "Para processo",
      solicitacaoProrrogacao: false,
    };

    it("should create a new desarquivamento successfully", async () => {
      mockCreateDesarquivamentoUseCase.execute.mockResolvedValue(
        mockDesarquivamento,
      );

      const mockReq = {
        headers: { accept: "application/json" },
      } as any as Request;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        redirect: jest.fn(),
      } as any as Response;

      await controller.create(createDto, mockEditorUser, mockReq, mockRes);

      expect(createDesarquivamentoUseCase.execute).toHaveBeenCalledWith({
        ...createDto,
        urgente: false,
        criadoPorId: mockEditorUser.id,
      });
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Desarquivamento criado com sucesso",
        data: mockDesarquivamento,
      });
    });
  });

  describe("findAll", () => {
    const queryDto: QueryDesarquivamentoDto = { page: 1, limit: 10 };

    it("should return a paginated list of desarquivamentos", async () => {
      mockFindAllDesarquivamentosUseCase.execute.mockResolvedValue(
        mockPaginatedResult,
      );

      const mockReq = {
        headers: { accept: "application/json" },
      } as any as Request;
      const mockRes = {
        json: jest.fn(),
        render: jest.fn(),
      } as any as Response;

      await controller.findAll(queryDto, mockAdminUser);

      expect(findAllDesarquivamentosUseCase.execute).toHaveBeenCalledWith({
        ...queryDto,
        userId: mockAdminUser.id,
        userRoles: [mockAdminUser.role.name],
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPaginatedResult,
        meta: {
          page: mockPaginatedResult.page,
          limit: mockPaginatedResult.limit,
          total: mockPaginatedResult.total,
          totalPages: mockPaginatedResult.totalPages,
        },
      });
    });
  });

  describe("findOne", () => {
    it("should return a single desarquivamento by ID", async () => {
      mockFindDesarquivamentoByIdUseCase.execute.mockResolvedValue(
        mockDesarquivamento,
      );

      const mockReq = {
        headers: { accept: "application/json" },
      } as any as Request;
      const mockRes = {
        json: jest.fn(),
        render: jest.fn(),
      } as any as Response;

      await controller.findOne(1, mockEditorUser, mockReq);

      expect(findDesarquivamentoByIdUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        userId: mockEditorUser.id,
        userRoles: [mockEditorUser.role.name],
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDesarquivamento,
      });
    });
  });

  describe("update", () => {
    const updateDto: UpdateDesarquivamentoDto = {
      status: StatusDesarquivamentoEnum.FINALIZADO,
    };

    it("should update a desarquivamento successfully", async () => {
      const updatedDesarquivamento = { ...mockDesarquivamento, ...updateDto };
      mockUpdateDesarquivamentoUseCase.execute.mockResolvedValue(
        updatedDesarquivamento,
      );

      const mockReq = {
        headers: { accept: "application/json" },
      } as any as Request;
      const mockRes = {
        json: jest.fn(),
        redirect: jest.fn(),
      } as any as Response;

      await controller.update(1, updateDto, mockEditorUser);

      expect(updateDesarquivamentoUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        ...updateDto,
        userId: mockEditorUser.id,
        userRoles: [mockEditorUser.role.name],
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Desarquivamento atualizado com sucesso",
        data: updatedDesarquivamento,
      });
    });
  });

  describe("remove", () => {
    it("should remove a desarquivamento successfully", async () => {
      mockDeleteDesarquivamentoUseCase.execute.mockResolvedValue(undefined);

      const mockReq = {
        headers: { accept: "application/json" },
      } as any as Request;
      const mockRes = {
        json: jest.fn(),
        redirect: jest.fn(),
      } as any as Response;

      await controller.remove("1", mockAdminUser);

      expect(deleteDesarquivamentoUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        userId: mockAdminUser.id,
        userRoles: [mockAdminUser.role.name],
        permanent: false,
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Desarquivamento removido com sucesso",
      });
    });
  });

  describe("importDesarquivamentos", () => {
    const mockFile = {
      buffer: Buffer.from("mock file content"),
    } as Express.Multer.File;

    const mockImportResult: ImportResultDto = {
      totalRows: 10,
      successCount: 8,
      errorCount: 2,
      errors: [
        { row: 5, details: "Erro na linha 5" },
        { row: 7, details: "Erro na linha 7" },
      ],
    };

    it("should import data from a file successfully", async () => {
      mockImportDesarquivamentoUseCase.execute.mockResolvedValue(
        mockImportResult,
      );

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any as Response;

      await controller.importDesarquivamentos(
        mockFile as any,
        mockAdminUser,
        mockRes,
      );

      expect(importDesarquivamentoUseCase.execute).toHaveBeenCalledWith(
        mockFile.buffer,
        mockAdminUser.id,
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining(mockImportResult),
        }),
      );
    });

    it("should throw BadRequestException if no file is provided", async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any as Response;

      await expect(
        controller.importDesarquivamentos(null, mockAdminUser, mockRes),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
