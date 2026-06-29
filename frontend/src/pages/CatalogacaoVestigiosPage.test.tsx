import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CatalogacaoVestigiosPage from "@/pages/CatalogacaoVestigiosPage";
import { ThemeProvider } from "@/contexts/ThemeContext";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    get: mocks.get,
    patch: mocks.patch,
    delete: mocks.delete,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
    warning: mocks.toastWarning,
    info: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
  },
}));

const pendingVestigio = {
  id: "vest-1",
  codigoScv: "2.1.1",
  classePrincipal: "2",
  grupoCodigo: "2.1",
  subdivisaoCodigo: "2.1.1",
  facetas: [],
  facetasDescricoes: {},
  numeroVestigio: "123",
  numeroCaso: "456",
  categoria: "Papiloscópico - Geral",
  delegacia: "1a DP",
  mesReferencia: "2026-06",
  etiquetaCompleta: "2.1.1\nVG-123-0626",
  status: "catalogacao_pendente",
  observacoes: "",
  classeCatalogacao: "2",
  subclasseCatalogacao: "Papiloscopia",
  tipoCatalogacao: "Dactiloscopia",
  schemaVersao: "ccvc-2026-06",
  metadadosGerais: {},
  metadadosEspecificos: {},
  criadoPor: {
    id: "1",
    nome: "Operador",
    email: "operador@example.com",
  },
  createdAt: "2026-06-16T13:00:00.000Z",
  updatedAt: "2026-06-16T13:00:00.000Z",
};

const renderPage = (initialEntries = ["/custodia/catalogacao"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <CatalogacaoVestigiosPage />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe("CatalogacaoVestigiosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          data: [pendingVestigio],
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      },
    });
    mocks.patch.mockResolvedValue({
      data: { ...pendingVestigio, status: "catalogado" },
    });
    mocks.delete.mockResolvedValue({
      data: { success: true, data: { deletedCount: 1 } },
    });
  });

  it("renderiza a fila de vestigios pendentes de catalogacao", async () => {
    await act(async () => {
      renderPage();
    });

    expect(
      await screen.findByRole("heading", { name: /catalogação de vestígios/i }),
    ).toBeInTheDocument();
    // O label do schema agora eh "{classLabel} - Geral".
    expect(screen.getAllByText(/Papiloscópico/).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("VG-123-0626")).toBeInTheDocument();
  });

  it("salva os metadados e conclui a catalogacao do vestigio", async () => {
    const user = userEvent.setup();

    await act(async () => {
      renderPage();
    });

    await screen.findByDisplayValue("VG-123-0626");

    // "Perito Responsável" fica em identificacao (metadadosGerais); detalhes
    // técnicos ficam em tecnicas (metadadosEspecificos) no schema comum do
    // documento de classificação.
    await user.type(screen.getByLabelText("Perito Responsável"), " Perita Ana");
    await user.click(screen.getByText("Características Técnicas"));
    await user.type(
      screen.getByLabelText("Detalhes Técnicos da Classificação"),
      " Impressão latente",
    );
    await user.click(
      screen.getByRole("button", { name: /salvar catalogação/i }),
    );

    await waitFor(() => {
      expect(mocks.patch).toHaveBeenCalledWith(
        "/vestigios/vest-1",
        expect.objectContaining({
          status: "catalogado",
          metadadosGerais: expect.objectContaining({
            codigoVestigio: "VG-123-0626",
            peritoResponsavel: "Perita Ana",
          }),
          metadadosEspecificos: expect.objectContaining({
            detalhesTecnicosDaClassificacao: "Impressão latente",
          }),
        }),
      );
    });
  });

  it("seleciona o vestigio indicado na URL ao abrir a catalogacao", async () => {
    const outroVestigio = {
      ...pendingVestigio,
      id: "vest-2",
      etiquetaCompleta: "2.1.1\nVG-999-0626",
      createdAt: "2026-06-16T13:05:00.000Z",
      updatedAt: "2026-06-16T13:05:00.000Z",
    };

    mocks.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          data: [outroVestigio, pendingVestigio],
          total: 2,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      },
    });

    await act(async () => {
      renderPage(["/custodia/catalogacao?vestigioId=vest-1"]);
    });

    expect(await screen.findByDisplayValue("VG-123-0626")).toBeInTheDocument();
  });

  it("esvazia a fila pendente de catalogacao apos confirmacao", async () => {
    const user = userEvent.setup();

    await act(async () => {
      renderPage();
    });

    await screen.findByDisplayValue("VG-123-0626");

    await user.click(
      screen.getByRole("button", {
        name: /esvaziar banco de catalogação/i,
      }),
    );
    await user.type(screen.getByLabelText(/digite LIMPAR/i), "LIMPAR");
    await user.click(screen.getByRole("button", { name: /esvaziar fila/i }));

    await waitFor(() => {
      expect(mocks.delete).toHaveBeenCalledWith(
        "/vestigios/catalogacao/pendentes",
      );
      expect(screen.getByText(/nenhum vestígio pendente/i)).toBeInTheDocument();
    });
  });
});
