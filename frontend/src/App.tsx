import React, { Suspense, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import { PageLoading, RouteLoading } from "@/components/ui/Loading";
import { UserRole } from "@/types";
import {
  APP_NAVIGATE_EVENT,
  AUTH_REQUIRED_EVENT,
} from "@/lib/navigation/navigationEvents";

import {
  dashboardPage,
  desarquivamentosPage,
  novoDesarquivamentoPage,
  detalhesDesarquivamentoPage,
  termoDesarquivamentoPreviewPage,
  editDesarquivamentoPage,
  usuariosPage,
  novoUsuarioPage,
  detalheUsuarioPage,
  editarUsuarioPage,
  configuracoesPage,
  sobrePage,
  lixeiraPage,
  tarefasPage,
  novaTarefaPage,
  detalheTarefaPage,
  arquivoPage,
  prateleiraDetailPage,
  projetosPage,
  projetoDetailPage,
  kanbanPage,
  custodiaVestigiosPage,
  bancoVestigiosPage,
  catalogacaoVestigiosPage,
  relatoriosPage,
  notificacoesPage,
  auditoriaPage,
  notFoundPage,
} from "@/routes/lazyPages";

const renderLazyRoute = (Component: React.ComponentType<object>) => (
  <Suspense fallback={<RouteLoading />}>
    <Component />
  </Suspense>
);

const AppNavigationEffects: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAppNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        to: string;
        replace?: boolean;
      }>;
      const target = customEvent.detail?.to;

      if (!target) {
        return;
      }

      navigate(target, { replace: customEvent.detail?.replace ?? false });
    };

    const handleAuthRequired = (event: Event) => {
      const customEvent = event as CustomEvent<{ redirectTo?: string }>;
      const target = customEvent.detail?.redirectTo ?? "/login";

      if (location.pathname === target) {
        return;
      }

      navigate(target, {
        replace: true,
        state: { from: location.pathname },
      });
    };

    window.addEventListener(APP_NAVIGATE_EVENT, handleAppNavigate);
    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      window.removeEventListener(APP_NAVIGATE_EVENT, handleAppNavigate);
      window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, [location.pathname, navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <>
      <AppNavigationEffects />
      <Routes>
        {/* Rota de login */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/404"
          element={
            <Suspense fallback={<PageLoading />}>
              <notFoundPage.Component />
            </Suspense>
          }
        />

        {/* Rotas protegidas com layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={renderLazyRoute(dashboardPage.Component)} />

          {/* Desarquivamentos */}
          <Route
            path="desarquivamentos"
            element={renderLazyRoute(desarquivamentosPage.Component)}
          />
          <Route
            path="desarquivamentos/novo"
            element={renderLazyRoute(novoDesarquivamentoPage.Component)}
          />
          <Route
            path="desarquivamentos/:id"
            element={renderLazyRoute(detalhesDesarquivamentoPage.Component)}
          />
          <Route
            path="desarquivamentos/:id/termo/visualizar"
            element={renderLazyRoute(termoDesarquivamentoPreviewPage.Component)}
          />
          <Route
            path="desarquivamentos/:id/editar"
            element={renderLazyRoute(editDesarquivamentoPage.Component)}
          />

          {/* Lixeira */}
          <Route
            path="desarquivamentos/lixeira"
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                {renderLazyRoute(lixeiraPage.Component)}
              </ProtectedRoute>
            }
          />
          <Route
            path="lixeira"
            element={<Navigate to="/desarquivamentos/lixeira" replace />}
          />

          {/* Tarefas */}
          <Route
            path="tarefas"
            element={renderLazyRoute(tarefasPage.Component)}
          />
          <Route
            path="tarefas/nova"
            element={renderLazyRoute(novaTarefaPage.Component)}
          />
          <Route
            path="tarefas/:id"
            element={renderLazyRoute(detalheTarefaPage.Component)}
          />

          {/* Projetos Kanban */}
          <Route
            path="projetos"
            element={renderLazyRoute(projetosPage.Component)}
          />
          <Route
            path="projetos/:id"
            element={renderLazyRoute(projetoDetailPage.Component)}
          />
          <Route
            path="kanban/:id"
            element={renderLazyRoute(kanbanPage.Component)}
          />

          {/* Custódia de Vestígios */}
          <Route
            path="custodia"
            element={renderLazyRoute(custodiaVestigiosPage.Component)}
          />
          <Route
            path="custodia/banco-vestigios"
            element={renderLazyRoute(bancoVestigiosPage.Component)}
          />
          <Route
            path="custodia/catalogacao"
            element={renderLazyRoute(catalogacaoVestigiosPage.Component)}
          />

          {/* Relatórios */}
          <Route
            path="relatorios"
            element={renderLazyRoute(relatoriosPage.Component)}
          />

          {/* Arquivo */}
          <Route
            path="arquivo"
            element={renderLazyRoute(arquivoPage.Component)}
          />
          <Route
            path="arquivo/:id"
            element={renderLazyRoute(prateleiraDetailPage.Component)}
          />

          {/* Usuários - apenas para coordenadores e admins */}
          <Route
            path="usuarios"
            element={
              <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
                {renderLazyRoute(usuariosPage.Component)}
              </ProtectedRoute>
            }
          />
          <Route
            path="usuarios/novo"
            element={
              <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
                {renderLazyRoute(novoUsuarioPage.Component)}
              </ProtectedRoute>
            }
          />
          <Route
            path="usuarios/:id"
            element={
              <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
                {renderLazyRoute(detalheUsuarioPage.Component)}
              </ProtectedRoute>
            }
          />
          <Route
            path="usuarios/:id/editar"
            element={
              <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
                {renderLazyRoute(editarUsuarioPage.Component)}
              </ProtectedRoute>
            }
          />

          {/* Configurações */}
          <Route
            path="configuracoes"
            element={renderLazyRoute(configuracoesPage.Component)}
          />
          <Route path="sobre" element={renderLazyRoute(sobrePage.Component)} />

          {/* Notificações */}
          <Route
            path="notificacoes"
            element={renderLazyRoute(notificacoesPage.Component)}
          />
          <Route
            path="auditoria"
            element={
              <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
                {renderLazyRoute(auditoriaPage.Component)}
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Página 404 para rotas não encontradas */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
};

export default App;
