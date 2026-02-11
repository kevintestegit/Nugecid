import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { CreateDesarquivamentoDto } from '@/types'
import { useCreateDesarquivamento } from '@/hooks/useDesarquivamentos'
import { Button } from '@/components/ui/Button'
import DesarquivamentoForm from '@/components/nugecid/DesarquivamentoForm'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

interface NugecidCreatePageProps {
  className?: string
}

const NugecidCreatePage: React.FC<NugecidCreatePageProps> = ({ className }) => {
  const navigate = useNavigate()
  const createDesarquivamento = useCreateDesarquivamento()

  const handleSubmit = async (data: CreateDesarquivamentoDto) => {
    try {
      const result = await createDesarquivamento.mutateAsync(data as CreateDesarquivamentoDto)
      const created = result.data
      
      toast.success('Registro criado com sucesso!', {
        description: `Código: ${created?.codigoBarras || created?.id || 'novo registro'}`
      })
      
      // Redirecionar para a página de detalhes do registro criado
      if (created?.id) {
        navigate(`/nugecid/${created.id}`)
      } else {
        navigate('/nugecid')
      }
    } catch (error: any) {
      console.error('Erro ao criar registro:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Erro interno do servidor'
      
      toast.error('Erro ao criar registro', {
        description: errorMessage
      })
      
      throw error // Re-throw para que o form possa lidar com o estado de loading
    }
  }

  const handleCancel = () => {
    navigate('/nugecid')
  }

  return (
    <div className={cn('container mx-auto px-4 py-6 max-w-4xl', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/nugecid')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Novo Registro NUGECID
            </h1>
            <p className="text-gray-600 mt-1">
              Preencha as informações para criar um novo registro de desarquivamento
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
              <span className="text-sm font-medium text-gray-500">
                Novo Registro
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <DesarquivamentoForm
            onSubmit={(data) => handleSubmit(data as CreateDesarquivamentoDto)}
            onCancel={handleCancel}
            isLoading={createDesarquivamento.isPending}
          />
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Informações Importantes
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Todos os campos marcados com (*) são obrigatórios</li>
          <li>• O código de barras será gerado automaticamente após a criação</li>
          <li>• Solicitações urgentes têm prioridade no processamento</li>
          <li>• Você receberá notificações sobre o andamento da solicitação</li>
        </ul>
      </div>
    </div>
  )
}

export default NugecidCreatePage
