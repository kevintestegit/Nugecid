import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Loader2 } from 'lucide-react'
import { UpdateDesarquivamentoDto } from '@/types'
import { useDesarquivamento, useUpdateDesarquivamento } from '@/hooks/useDesarquivamentos'
import { Button } from '@/components/ui/Button'
import DesarquivamentoForm from '@/components/nugecid/DesarquivamentoForm'
import { PageLoading } from '@/components/ui'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

interface NugecidEditPageProps {
  className?: string
}

const NugecidEditPage: React.FC<NugecidEditPageProps> = ({ className }) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const updateDesarquivamento = useUpdateDesarquivamento()

  const {
    data: response,
    isLoading,
    error
  } = useDesarquivamento(id)
  const desarquivamento = response?.data

  const handleSubmit = async (data: UpdateDesarquivamentoDto) => {
    try {
      const result = await updateDesarquivamento.mutateAsync({
        id: id!,
        data
      })
      const updated = result.data
      
      toast.success('Registro atualizado com sucesso!', {
        description: `Código: ${updated?.codigoBarras || updated?.id || id}`
      })
      
      // Redirecionar para a página de detalhes
      navigate(`/nugecid/${id}`)
    } catch (error: any) {
      console.error('Erro ao atualizar registro:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Erro interno do servidor'
      
      toast.error('Erro ao atualizar registro', {
        description: errorMessage
      })
      
      throw error // Re-throw para que o form possa lidar com o estado de loading
    }
  }

  const handleCancel = () => {
    navigate(`/nugecid/${id}`)
  }

  // Loading state
  if (isLoading) {
    return <PageLoading />
  }

  // Error state
  if (error) {
    return (
      <div className={cn('container mx-auto px-4 py-6 max-w-4xl', className)}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar registro
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Não foi possível carregar os dados do registro'}
          </p>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/nugecid')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à Lista
            </Button>
            <Button
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Not found state
  if (!desarquivamento) {
    return (
      <div className={cn('container mx-auto px-4 py-6 max-w-4xl', className)}>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Registro não encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            O registro solicitado não existe ou foi removido
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/nugecid')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Lista
          </Button>
        </div>
      </div>
    )
  }

  // Check if can edit
  const canEdit = !['FINALIZADO', 'NAO_COLETADO', 'NAO_LOCALIZADO'].includes(desarquivamento.status)
  
  if (!canEdit) {
    return (
      <div className={cn('container mx-auto px-4 py-6 max-w-4xl', className)}>
        <div className="text-center py-12">
          <div className="text-yellow-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Registro não pode ser editado
          </h2>
          <p className="text-gray-600 mb-4">
            Este registro está com status "{desarquivamento.status}" e não pode ser modificado
          </p>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/nugecid')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à Lista
            </Button>
            <Button
              onClick={() => navigate(`/nugecid/${id}`)}
            >
              Ver Detalhes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('container mx-auto px-4 py-6 max-w-4xl', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/nugecid/${id}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Edit className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Registro NUGECID
            </h1>
            <p className="text-gray-600 mt-1">
              Código: <span className="font-mono font-medium">{desarquivamento.codigoBarras}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => navigate('/nugecid')}
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              NUGECID
            </button>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <button
                onClick={() => navigate(`/nugecid/${id}`)}
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {desarquivamento.codigoBarras}
              </button>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-500">
                Editar
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <DesarquivamentoForm
            initialData={desarquivamento}
            onSubmit={(data) => handleSubmit(data as UpdateDesarquivamentoDto)}
            onCancel={handleCancel}
            isLoading={updateDesarquivamento.isPending}
            isEdit={true}
          />
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-orange-900 mb-2">
          Informações sobre Edição
        </h3>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Apenas registros pendentes ou em andamento podem ser editados</li>
          <li>• Alterações serão registradas no histórico do sistema</li>
          <li>• O código de barras não pode ser alterado</li>
          <li>• Notificações serão enviadas sobre as alterações</li>
        </ul>
      </div>
    </div>
  )
}

export default NugecidEditPage
