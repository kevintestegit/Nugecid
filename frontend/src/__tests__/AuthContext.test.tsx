import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types";

const { apiServiceMock, pushSubscriptionServiceMock } = vi.hoisted(() => ({
  apiServiceMock: {
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
  pushSubscriptionServiceMock: {
    detachCurrentSubscription: vi.fn(),
  },
}));

vi.mock("@/services/api", () => ({
  apiService: apiServiceMock,
}));

vi.mock("@/services/pushSubscriptionService", () => ({
  pushSubscriptionService: pushSubscriptionServiceMock,
}));

const makeAxios401Error = () => ({
  isAxiosError: true,
  message: "Unauthorized",
  response: {
    status: 401,
  },
});

const testUser: User = {
  id: 1,
  nome: "Admin",
  usuario: "admin",
  ativo: true,
  createdAt: "2026-03-06T00:00:00.000Z",
  updatedAt: "2026-03-06T00:00:00.000Z",
  role: {
    id: 1,
    name: "admin",
    description: "Administrador",
    permissions: [],
  },
};

const AuthProbe = () => {
  const { user, isAuthenticated, login, logout, checkPermission } = useAuth();

  return (
    <div>
      <span data-testid="auth-state">
        {isAuthenticated ? `auth:${user?.usuario}` : "anon"}
      </span>
      <span data-testid="files-read-permission">
        {checkPermission("read", "arquivos") ? "allowed" : "denied"}
      </span>
      <button
        type="button"
        onClick={() => login({ usuario: "admin", senha: "123456" })}
      >
        login
      </button>
      <button type="button" onClick={() => logout()}>
        logout
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reidrata a sessão após 401 inicial usando refresh por cookie", async () => {
    apiServiceMock.getCurrentUser
      .mockRejectedValueOnce(makeAxios401Error())
      .mockResolvedValueOnce({
        success: true,
        data: testUser,
      });
    apiServiceMock.refreshToken.mockResolvedValue({
      success: true,
      data: {
        accessToken: "cookie-token",
        expiresIn: "50m",
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("auth:admin");
    });

    expect(apiServiceMock.getCurrentUser).toHaveBeenNthCalledWith(1, {
      skipAuthRedirect: true,
    });
    expect(apiServiceMock.refreshToken).toHaveBeenCalledTimes(1);
    expect(apiServiceMock.getCurrentUser).toHaveBeenNthCalledWith(2, {
      skipAuthRedirect: true,
    });
  });

  it("faz login e logout sem depender de refresh token em memória", async () => {
    apiServiceMock.getCurrentUser.mockRejectedValue(makeAxios401Error());
    apiServiceMock.refreshToken.mockRejectedValue(makeAxios401Error());
    apiServiceMock.login.mockResolvedValue({
      success: true,
      data: {
        user: testUser,
        accessToken: "cookie-token",
        expiresIn: "50m",
      },
    });
    apiServiceMock.logout.mockResolvedValue(undefined);
    pushSubscriptionServiceMock.detachCurrentSubscription.mockResolvedValue(
      undefined,
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("anon");
    });

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("auth:admin");
    });

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("anon");
    });

    expect(apiServiceMock.login).toHaveBeenCalledWith({
      usuario: "admin",
      senha: "123456",
    });
    expect(
      pushSubscriptionServiceMock.detachCurrentSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(apiServiceMock.logout).toHaveBeenCalledTimes(1);
  });

  it("não autentica apenas com usuário em cache quando a sessão não pode ser validada", async () => {
    localStorage.setItem("user", JSON.stringify(testUser));
    apiServiceMock.getCurrentUser.mockRejectedValue({
      isAxiosError: true,
      code: "ERR_NETWORK",
      message: "Network Error",
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("anon");
    });

    expect(localStorage.getItem("user")).toBeNull();
  });

  it("normaliza papel legado para regras de permissão do frontend", async () => {
    const legacyUser: User = {
      ...testUser,
      role: {
        ...testUser.role,
        name: "nugecid_operator",
      },
    };

    apiServiceMock.getCurrentUser.mockResolvedValue({
      success: true,
      data: legacyUser,
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("auth:admin");
    });

    expect(screen.getByTestId("files-read-permission")).toHaveTextContent(
      "allowed",
    );
  });
});
