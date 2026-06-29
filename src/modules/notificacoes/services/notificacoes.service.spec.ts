import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { NotificacoesService } from "./notificacoes.service";
import {
  Notificacao,
  TipoNotificacao,
  PrioridadeNotificacao,
  NotificationPreferences,
} from "../entities";
import { User } from "../../users/entities/user.entity";
import { Tarefa } from "../../tarefas/entities/tarefa.entity";
import { DesarquivamentoTypeOrmEntity } from "../../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { PushNotificationsService } from "./push-notifications.service";

describe("NotificacoesService", () => {
  let service: NotificacoesService;

  const mockNotificacao = {
    id: 1,
    tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
    titulo: "Test Notification",
    descricao: "Test description",
    lida: false,
    prioridade: PrioridadeNotificacao.MEDIA,
    usuarioId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    marcarComoLida: jest.fn(),
    marcarComoNaoLida: jest.fn(),
  };

  const mockUser = {
    id: 1,
    nome: "Test User",
    usuario: "testuser",
    role: { id: 1, name: "admin" },
  };

  const mockPreferences = {
    id: 1,
    userId: 1,
    inAppEnabled: true,
    desktopEnabled: false,
    pushEnabled: false,
    soundEnabled: true,
    enabledTypes: {
      solicitacao_pendente: true,
      novo_processo: true,
      mencao: true,
      tarefa_atribuida: true,
      tarefa_alterada: true,
      tarefa_comentada: true,
      prazo_proximo: true,
      tarefa_atrasada: true,
      novo_registro: true,
      pasta_criada: true,
      evento_auditoria: false,
    },
  };

  const mockNotificacaoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockTarefaRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDesarquivamentoRepository = {
    find: jest.fn(),
  };

  const mockPreferencesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPushNotificationsService = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacoesService,
        {
          provide: getRepositoryToken(Notificacao),
          useValue: mockNotificacaoRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Tarefa),
          useValue: mockTarefaRepository,
        },
        {
          provide: getRepositoryToken(DesarquivamentoTypeOrmEntity),
          useValue: mockDesarquivamentoRepository,
        },
        {
          provide: getRepositoryToken(NotificationPreferences),
          useValue: mockPreferencesRepository,
        },
        {
          provide: PushNotificationsService,
          useValue: mockPushNotificationsService,
        },
      ],
    }).compile();

    service = module.get<NotificacoesService>(NotificacoesService);
    jest.spyOn(service["logger"], "debug").mockImplementation(() => {});
    jest.spyOn(service["logger"], "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto = {
      tipo: TipoNotificacao.SOLICITACAO_PENDENTE,
      titulo: "Test",
      descricao: "Test desc",
      usuarioId: 1,
    };

    it("should create a notification when user exists and preferences allow", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockPreferencesRepository.find.mockResolvedValue([mockPreferences]);
      mockNotificacaoRepository.create.mockReturnValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotificacao);
      expect(mockPreferencesRepository.find).toHaveBeenCalledWith({
        where: { userId: expect.anything() },
      });
      expect(mockPushNotificationsService.sendToUser).not.toHaveBeenCalled();
    });

    it("should persist the notification even when all channels are disabled", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue({
        ...mockPreferences,
        inAppEnabled: false,
        desktopEnabled: false,
      });
      mockPreferencesRepository.find.mockResolvedValue([
        {
          ...mockPreferences,
          inAppEnabled: false,
          desktopEnabled: false,
        },
      ]);
      mockNotificacaoRepository.create.mockReturnValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotificacao);
      expect(mockNotificacaoRepository.save).toHaveBeenCalled();
      expect(mockPushNotificationsService.sendToUser).not.toHaveBeenCalled();
    });

    it("should create notification when no preferences exist (default allow)", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.find.mockResolvedValue([]);
      mockNotificacaoRepository.create.mockReturnValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotificacao);
    });

    it("should create notification when in-app is disabled but push is enabled", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue({
        ...mockPreferences,
        inAppEnabled: false,
        pushEnabled: true,
      });
      mockPreferencesRepository.find.mockResolvedValue([
        {
          ...mockPreferences,
          inAppEnabled: false,
          pushEnabled: true,
        },
      ]);
      mockNotificacaoRepository.create.mockReturnValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotificacao);
      expect(mockPushNotificationsService.sendToUser).toHaveBeenCalledWith(
        1,
        mockNotificacao,
      );
    });

    it("should not send push when only desktop is enabled", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue({
        ...mockPreferences,
        inAppEnabled: false,
        desktopEnabled: true,
        pushEnabled: false,
      });
      mockPreferencesRepository.find.mockResolvedValue([
        {
          ...mockPreferences,
          inAppEnabled: false,
          desktopEnabled: true,
          pushEnabled: false,
        },
      ]);
      mockNotificacaoRepository.create.mockReturnValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      await service.create(createDto);

      expect(mockPushNotificationsService.sendToUser).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when user does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should allow notification when preferences check fails (fail-open)", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.find.mockResolvedValue([]);
      mockNotificacaoRepository.create.mockReturnValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotificacao);
    });

    it("should return the existing notification when a duplicate is detected", async () => {
      const nonRecurrenteDto = {
        tipo: TipoNotificacao.MENCAO,
        titulo: "Test",
        descricao: "Test desc",
        usuarioId: 1,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.find.mockResolvedValue([]);
      mockNotificacaoRepository.findOne.mockResolvedValue(mockNotificacao);

      const result = await service.create(nonRecurrenteDto);

      expect(result).toEqual(mockNotificacao);
      expect(mockNotificacaoRepository.save).not.toHaveBeenCalled();
    });

    it("should upsert existing notification for tipo recorrente", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.find.mockResolvedValue([]);
      mockNotificacaoRepository.findOne.mockResolvedValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotificacao);
      expect(mockNotificacaoRepository.save).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a notification", async () => {
      mockNotificacaoRepository.findOne.mockResolvedValue(mockNotificacao);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockNotificacao);
    });

    it("should throw NotFoundException when notification not found", async () => {
      mockNotificacaoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("marcarComoLida", () => {
    it("should mark notification as read", async () => {
      mockNotificacaoRepository.findOne.mockResolvedValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue({
        ...mockNotificacao,
        lida: true,
      });

      const result = await service.marcarComoLida(1, 1);

      expect(mockNotificacao.marcarComoLida).toHaveBeenCalled();
      expect(result.lida).toBe(true);
    });
  });

  describe("marcarTodasComoLidas", () => {
    it("should mark all notifications as read", async () => {
      mockNotificacaoRepository.update.mockResolvedValue({ affected: 5 });

      const result = await service.marcarTodasComoLidas(1);

      expect(result).toBe(5);
      expect(mockNotificacaoRepository.update).toHaveBeenCalledWith(
        { usuarioId: 1, lida: false },
        { lida: true },
      );
    });
  });

  describe("delete", () => {
    it("should soft-delete a notification", async () => {
      mockNotificacaoRepository.findOne.mockResolvedValue(mockNotificacao);
      mockNotificacaoRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.delete(1, 1);

      expect(mockNotificacaoRepository.softDelete).toHaveBeenCalledWith(1);
    });
  });

  describe("limparNotificacoesAntigas", () => {
    it("should soft-delete old read, expired, and stale unread notifications", async () => {
      const mockQb = {
        softDelete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 10 }),
      };
      mockNotificacaoRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.limparNotificacoesAntigas(30);

      expect(result).toBe(30);
      expect(mockQb.softDelete).toHaveBeenCalledTimes(3);
      expect(mockQb.where).toHaveBeenCalledWith("lida = :lida", {
        lida: true,
      });
    });

    it("should return 0 when no old notifications exist", async () => {
      const mockQb = {
        softDelete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      mockNotificacaoRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.limparNotificacoesAntigas(30);

      expect(result).toBe(0);
    });
  });

  describe("getEstatisticas", () => {
    it("should return aggregated statistics", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const mockQbContagens = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ total: "10", lidas: "7", naoLidas: "3" }),
      };
      const mockQbTipo = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { tipo: "solicitacao_pendente", count: "5" },
          { tipo: "novo_processo", count: "5" },
        ]),
      };
      const mockQbPrioridade = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { prioridade: "alta", count: "3" },
          { prioridade: "media", count: "7" },
        ]),
      };

      let callCount = 0;
      mockNotificacaoRepository.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockQbContagens;
        if (callCount === 2) return mockQbTipo;
        return mockQbPrioridade;
      });

      const result = await service.getEstatisticas(1);

      expect(result.total).toBe(10);
      expect(result.naoLidas).toBe(3);
      expect(result.lidas).toBe(7);
      expect(result.porTipo).toEqual({
        solicitacao_pendente: 5,
        novo_processo: 5,
      });
      expect(result.porPrioridade).toEqual({
        alta: 3,
        media: 7,
      });
    });
  });

  describe("notificarMencao", () => {
    it("should create a mention notification even when channels are disabled", async () => {
      mockPreferencesRepository.find.mockResolvedValue([
        {
          ...mockPreferences,
          inAppEnabled: false,
          desktopEnabled: false,
          pushEnabled: false,
        },
      ]);
      mockTarefaRepository.findOne.mockResolvedValue({
        id: 1,
        titulo: "Test Task",
        projeto: { nome: "Test Project" },
      });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockNotificacaoRepository.create.mockReturnValue(mockNotificacao);
      mockNotificacaoRepository.save.mockResolvedValue(mockNotificacao);

      const result = await service.notificarMencao(1, 2, 1, "test comment");

      expect(result).toEqual(mockNotificacao);
      expect(mockPushNotificationsService.sendToUser).not.toHaveBeenCalled();
    });
  });
});
