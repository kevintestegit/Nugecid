import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import DesarquivamentosPage from '@/pages/DesarquivamentosPage'
import NovoDesarquivamentoPage from '@/pages/NovoDesarquivamentoPage'
import DetalhesDesarquivamentoPage from '@/pages/DetalhesDesarquivamentoPage'
import EditDesarquivamentoPage from '@/pages/EditDesarquivamentoPage'
import UsuariosPage from '@/pages/usuarios/UsuariosPage'
import NovoUsuarioPage from '@/pages/usuarios/NovoUsuarioPage'
import EditarUsuarioPage from '@/pages/usuarios/EditarUsuarioPage'
import ConfiguracoesPage from '@/pages/ConfiguracoesPage'
import LixeiraPage from '@/pages/LixeiraPage'
import TarefasPage from '@/pages/TarefasPage'
import NovaTarefaPage from '@/pages/tarefas/NovaTarefaPage'
import DetalheTarefaPage from '@/pages/tarefas/DetalheTarefaPage'
import ArquivoPage from '@/pages/ArquivoPage'
import PrateleiraDetailPage from '@/pages/PrateleiraDetailPage'
import ProjetosPage from '@/pages/ProjetosPage'
import KanbanPage from '@/pages/KanbanPage'
import SearchIconTest from '@/components/test/SearchIconTest'
import CustodiaVestigiosPage from '@/pages/CustodiaVestigiosPage'
import { RelatoriosPage } from '@/pages/RelatoriosPage'
import { UserRole } from '@/types'

const App: React.FC = () => {
  return (
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
  )
}

export default App
