jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

import { BadRequestException } from "@nestjs/common";
import * as webPush from "web-push";
import { PushNotificationsService } from "./push-notifications.service";
import { SavePushSubscriptionDto } from "../dto";

describe("PushNotificationsService", () => {
  const createService = () => {
    const pushSubscriptionRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    const preferencesRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          "app.webPush.vapidPublicKey": "public-key",
          "app.webPush.vapidPrivateKey": "private-key",
          "app.webPush.subject": "mailto:admin@example.com",
        };

        return values[key] ?? defaultValue;
      }),
    };

    const service = new PushNotificationsService(
      pushSubscriptionRepository as never,
      preferencesRepository as never,
      configService as never,
    );

    return { service, pushSubscriptionRepository };
  };

  const dto = (endpoint: string): SavePushSubscriptionDto => ({
    endpoint,
    expirationTime: null,
    keys: {
      auth: "auth-key",
      p256dh: "p256dh-key",
    },
  });

  it("rejeita endpoint Web Push local antes de persistir a subscription", async () => {
    const { service, pushSubscriptionRepository } = createService();

    await expect(
      service.saveSubscription(1, dto("https://127.0.0.1:8443/push")),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pushSubscriptionRepository.findOne).not.toHaveBeenCalled();
    expect(pushSubscriptionRepository.save).not.toHaveBeenCalled();
  });

  it("remove subscription persistida com endpoint local antes de enviar push", async () => {
    const { service, pushSubscriptionRepository } = createService();
    const endpoint = "https://127.0.0.1:8443/push";

    pushSubscriptionRepository.find.mockResolvedValue([
      {
        endpoint,
        toWebPushSubscription: () => dto(endpoint),
      },
    ]);

    await service.sendToUser(1, {
      id: 10,
      titulo: "Teste",
      descricao: "Mensagem",
      tipo: "novo_registro",
      prioridade: "normal",
    } as never);

    expect(webPush.sendNotification).not.toHaveBeenCalled();
    expect(pushSubscriptionRepository.delete).toHaveBeenCalledWith({
      endpoint,
    });
  });
});
