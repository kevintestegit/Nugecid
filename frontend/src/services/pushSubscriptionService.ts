import { apiService, PushSubscriptionPayload } from "@/services/api";

export type PushSyncResult =
  | "subscribed"
  | "unsupported"
  | "permission-denied"
  | "server-disabled"
  | "noop";

const SERVICE_WORKER_URL = "/push-sw.js";
const SERVICE_WORKER_ACTIVATION_TIMEOUT_MS = 10000;

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

const subscriptionToPayload = (
  subscription: PushSubscription,
): PushSubscriptionPayload => {
  const json = subscription.toJSON();

  if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh) {
    throw new Error("Push subscription inválida");
  }

  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      auth: json.keys.auth,
      p256dh: json.keys.p256dh,
    },
  };
};

const extractErrorMessage = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: unknown } }).response === "object"
  ) {
    const responseData = (error as { response?: { data?: unknown } }).response
      ?.data;

    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof (responseData as { message?: unknown }).message === "string"
    ) {
      return (responseData as { message: string }).message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
};

export class PushSubscriptionService {
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  }

  private async waitForWorkerActivation(
    registration: ServiceWorkerRegistration,
  ): Promise<ServiceWorkerRegistration> {
    if (registration.active) {
      return registration;
    }

    const worker =
      registration.installing ?? registration.waiting ?? registration.active;

    if (!worker) {
      throw new Error(
        "Nenhum Service Worker de notificações foi inicializado.",
      );
    }

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        worker.removeEventListener("statechange", handleStateChange);
        reject(
          new Error(
            "O Service Worker de notificações não ficou ativo dentro do tempo esperado.",
          ),
        );
      }, SERVICE_WORKER_ACTIVATION_TIMEOUT_MS);

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        worker.removeEventListener("statechange", handleStateChange);
      };

      const handleStateChange = () => {
        if (worker.state === "activated") {
          cleanup();
          resolve();
        }
      };

      worker.addEventListener("statechange", handleStateChange);
      handleStateChange();
    });

    if (!registration.active) {
      const readyRegistration = await navigator.serviceWorker.ready;
      if (readyRegistration.active) {
        return readyRegistration;
      }
    }

    if (!registration.active) {
      throw new Error(
        "O Service Worker de notificações foi registrado, mas não ficou ativo.",
      );
    }

    return registration;
  }

  private async getRegistration(): Promise<ServiceWorkerRegistration> {
    try {
      const existingRegistration =
        await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
      const registration =
        existingRegistration ??
        (await navigator.serviceWorker.register(SERVICE_WORKER_URL));

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      const activatedRegistration =
        await this.waitForWorkerActivation(registration);
      const readyRegistration = await navigator.serviceWorker.ready;

      return readyRegistration.active
        ? readyRegistration
        : activatedRegistration;
    } catch (error) {
      throw new Error(
        `Falha ao registrar o Service Worker de notificações: ${extractErrorMessage(
          error,
        )}`,
      );
    }
  }

  async ensureRegisteredWithServer(): Promise<PushSyncResult> {
    if (!this.isSupported()) {
      return "unsupported";
    }

    if (Notification.permission !== "granted") {
      return "permission-denied";
    }

    let config;
    try {
      config = await apiService.getWebPushConfig();
    } catch (error) {
      throw new Error(
        `Falha ao carregar a configuração Web Push do servidor: ${extractErrorMessage(
          error,
        )}`,
      );
    }

    if (!config.success || !config.data?.enabled || !config.data.publicKey) {
      return "server-disabled";
    }

    const registration = await this.getRegistration();
    let subscription: PushSubscription | null;

    try {
      subscription = await registration.pushManager.getSubscription();
    } catch (error) {
      throw new Error(
        `Falha ao consultar a subscription atual do navegador: ${extractErrorMessage(
          error,
        )}`,
      );
    }

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            config.data.publicKey,
          ) as BufferSource,
        });
      } catch (error) {
        throw new Error(
          `Falha ao criar a subscription Web Push neste navegador: ${extractErrorMessage(
            error,
          )}`,
        );
      }
    }

    try {
      await apiService.savePushSubscription(
        subscriptionToPayload(subscription),
      );
    } catch (error) {
      throw new Error(
        `Falha ao registrar a subscription no servidor: ${extractErrorMessage(
          error,
        )}`,
      );
    }

    return "subscribed";
  }

  async detachCurrentSubscription(
    options: { removeFromBrowser?: boolean } = {},
  ): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    const removeFromBrowser = options.removeFromBrowser !== false;
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (!subscription) {
      return;
    }

    try {
      await apiService.deletePushSubscription(subscription.endpoint);
    } catch {
      // Silent: logout and preference toggles should not fail because of cleanup.
    }

    if (removeFromBrowser) {
      try {
        await subscription.unsubscribe();
      } catch {
        // Silent
      }
    }
  }
}

export const pushSubscriptionService = new PushSubscriptionService();
