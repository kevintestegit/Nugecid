import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Clock, 
  Eye, 
  FileText,
  User,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, getStatusLabel, getTipoDesarquivamentoLabel } from '@/utils/format'
import { Desarquivamento } from '@/types'
import { cn } from '@/utils/cn'

interface RecentActivityProps {
  activities: Desarquivamento[]
  isLoading?: boolean
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, isLoading = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'EM_ANALISE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'APROVADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'REJEITADO':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isExpired = (prazoVencimento: string) => {
    return new Date(prazoVencimento) < new Date()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl font-bold leading-tight tracking-tight">
              <Clock className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80 leading-relaxed">
              Últimas solicitações de desarquivamento
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
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

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>
            Últimas solicitações de desarquivamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma atividade recente encontrada</p>
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
            <CardTitle className="flex items-center gap-2 text-xl font-bold leading-tight tracking-tight">
              <Clock className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80 leading-relaxed">
              Últimas {activities.length} solicitações de desarquivamento
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/desarquivamentos" className="flex items-center gap-2">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className={cn(
                "flex items-center space-x-4 p-3 rounded-lg border transition-colors",
                activity.urgente
                  ? "border-rose-200 bg-rose-50/50 hover:border-rose-300 hover:bg-rose-50"
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.nomeCompleto || 'Nome não informado'}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(activity.status))}
                  >
                    {getStatusLabel(activity.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {getTipoDesarquivamentoLabel(activity.tipoDesarquivamento)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(activity.createdAt)}
                  </span>
                  {activity.urgente && (
                    <Badge variant="destructive" className="text-xs">
                      Urgente
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/desarquivamentos/${activity.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length >= 5 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/desarquivamentos" className="flex items-center justify-center gap-2">
                Ver todas as solicitações
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivity
