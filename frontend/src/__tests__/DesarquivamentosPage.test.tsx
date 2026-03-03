import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import DesarquivamentosPage from "@/pages/DesarquivamentosPage";

const refetchMock = vi.fn();
const useDesarquivamentosMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      role: { name: "admin" },
    },
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
      error: new Error("backend down"),
      refetch: refetchMock,
    });
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
});
