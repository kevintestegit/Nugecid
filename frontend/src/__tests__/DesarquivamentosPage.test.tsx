import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import DesarquivamentosPage from "@/pages/DesarquivamentosPage";
import {
  StatusDesarquivamento,
  TipoDesarquivamento,
  type Desarquivamento,
  type DesarquivamentoPrintCandidate,
} from "@/types";

const refetchMock = vi.fn();
const useDesarquivamentosMock = vi.fn();
const getDesarquivamentosMock = vi.fn();
const getPrintCandidatesMock = vi.fn();
const printHtmlDocumentMock = vi.fn();

const makeDesarquivamento = (
  overrides: Partial<Desarquivamento> = {},
): Desarquivamento => ({
  id: 1,
  numeroSolicitacao: 1001,
  tipoDesarquivamento: TipoDesarquivamento.FISICO,
  status: StatusDesarquivamento.SOLICITADO,
  nomeCompleto: "Maria da Silva",
  numeroNicLaudoAuto: "NIC-001",
  numeroProcesso: "0800001-10.2026.8.20.0001",
  tipoDocumento: "Laudo",
  dataSolicitacao: "2026-05-20T10:00:00.000Z",
  setorDemandante: "NUGECID",
  servidorResponsavel: "Servidor Teste",
  finalidadeDesarquivamento: "Consulta",
  solicitacaoProrrogacao: false,
  criadoPorId: 1,
  createdAt: "2026-05-20T10:00:00.000Z",
  updatedAt: "2026-05-20T10:00:00.000Z",
  ...overrides,
});

const makePrintCandidate = (
  overrides: Partial<DesarquivamentoPrintCandidate> = {},
): DesarquivamentoPrintCandidate => ({
  id: 1,
  numeroProcesso: "0800001-10.2026.8.20.0001",
  numeroNicLaudoAuto: "NIC-001",
  nomeCompleto: "Maria da Silva",
  tipoDocumento: "Laudo",
  status: StatusDesarquivamento.DESARQUIVADO,
  dataDesarquivamentoSAG: "2026-05-20T10:00:00.000Z",
  ...overrides,
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      nome: "Admin Teste",
      usuario: "admin",
      role: { name: "admin" },
    },
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

vi.mock("@/hooks/useDesarquivamentos", () => ({
  useDesarquivamentos: (...args: unknown[]) => useDesarquivamentosMock(...args),
  useDeleteDesarquivamento: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDesarquivamentosImport", () => ({
  useDesarquivamentosImport: () => ({
    isLoading: false,
  }),
}));

vi.mock("@/services/api", () => ({
  apiService: {
    updateDesarquivamento: vi.fn(),
    exportDesarquivamentos: vi.fn(),
    getDesarquivamentos: (...args: unknown[]) =>
      getDesarquivamentosMock(...args),
    getPrintCandidates: (...args: unknown[]) => getPrintCandidatesMock(...args),
  },
}));

vi.mock("@/components/desarquivamentos/print-utils", () => ({
  printHtmlDocument: (...args: unknown[]) => printHtmlDocumentMock(...args),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
      refetchQueries: vi.fn(),
      removeQueries: vi.fn(),
    }),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
    })),
  };
});

