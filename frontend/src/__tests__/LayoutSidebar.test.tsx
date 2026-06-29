import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Layout from "@/components/layout/Layout";

const authState = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: authState.useAuthMock,
}));

vi.mock("@/components/layout/GlobalSearch", () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

vi.mock("@/components/ui/NotificationBell", () => ({
  default: () => <div data-testid="notification-bell" />,
}));

vi.mock("@/hooks/useNotificacoes", () => ({
  useNotificacoes: vi.fn(),
}));

vi.mock("@/hooks/useRealtimeSync", () => ({
  useRealtimeSync: vi.fn(),
}));

vi.mock("@/hooks/useDomainSyncSSE", () => ({
  useDomainSyncSSE: vi.fn(),
}));

vi.mock("@/hooks/useDailySummary", () => ({
  useDailySummary: () => ({
    isOpen: false,
    isLoading: false,
    grupos: [],
    totalGeral: 0,
    dismiss: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock("@/routes/lazyPages", () => ({
  preloadByPath: {},
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

const renderLayout = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Conteudo inicial</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Layout desktop sidebar", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authState.logoutMock.mockResolvedValue(undefined);
    authState.useAuthMock.mockReturnValue({
      logout: authState.logoutMock,
      user: {
        avatarUrl: null,
        nome: "Admin Teste",
        role: {
          name: "admin",
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renderiza a logo aberta com largura maior mantendo a altura", () => {
    const { container } = renderLayout();

    const expandedLogo = container.querySelector('[class*="w-[200px]"]');

    expect(expandedLogo).toBeInTheDocument();
    expect(expandedLogo).toHaveClass("h-12");
    expect(expandedLogo).toHaveClass("justify-center");
  });

  it("posiciona o botao de recolher sem deslocar a logo aberta", () => {
    const { container } = renderLayout();

    const collapseButton = screen.getByRole("button", {
      name: "Recolher barra lateral",
    });

    const expandedLogoLink = container.querySelector(
      '[data-testid="desktop-sidebar-logo-link"]',
    );

    expect(expandedLogoLink).toHaveClass("justify-center");
    expect(collapseButton).toHaveClass("absolute");
    expect(collapseButton).toHaveClass("right-3");
    expect(collapseButton).toHaveClass("cursor-w-resize");
  });

  it("mostra logo compacta e cursor somente no botao ao recolher", () => {
    const { container } = renderLayout();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recolher barra lateral",
      }),
    );

    const sidebarPanel = document.getElementById("desktop-sidebar-panel");
    const compactLogo = container.querySelector('svg[viewBox="0 0 35 50"]');

    expect(sidebarPanel).not.toHaveClass("cursor-e-resize");
    expect(compactLogo).toBeInTheDocument();

    const expandButton = screen.getByRole("button", {
      name: "Abrir barra lateral",
    });

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton).toHaveClass("cursor-e-resize");
  });

  it("renderiza labels da navegacao sem aspecto esticado", () => {
    renderLayout();

    const desktopNav = screen.getByRole("navigation", {
      name: "Navegação principal desktop",
    });
    const dashboardLink = within(desktopNav).getByRole("link", {
      name: "Dashboard",
    });

    expect(dashboardLink).not.toHaveClass("uppercase");
    expect(dashboardLink).not.toHaveClass("tracking-[0.08em]");
    expect(dashboardLink).toHaveClass("tracking-normal");
  });
});
