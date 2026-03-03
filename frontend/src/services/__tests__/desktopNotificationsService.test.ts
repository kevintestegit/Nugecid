import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { desktopNotificationsService } from "../desktopNotificationsService";
import type { Notificacao } from "../notificacoesService";

const baseNotification: Notificacao = {
  id: 42,
  tipo: "solicitacao_pendente",
  titulo: "Nova solicitação pendente",
  descricao: "Há uma solicitação aguardando análise.",
  detalhes: {
    numero_processo: "2026.000123",
  },
  prioridade: "alta",
  lida: false,
  usuarioId: 1,
  link: "/desarquivamentos/42",
  createdAt: "2026-03-26T00:00:00.000Z",
  updatedAt: "2026-03-26T00:00:00.000Z",
};

const notificationInstances: NotificationMock[] = [];

class NotificationMock {
  static permission: NotificationPermission = "granted";
  static requestPermission = vi.fn(async () => NotificationMock.permission);

  onclick: ((event: Event) => void) | null = null;
  close = vi.fn();
  title: string;
  options?: NotificationOptions;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
    notificationInstances.push(this);
  }
}

describe("desktopNotificationsService", () => {
  beforeEach(() => {
    notificationInstances.length = 0;
    NotificationMock.permission = "granted";
    NotificationMock.requestPermission.mockClear();
    vi.stubGlobal(
      "Notification",
      NotificationMock as unknown as typeof Notification,
    );
    vi.spyOn(window, "focus").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should create a browser notification when permission is granted", () => {
    const onClick = vi.fn();

    const notification = desktopNotificationsService.show(baseNotification, {
      onClick,
    });

    expect(notification).not.toBeNull();
    expect(notificationInstances).toHaveLength(1);
    expect(notificationInstances[0].title).toBe(baseNotification.titulo);
    expect(notificationInstances[0].options?.tag).toBe("sgc-notificacao-42");

    notificationInstances[0].onclick?.(new Event("click"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(notificationInstances[0].close).toHaveBeenCalledTimes(1);
  });

  it("should not create a browser notification when permission is denied", () => {
    NotificationMock.permission = "denied";

    const notification = desktopNotificationsService.show(baseNotification);

    expect(notification).toBeNull();
    expect(notificationInstances).toHaveLength(0);
  });

  it("should request permission from the browser when supported", async () => {
    NotificationMock.permission = "granted";

    const permission = await desktopNotificationsService.requestPermission();

    expect(NotificationMock.requestPermission).toHaveBeenCalledTimes(1);
    expect(permission).toBe("granted");
  });
});
