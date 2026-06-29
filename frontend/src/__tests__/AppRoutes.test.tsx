import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import App from "@/App";

const authState = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: authState.useAuthMock,
}));

vi.mock("@/components/layout/Layout", async () => {
  const { Outlet } =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    default: () => <Outlet />,
  };
});

vi.mock("@/pages/LoginPage", () => ({
  default: () => <div>Login page</div>,
}));

vi.mock("@/routes/lazyPages", () => {
  const page = (name: string) => ({
    Component: () => <div>{name}</div>,
  });

  return {
    dashboardPage: page("Dashboard page"),
    desarquivamentosPage: page("Desarquivamentos page"),
    novoDesarquivamentoPage: page("Novo desarquivamento page"),
    detalhesDesarquivamentoPage: page("Detalhes desarquivamento page"),
    termoDesarquivamentoPreviewPage: page("Termo preview page"),
    editDesarquivamentoPage: page("Editar desarquivamento page"),
    usuariosPage: page("Usuarios page"),
    novoUsuarioPage: page("Novo usuario page"),
    detalheUsuarioPage: page("Detalhe usuario page"),
    editarUsuarioPage: page("Editar usuario page"),
    configuracoesPage: page("Configuracoes page"),
    sobrePage: page("Sobre page"),
    lixeiraPage: page("Lixeira page"),
    tarefasPage: page("Tarefas page"),
    novaTarefaPage: page("Nova tarefa page"),
    detalheTarefaPage: page("Detalhe tarefa page"),
    arquivoPage: page("Arquivo page"),
    prateleiraDetailPage: page("Prateleira page"),
    projetosPage: page("Projetos page"),
    projetoDetailPage: page("Projeto detail page"),
    kanbanPage: page("Kanban page"),
    searchIconTestPage: page("Search icon test page"),
    custodiaVestigiosPage: page("Custodia page"),
    bancoVestigiosPage: page("Banco vestigios page"),
    catalogacaoVestigiosPage: page("Catalogacao vestigios page"),
    relatoriosPage: page("Relatorios page"),
    notificacoesPage: page("Notificacoes page"),
    auditoriaPage: page("Auditoria page"),
    notFoundPage: page("Not found page"),
  };
});

describe("App routes", () => {
  it("bloqueia lixeira para usuário coordenador", async () => {
    authState.useAuthMock.mockReturnValue({
      user: {
        role: {
          name: "coordenador",
        },
      },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/desarquivamentos/lixeira"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Acesso Negado")).toBeInTheDocument();
    expect(screen.queryByText("Lixeira page")).not.toBeInTheDocument();
  });

  it("renderiza a rota de catalogação de vestígios", async () => {
    authState.useAuthMock.mockReturnValue({
      user: {
        role: {
          name: "admin",
        },
      },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/custodia/catalogacao"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Catalogacao vestigios page"),
    ).toBeInTheDocument();
  });
});
