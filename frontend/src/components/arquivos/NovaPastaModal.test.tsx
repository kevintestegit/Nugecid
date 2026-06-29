import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NovaPastaModal } from "@/components/arquivos/NovaPastaModal";

const useThemeMock = vi.fn();

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => useThemeMock(),
}));

describe("NovaPastaModal", () => {
  beforeEach(() => {
    useThemeMock.mockReturnValue({ theme: "light" });
  });

  it("renderiza o conteúdo quando aberto", () => {
    render(
      <NovaPastaModal
        isOpen
        onClose={vi.fn()}
        onAddPasta={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Nova Pasta/Prateleira")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar Pasta" })).toBeInTheDocument();
  });
});
