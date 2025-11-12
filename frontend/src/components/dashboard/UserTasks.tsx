import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  CheckSquare, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { UserTask } from '@/hooks/useUserTasks'

interface UserTasksProps {
  tasks: UserTask[]
  isLoading?: boolean
}

const UserTasks: React.FC<UserTasksProps> = ({ tasks, isLoading = false }) => {
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'EM_ANDAMENTO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CONCLUIDA':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800'
      case 'ALTA':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800'
      case 'BAIXA':
        return 'bg-green-100 text-green-800'
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
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
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg animate-pulse">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeTasks = tasks.filter(t => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA')

  if (!activeTasks || activeTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Minhas Tarefas
          </CardTitle>
          <CardDescription>
            Tarefas atribuídas a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Você não tem tarefas pendentes</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <CheckSquare className="h-5 w-5" />
              Minhas Tarefas
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80">
              {activeTasks.length} {activeTasks.length === 1 ? 'tarefa ativa' : 'tarefas ativas'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tarefas" className="flex items-center gap-2">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeTasks.slice(0, 5).map((task) => (
            <div 
              key={task.id} 
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate flex-1">
                    {task.titulo}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs whitespace-nowrap", getPrioridadeColor(task.prioridade))}
                  >
                    {getPrioridadeLabel(task.prioridade)}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(task.status))}
                  >
                    {getStatusLabel(task.status)}
                  </Badge>
                  
                  <span className={cn(
                    "flex items-center gap-1",
                    isPastDue(task.prazo) && "text-red-600 font-semibold"
                  )}>
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.prazo)}
                    {isPastDue(task.prazo) && <AlertCircle className="h-3 w-3 ml-1" />}
                  </span>
                  
                  {task.projeto && (
                    <span className="text-gray-500">
                      {task.projeto.nome}
                    </span>
                  )}
                </div>
              </div>
              
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/tarefas/${task.id}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
        
        {activeTasks.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tarefas" className="flex items-center justify-center gap-2">
                Ver todas as tarefas ({activeTasks.length})
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
