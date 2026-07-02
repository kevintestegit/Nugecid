import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemSettings } from "../SystemSettings";

const { backupServiceMock, toastMock } = vi.hoisted(() => ({
  backupServiceMock: {
    getSystemSettings: vi.fn(),
    updateSystemSettings: vi.fn(),
    listBackups: vi.fn(),
    createFullBackup: vi.fn(),
    restoreBackup: vi.fn(),
  },
  toastMock: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/services/backupService", () => ({
  __esModule: true,
  default: backupServiceMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/components/ui/ProgressBar", () => ({
  LinearProgress: ({ label, value }: { label?: string; value: number }) => (
    <div data-testid="linear-progress">
      {label}:{value}
    </div>
  ),
  MultiStepProgress: ({
    steps,
  }: {
    steps: Array<{
      label: string;
      status: "pending" | "current" | "completed" | "error";
    }>;
  }) => (
    <div data-testid="restore-steps">
      {steps.map((step) => `${step.label}:${step.status}`).join("|")}
    </div>
  ),
}));

describe("SystemSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backupServiceMock.getSystemSettings.mockResolvedValue({
      autoBackup: true,
      backupFrequency: "daily",
      logLevel: "info",
      maintenanceMode: false,
      cacheEnabled: true,
    });
    backupServiceMock.updateSystemSettings.mockResolvedValue({});
    backupServiceMock.listBackups.mockResolvedValue({ backups: [] });
    backupServiceMock.createFullBackup.mockResolvedValue({
      success: true,
      filename: "backup.sql",
      size: "1MB",
    });
    backupServiceMock.restoreBackup.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render key sections", async () => {
    render(<SystemSettings />);

    expect(await screen.findByText("Backup e Recuperação")).toBeInTheDocument();
    expect(screen.getByText("Logs e Monitoramento")).toBeInTheDocument();
    expect(screen.getByText("Manutenção")).toBeInTheDocument();
  });

  it("should change backup frequency when select changes", async () => {
    render(<SystemSettings />);

    const select = await screen.findByLabelText("Frequência do backup");
    fireEvent.change(select, { target: { value: "weekly" } });

    expect((select as HTMLSelectElement).value).toBe("weekly");
  });

  it("limpa o intervalo de progresso quando a criação do backup falha", async () => {
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
    backupServiceMock.createFullBackup.mockRejectedValueOnce(
      new Error("timeout of 600000ms exceeded"),
    );

    render(<SystemSettings />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Fazer Backup Agora" }),
    );

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
    });

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "Fazer Backup Agora" }),
    ).toBeEnabled();
  });

  it("marca o passo atual como erro quando a restauração falha", async () => {
    backupServiceMock.listBackups.mockResolvedValueOnce({
      backups: [
        {
          filename: "backup_full_2026-03-24.tar.gz",
          size: "1MB",
          sizeBytes: 1024,
          created: "2026-03-24T10:00:00.000Z",
          modified: "2026-03-24T10:00:00.000Z",
          type: "full",
          includesFiles: true,
        },
      ],
    });
    backupServiceMock.restoreBackup.mockRejectedValueOnce(
      new Error("falha no restore"),
    );

    render(<SystemSettings />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Restaurar Backup" }),
    );

    fireEvent.click(await screen.findByText("backup_full_2026-03-24.tar.gz"));
    fireEvent.change(screen.getByLabelText(/Para confirmar, digite/i), {
      target: { value: "CONFIRMAR" },
    });

    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Restaurar Backup" }),
    );

    await waitFor(
      () => {
        expect(backupServiceMock.restoreBackup).toHaveBeenCalledWith(
          "backup_full_2026-03-24.tar.gz",
        );
        expect(screen.getByTestId("restore-steps")).toHaveTextContent(
          "Banco de Dados:error",
        );
      },
      { timeout: 2000 },
    );
  }, 10000);
});