describe("DesarquivamentosPage", () => {
  beforeEach(() => {
    refetchMock.mockClear();
    useDesarquivamentosMock.mockReset();
    useDesarquivamentosMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error("backend down"),
      refetch: refetchMock,
    });
    getDesarquivamentosMock.mockReset();
    getPrintCandidatesMock.mockReset();
    printHtmlDocumentMock.mockReset();
  });

  it("mostra estado de erro quando a consulta falha e permite retry", () => {
    render(
      <MemoryRouter>
        <DesarquivamentosPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
    expect(
      screen.getByText("Não foi possível carregar as solicitações."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("ativa o filtro de atenção necessária a partir da URL", () => {
    useDesarquivamentosMock.mockReturnValue({
      data: {
        data: [],
        meta: {
          total: 19,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
    });

    render(
      <MemoryRouter
        initialEntries={[
          "/desarquivamentos?status=SOLICITADO&atencaoNecessaria=true",
        ]}
      >
        <DesarquivamentosPage />
      </MemoryRouter>,
    );

    expect(useDesarquivamentosMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: ["SOLICITADO"],
        atencaoNecessaria: true,
      }),
    );
    expect(
      screen.getByText(/filtro ativo: atenção necessária/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/19 solicitações encontradas/i),
    ).toBeInTheDocument();
  });

  it("oferece visualização em cards para viewports reduzidos sem remover ações", () => {
    useDesarquivamentosMock.mockReturnValue({
      data: {
        data: [makeDesarquivamento()],
        meta: {
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
    });

    render(
      <MemoryRouter>
        <DesarquivamentosPage />
      </MemoryRouter>,
    );

    const mobileList = screen.getByRole("list", {
      name: /solicitações em formato de cartões/i,
    });

    expect(mobileList).toHaveClass("lg:hidden");
    expect(
      within(mobileList).getByText("0800001-10.2026.8.20.0001"),
    ).toBeInTheDocument();
    expect(
      within(mobileList).getAllByRole("button", { name: /ver detalhes/i })
        .length,
    ).toBeGreaterThan(0);
  });

  it("abre o modal de impressão com foco inicial e fecha por escape retornando foco", async () => {
    const user = userEvent.setup();
    getPrintCandidatesMock.mockResolvedValue({
      data: [makePrintCandidate()],
      meta: {
        totalPages: 1,
      },
    });
    useDesarquivamentosMock.mockReturnValue({
      data: {
        data: [makeDesarquivamento()],
        meta: {
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
    });

    render(
      <MemoryRouter>
        <DesarquivamentosPage />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole("button", { name: /imprimir termos/i });
    await user.click(openButton);

    const dialog = await screen.findByRole("dialog", {
      name: /selecionar termos para impressão/i,
    });
    const searchInput = screen.getByLabelText(/buscar por nº de processo/i);

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(getPrintCandidatesMock).toHaveBeenCalledTimes(1);
    expect(getDesarquivamentosMock).not.toHaveBeenCalled();
    await waitFor(() => expect(searchInput).toHaveFocus());

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(openButton).toHaveFocus();
  });

  it("permite navegação por Tab dentro do modal de impressão", async () => {
    const user = userEvent.setup();
    getPrintCandidatesMock.mockResolvedValue({
      data: [makePrintCandidate()],
      meta: {
        totalPages: 1,
      },
    });
    useDesarquivamentosMock.mockReturnValue({
      data: {
        data: [makeDesarquivamento()],
        meta: {
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
    });

    render(
      <MemoryRouter>
        <DesarquivamentosPage />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole("button", { name: /imprimir termos/i });
    await user.click(openButton);

    await screen.findByRole("dialog", {
      name: /selecionar termos para impressão/i,
    });

    const searchInput = screen.getByLabelText(/buscar por nº de processo/i);
    expect(searchInput).toHaveFocus();

    // Tab para avançar para próximo elemento focável
    await user.tab();
    const marcarVisivelButton = screen.getByRole("button", {
      name: /marcar visíveis/i,
    });
    expect(marcarVisivelButton).toHaveFocus();

    // Tab novamente para próximo
    await user.tab();
    const limparButton = screen.getByRole("button", {
      name: /limpar seleção/i,
    });
    expect(limparButton).toHaveFocus();
  });

  it("permite impressão com item selecionado no modal", async () => {
    const user = userEvent.setup();
    const candidate = makePrintCandidate({
      id: 42,
      numeroProcesso: "0800001-10.2026.8.20.0001",
    });

    getPrintCandidatesMock.mockResolvedValue({
      data: [candidate],
      meta: {
        totalPages: 1,
      },
    });
    useDesarquivamentosMock.mockReturnValue({
      data: {
        data: [candidate],
        meta: {
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
    });

    render(
      <MemoryRouter>
        <DesarquivamentosPage />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole("button", { name: /imprimir termos/i });
    await user.click(openButton);

    await screen.findByRole("dialog", {
      name: /selecionar termos para impressão/i,
    });

    // Encontrar e clicar no checkbox para o candidato
    const checkbox = screen.getByRole("checkbox", {
      checked: false,
    });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // Clicar em "Imprimir selecionados"
    const printButton = screen.getByRole("button", {
      name: /imprimir selecionados/i,
    });
    await user.click(printButton);

    // Verificar que printHtmlDocument foi chamado
    expect(printHtmlDocumentMock).toHaveBeenCalled();
  });
});
