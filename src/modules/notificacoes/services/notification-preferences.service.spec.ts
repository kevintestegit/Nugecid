import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { NotificationPreferences } from "../entities/notification-preferences.entity";
import { User } from "../../users/entities/user.entity";

describe("NotificationPreferencesService", () => {
  let service: NotificationPreferencesService;

  const mockUser = {
    id: 1,
    nome: "Test User",
    usuario: "testuser",
  };

  const defaultEnabledTypes = {
    solicitacao_pendente: true,
    novo_processo: true,
    novo_desarquivamento: true,
    mencao: true,
    tarefa_atribuida: true,
    tarefa_alterada: true,
    tarefa_comentada: true,
    prazo_proximo: true,
    tarefa_atrasada: true,
    projeto_atualizado: true,
    novo_registro: true,
    pasta_criada: true,
    evento_auditoria: false,
  };

  const mockPreferences = {
    id: 1,
    userId: 1,
    inAppEnabled: true,
    desktopEnabled: false,
    pushEnabled: false,
    soundEnabled: true,
    enabledTypes: { ...defaultEnabledTypes },
    canReceiveNotification: jest
      .fn()
      .mockImplementation(
        (type: string, channel: "in_app" | "desktop" | "push") => {
          if (channel === "in_app") {
            return (
              mockPreferences.inAppEnabled &&
              (mockPreferences.enabledTypes[type] ?? false)
            );
          }
          if (channel === "desktop") {
            return (
              mockPreferences.desktopEnabled &&
              (mockPreferences.enabledTypes[type] ?? false)
            );
          }
          if (channel === "push") {
            return (
              mockPreferences.pushEnabled &&
              (mockPreferences.enabledTypes[type] ?? false)
            );
          }
          return false;
        },
      ),
    enableType: jest.fn(),
    disableType: jest.fn(),
  };

  const mockPreferencesRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        {
          provide: getRepositoryToken(NotificationPreferences),
          useValue: mockPreferencesRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationPreferencesService>(
      NotificationPreferencesService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrCreatePreferences", () => {
    it("should return existing preferences", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);

      const result = await service.getOrCreatePreferences(1);

      expect(result).toEqual(mockPreferences);
      expect(mockPreferencesRepository.create).not.toHaveBeenCalled();
    });

    it("should create default preferences when none exist", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.create.mockReturnValue(mockPreferences);
      mockPreferencesRepository.save.mockResolvedValue(mockPreferences);

      const result = await service.getOrCreatePreferences(1);

      expect(result).toEqual(mockPreferences);
      expect(mockPreferencesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          inAppEnabled: true,
          desktopEnabled: false,
          pushEnabled: false,
          soundEnabled: true,
        }),
      );
    });

    it("should throw NotFoundException when user does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrCreatePreferences(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updatePreferences", () => {
    it("should update inAppEnabled", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue({
        ...mockPreferences,
      });
      mockPreferencesRepository.save.mockResolvedValue({
        ...mockPreferences,
        inAppEnabled: false,
      });

      const result = await service.updatePreferences(1, {
        inAppEnabled: false,
      });

      expect(result.inAppEnabled).toBe(false);
    });

    it("should merge enabledTypes", async () => {
      const prefs = {
        ...mockPreferences,
        enabledTypes: { ...defaultEnabledTypes },
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(prefs);
      mockPreferencesRepository.save.mockImplementation((p) =>
        Promise.resolve(p),
      );

      await service.updatePreferences(1, {
        enabledTypes: { evento_auditoria: true },
      });

      expect(mockPreferencesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          enabledTypes: expect.objectContaining({
            evento_auditoria: true,
            solicitacao_pendente: true,
          }),
        }),
      );
    });

    it("should update desktopEnabled", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue({
        ...mockPreferences,
      });
      mockPreferencesRepository.save.mockResolvedValue({
        ...mockPreferences,
        desktopEnabled: true,
      });

      const result = await service.updatePreferences(1, {
        desktopEnabled: true,
      });

      expect(result.desktopEnabled).toBe(true);
    });

    it("should update pushEnabled", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue({
        ...mockPreferences,
      });
      mockPreferencesRepository.save.mockResolvedValue({
        ...mockPreferences,
        pushEnabled: true,
      });

      const result = await service.updatePreferences(1, {
        pushEnabled: true,
      });

      expect(result.pushEnabled).toBe(true);
    });
  });

  describe("canReceiveNotification", () => {
    it("should return true for enabled notification type", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockPreferences.canReceiveNotification.mockReturnValue(true);

      const result = await service.canReceiveNotification(
        1,
        "solicitacao_pendente",
      );

      expect(result).toBe(true);
    });

    it("should return false for disabled notification type", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockPreferences.canReceiveNotification.mockReturnValue(false);

      const result = await service.canReceiveNotification(
        1,
        "evento_auditoria",
      );

      expect(result).toBe(false);
    });
  });

  describe("resetToDefaults", () => {
    it("should reset all preferences to defaults", async () => {
      const prefs = {
        ...mockPreferences,
        inAppEnabled: false,
        desktopEnabled: true,
        pushEnabled: true,
        soundEnabled: false,
        enabledTypes: { solicitacao_pendente: false },
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(prefs);
      mockPreferencesRepository.save.mockImplementation((p) =>
        Promise.resolve(p),
      );

      const result = await service.resetToDefaults(1);

      expect(result.inAppEnabled).toBe(true);
      expect(result.desktopEnabled).toBe(false);
      expect(result.pushEnabled).toBe(false);
      expect(result.soundEnabled).toBe(true);
      expect(result.enabledTypes).toEqual(defaultEnabledTypes);
    });
  });

  describe("enableNotificationType", () => {
    it("should enable a notification type", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockPreferencesRepository.save.mockResolvedValue(mockPreferences);

      await service.enableNotificationType(1, "evento_auditoria");

      expect(mockPreferences.enableType).toHaveBeenCalledWith(
        "evento_auditoria",
      );
    });
  });

  describe("disableNotificationType", () => {
    it("should disable a notification type", async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockPreferencesRepository.save.mockResolvedValue(mockPreferences);

      await service.disableNotificationType(1, "solicitacao_pendente");

      expect(mockPreferences.disableType).toHaveBeenCalledWith(
        "solicitacao_pendente",
      );
    });
  });
});
