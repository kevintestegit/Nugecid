import React, { lazy } from "react";

type PageComponent = React.ComponentType<object>;

function createLazyPage<T extends PageComponent>(
  importer: () => Promise<{ default: T }>,
): {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<{ default: T }>;
} {
  return {
    Component: lazy(importer),
    preload: importer,
  };
}

export const dashboardPage = createLazyPage(
  () => import("@/pages/DashboardPage"),
);
export const desarquivamentosPage = createLazyPage(
  () => import("@/pages/DesarquivamentosPage"),
);
export const novoDesarquivamentoPage = createLazyPage(
  () => import("@/pages/NovoDesarquivamentoPage"),
);
export const detalhesDesarquivamentoPage = createLazyPage(
  () => import("@/pages/DetalhesDesarquivamentoPage"),
);
export const termoDesarquivamentoPreviewPage = createLazyPage(
  () => import("@/pages/TermoDesarquivamentoPreviewPage"),
);
export const editDesarquivamentoPage = createLazyPage(
  () => import("@/pages/EditDesarquivamentoPage"),
);
export const usuariosPage = createLazyPage(
  () => import("@/pages/usuarios/UsuariosPage"),
);
export const novoUsuarioPage = createLazyPage(
  () => import("@/pages/usuarios/NovoUsuarioPage"),
);
export const editarUsuarioPage = createLazyPage(
  () => import("@/pages/usuarios/EditarUsuarioPage"),
);
export const detalheUsuarioPage = createLazyPage(
  () => import("@/pages/usuarios/DetalheUsuarioPage"),
);
export const configuracoesPage = createLazyPage(
  () => import("@/pages/ConfiguracoesPage"),
);
export const sobrePage = createLazyPage(() => import("@/pages/SobrePage"));
export const lixeiraPage = createLazyPage(() => import("@/pages/LixeiraPage"));
export const tarefasPage = createLazyPage(() => import("@/pages/TarefasPage"));
export const novaTarefaPage = createLazyPage(
  () => import("@/pages/tarefas/NovaTarefaPage"),
);
export const detalheTarefaPage = createLazyPage(
  () => import("@/pages/tarefas/DetalheTarefaPage"),
);
export const arquivoPage = createLazyPage(() => import("@/pages/ArquivoPage"));
export const prateleiraDetailPage = createLazyPage(
  () => import("@/pages/PrateleiraDetailPage"),
);
export const projetosPage = createLazyPage(
  () => import("@/pages/ProjetosPage"),
);
export const projetoDetailPage = createLazyPage(
  () => import("@/pages/ProjetoDetailPage"),
);
export const kanbanPage = createLazyPage(() => import("@/pages/KanbanPage"));
export const searchIconTestPage = createLazyPage(
  () => import("@/components/test/SearchIconTest"),
);
export const notFoundPage = createLazyPage(
  () => import("@/pages/NotFoundPage"),
);

export const custodiaVestigiosPage = createLazyPage(
  () => import("@/pages/CustodiaVestigiosPage"),
);
export const bancoVestigiosPage = createLazyPage(
  () => import("@/pages/BancoVestigiosPage"),
);
export const relatoriosPage = createLazyPage(() =>
  import("@/pages/RelatoriosPage").then((module) => ({
    default: module.RelatoriosPage,
  })),
);
export const notificacoesPage = createLazyPage(
  () => import("@/pages/NotificacoesPage"),
);
export const auditoriaPage = createLazyPage(
  () => import("@/pages/AuditoriaPage"),
);

export const preloadByPath: Record<string, () => Promise<unknown>> = {
  "/": dashboardPage.preload,
  "/desarquivamentos": desarquivamentosPage.preload,
  "/desarquivamentos/novo": novoDesarquivamentoPage.preload,
  "/desarquivamentos/:id": detalhesDesarquivamentoPage.preload,
  "/desarquivamentos/:id/termo/visualizar":
    termoDesarquivamentoPreviewPage.preload,
  "/desarquivamentos/:id/editar": editDesarquivamentoPage.preload,
  "/desarquivamentos/lixeira": lixeiraPage.preload,
  "/tarefas": tarefasPage.preload,
  "/tarefas/nova": novaTarefaPage.preload,
  "/tarefas/:id": detalheTarefaPage.preload,
  "/projetos": projetosPage.preload,
  "/projetos/:id": projetoDetailPage.preload,
  "/kanban/:id": kanbanPage.preload,
  "/custodia": custodiaVestigiosPage.preload,
  "/custodia/banco-vestigios": bancoVestigiosPage.preload,
  "/relatorios": relatoriosPage.preload,
  "/arquivo": arquivoPage.preload,
  "/arquivo/:id": prateleiraDetailPage.preload,
  "/usuarios": usuariosPage.preload,
  "/usuarios/novo": novoUsuarioPage.preload,
  "/usuarios/:id": detalheUsuarioPage.preload,
  "/usuarios/:id/editar": editarUsuarioPage.preload,
  "/configuracoes": configuracoesPage.preload,
  "/sobre": sobrePage.preload,
  "/notificacoes": notificacoesPage.preload,
  "/auditoria": auditoriaPage.preload,
  "/test-icons": searchIconTestPage.preload,
  "*": notFoundPage.preload,
};
