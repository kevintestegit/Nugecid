import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit } from 'lucide-react'
import { useUser, useUpdateUser } from '@/hooks/useUsers'
import { UpdateUserDto } from '@/types'
import UsuarioForm from './UsuarioForm'

interface EditUserModalProps {
  userId: number
  onClose: () => void
  onSuccess?: () => void
}

const EditUserModal: React.FC<EditUserModalProps> = ({ userId, onClose, onSuccess }) => {
  const { data: userResponse, isLoading: isLoadingUser } = useUser(userId)
  const updateUserMutation = useUpdateUser()
  const user = userResponse?.data

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = async (data: UpdateUserDto) => {
    try {
      await updateUserMutation.mutateAsync({ id: userId, data })
      onSuccess?.()
    } catch (error) {
      // O erro será tratado pelo hook useUpdateUser
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  if (isLoadingUser) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm" />
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 pointer-events-auto">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </>,
      document.body
    )
  }

  if (!user) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 pointer-events-auto">
            <div className="text-center py-8">
              <p className="text-gray-500">Usuário não encontrado</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    )
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 pointer-events-auto">
          {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Editar Usuário</h3>
              <p className="text-sm text-gray-500">Edite os dados de {user.nome}</p>
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
          <UsuarioForm
            mode="edit"
            initialData={{
              nome: user.nome,
              usuario: user.usuario,
              matricula: user.matricula,
              role: user.role,
              ativo: user.ativo
            }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={updateUserMutation.isPending}
          />
        </div>
        </div>
      </div>
    </>
  ,
    document.body
  )
}

export default EditUserModal
