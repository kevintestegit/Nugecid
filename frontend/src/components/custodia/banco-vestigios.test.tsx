import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BancoVestigios from "@/components/custodia/banco-vestigios";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    get: mocks.get,
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    confirm: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const catalogado = {
  id: "vest-1",
  codigoScv: "103.154",
  classePrincipal: "100",
  grupoCodigo: "103",
  subdivisaoCodigo: "103.154",
  facetas: [],
  facetasDescricoes: {},
  numeroVestigio: "4102",
  numeroCaso: "4305",
  categoria: "Toxicologia",
  delegacia: "3ª DP",
  mesReferencia: "2026-07",
  etiquetaCompleta: "103.154\nVG-4102-0726",
  status: "catalogado",
  observacoes: "",
  criadoPor: {
    id: "1",
    nome: "Operador",
    email: "operador@example.com",
  },
  createdAt: "2026-07-02T11:30:00.000Z",
  updatedAt: "2026-07-02T11:31:00.000Z",
};

describe("BancoVestigios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          data: [catalogado],
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      },
    });
  });

  it("lista vestígio catalogado vindo da resposta paginada", async () => {
    render(
      <MemoryRouter>
        <BancoVestigios />
      </MemoryRouter>,
    );

    expect(await screen.findByText("103.154")).toBeInTheDocument();
    expect(screen.getByText("4102")).toBeInTheDocument();
    expect(screen.getByText("catalogado")).toBeInTheDocument();
  });

  it("oferece o status Catalogado no filtro", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BancoVestigios />
      </MemoryRouter>,
    );

    await screen.findByText("103.154");
    await user.click(screen.getByLabelText("Status"));

    expect(
      screen.getByRole("option", { name: "Catalogado" }),
    ).toBeInTheDocument();
  });

  it("abre o registro indicado pelo redirecionamento", async () => {
    render(
      <MemoryRouter
        initialEntries={["/custodia/banco-vestigios?vestigioId=vest-1"]}
      >
        <BancoVestigios />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Detalhes do Vestígio" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("103.154").length).toBeGreaterThan(0);
  });
});
