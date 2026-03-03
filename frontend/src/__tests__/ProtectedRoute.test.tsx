import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/types";

const authState = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: authState.useAuthMock,
}));

describe("ProtectedRoute", () => {
  it("redireciona usuário não autenticado para /login", () => {
    authState.useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={["/restrita"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/restrita"
            element={
              <ProtectedRoute>
                <div>Área protegida</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Área protegida")).not.toBeInTheDocument();
  });

  it("bloqueia acesso quando a role não atende ao requiredRole", () => {
    authState.useAuthMock.mockReturnValue({
      user: {
        role: {
          name: "usuario",
        },
      },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/usuarios"]}>
        <Routes>
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
                <div>Gestão de usuários</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Acesso Negado")).toBeInTheDocument();
    expect(
      screen.getByText("Você não tem permissão para acessar esta página."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Gestão de usuários")).not.toBeInTheDocument();
  });

  it("permite acesso quando usuário autenticado possui permissão", () => {
    authState.useAuthMock.mockReturnValue({
      user: {
        role: {
          name: "admin",
        },
      },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/usuarios"]}>
        <Routes>
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
                <div>Gestão de usuários</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Gestão de usuários")).toBeInTheDocument();
  });
});
