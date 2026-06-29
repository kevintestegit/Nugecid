import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            foto: "IMG_8199",
            arquivo: "IMG_8199.jpg",
            sala: "Sala do IML",
            caixas: ["15"],
            controles: ["100.015"],
            periodos: ["2021 A 2023"],
            classificacao: "Pericia psicologica",
            tipoDocumento: "Laudos periciais",
            confiancaMedia: 0.836,
            textoResumo:
              "Instituto de Medicina Legal | Classificacao | Pericia psicologica | Tipo de documento | Laudos periciais",
          },
        ],
      }),
    );
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

  it("exibe a galeria Ribeira separada por sala", async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(screen.getByRole("button", { name: /Fotos Ribeira/i }));

    expect(
      screen.getByRole("heading", { name: "Sala Instituto de Identificação" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sala do IML" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Fotos a classificar" }),
    ).toBeInTheDocument();
    expect(screen.getByAltText(/IMG_8199 - Sala do IML/i)).toBeInTheDocument();
  });

  it("exibe a tabela de etiquetas extraidas pelo OCR na aba Fotos Ribeira", async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(screen.getByRole("button", { name: /Fotos Ribeira/i }));

    expect(
      await screen.findByRole("heading", { name: /Etiquetas OCR/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Foto" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Caixas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Controles" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "IMG_8199" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "100.015" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Baixar planilha CSV/i }),
    ).toHaveAttribute(
      "href",
      "/assets/arquivo-ribeira/arquivo-ribeira-etiquetas.csv",
    );
  });

  it("abre fotos Ribeira em modal e permite navegar entre imagens", async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(screen.getByRole("button", { name: /Fotos Ribeira/i }));
    await user.click(screen.getByRole("button", { name: /Abrir IMG_8199/i }));

    expect(
      screen.getByRole("dialog", { name: /Visualização IMG_8199/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 de 13 - Sala do IML")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Próxima foto/i }));

    expect(
      screen.getByRole("dialog", { name: /Visualização IMG_8201/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 de 13 - Sala do IML")).toBeInTheDocument();
  });
});
