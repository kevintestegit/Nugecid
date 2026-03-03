import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as webPush from "web-push";

import {
  NotificationPushSubscription,
  NotificationPreferences,
  Notificacao,
} from "../entities";
import { RemovePushSubscriptionDto, SavePushSubscriptionDto } from "../dto";

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly vapidPublicKey?: string;
  private readonly vapidPrivateKey?: string;
  private readonly vapidSubject: string;

  constructor(
    @InjectRepository(NotificationPushSubscription)
    private readonly pushSubscriptionRepository: Repository<NotificationPushSubscription>,
    @InjectRepository(NotificationPreferences)
    private readonly preferencesRepository: Repository<NotificationPreferences>,
    private readonly configService: ConfigService,
  ) {
    this.vapidPublicKey = this.configService.get<string>(
      "app.webPush.vapidPublicKey",
    );
    this.vapidPrivateKey = this.configService.get<string>(
      "app.webPush.vapidPrivateKey",
    );
    this.vapidSubject = this.configService.get<string>(
      "app.webPush.subject",
      "mailto:admin@localhost",
    );

    if (this.isConfigured()) {
      webPush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey!,
        this.vapidPrivateKey!,
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.vapidPublicKey && this.vapidPrivateKey && this.vapidSubject,
    );
  }

  getClientConfig(): { enabled: boolean; publicKey?: string } {
    if (!this.isConfigured()) {
      return { enabled: false };
    }

    return {
      enabled: true,
      publicKey: this.vapidPublicKey,
    };
  }

  async saveSubscription(
    userId: number,
    dto: SavePushSubscriptionDto,
    userAgent?: string,
  ): Promise<NotificationPushSubscription | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const existing = await this.pushSubscriptionRepository.findOne({
      where: { endpoint: dto.endpoint },
    });

    const subscription = existing
      ? existing
      : this.pushSubscriptionRepository.create({
          userId,
          endpoint: dto.endpoint,
        });

    subscription.userId = userId;
    subscription.endpoint = dto.endpoint;
    subscription.subscription = {
      endpoint: dto.endpoint,
      expirationTime: dto.expirationTime ?? null,
      keys: {
        auth: dto.keys.auth,
        p256dh: dto.keys.p256dh,
      },
    };
    subscription.userAgent = userAgent ?? null;

    return this.pushSubscriptionRepository.save(subscription);
  }

  async removeSubscription(
    userId: number,
    dto: RemovePushSubscriptionDto,
  ): Promise<void> {
    await this.pushSubscriptionRepository.delete({
      userId,
      endpoint: dto.endpoint,
    });
  }

  async sendToUser(userId: number, notificacao: Notificacao): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    const preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (
      preferences &&
      !preferences.canReceiveNotification(notificacao.tipo, "push")
    ) {
      return;
    }

    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { userId },
    });

    if (!subscriptions.length) {
      return;
    }

    const payload = JSON.stringify(this.buildPayload(notificacao));

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webPush.sendNotification(
          subscription.toWebPushSubscription(),
          payload,
          {
            TTL: 60 * 60,
          },
        ),
      ),
    );

    await Promise.all(
      results.map(async (result, index) => {
        if (result.status === "fulfilled") {
          return;
        }

        const subscription = subscriptions[index];
        const statusCode = this.extractStatusCode(result.reason);
        if (statusCode === 404 || statusCode === 410) {
          await this.pushSubscriptionRepository.delete({
            endpoint: subscription.endpoint,
          });
          return;
        }

        this.logger.warn(
          `Falha ao enviar Web Push para usuário ${userId}: ${
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason)
          }`,
        );
      }),
    );
  }

  private extractStatusCode(error: unknown): number | undefined {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
    ) {
      return (error as { statusCode: number }).statusCode;
    }

    return undefined;
  }

  private buildPayload(notificacao: Notificacao) {
    const targetUrl =
      notificacao.link ||
      (notificacao.processoId
        ? `/desarquivamentos/${notificacao.processoId}`
        : notificacao.solicitacaoId
          ? `/desarquivamentos/${notificacao.solicitacaoId}`
          : notificacao.tarefaId
            ? `/tarefas/${notificacao.tarefaId}`
            : "/notificacoes");

    return {
      title: notificacao.titulo,
      body: notificacao.descricao,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: `sgc-notificacao-${notificacao.id}`,
      url: targetUrl,
      notificationId: notificacao.id,
      tipo: notificacao.tipo,
      prioridade: notificacao.prioridade,
      requireInteraction: notificacao.prioridade === "critica",
    };
  }
}
