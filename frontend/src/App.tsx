import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import { PageLoading } from '@/components/ui/Loading'
import { UserRole } from '@/types'

import {
  dashboardPage,
  desarquivamentosPage,
  novoDesarquivamentoPage,
  detalhesDesarquivamentoPage,
  editDesarquivamentoPage,
  usuariosPage,
  novoUsuarioPage,
  editarUsuarioPage,
  configuracoesPage,
  lixeiraPage,
  tarefasPage,
  novaTarefaPage,
  detalheTarefaPage,
  arquivoPage,
  prateleiraDetailPage,
  projetosPage,
  kanbanPage,
  searchIconTestPage,
  custodiaVestigiosPage,
  bancoVestigiosPage,
  relatoriosPage,
} from '@/routes/lazyPages'

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
            <Route index element={<dashboardPage.Component />} />
          
          {/* Desarquivamentos */}
          <Route path="desarquivamentos" element={<desarquivamentosPage.Component />} />
          <Route path="desarquivamentos/novo" element={<novoDesarquivamentoPage.Component />} />
          <Route path="desarquivamentos/:id" element={<detalhesDesarquivamentoPage.Component />} />
          <Route path="desarquivamentos/:id/editar" element={<editDesarquivamentoPage.Component />} />
          
          {/* Lixeira */}
          <Route path="desarquivamentos/lixeira" element={<lixeiraPage.Component />} />
          <Route path="lixeira" element={<Navigate to="/desarquivamentos/lixeira" replace />} />
          
          {/* Tarefas */}
          <Route path="tarefas" element={<tarefasPage.Component />} />
          <Route path="tarefas/nova" element={<novaTarefaPage.Component />} />
          <Route path="tarefas/:id" element={<detalheTarefaPage.Component />} />
          
          {/* Projetos Kanban */}
          <Route path="projetos" element={<projetosPage.Component />} />
          <Route path="kanban/:id" element={<kanbanPage.Component />} />
          
          {/* Custódia de Vestígios */}
          <Route path="custodia" element={<custodiaVestigiosPage.Component />} />
          <Route path="custodia/banco-vestigios" element={<bancoVestigiosPage.Component />} />

          {/* Relatórios */}
          <Route path="relatorios" element={<relatoriosPage.Component />} />

          {/* Arquivo */}
          <Route path="arquivo" element={<arquivoPage.Component />} />
          <Route path="arquivo/:id" element={<prateleiraDetailPage.Component />} />
          
          {/* Usuários - apenas para coordenadores e admins */}
          <Route path="usuarios" element={
            <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
              <usuariosPage.Component />
            </ProtectedRoute>
          } />
          <Route path="usuarios/novo" element={
            <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
              <novoUsuarioPage.Component />
            </ProtectedRoute>
          } />
          <Route path="usuarios/:id/editar" element={
            <ProtectedRoute requiredRole={UserRole.COORDENADOR}>
              <editarUsuarioPage.Component />
            </ProtectedRoute>
          } />
          
          {/* Configurações */}
          <Route path="configuracoes" element={<configuracoesPage.Component />} />
          
          {/* Teste de ícones - temporário */}
          <Route path="test-icons" element={<searchIconTestPage.Component />} />
        </Route>
        
          {/* Redirecionar rotas não encontradas para o dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
