import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import { PageLoading } from '@/components/ui/Loading'
import { UserRole } from '@/types'

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const DesarquivamentosPage = lazy(() => import('@/pages/DesarquivamentosPage'))
const NovoDesarquivamentoPage = lazy(() => import('@/pages/NovoDesarquivamentoPage'))
const DetalhesDesarquivamentoPage = lazy(() => import('@/pages/DetalhesDesarquivamentoPage'))
const EditDesarquivamentoPage = lazy(() => import('@/pages/EditDesarquivamentoPage'))
const UsuariosPage = lazy(() => import('@/pages/usuarios/UsuariosPage'))
const NovoUsuarioPage = lazy(() => import('@/pages/usuarios/NovoUsuarioPage'))
const EditarUsuarioPage = lazy(() => import('@/pages/usuarios/EditarUsuarioPage'))
const ConfiguracoesPage = lazy(() => import('@/pages/ConfiguracoesPage'))
const LixeiraPage = lazy(() => import('@/pages/LixeiraPage'))
const TarefasPage = lazy(() => import('@/pages/TarefasPage'))
const NovaTarefaPage = lazy(() => import('@/pages/tarefas/NovaTarefaPage'))
const DetalheTarefaPage = lazy(() => import('@/pages/tarefas/DetalheTarefaPage'))
const ArquivoPage = lazy(() => import('@/pages/ArquivoPage'))
const PrateleiraDetailPage = lazy(() => import('@/pages/PrateleiraDetailPage'))
const ProjetosPage = lazy(() => import('@/pages/ProjetosPage'))
const KanbanPage = lazy(() => import('@/pages/KanbanPage'))
const SearchIconTest = lazy(() => import('@/components/test/SearchIconTest'))
const CustodiaVestigiosPage = lazy(() => import('@/pages/CustodiaVestigiosPage'))
const BancoVestigiosPage = lazy(() => import('@/pages/BancoVestigiosPage'))
const RelatoriosPage = lazy(() => import('@/pages/RelatoriosPage').then(module => ({ default: module.RelatoriosPage })))

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
          {/* Rota de login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas protegidas com layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />
          
          {/* Desarquivamentos */}
          <Route path="desarquivamentos" element={<DesarquivamentosPage />} />
          <Route path="desarquivamentos/novo" element={<NovoDesarquivamentoPage />} />
          <Route path="desarquivamentos/:id" element={<DetalhesDesarquivamentoPage />} />
          <Route path="desarquivamentos/:id/editar" element={<EditDesarquivamentoPage />} />
          
          {/* Lixeira */}
          <Route path="desarquivamentos/lixeira" element={<LixeiraPage />} />
          <Route path="lixeira" element={<Navigate to="/desarquivamentos/lixeira" replace />} />
          
          {/* Tarefas */}
          <Route path="tarefas" element={<TarefasPage />} />
          <Route path="tarefas/nova" element={<NovaTarefaPage />} />
          <Route path="tarefas/:id" element={<DetalheTarefaPage />} />
          
          {/* Projetos Kanban */}
          <Route path="projetos" element={<ProjetosPage />} />
          <Route path="kanban/:id" element={<KanbanPage />} />
          
          {/* Custódia de Vestígios */}
          <Route path="custodia" element={<CustodiaVestigiosPage />} />
          <Route path="custodia/banco-vestigios" element={<BancoVestigiosPage />} />

          {/* Relatórios */}
          <Route path="relatorios" element={<RelatoriosPage />} />

          {/* Arquivo */}
          <Route path="arquivo" element={<ArquivoPage />} />
          <Route path="arquivo/:id" element={<PrateleiraDetailPage />} />
          
          {/* Usuários - apenas para coordenadores e admins */}
          <Route path="usuarios" element={
            <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
              <UsuariosPage />
            </ProtectedRoute>
          } />
          <Route path="usuarios/novo" element={
            <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
              <NovoUsuarioPage />
            </ProtectedRoute>
          } />
          <Route path="usuarios/:id/editar" element={
            <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
              <EditarUsuarioPage />
            </ProtectedRoute>
          } />
          
          {/* Configurações */}
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          
          {/* Teste de ícones - temporário */}
          <Route path="test-icons" element={<SearchIconTest />} />
        </Route>
        
          {/* Redirecionar rotas não encontradas para o dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
