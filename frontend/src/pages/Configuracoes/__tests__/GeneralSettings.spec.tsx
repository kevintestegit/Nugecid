import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GeneralSettings } from "../GeneralSettings";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  sendTestNotification: vi.fn(),
  getPermission: vi.fn(),
  requestPermission: vi.fn(),
  show: vi.fn(),
  ensureRegisteredWithServer: vi.fn(),
  detachCurrentSubscription: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  apiService: {
    getNotificationPreferences: mocks.getNotificationPreferences,
    updateNotificationPreferences: mocks.updateNotificationPreferences,
    sendTestNotification: mocks.sendTestNotification,
  },
}));

vi.mock("@/services/desktopNotificationsService", () => ({
  desktopNotificationsService: {
    getPermission: mocks.getPermission,
    requestPermission: mocks.requestPermission,
    show: mocks.show,
  },
}));

vi.mock("@/services/pushSubscriptionService", () => ({
  pushSubscriptionService: {
    ensureRegisteredWithServer: mocks.ensureRegisteredWithServer,
    detachCurrentSubscription: mocks.detachCurrentSubscription,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
    warning: vi.fn(),
  },
}));

const basePreferences = {
  id: 1,
  userId: 1,
  inAppEnabled: true,
  desktopEnabled: false,
  pushEnabled: false,
  soundEnabled: true,
  enabledTypes: {
    solicitacao_pendente: true,
  },
  createdAt: "2026-03-26T00:00:00.000Z",
  updatedAt: "2026-03-26T00:00:00.000Z",
};

describe("GeneralSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getNotificationPreferences.mockResolvedValue({
      success: true,
      data: basePreferences,
    });
    mocks.updateNotificationPreferences.mockResolvedValue({
      success: true,
      data: {
        ...basePreferences,
        desktopEnabled: true,
        pushEnabled: true,
      },
    });
    mocks.sendTestNotification.mockResolvedValue({
      success: true,
      data: { id: 99 },
    });
    mocks.getPermission.mockReturnValue("granted");
    mocks.requestPermission.mockResolvedValue("granted");
    mocks.show.mockReturnValue({ close: vi.fn() });
    mocks.ensureRegisteredWithServer.mockResolvedValue("subscribed");
    mocks.detachCurrentSubscription.mockResolvedValue(undefined);
  });

  it("should render appearance and notifications cards", async () => {
    render(
      <ThemeProvider>
        <GeneralSettings />
      </ThemeProvider>,
    );

    expect(await screen.findByText("Aparência")).toBeInTheDocument();
    expect(screen.getByText("Notificações")).toBeInTheDocument();
    expect(screen.getByText("Notificações in-app")).toBeInTheDocument();
    expect(
      screen.getByText("Notificações na área de trabalho"),
    ).toBeInTheDocument();
    expect(screen.getByText("Som")).toBeInTheDocument();
  });

  it("should save desktop notification preference", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <GeneralSettings />
      </ThemeProvider>,
    );

    const desktopLabel = await screen.findByText(
      "Notificações na área de trabalho",
    );
    let desktopRow: HTMLElement | null = desktopLabel.parentElement;
    while (
      desktopRow &&
      within(desktopRow).queryAllByRole("switch").length === 0
    ) {
      desktopRow = desktopRow.parentElement;
    }

    if (!desktopRow) {
      throw new Error("Desktop notifications row not found");
    }

    const desktopSwitch = within(desktopRow).getByRole("switch");
    await act(async () => {
      await user.click(desktopSwitch);
    });

    const saveButton = await screen.findByRole("button", {
      name: /salvar alterações/i,
    });
    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => {
      expect(mocks.updateNotificationPreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          desktopEnabled: true,
          pushEnabled: false,
        }),
      );
      expect(mocks.toastSuccess).toHaveBeenCalled();
      expect(mocks.getNotificationPreferences).toHaveBeenCalledTimes(2);
      expect(mocks.ensureRegisteredWithServer).toHaveBeenCalledTimes(1);
    });
  });

  it("should run a local browser notification test", async () => {
    const user = userEvent.setup();
    mocks.getNotificationPreferences.mockResolvedValueOnce({
      success: true,
      data: {
        ...basePreferences,
        desktopEnabled: true,
        pushEnabled: false,
      },
    });

    render(
      <ThemeProvider>
        <GeneralSettings />
      </ThemeProvider>,
    );

    const testButton = await screen.findByRole("button", {
      name: /testar no navegador/i,
    });

    await act(async () => {
      await user.click(testButton);
    });

    await waitFor(() => {
      expect(mocks.show).toHaveBeenCalledTimes(1);
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "Notificação local exibida com sucesso",
      );
    });
  });

  it("should send a server-side test notification", async () => {
    const user = userEvent.setup();
    mocks.getNotificationPreferences.mockResolvedValueOnce({
      success: true,
      data: {
        ...basePreferences,
        desktopEnabled: true,
        pushEnabled: true,
      },
    });

    render(
      <ThemeProvider>
        <GeneralSettings />
      </ThemeProvider>,
    );

    const testButton = await screen.findByRole("button", {
      name: /testar pelo servidor/i,
    });

    await act(async () => {
      await user.click(testButton);
    });

    await waitFor(() => {
      expect(mocks.ensureRegisteredWithServer).toHaveBeenCalledTimes(1);
      expect(mocks.sendTestNotification).toHaveBeenCalledTimes(1);
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "Notificação de teste enviada. O alerta deve aparecer em instantes.",
      );
    });
  });
});
