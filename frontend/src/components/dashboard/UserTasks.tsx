import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  CheckSquare, 
  AlertCircle,
  ArrowRight,
  Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { UserTask } from '@/hooks/useUserTasks'
import { Avatar, AvatarGroup } from '@/components/kanban/Avatar'
import { useAuth } from '@/contexts/AuthContext'

interface UserTasksProps {
  tasks: UserTask[]
  isLoading?: boolean
}

const UserTasks: React.FC<UserTasksProps> = ({ tasks, isLoading = false }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA'>('all')
  const { user } = useAuth()
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em andamento',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'EM_ANDAMENTO':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CONCLUIDA':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-50 text-red-700'
      case 'ALTA':
        return 'bg-orange-50 text-orange-700'
      case 'MEDIA':
        return 'bg-yellow-50 text-yellow-700'
      case 'BAIXA':
        return 'bg-green-50 text-green-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = {
      'URGENTE': 'Urgente',
      'ALTA': 'Alta',
      'MEDIA': 'Média',
      'BAIXA': 'Baixa'
    }
    return labels[prioridade] || prioridade
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isPastDue = (prazo: string) => {
    return new Date(prazo) < new Date()
  }

  const visibleTasks = useMemo(() => tasks.filter(t => t.status !== 'CANCELADA'), [tasks])
  const activeTasks = useMemo(
    () => visibleTasks.filter(t => t.status !== 'CONCLUIDA'),
    [visibleTasks]
  )
  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') {
      return activeTasks
    }
    return visibleTasks.filter(task => task.status === activeTab)
  }, [activeTab, activeTasks, visibleTasks])

  const hasAnyTasks = visibleTasks.length > 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CheckSquare className="h-5 w-5" />
            Minhas Tarefas
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/80">
            Tarefas atribuídas a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start justify-between gap-3 p-4 border rounded-xl animate-pulse bg-white">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/80">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <CheckSquare className="h-5 w-5" />
              Minhas Tarefas
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80">
              {activeTasks.length} {activeTasks.length === 1 ? 'tarefa ativa' : 'tarefas ativas'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tarefas" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex gap-4 border-b border-gray-100 pt-3 text-xs font-medium text-gray-500">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'PENDENTE', label: 'A Fazer' },
            { key: 'EM_ANDAMENTO', label: 'Em Progresso' },
            { key: 'CONCLUIDA', label: 'Concluídas' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'pb-3 transition-colors',
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnyTasks ? (
          <div className="py-10 text-center text-gray-500">
            <CheckSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">Você não tem tarefas pendentes.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Nenhuma tarefa encontrada para este filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.slice(0, 5).map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200/70 hover:border-gray-300 hover:bg-gray-50/70 transition-colors"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase', getPrioridadeColor(task.prioridade))}>
                      {getPrioridadeLabel(task.prioridade)}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(task.prazo)}
                    </span>
                    {isPastDue(task.prazo) && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Atrasada
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {task.titulo}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    {task.projeto && (
                      <span className="flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-600">
                        {task.projeto.nome}
                      </span>
                    )}
                    {(() => {
                      const responsaveis = task.responsaveis?.length
                        ? task.responsaveis
                        : task.responsavel
                          ? [task.responsavel]
                          : user
                            ? [{ id: user.id, nome: user.nome, avatar: user.avatar ?? undefined, avatarUrl: user.avatarUrl }]
                            : []
                      if (!responsaveis.length) return null
                      const normalized = responsaveis.map((responsavel) => ({
                        ...responsavel,
                        usuario: responsavel.nome,
                      }))
                      return responsaveis.length > 1 ? (
                        <AvatarGroup usuarios={normalized} size="xs" max={3} />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-white">
                          <Avatar usuario={normalized[0]} size="xs" showTooltip={false} />
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/tarefas/${task.id}`} className="flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 hover:border-gray-300">
                      <ArrowRight className="h-4 w-4 text-gray-500" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredTasks.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tarefas" className="flex items-center justify-center gap-2">
                Ver todas as tarefas ({filteredTasks.length})
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UserTasks
