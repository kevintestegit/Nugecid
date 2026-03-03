import type { Notificacao } from "@/services/notificacoesService";

type DesktopNotificationPermission = NotificationPermission | "unsupported";

interface ShowDesktopNotificationOptions {
  onClick?: () => void;
}

const APP_NOTIFICATION_ICON = "/favicon.svg";
const MAX_BODY_LENGTH = 180;

const truncateText = (value: string, maxLength = MAX_BODY_LENGTH) => {
  const normalized = value.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

const collectDetailsSummary = (
  detalhes?: Record<string, unknown>,
): string[] => {
  if (!detalhes) {
    return [];
  }

  const summaryKeys = [
    "nome_completo",
    "numero_processo",
    "tipo_documento",
    "acao_requerida",
  ] as const;

  return summaryKeys
    .map((key) => detalhes[key])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
};

export class DesktopNotificationsService {
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  getPermission(): DesktopNotificationPermission {
    if (!this.isSupported()) {
      return "unsupported";
    }

    return window.Notification.permission;
  }

  async requestPermission(): Promise<DesktopNotificationPermission> {
    if (!this.isSupported()) {
      return "unsupported";
    }

    try {
      return await window.Notification.requestPermission();
    } catch {
      return window.Notification.permission;
    }
  }

  private buildBody(notificacao: Notificacao): string {
    const summaryParts = [
      notificacao.descricao?.trim(),
      ...collectDetailsSummary(notificacao.detalhes),
    ].filter((value): value is string => Boolean(value && value.trim()));

    if (summaryParts.length === 0) {
      return truncateText(notificacao.titulo);
    }

    return truncateText(summaryParts.join(" | "));
  }

  show(
    notificacao: Notificacao,
    options: ShowDesktopNotificationOptions = {},
  ): Notification | null {
    if (this.getPermission() !== "granted") {
      return null;
    }

    const notification = new window.Notification(notificacao.titulo, {
      body: this.buildBody(notificacao),
      icon: APP_NOTIFICATION_ICON,
      badge: APP_NOTIFICATION_ICON,
      tag: `sgc-notificacao-${notificacao.id}`,
      requireInteraction: notificacao.prioridade === "critica",
      data: {
        notificationId: notificacao.id,
        tipo: notificacao.tipo,
      },
    });

    notification.onclick = (event) => {
      event.preventDefault();
      if (typeof window.focus === "function") {
        window.focus();
      }
      options.onClick?.();
      notification.close();
    };

    return notification;
  }
}

export const desktopNotificationsService = new DesktopNotificationsService();
