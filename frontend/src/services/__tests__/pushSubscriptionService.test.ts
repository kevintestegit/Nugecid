import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWebPushConfig: vi.fn(),
  savePushSubscription: vi.fn(),
  deletePushSubscription: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  apiService: {
    getWebPushConfig: mocks.getWebPushConfig,
    savePushSubscription: mocks.savePushSubscription,
    deletePushSubscription: mocks.deletePushSubscription,
  },
}));

import { pushSubscriptionService } from "../pushSubscriptionService";

type MockServiceWorkerState =
  | "installing"
  | "installed"
  | "activating"
  | "activated"
  | "redundant";

const createWorker = (initialState: MockServiceWorkerState = "activated") => {
  const listeners = new Set<() => void>();
  const worker = {
    state: initialState,
    addEventListener: vi.fn((event: string, listener: () => void) => {
      if (event === "statechange") {
        listeners.add(listener);
      }
    }),
    removeEventListener: vi.fn((event: string, listener: () => void) => {
      if (event === "statechange") {
        listeners.delete(listener);
      }
    }),
    postMessage: vi.fn(),
  };

  return {
    worker,
    activate() {
      worker.state = "activated";
      listeners.forEach((listener) => listener());
    },
  };
};

describe("pushSubscriptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return server-disabled when VAPID config is missing", async () => {
    vi.stubGlobal("Notification", {
      permission: "granted",
    });
    vi.stubGlobal("PushManager", class {});
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        register: vi.fn(),
        ready: Promise.resolve({
          active: {},
        }),
      },
    });

    mocks.getWebPushConfig.mockResolvedValue({
      success: true,
      data: {
        enabled: false,
      },
    });

    await expect(
      pushSubscriptionService.ensureRegisteredWithServer(),
    ).resolves.toBe("server-disabled");
  });

  it("should save an existing subscription on the backend", async () => {
    const existingSubscription = {
      endpoint: "https://push.example/subscription/1",
      toJSON: () => ({
        endpoint: "https://push.example/subscription/1",
        expirationTime: null,
        keys: {
          auth: "auth",
          p256dh: "p256dh",
        },
      }),
      unsubscribe: vi.fn(),
    };

    vi.stubGlobal("Notification", {
      permission: "granted",
    });
    vi.stubGlobal("PushManager", class {});
    const activeWorker = createWorker();
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue({
          active: activeWorker.worker,
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(existingSubscription),
          },
        }),
        ready: Promise.resolve({
          active: activeWorker.worker,
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(existingSubscription),
          },
        }),
      },
    });

    mocks.getWebPushConfig.mockResolvedValue({
      success: true,
      data: {
        enabled: true,
        publicKey: "BEl6Y2xlbmUtdmFwaWQta2V5",
      },
    });
    mocks.savePushSubscription.mockResolvedValue({
      success: true,
    });

    await expect(
      pushSubscriptionService.ensureRegisteredWithServer(),
    ).resolves.toBe("subscribed");

    expect(mocks.savePushSubscription).toHaveBeenCalledWith({
      endpoint: "https://push.example/subscription/1",
      expirationTime: null,
      keys: {
        auth: "auth",
        p256dh: "p256dh",
      },
    });
  });

  it("should wait for the service worker to activate before subscribing", async () => {
    const subscription = {
      endpoint: "https://push.example/subscription/2",
      toJSON: () => ({
        endpoint: "https://push.example/subscription/2",
        expirationTime: null,
        keys: {
          auth: "auth-2",
          p256dh: "p256dh-2",
        },
      }),
      unsubscribe: vi.fn(),
    };

    const workerHandle = createWorker("installing");
    const subscribe = vi.fn().mockResolvedValue(subscription);
    const getSubscription = vi.fn().mockResolvedValue(null);
    const registration: {
      active: null | typeof workerHandle.worker;
      waiting: null | typeof workerHandle.worker;
      installing: typeof workerHandle.worker;
      pushManager: {
        getSubscription: typeof getSubscription;
        subscribe: typeof subscribe;
      };
    } = {
      active: null,
      waiting: null,
      installing: workerHandle.worker,
      pushManager: {
        getSubscription,
        subscribe,
      },
    };

    vi.stubGlobal("Notification", {
      permission: "granted",
    });
    vi.stubGlobal("PushManager", class {});

    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(registration),
        ready: new Promise((resolve) => {
          setTimeout(() => {
            registration.active = workerHandle.worker;
            workerHandle.activate();
            resolve(registration);
          }, 0);
        }),
      },
    });

    mocks.getWebPushConfig.mockResolvedValue({
      success: true,
      data: {
        enabled: true,
        publicKey: "BEl6Y2xlbmUtdmFwaWQta2V5",
      },
    });
    mocks.savePushSubscription.mockResolvedValue({ success: true });

    await expect(
      pushSubscriptionService.ensureRegisteredWithServer(),
    ).resolves.toBe("subscribed");

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(mocks.savePushSubscription).toHaveBeenCalledWith({
      endpoint: "https://push.example/subscription/2",
      expirationTime: null,
      keys: {
        auth: "auth-2",
        p256dh: "p256dh-2",
      },
    });
  });
});
