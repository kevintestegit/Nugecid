import { render, screen, fireEvent } from "@testing-library/react";
import { SecuritySettings } from "../SecuritySettings";
import { vi } from "vitest";

vi.mock("@/services/backupService", () => ({
  __esModule: true,
  default: {
    getSystemSettings: vi.fn().mockResolvedValue({
      data: {
        sessionTimeout: 30,
        twoFactorAuth: false,
        passwordExpiry: 90,
        maxLoginAttempts: 5,
        requireStrongPassword: true,
      },
    }),
    updateSystemSettings: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/services/api", () => ({
  apiService: {
    listBlockedUsers: vi.fn().mockResolvedValue({ success: true, data: [] }),
    unblockUser: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("@/components/Security/IpMonitoring", () => ({
  IpMonitoring: () => <div>IpMonitoringMock</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("SecuritySettings", () => {
  it("should render session and authentication cards", async () => {
    render(<SecuritySettings />);

    expect(await screen.findByText("Sessão")).toBeInTheDocument();
    expect(screen.getByText("Autenticação")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Tempo limite da sessão (minutos)"),
    ).toBeInTheDocument();
  });

  it("should change session timeout when input is changed", async () => {
    render(<SecuritySettings />);

    const input = await screen.findByLabelText(
      "Tempo limite da sessão (minutos)",
    );
    fireEvent.change(input, { target: { value: "60" } });

    expect((input as HTMLInputElement).value).toBe("60");
  });
});
