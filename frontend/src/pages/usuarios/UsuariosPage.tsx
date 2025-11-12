import React, { useState } from 'react'
import { Users, Plus } from 'lucide-react'
import { useUsers, useUserPermissions } from '@/hooks/useUsers'
import { UsersQueryParams } from '@/types'
import UsuarioFilters from '@/components/usuarios/UsuarioFilters'
import UsuariosTable from '@/components/usuarios/UsuariosTable'
import DeleteUserModal from '@/components/usuarios/DeleteUserModal'
import CreateUserModal from '@/components/usuarios/CreateUserModal'

const UsuariosPage: React.FC = () => {
  const [queryParams, setQueryParams] = useState<UsersQueryParams>({
    page: 1,
    limit: 10,
    active: true
  })
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const { canManageUsers, canViewUsers } = useUserPermissions()
  const { data: usersResponse, isLoading, error, refetch } = useUsers(queryParams)


  // Redirecionar se não tiver permissão
  if (!canViewUsers) {
    // DEBUG: Log detalhado
    console.error('❌ Acesso negado à página de usuários', {
      canViewUsers,
      canManageUsers,
      authUser: (window as any).__authUser,
      localStorage_user: localStorage.getItem('user'),
      localStorage_token: localStorage.getItem('accessToken') ? 'EXISTS' : 'NOT_FOUND'
    })
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="mt-4 text-xs text-gray-500">
            <p>Abra o Console (F12) para ver detalhes do erro</p>
          </div>
        </div>
      </div>
    )
  }

  const handleFilterChange = (newParams: Partial<UsersQueryParams>) => {
    setQueryParams(prev => ({
      ...prev,
      ...newParams,
      page: 1 // Reset para primeira página ao filtrar
    }))
  }

  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }))
  }

  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId)
  }

  const handleCloseDeleteModal = () => {
    setUserToDelete(null)
  }

  // Mostra tela de erro somente se houve erro E não há dados de usuários disponíveis.
  if (error && (!usersResponse || !usersResponse.data || usersResponse.data.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar usuários
          </h2>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro ao carregar a lista de usuários.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-gray-600">Gerencie usuários do sistema</p>
          </div>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <UsuarioFilters
          params={queryParams}
          onParamsChange={handleFilterChange}
          canManageUsers={canManageUsers}
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <UsuariosTable
          users={usersResponse?.data || []}
          meta={usersResponse?.meta}
          isLoading={isLoading}
          canManageUsers={canManageUsers}
          onPageChange={handlePageChange}
          onDeleteUser={handleDeleteUser}
          onRefresh={refetch}
        />
      </div>

      {/* Modal de confirmação de exclusão */}
      {userToDelete && (
        <DeleteUserModal
          userId={userToDelete}
          onClose={handleCloseDeleteModal}
          onSuccess={() => {
            refetch()
          }}
        />
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

export default UsuariosPage