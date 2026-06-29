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

    await user.click(screen.getByLabelText("Nível 3"));
    await user.click(screen.getByText("101.11 - Sangue - Líquido"));

    await user.click(
      screen.getByRole("button", { name: /inserir para catalogação/i }),
    );

    await waitFor(() => {
      expect(mocks.post).toHaveBeenCalledWith(
        "/vestigios",
        expect.objectContaining({
          codigoScv: "101.11",
          status: "catalogacao_pendente",
          classeCatalogacao: "1",
          subclasseCatalogacao: "Fluidos Corporais",
          tipoCatalogacao: "Sangue - Líquido",
          schemaVersao: "ccvc-2026-06",
        }),
      );
      expect(mocks.dispatchAppNavigate).toHaveBeenCalledWith({
        to: "/custodia/catalogacao?vestigioId=vestigio-1",
      });
    });
  });
});
