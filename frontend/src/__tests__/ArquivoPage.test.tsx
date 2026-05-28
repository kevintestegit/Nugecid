import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ArquivoPage from "@/pages/ArquivoPage";
import type { Pasta } from "@/hooks/usePastas";

const usePastasMock = vi.fn();
const usePlanilhasControleMock = vi.fn();

const makePasta = (overrides: Partial<Pasta> = {}): Pasta => ({
  id: "pasta-1",
  nome: "Prateleira A",
  descricao: "Documentos físicos",
  imagens: 0,
  planilhas: 0,
  dataCriacao: "2026-05-20T10:00:00.000Z",
  tags: [],
  arquivos: [],
  ...overrides,
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    checkPermission: () => true,
  }),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: false,
  }),
}));

vi.mock("@/hooks/usePastas", () => ({
  usePastas: (...args: unknown[]) => usePastasMock(...args),
}));

vi.mock("@/hooks/usePlanilhasControle", () => ({
  usePlanilhasControle: (...args: unknown[]) =>
    usePlanilhasControleMock(...args),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ArquivoPage />
    </MemoryRouter>,
  );

describe("ArquivoPage", () => {
  beforeEach(() => {
    usePastasMock.mockReset();
    usePlanilhasControleMock.mockReset();
    usePastasMock.mockReturnValue({
      pastas: [],
      isLoading: false,
      error: null,
      createPasta: vi.fn(),
      deletePasta: vi.fn(),
      updatePasta: vi.fn(),
      isUpdatingPasta: false,
    });
    usePlanilhasControleMock.mockReturnValue({
      planilhas: [],
      isLoading: false,
      uploadPlanilha: vi.fn(),
      isUploadingPlanilha: false,
      deletePlanilha: vi.fn(),
      isDeletingPlanilha: false,
      planilhaGeral: {
        totalPastas: 0,
        totalPlanilhas: 0,
        totalItens: 0,
        colunas: [],
        linhas: [],
        grupos: [],
      },
      isLoadingPlanilhaGeral: false,
      planilhaGeralError: null,
      refetchPlanilhaGeral: vi.fn(),
    });
  });

  it("usa loading compartilhado ao carregar pastas", () => {
    usePastasMock.mockReturnValue({
      pastas: [],
      isLoading: true,
      error: null,
      createPasta: vi.fn(),
      deletePasta: vi.fn(),
      updatePasta: vi.fn(),
      isUpdatingPasta: false,
    });

    renderPage();

    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
  });

  it("usa estado de erro compartilhado quando pastas falham", () => {
    usePastasMock.mockReturnValue({
      pastas: [],
      isLoading: false,
      error: new Error("falha"),
      createPasta: vi.fn(),
      deletePasta: vi.fn(),
      updatePasta: vi.fn(),
      isUpdatingPasta: false,
    });

    renderPage();

    expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
    expect(
      screen.getByText("Não foi possível carregar as pastas do arquivo."),
    ).toBeInTheDocument();
  });

  it("usa estado vazio compartilhado quando não há pastas", () => {
    renderPage();

    expect(screen.getByText("Nenhuma pasta encontrada")).toBeInTheDocument();
    expect(
      screen.getByText("Crie uma pasta para organizar imagens e planilhas."),
    ).toBeInTheDocument();
  });

  it("mantém a listagem de pastas quando há dados", () => {
    usePastasMock.mockReturnValue({
      pastas: [makePasta()],
      isLoading: false,
      error: null,
      createPasta: vi.fn(),
      deletePasta: vi.fn(),
      updatePasta: vi.fn(),
      isUpdatingPasta: false,
    });

    renderPage();

    expect(screen.getByText("Prateleira A")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma pasta encontrada"),
    ).not.toBeInTheDocument();
  });
});
