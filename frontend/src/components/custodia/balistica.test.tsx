import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CustodiaBalistica from "@/components/custodia/balistica";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  dispatchAppNavigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    post: mocks.post,
  },
}));

vi.mock("@/lib/navigation/navigationEvents", () => ({
  dispatchAppNavigate: mocks.dispatchAppNavigate,
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

describe("CustodiaBalistica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockResolvedValue({ data: { id: "vestigio-1" } });
  });

  it("exibe o dropdown de tipo dos vestígios", () => {
    render(<CustodiaBalistica />);

    expect(screen.getByLabelText("Tipo dos vestígios")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /inserir para catalogação/i }),
    ).toBeInTheDocument();
  });

  it("envia status e dados de catalogacao ao salvar no banco", async () => {
    const user = userEvent.setup();

    render(<CustodiaBalistica />);

    // Seleciona instituto 100 (Criminalística)
    await user.click(screen.getByLabelText("Nível 1"));
    await user.click(screen.getAllByText("100 - Criminalística").at(-1)!);

    // Seleciona disciplina 101 (Biologia)
    await user.click(screen.getByLabelText("Nível 2"));
    await user.click(screen.getAllByText("101 - Biologia").at(-1)!);

    // Seleciona subdivisão 101.1 (Humana)
    await user.click(screen.getByLabelText("Nível 3"));
    await user.click(screen.getAllByText("101.1 - Humana").at(-1)!);

    // Seleciona subdivisão 101.11 (Vestígio Hematológico)
    await user.click(screen.getByLabelText("Nível 4"));
    await user.click(
      screen.getAllByText("101.11 - Vestígio Hematológico").at(-1)!,
    );

    await user.click(
      screen.getByRole("button", { name: /inserir para catalogação/i }),
    );

    await waitFor(() => {
      expect(mocks.post).toHaveBeenCalledWith(
        "/vestigios",
        expect.objectContaining({
          codigoScv: "101.11",
          status: "catalogacao_pendente",
          classeCatalogacao: "101",
          subclasseCatalogacao: "Biologia",
          tipoCatalogacao: "Vestígio Hematológico",
          schemaVersao: "ccvc-2026-07",
        }),
      );
      expect(mocks.dispatchAppNavigate).toHaveBeenCalledWith({
        to: "/custodia/catalogacao?vestigioId=vestigio-1",
      });
    });
  });
});
