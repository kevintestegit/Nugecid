import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "./LoginPage";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/assets/images/login-hero.webp", () => ({
  default: "login-hero.webp",
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

describe("LoginPage", () => {
  it("mantém o botão de mostrar senha na navegação por teclado", async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.tab();
    expect(screen.getByLabelText("Usuário")).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText("Senha")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toHaveFocus();
  });

  it("preserva o texto de acesso bloqueado", () => {
    renderLogin();

    expect(
      screen.getByText("Em caso de acesso bloqueado, To nem ai"),
    ).toBeInTheDocument();
  });
});
