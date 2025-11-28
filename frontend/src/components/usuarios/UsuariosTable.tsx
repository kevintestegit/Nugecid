import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Edit,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  Shield,
  User,
  Crown,
  Eye,
  UserPlus
} from 'lucide-react'
import { User as UserType, PaginationMeta } from '@/types'
import { useReactivateUser } from '@/hooks/useUsers'
import UserDetailModal from './UserDetailModal'
import EditUserModal from './EditUserModal'
import { NoResultsFound } from '@/components/ui/EmptyState'
import { TableLoading } from '@/components/ui/Loading'
import { SkeletonTable } from '@/components/ui/Skeleton'

interface UsuariosTableProps {
  users: UserType[]
  meta?: PaginationMeta
  isLoading: boolean
  canManageUsers: boolean
  onPageChange: (page: number) => void
  onDeleteUser: (userId: number) => void
  onRefresh?: () => void
}

const UsuariosTable: React.FC<UsuariosTableProps> = ({
  users,
  meta,
  isLoading,
  canManageUsers,
  onPageChange,
  onDeleteUser,
  onRefresh
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const reactivateUserMutation = useReactivateUser()

  const handleReactivateUser = async (userId: number) => {
    try {
      await reactivateUserMutation.mutateAsync(userId)
    } catch (error) {
      console.error('Erro ao reativar usuário:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'coordenador':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'coordenador':
        return 'Coordenador'
      default:
        return 'Usuário'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800'
      case 'coordenador':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <SkeletonTable rows={10} columns={5} />
  }

  if (!users.length) {
    return (
      <div className="p-8">
        <NoResultsFound
          description="Não há usuários que correspondam aos filtros aplicados."
          secondaryAction={{
            label: 'Limpar filtros',
            onClick: () => window.location.reload()
          }}
          variant="compact"
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Papel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </th>
              {canManageUsers && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.usuario}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role.name)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role.name)}`}>
                      {getRoleLabel(user.role.name)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.ativo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                {canManageUsers && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.ativo ? (
                        <>
                          <button
                            onClick={() => setSelectedUserId(user.id)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditUserId(user.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Desativar usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleReactivateUser(user.id)}
                          disabled={reactivateUserMutation.isPending}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                          title="Reativar usuário"
                        >
                          {reactivateUserMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {meta && meta.totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(meta.page - 1)}
                disabled={!meta.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => onPageChange(meta.page + 1)}
                disabled={!meta.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {((meta.page - 1) * meta.limit) + 1}
                  </span>{' '}
                  até{' '}
                  <span className="font-medium">
                    {Math.min(meta.page * meta.limit, meta.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{meta.total}</span>{' '}
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(meta.page - 1)}
                    disabled={!meta.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Números das páginas */}
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(meta.totalPages - 4, meta.page - 2)) + i
                    if (pageNum > meta.totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === meta.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => onPageChange(meta.page + 1)}
                    disabled={!meta.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Modal de Edição */}
      {editUserId && (
        <EditUserModal
          userId={editUserId}
          onClose={() => setEditUserId(null)}
          onSuccess={() => {
             setEditUserId(null)
             onRefresh?.()
           }}
        />
      )}
    </div>
  )
}

export default UsuariosTable