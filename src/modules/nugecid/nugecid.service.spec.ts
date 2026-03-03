import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";

import { NugecidService } from "./nugecid.service";
import { NugecidAuditService } from "./nugecid-audit.service";
import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import { DesarquivamentoCommentTypeOrmEntity } from "./infrastructure/entities/desarquivamento-comment.typeorm-entity";
import { User } from "../users/entities/user.entity";
import { NotificacoesService } from "../notificacoes/services/notificacoes.service";
import { TipoDesarquivamentoEnum } from "./domain/enums/tipo-desarquivamento.enum";
import { StatusDesarquivamentoEnum } from "./domain/enums/status-desarquivamento.enum";

describe("NugecidService", () => {
  let service: NugecidService;
  let userRepository: Repository<User>;

  const currentUser = {
    id: 2,
    usuario: "editor",
    role: { id: 2, name: "editor" },
  } as User;

  const mockEntity = {
    id: 1,
    numeroNicLaudoAuto: "NIC-2024001",
    nomeCompleto: "João Silva",
    numeroProcesso: "2024001-PROC",
    tipoDocumento: "Laudo",
    setorDemandante: "Delegacia",
    servidorResponsavel: "Servidor Teste",
    status: StatusDesarquivamentoEnum.SOLICITADO,
    desarquivamentoFisicoDigital: TipoDesarquivamentoEnum.FISICO,
    tipoDesarquivamento: TipoDesarquivamentoEnum.FISICO,
    dataSolicitacao: new Date(),
    criadoPorId: 2,
  } as unknown as DesarquivamentoTypeOrmEntity;

  const makeQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockEntity], 1]),
    getOne: jest.fn().mockResolvedValue(mockEntity),
  });

  const mockDesarquivamentoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCommentRepository = {};

  const mockUserRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockNugecidAuditService = {
    saveDesarquivamentoAudit: jest.fn().mockResolvedValue({}),
    findByEntity: jest.fn().mockResolvedValue([]),
  };

  const mockNotificacoesService = {
    criarNotificacao: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NugecidService,
        {
          provide: getRepositoryToken(DesarquivamentoTypeOrmEntity),
          useValue: mockDesarquivamentoRepository,
        },
        {
          provide: getRepositoryToken(DesarquivamentoCommentTypeOrmEntity),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: NugecidAuditService,
          useValue: mockNugecidAuditService,
        },
        {
          provide: NotificacoesService,
          useValue: mockNotificacoesService,
        },
      ],
    }).compile();

    service = module.get<NugecidService>(NugecidService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it("deve criar um desarquivamento com sucesso", async () => {
    const dto = {
      desarquivamentoFisicoDigital: TipoDesarquivamentoEnum.FISICO,
      nomeCompleto: "João Silva",
      numeroNicLaudoAuto: "NIC-2024001",
      numeroProcesso: "2024001-PROC",
      tipoDocumento: "Laudo",
      dataSolicitacao: new Date().toISOString(),
      setorDemandante: "Delegacia",
      servidorResponsavel: "Servidor Teste",
      finalidadeDesarquivamento: "Processo judicial",
      solicitacaoProrrogacao: false,
      urgente: false,
    };

    mockDesarquivamentoRepository.create.mockReturnValue(mockEntity);
    mockDesarquivamentoRepository.save.mockResolvedValue(mockEntity);
    const qb = makeQueryBuilder();
    mockDesarquivamentoRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.create(dto as any, currentUser);

    expect(mockDesarquivamentoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        criadoPorId: currentUser.id,
        status: StatusDesarquivamentoEnum.SOLICITADO,
      }),
    );
    expect(userRepository.find).toHaveBeenCalled();
    expect(result).toEqual(mockEntity);
  });

  it("deve listar desarquivamentos com busca", async () => {
    const qb = makeQueryBuilder();
    mockDesarquivamentoRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      search: "João",
    });

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("nomeCompleto"),
      expect.objectContaining({ search: "%João%" }),
    );
    expect(result.total).toBe(1);
    expect(result.desarquivamentos).toHaveLength(1);
  });

  it("deve buscar um desarquivamento por id", async () => {
    const qb = makeQueryBuilder();
    mockDesarquivamentoRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findOne(1);

    expect(qb.where).toHaveBeenCalledWith("desarquivamento.id = :id", {
      id: 1,
    });
    expect(result).toEqual(mockEntity);
  });

  it("deve lançar NotFoundException quando id não existir", async () => {
    const qb = makeQueryBuilder();
    qb.getOne.mockResolvedValue(null);
    mockDesarquivamentoRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it("deve buscar por código de barras (numeroNicLaudoAuto)", async () => {
    mockDesarquivamentoRepository.findOne.mockResolvedValue(mockEntity);

    const result = await service.findByBarcode("NIC-2024001");

    expect(mockDesarquivamentoRepository.findOne).toHaveBeenCalledWith({
      where: { numeroNicLaudoAuto: "NIC-2024001" },
      relations: ["usuario", "responsavel"],
    });
    expect(result).toEqual(mockEntity);
  });

  it("deve consolidar visualizações repetidas no histórico", async () => {
    mockDesarquivamentoRepository.findOne.mockResolvedValue(mockEntity);

    const makeAudit = (overrides: Record<string, unknown>) => ({
      id: 0,
      action: "VIEW",
      timestamp: new Date("2026-02-04T08:18:00.000Z"),
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        nome: "Editor",
        usuario: "editor",
      },
      details: {},
      ipAddress: "127.0.0.1",
      success: true,
      getActionLabel: jest.fn().mockReturnValue("Visualização"),
      ...overrides,
    });

    const viewOld = makeAudit({
      id: 10,
      action: "VIEW",
      timestamp: new Date("2026-02-04T08:18:00.000Z"),
    });
    const viewNew = makeAudit({
      id: 11,
      action: "VIEW",
      timestamp: new Date("2026-02-04T09:18:00.000Z"),
    });
    const statusUpdate = makeAudit({
      id: 12,
      action: "UPDATE",
      timestamp: new Date("2026-02-04T09:30:00.000Z"),
      details: {
        details: "Status alterado",
        changes: {
          status: { from: "SOLICITADO", to: "DESARQUIVADO" },
        },
      },
      getActionLabel: jest.fn().mockReturnValue("Atualização"),
    });

    mockNugecidAuditService.findByEntity
      .mockResolvedValueOnce([viewNew, statusUpdate])
      .mockResolvedValueOnce([viewOld]);

    const result = await service.getHistorico(1);

    expect(mockNugecidAuditService.findByEntity).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.data.filter((item) => item.action === "VIEW")).toHaveLength(
      1,
    );
    expect(result.data.filter((item) => item.action === "UPDATE")).toHaveLength(
      1,
    );
  });
});
