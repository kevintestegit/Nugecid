import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import DetalhesDesarquivamentoPage from "@/pages/DetalhesDesarquivamentoPage";
import NotFoundPage from "@/pages/NotFoundPage";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock("@/hooks/useDesarquivamentos", () => ({
  useDesarquivamento: () => ({
    data: undefined,
    isLoading: false,
    error: undefined,
  }),
  useDownloadTermoPdf: () => ({ mutate: vi.fn(), isPending: false }),
  useDownloadTermoDocx: () => ({ mutate: vi.fn(), isPending: false }),
  useDesarquivamentoComments: () => ({
    data: undefined,
    isLoading: false,
  }),
  useAddDesarquivamentoComment: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDesarquivamentoHistorico", () => ({
  useDesarquivamentoHistorico: () => ({
    data: [],
  }),
}));

vi.mock("@/hooks/useDesarquivamentosAnexos", () => ({
  useDesarquivamentosAnexos: () => ({
    data: [],
    isLoading: false,
  }),
  useUploadDesarquivamentoAnexo: () => ({
    mutateAsync: vi.fn(),
  }),
  useDownloadDesarquivamentoAnexo: () => ({
    mutateAsync: vi.fn(),
  }),
  useDeleteDesarquivamentoAnexo: () => ({
    mutateAsync: vi.fn(),
  }),
  useViewDesarquivamentoAnexo: () => ({
    mutateAsync: vi.fn(),
  }),
  useUpdateDesarquivamentoAnexo: () => ({
    mutateAsync: vi.fn(),
  }),
}));

describe("DetalhesDesarquivamentoPage", () => {
  it("renderiza a página 404 quando o id da rota não é numérico", () => {
    render(
      <MemoryRouter initialEntries={["/desarquivamentos/algimas"]}>
        <Routes>
          <Route
            path="/desarquivamentos/:id"
            element={<DetalhesDesarquivamentoPage />}
          />
          <Route path="/404" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /página não.*encontrada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /voltar ao login/i }),
    ).toBeInTheDocument();
  });
});
