import React from 'react'
import { X, User, Shield, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { useUser } from '@/hooks/useUsers'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserDetailModalProps {
  userId: number
  onClose: () => void
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, onClose }) => {
  const { data: userResponse, isLoading } = useUser(userId)
  const user = userResponse?.data

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'coordenador':
        return 'Coordenador'
      case 'usuario':
        return 'Usuário'
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Usuário</h3>
              <p className="text-sm text-gray-500">Informações completas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Básicas
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">Nome:</span>
                    <span className="text-sm text-gray-900 text-right">{user.nome}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">Login:</span>
                    <span className="text-sm text-gray-900 text-right">{user.usuario}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">ID:</span>
                    <span className="text-sm text-gray-900 text-right">#{user.id}</span>
                  </div>
                </div>
              </div>

              {/* Perfil e Status */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Perfil e Status
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Perfil:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role.name === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role.name === 'coordenador'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getRoleLabel(user.role.name)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.ativo 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.ativo ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Inativo
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Histórico
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">Criado em:</span>
                    <span className="text-sm text-gray-900 text-right">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">Atualizado em:</span>
                    <span className="text-sm text-gray-900 text-right">
                      {formatDate(user.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Usuário não encontrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal