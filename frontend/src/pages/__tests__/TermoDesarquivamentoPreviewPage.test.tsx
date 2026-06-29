import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import TermoDesarquivamentoPreviewPage from "@/pages/TermoDesarquivamentoPreviewPage";

const mutatePdf = vi.fn();
const mutateDocx = vi.fn();

vi.mock("@/hooks/useDesarquivamentos", () => ({
  useTermoPreviewHtml: () => ({
    data: "<html><body><h1>Termo</h1></body></html>",
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useDownloadTermoPdf: () => ({
    mutate: mutatePdf,
    isPending: false,
  }),
  useDownloadTermoDocx: () => ({
    mutate: mutateDocx,
    isPending: false,
  }),
}));

describe("TermoDesarquivamentoPreviewPage", () => {
  it("renderiza a pré-visualização e habilita a impressão após carregar o iframe", async () => {
    act(() => {
      render(
        <MemoryRouter
          initialEntries={["/desarquivamentos/96/termo/visualizar"]}
        >
          <Routes>
            <Route
              path="/desarquivamentos/:id/termo/visualizar"
              element={<TermoDesarquivamentoPreviewPage />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(
      screen.getByRole("heading", { name: /pré-visualização do termo/i }),
    ).toBeInTheDocument();

    const iframe = screen.getByTitle(
      "Pré-visualização do termo de desarquivamento",
    );
    expect(iframe).toHaveAttribute(
      "srcdoc",
      "<html><body><h1>Termo</h1></body></html>",
    );
    expect(iframe).toHaveAttribute("sandbox", "allow-same-origin");

    const printButton = screen.getByRole("button", { name: /imprimir/i });
    expect(printButton).toBeDisabled();

    act(() => {
      fireEvent.load(iframe);
    });
    await waitFor(() => expect(printButton).not.toBeDisabled());
  });

  it("aciona o download de PDF e Word para o desarquivamento atual", async () => {
    act(() => {
      render(
        <MemoryRouter
          initialEntries={["/desarquivamentos/96/termo/visualizar"]}
        >
          <Routes>
            <Route
              path="/desarquivamentos/:id/termo/visualizar"
              element={<TermoDesarquivamentoPreviewPage />}
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /pré-visualização do termo/i }),
      ).toBeInTheDocument(),
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /baixar pdf/i }));
      fireEvent.click(screen.getByRole("button", { name: /baixar word/i }));
    });

    expect(mutatePdf).toHaveBeenCalledWith(96, expect.any(Object));
    expect(mutateDocx).toHaveBeenCalledWith(96, expect.any(Object));
  });
});
