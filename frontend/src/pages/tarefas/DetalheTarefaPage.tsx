import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Clock, 
  User, 
  Calendar,
  Flag,
  FileText,
  History,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react'
import { toast } from 'sonner'
import TarefaForm from '@/components/tarefas/TarefaForm'
import { useTarefas } from '@/hooks/useTarefas'
import { useUsers } from '@/hooks/useUsers'
import { Tarefa, StatusTarefa, PrioridadeTarefa, UpdateTarefaDto } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog'

const DetalheTarefaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getTarefa,
    updateTarefa,
    deleteTarefa,
    getHistoricoTarefa,
    loading
  } = useTarefas()
  const { data: usersResponse, isLoading: loadingUsers } = useUsers({ page: 1, limit: 1000 })
  const usuarios = usersResponse?.data ?? []

  const [tarefa, setTarefa] = useState<Tarefa | null>(null)
  const [historico, setHistorico] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [loadingTarefa, setLoadingTarefa] = useState(true)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (id) {
      loadTarefa()
    }
  }, [id])

  const loadTarefa = async () => {
    if (!id) return
    
    try {
      setLoadingTarefa(true)
      const tarefaData = await getTarefa(parseInt(id))
      setTarefa(tarefaData)
    } catch (error) {
      console.error('Erro ao carregar tarefa:', error)
      toast.error('Erro ao carregar tarefa')
      navigate('/tarefas')
    } finally {
      setLoadingTarefa(false)
    }
  }

  const loadHistorico = async () => {
    if (!id) return
    
    try {
      setLoadingHistorico(true)
      const historicoData = await getHistoricoTarefa(parseInt(id))
      setHistorico(historicoData)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoadingHistorico(false)
    }
  }

  const handleUpdate = async (data: UpdateTarefaDto) => {
    if (!tarefa) return
    
    try {
      const tarefaAtualizada = await updateTarefa(tarefa.id, data)
      setTarefa(tarefaAtualizada)
      setIsEditing(false)
      toast.success('Tarefa atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error('Erro ao atualizar tarefa')
    }
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!tarefa) return

    try {
      await deleteTarefa(tarefa.id)
      toast.success('Tarefa excluída com sucesso!')
      navigate('/tarefas')
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error('Erro ao excluir tarefa')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleStatusChange = async (novoStatus: StatusTarefa) => {
    if (!tarefa) return
    
    try {
      const tarefaAtualizada = await updateTarefa(tarefa.id, { estado: novoStatus } as UpdateTarefaDto)
      setTarefa(tarefaAtualizada)
      toast.success('Status atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusIcon = (status: StatusTarefa) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return <Clock className="h-4 w-4" />
      case StatusTarefa.EM_ANDAMENTO:
        return <PlayCircle className="h-4 w-4" />
      case StatusTarefa.CONCLUIDA:
        return <CheckCircle className="h-4 w-4" />
      case StatusTarefa.CANCELADA:
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: StatusTarefa) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return 'bg-yellow-100 text-yellow-800'
      case StatusTarefa.EM_ANDAMENTO:
        return 'bg-blue-100 text-blue-800'
      case StatusTarefa.CONCLUIDA:
        return 'bg-green-100 text-green-800'
      case StatusTarefa.CANCELADA:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadeColor = (prioridade: PrioridadeTarefa) => {
    switch (prioridade) {
      case PrioridadeTarefa.BAIXA:
        return 'bg-green-100 text-green-800'
      case PrioridadeTarefa.MEDIA:
        return 'bg-yellow-100 text-yellow-800'
      case PrioridadeTarefa.ALTA:
        return 'bg-orange-100 text-orange-800'
      case PrioridadeTarefa.CRITICA:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  if (loadingTarefa) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!tarefa) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tarefa não encontrada</h2>
          <p className="text-gray-600 mb-4">A tarefa que você está procurando não existe ou foi removida.</p>
          <Button onClick={() => navigate('/tarefas')}>Voltar para Tarefas</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tarefas')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tarefa.titulo}</h1>
            <p className="text-gray-600">Detalhes da tarefa #{tarefa.id}</p>
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Editar Tarefa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TarefaForm
                  tarefa={tarefa}
                  onSubmit={handleUpdate}
                  onCancel={() => setIsEditing(false)}
                  loading={loading || loadingUsers}
                  submitLabel="Salvar Alterações"
                  cancelLabel="Cancelar"
                  usuarios={usuarios}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Informações da Tarefa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações da Tarefa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {tarefa.descricao || 'Nenhuma descrição fornecida.'}
                    </p>
                  </div>
                  
                  {tarefa.observacoes && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{tarefa.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tarefa.status !== StatusTarefa.EM_ANDAMENTO && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(StatusTarefa.EM_ANDAMENTO)}
                        className="flex items-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar
                      </Button>
                    )}
                    {tarefa.status !== StatusTarefa.CONCLUIDA && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(StatusTarefa.CONCLUIDA)}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Concluir
                      </Button>
                    )}
                    {tarefa.status !== StatusTarefa.CANCELADA && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(StatusTarefa.CANCELADA)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status e Prioridade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`flex items-center gap-1 ${tarefa.status ? getStatusColor(tarefa.status) : ''}`}>
                  {tarefa.status ? getStatusIcon(tarefa.status) : null}
                  {tarefa.status ? tarefa.status.replace('_', ' ').toUpperCase() : 'STATUS INDEFINIDO'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-gray-500" />
                <Badge className={tarefa.prioridade ? getPrioridadeColor(tarefa.prioridade) : ''}>
                  {tarefa.prioridade ? tarefa.prioridade.toUpperCase() : 'PRIORIDADE INDEFINIDA'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pessoas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pessoas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Responsável</p>
                  <p className="text-sm text-gray-600">{tarefa.responsavel?.nome || 'Não atribuído'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Criado por</p>
                  <p className="text-sm text-gray-600">{tarefa.criador?.nome}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Criado em</p>
                  <p className="text-sm text-gray-600">{formatDate(tarefa.createdAt)}</p>
                </div>
              </div>
              
              {tarefa.prazo && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Prazo</p>
                    <p className="text-sm text-gray-600">{formatDate(tarefa.prazo)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Atualizado em</p>
                  <p className="text-sm text-gray-600">{formatDate(tarefa.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadHistorico}
                  disabled={loadingHistorico}
                >
                  {loadingHistorico ? 'Carregando...' : 'Carregar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {historico.length > 0 ? (
                <div className="space-y-3">
                  {historico.map((item, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-3 pb-3">
                      <p className="text-sm font-medium">{item.acao}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(item.createdAt)} - {item.usuario?.nome}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhum histórico disponível</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Confirm Dialog */}
      <EnhancedConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${tarefa?.titulo}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta tarefa permanentemente"
        warningList={[
          'Esta ação não pode ser desfeita',
          'Todos os dados da tarefa serão perdidos',
          'O histórico será apagado'
        ]}
      />
    </div>
  )
}

export default DetalheTarefaPage