import { render, screen } from "@testing-library/react";
import QuickActions from "@/components/dashboard/QuickActions";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { role: { name: "admin" } } }),
}));

describe("QuickActions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("esconde ações desabilitadas por feature flag", () => {
    vi.stubEnv("VITE_FEATURE_EXPORTAR", "false");
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/Exportar Dados/i)).not.toBeInTheDocument();
  });

  it("mostra ações quando feature flag está habilitada", () => {
    vi.stubEnv("VITE_FEATURE_EXPORTAR", "true");
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Exportar Dados/i)).toBeInTheDocument();
  });
});
