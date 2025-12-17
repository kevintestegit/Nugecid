import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KanbanBoard, Coluna as KanbanColuna, Tarefa as KanbanTarefa, Projeto as KanbanProjeto, TaskDetailModal } from '@/components/kanban'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui'
import { Loader2, RefreshCw, Plus, Columns, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/services/api'
import tarefasService from '@/services/tarefasService'
import { useAuth } from '@/contexts/AuthContext'
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog'
import { SkeletonKanbanCard, Skeleton } from '@/components/ui/Skeleton'
import type { Coluna as KanbanDomainColumn, Tarefa as KanbanDomainTask, Usuario as KanbanDomainUser } from '@/types/kanban.types'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

interface ProjetoResumo {
  id: number
  nome: string
  descricao?: string
  cor?: string
  createdAt?: string
  updatedAt?: string
}

interface ColunaResponse {
  id: number
  nome: string
  cor?: string
  ordem?: number
  projetoId?: number
  ativa?: boolean
  limiteWip?: number
  limite_wip?: number
}

interface TarefaResponse {
  id: number
  titulo: string
  descricao?: string
  prioridade?: string
  prazo?: string
  ordem?: number
  colunaId?: number
  coluna_id?: number
  coluna?: { id: number }
  responsavel?: { id: number; nome: string; avatarUrl?: string; avatar?: string }
  tags?: string[]
  comentarios?: unknown[]
}

interface ProjetoDetalhado extends ProjetoResumo {
  colunas?: ColunaResponse[]
  tarefas?: TarefaResponse[]
}

type BoardTask = KanbanTarefa & { coluna_id: number; colunaId?: number }

type ResponsibleFilter = 'all' | 'mine' | number

const STORAGE_KEY = 'tarefas.selectedProjectId'

const normalizePriority = (value?: string): KanbanTarefa['prioridade'] => {
  if (!value) return 'media'
  const normalized = value.toLowerCase()
  if (normalized === 'baixa' || normalized === 'media' || normalized === 'alta' || normalized === 'critica') {
    return normalized
  }
  return 'media'
}

const mapColumns = (data: ColunaResponse[] | undefined, fallbackProjectId: number): KanbanColuna[] => {
  if (!data) return []
  return data
    .map(coluna => ({
      id: coluna.id,
      nome: coluna.nome,
      cor: coluna.cor ?? '#3B82F6',
      ordem: coluna.ordem ?? 1,
      projeto_id: coluna.projetoId ?? fallbackProjectId,
      limite_wip: coluna.limiteWip ?? coluna.limite_wip,
    }))
    .sort((a, b) => a.ordem - b.ordem)
}

const mapTasks = (data: TarefaResponse[] | undefined): BoardTask[] => {
  if (!data) return []

  const grouped = new Map<number, BoardTask[]>()

  data.forEach(item => {
    const columnId = item.colunaId ?? item.coluna_id ?? item.coluna?.id ?? 0
    if (!columnId) return

    const base: BoardTask = {
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao ?? '',
      prioridade: normalizePriority(item.prioridade),
      prazo: item.prazo ?? undefined,
      responsavel: item.responsavel
        ? {
            id: item.responsavel.id,
            nome: item.responsavel.nome,
            avatar: item.responsavel.avatarUrl ?? item.responsavel.avatar,
          }
        : undefined,
      comentarios: Array.isArray(item.comentarios) ? item.comentarios.length : undefined,
      ordem: item.ordem ?? 0,
      tags: Array.isArray(item.tags) ? item.tags : [],
      coluna_id: columnId,
      colunaId: columnId,
    }

    const list = grouped.get(columnId) ?? []
    list.push(base)
    grouped.set(columnId, list)
  })

  const result: BoardTask[] = []
  grouped.forEach(list => {
    list
      .sort((a, b) => a.ordem - b.ordem || a.id - b.id)
      .forEach((task, index) => {
        task.ordem = index + 1
        result.push(task)
      })
  })

  return result
}

const buildDomainUser = (responsavel: BoardTask['responsavel'] | undefined): KanbanDomainUser | undefined => {
  if (!responsavel) return undefined
  return {
    id: responsavel.id,
    nome: responsavel.nome,
    usuario: responsavel.nome,
    avatar: responsavel.avatar,
  }
}

const buildDomainColumn = (coluna: KanbanColuna | undefined, projetoId: number): KanbanDomainColumn | undefined => {
  if (!coluna) return undefined
  return {
    id: coluna.id,
    nome: coluna.nome,
    cor: coluna.cor ?? '#3B82F6',
    ordem: coluna.ordem,
    ativa: true,
    projetoId,
  }
}

const buildDomainTask = (tarefa: BoardTask, projetoId: number, coluna?: KanbanColuna): KanbanDomainTask => {
  const now = new Date().toISOString()
  const colunaId = tarefa.colunaId ?? tarefa.coluna_id ?? 0

  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    projetoId,
    colunaId,
    criadorId: 0,
    responsavelId: tarefa.responsavel?.id,
    prazo: tarefa.prazo,
    prioridade: tarefa.prioridade,
    ordem: tarefa.ordem,
    tags: tarefa.tags,
    createdAt: now,
    updatedAt: now,
    responsavel: buildDomainUser(tarefa.responsavel),
    coluna: buildDomainColumn(coluna, projetoId),
  }
}

const TarefasPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [projects, setProjects] = useState<ProjetoResumo[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [projectDetails, setProjectDetails] = useState<ProjetoDetalhado | null>(null)
  const [columns, setColumns] = useState<KanbanColuna[]>([])
  const [tasks, setTasks] = useState<BoardTask[]>([])
  const [selectedResponsibleId, setSelectedResponsibleId] = useState<ResponsibleFilter>('all')
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingBoard, setLoadingBoard] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteColumn, setDeleteColumn] = useState<{ id: number; nome: string } | null>(null)
  const [deleteTask, setDeleteTask] = useState<{ id: number; titulo: string } | null>(null)
  const [detailTask, setDetailTask] = useState<KanbanDomainTask | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    try {
      const response = await api.get<ApiResponse<ProjetoResumo[]>>('/projetos')
      if (!response.data.success) {
        throw new Error(response.data.message || 'Não foi possível carregar os projetos.')
      }

      const lista = response.data.data ?? []
      setProjects(lista)

      if (!lista.length) {
        setSelectedProjectId(null)
        setProjectDetails(null)
        setColumns([])
        setTasks([])
        localStorage.removeItem(STORAGE_KEY)
        return
      }

      const storedId = localStorage.getItem(STORAGE_KEY)
      let nextId: number | null = storedId ? Number(storedId) : null
      if (nextId && !lista.some(proj => proj.id === nextId)) {
        nextId = null
      }
      if (!nextId) {
        nextId = lista[0].id
      }

      setSelectedProjectId(nextId)
    } catch (err) {
      console.error('Erro ao carregar projetos:', err)
      setError('Não foi possível carregar os projetos no momento.')
      toast.error('Não foi possível carregar os projetos.')
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  const loadBoardData = useCallback(async (projectId: number) => {
    setLoadingBoard(true)
    try {
      setError(null)
      const response = await api.get<ApiResponse<ProjetoDetalhado>>(`/projetos/${projectId}`)
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Não foi possível carregar o quadro de tarefas.')
      }

      const project = response.data.data
      
      setProjectDetails(project)
      const mappedColumns = mapColumns(project.colunas, project.id)
      const mappedTasks = mapTasks(project.tarefas)
      
      setColumns(mappedColumns)
      setTasks(mappedTasks)
    } catch (err) {
      setError('Não foi possível carregar o quadro de tarefas.')
      toast.error('Não foi possível carregar o quadro de tarefas.')
      setColumns([])
      setTasks([])
    } finally {
      setLoadingBoard(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(STORAGE_KEY, String(selectedProjectId))
      loadBoardData(selectedProjectId)
      setSelectedResponsibleId('all')
    }
  }, [selectedProjectId]) // Removido loadBoardData da dependência

  const responsibleOptions = useMemo(() => {
    const unique = new Map<number, { id: number; nome: string }>()
    tasks.forEach(task => {
      if (task.responsavel) {
        unique.set(task.responsavel.id, {
          id: task.responsavel.id,
          nome: task.responsavel.nome,
        })
      }
    })
    return Array.from(unique.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [tasks])

  useEffect(() => {
    if (typeof selectedResponsibleId === 'number' && !responsibleOptions.some(option => option.id === selectedResponsibleId)) {
      setSelectedResponsibleId('all')
    }
  }, [responsibleOptions, selectedResponsibleId])

  const boardTasks = useMemo(() => {
    if (selectedResponsibleId === 'all') {
      return tasks
    }

    if (selectedResponsibleId === 'mine') {
      if (!user) return []
      return tasks.filter(task => task.responsavel?.id === user.id)
    }

    return tasks.filter(task => task.responsavel?.id === selectedResponsibleId)
  }, [tasks, selectedResponsibleId, user])

  const stats = useMemo(() => {
    const total = tasks.length
    const now = new Date()
    let overdue = 0
    let upcomingWeek = 0
    const priorities: Record<KanbanTarefa['prioridade'], number> = {
      baixa: 0,
      media: 0,
      alta: 0,
      critica: 0,
    }

    tasks.forEach(task => {
      priorities[task.prioridade] = (priorities[task.prioridade] ?? 0) + 1

      if (task.prazo) {
        const dueDate = new Date(task.prazo)
        if (!Number.isNaN(dueDate.getTime())) {
          if (dueDate < now) {
            overdue += 1
          } else {
            const diffMs = dueDate.getTime() - now.getTime()
            if (diffMs <= 7 * 24 * 60 * 60 * 1000) {
              upcomingWeek += 1
            }
          }
        }
      }
    })

    return { total, overdue, upcomingWeek, priorities }
  }, [tasks])

  const handleProjectChange = useCallback((value: string) => {
    const parsed = Number(value)
    setSelectedProjectId(Number.isNaN(parsed) ? null : parsed)
  }, [])

  const handleResponsibleChange = useCallback((value: string) => {
    if (value === 'all' || value === 'mine') {
      setSelectedResponsibleId(value)
      return
    }

    const parsed = Number(value)
    setSelectedResponsibleId(Number.isNaN(parsed) ? 'all' : parsed)
  }, [])

  const handleMoveTask = useCallback(
    async (taskId: number, _sourceColumnId: number, targetColumnId: number, targetIndex: number) => {
      if (!selectedProjectId) return
      
      setIsMutating(true)
      
      try {
        await tarefasService.moveTarefa(taskId, {
          colunaId: targetColumnId,
          ordem: targetIndex + 1,
        })
        
        // Recarregar dados do servidor para garantir sincronização
        await loadBoardData(selectedProjectId)
        
        toast.success('Tarefa movida com sucesso!')
      } catch (error) {
        toast.error('Não foi possível mover a tarefa.')
        await loadBoardData(selectedProjectId)
      } finally {
        setIsMutating(false)
      }
    },
    [selectedProjectId, loadBoardData]
  )

  const handleReorderTasks = useCallback(
    async (colunaId: number, orderedIds: number[], movedTaskId?: number) => {
      if (!selectedProjectId || movedTaskId === undefined) return
      const newIndex = orderedIds.findIndex(id => id === movedTaskId)
      if (newIndex === -1) return

      setIsMutating(true)
      
      try {
        await tarefasService.moveTarefa(movedTaskId, {
          colunaId,
          ordem: newIndex + 1,
        })
        
        // Recarregar dados do servidor
        await loadBoardData(selectedProjectId)
      } catch (error) {
        console.error('Erro ao reordenar tarefas:', error)
        toast.error('Não foi possível reordenar as tarefas.')
        await loadBoardData(selectedProjectId)
      } finally {
        setIsMutating(false)
      }
    },
    [selectedProjectId, loadBoardData]
  )

  const handleAddColumn = useCallback(async () => {
    if (!selectedProjectId) return
    const nome = window.prompt('Nome da nova coluna')
    if (!nome || !nome.trim()) {
      return
    }

    setIsMutating(true)
    try {
      const response = await api.post<ApiResponse<ColunaResponse>>('/colunas', {
        projetoId: selectedProjectId,
        nome: nome.trim(),
      })
      if (!response.data.success) {
        throw new Error(response.data.message || 'Não foi possível criar a coluna.')
      }
      toast.success('Coluna criada com sucesso!')
      await loadBoardData(selectedProjectId)
    } catch (error) {
      console.error('Erro ao criar coluna:', error)
      toast.error('Não foi possível criar a coluna.')
    } finally {
      setIsMutating(false)
    }
  }, [loadBoardData, selectedProjectId])

  const handleEditColumn = useCallback(async (coluna: KanbanColuna) => {
    if (!selectedProjectId) return
    const novoNome = window.prompt('Renomear coluna', coluna.nome)
    if (!novoNome || !novoNome.trim() || novoNome.trim() === coluna.nome) {
      return
    }

    setIsMutating(true)
    try {
      const response = await api.patch<ApiResponse<ColunaResponse>>(`/colunas/${coluna.id}`, {
        nome: novoNome.trim(),
      })
      if (!response.data.success) {
        throw new Error(response.data.message || 'Não foi possível atualizar a coluna.')
      }
      toast.success('Coluna atualizada com sucesso!')
      await loadBoardData(selectedProjectId)
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error)
      toast.error('Não foi possível atualizar a coluna.')
    } finally {
      setIsMutating(false)
    }
  }, [loadBoardData, selectedProjectId])

  const handleDeleteColumn = useCallback((colunaId: number, colunaNome: string) => {
    setDeleteColumn({ id: colunaId, nome: colunaNome })
  }, [])

  const handleConfirmDeleteColumn = useCallback(async () => {
    if (!selectedProjectId || !deleteColumn) return

    setIsMutating(true)
    try {
      const response = await api.delete<ApiResponse<unknown>>(`/colunas/${deleteColumn.id}`)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Não foi possível excluir a coluna.')
      }
      toast.success('Coluna excluída com sucesso!')
      await loadBoardData(selectedProjectId)
    } catch (error) {
      console.error('Erro ao excluir coluna:', error)
      toast.error('Não foi possível excluir a coluna.')
      await loadBoardData(selectedProjectId)
    } finally {
      setIsMutating(false)
      setDeleteColumn(null)
    }
  }, [loadBoardData, selectedProjectId, deleteColumn])

  const handleAddTask = useCallback(
    (colunaId?: number) => {
      if (!selectedProjectId) {
        toast.error('Selecione um projeto para criar tarefas.')
        return
      }

      navigate('/tarefas/nova', {
        state: {
          projetoId: selectedProjectId,
          colunaId: colunaId ?? null,
        },
      })
    },
    [navigate, selectedProjectId]
  )

  const handleTaskClick = useCallback(
    (tarefa: KanbanTarefa) => {
      if (!selectedProjectId) return
      const boardTask = tarefa as BoardTask
      const columnId = boardTask.colunaId ?? boardTask.coluna_id
      const coluna = columns.find(item => item.id === columnId)

      setDetailTask(buildDomainTask(boardTask, selectedProjectId, coluna))
      setIsDetailOpen(true)
    },
    [columns, selectedProjectId]
  )

  const handleTaskEdit = useCallback((tarefa: KanbanTarefa) => {
    navigate(`/tarefas/${tarefa.id}`)
  }, [navigate])

  const handleTaskDelete = useCallback((taskId: number, taskTitulo: string) => {
    setDeleteTask({ id: taskId, titulo: taskTitulo })
  }, [])

  const handleConfirmDeleteTask = useCallback(
    async () => {
      if (!selectedProjectId || !deleteTask) return

      setIsMutating(true)
      try {
        await tarefasService.deleteTarefa(deleteTask.id)
        toast.success('Tarefa removida com sucesso!')
        await loadBoardData(selectedProjectId)
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error)
        toast.error('Não foi possível excluir a tarefa.')
        await loadBoardData(selectedProjectId)
      } finally {
        setIsMutating(false)
        setDeleteTask(null)
      }
    },
    [loadBoardData, selectedProjectId, deleteTask]
  )

  const handleRefresh = useCallback(() => {
    if (selectedProjectId) {
      loadBoardData(selectedProjectId)
    } else {
      loadProjects()
    }
  }, [loadBoardData, loadProjects, selectedProjectId])

  const handleProjectSettings = useCallback(() => {
    navigate('/projetos')
  }, [navigate])

  const boardLoading = loadingBoard || loadingProjects
  const disableActions = boardLoading || isMutating

  const projetoResumo: KanbanProjeto = projectDetails
    ? {
        id: projectDetails.id,
        nome: projectDetails.nome,
        descricao: projectDetails.descricao ?? '',
        cor: projectDetails.cor,
        data_criacao: projectDetails.createdAt ?? '',
        data_atualizacao: projectDetails.updatedAt ?? '',
      }
    : {
        id: 0,
        nome: 'Projeto',
        descricao: '',
        cor: '#3B82F6',
        data_criacao: '',
        data_atualizacao: '',
      }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quadro de Tarefas</h1>
          <p className="text-gray-600">Organize e acompanhe as atividades da equipe em tempo real.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/tarefas/nova')} disabled={disableActions || !selectedProjectId}
            className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova tarefa
          </Button>
          <Button variant="outline" onClick={handleAddColumn} disabled={disableActions || !selectedProjectId}
            className="flex items-center gap-2">
            <Columns className="h-4 w-4" />
            Nova coluna
          </Button>
          <Button variant="ghost" onClick={handleRefresh} disabled={boardLoading} className="flex items-center gap-2">
            {boardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="warning" className="mb-6">
          <AlertTitle>Algo deu errado</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedProjectId?.toString() ?? ''} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(projeto => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    {projeto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(selectedResponsibleId)} onValueChange={handleResponsibleChange}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                <SelectItem value="mine">Minhas tarefas</SelectItem>
                {responsibleOptions.map(option => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {responsibleOptions.length} responsável(is)
            </div>
            <Badge variant="secondary">{tasks.length} tarefa(s)</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total de tarefas</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Atrasadas</p>
            <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Próximos 7 dias</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.upcomingWeek}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 space-y-1 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Por prioridade</p>
            <p>Crítica: <span className="font-medium text-red-600">{stats.priorities.critica}</span></p>
            <p>Alta: <span className="font-medium text-orange-600">{stats.priorities.alta}</span></p>
            <p>Média: <span className="font-medium text-yellow-600">{stats.priorities.media}</span></p>
            <p>Baixa: <span className="font-medium text-green-600">{stats.priorities.baixa}</span></p>
          </div>
        </CardContent>
      </Card>

      {loadingProjects && !projects.length ? (
        <div className="min-h-[500px] rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, colIndex) => (
              <div key={colIndex} className="flex-shrink-0 w-80">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Skeleton variant="text" height={24} width="60%" className="mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, cardIndex) => (
                      <SkeletonKanbanCard key={cardIndex} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="py-16 text-center text-gray-600">
          <CardContent>
            <p className="mb-4 text-lg">Nenhum projeto encontrado.</p>
            <Button onClick={() => navigate('/projetos')} className="gap-2">
              <Columns className="h-4 w-4" />
              Criar primeiro projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="min-h-[500px] rounded-lg border border-gray-200 bg-white p-4">
          <KanbanBoard
            projeto={projetoResumo}
            colunas={columns}
            tarefas={boardTasks}
            onMoveTask={handleMoveTask}
            onReorderTasks={handleReorderTasks}
            onAddColumn={handleAddColumn}
            onEditColumn={handleEditColumn}
            onDeleteColumn={handleDeleteColumn}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onProjectSettings={handleProjectSettings}
            loading={boardLoading || isMutating}
          />
        </div>
      )}

      {/* Enhanced Confirm Dialogs */}
      <EnhancedConfirmDialog
        isOpen={deleteColumn !== null}
        onClose={() => setDeleteColumn(null)}
        onConfirm={handleConfirmDeleteColumn}
        title="Excluir coluna"
        description={`Tem certeza que deseja excluir a coluna "${deleteColumn?.nome}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta coluna permanentemente"
        warningList={[
          'Certifique-se de que não há tarefas importantes nela',
          'Esta ação não pode ser desfeita',
          'Todas as tarefas da coluna podem ser perdidas'
        ]}
      />

      <EnhancedConfirmDialog
        isOpen={deleteTask !== null}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${deleteTask?.titulo}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta tarefa permanentemente"
        warningList={[
          'Esta ação não pode ser desfeita',
          'Todos os dados da tarefa serão perdidos'
        ]}
      />

      <TaskDetailModal
        open={isDetailOpen}
        task={detailTask}
        onClose={() => {
          setIsDetailOpen(false)
          setDetailTask(null)
        }}
        onRefresh={async () => {
          if (selectedProjectId) {
            await loadBoardData(selectedProjectId)
          }
        }}
        onOpenTask={(taskId) => navigate(`/tarefas/${taskId}`)}
        openTaskLabel="Abrir página"
      />
    </div>
  )
}

export default TarefasPage


