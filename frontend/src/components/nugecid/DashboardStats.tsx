import React from 'react'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Archive,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { Desarquivamento, StatusDesarquivamento } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface DashboardStatsProps {
  desarquivamentos: Desarquivamento[]
  isLoading?: boolean
  className?: string
}

interface StatCard {
  title: string
  value: number
  icon: React.ReactNode
  description: string
  variant: 'default' | 'success' | 'warning' | 'danger'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  desarquivamentos,
  isLoading = false,
  className
}) => {
  // Calcular estatísticas
  const totalSolicitacoes = desarquivamentos.length
  
  const finalizados = desarquivamentos.filter(
    d => d.status === StatusDesarquivamento.FINALIZADO
  ).length
  
  const desarquivados = desarquivamentos.filter(
    d => d.status === StatusDesarquivamento.DESARQUIVADO
  ).length
  
  const naoColetados = desarquivamentos.filter(
    d => d.status === StatusDesarquivamento.NAO_COLETADO
  ).length
  
  const solicitados = desarquivamentos.filter(
    d => d.status === StatusDesarquivamento.SOLICITADO
  ).length
  
  const retiradosPeloSetor = desarquivamentos.filter(
    d => d.status === StatusDesarquivamento.RETIRADO_PELO_SETOR
  ).length
  
  const naoLocalizados = desarquivamentos.filter(
    d => d.status === StatusDesarquivamento.NAO_LOCALIZADO
  ).length
  
  // Calcular itens em atraso (mais de 5 dias sem coleta)
  const itensEmAtraso = desarquivamentos.filter(d => {
    if (d.status === StatusDesarquivamento.FINALIZADO || 
        d.status === StatusDesarquivamento.DESARQUIVADO ||
        d.status === StatusDesarquivamento.RETIRADO_PELO_SETOR) {
      return false
    }
    
    const solicitacaoDate = new Date(d.createdAt || d.dataSolicitacao)
    const today = new Date()
    const diffTime = today.getTime() - solicitacaoDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 5
  }).length
  
  // Calcular solicitações com prorrogação
  const comProrrogacao = desarquivamentos.filter(
    d => d.solicitacaoProrrogacao
  ).length
  
  // Calcular solicitações do mês atual
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const solicitacoesDoMes = desarquivamentos.filter(
    d => new Date(d.createdAt || d.dataSolicitacao) >= inicioMes
  ).length

  const stats: StatCard[] = [
    {
      title: 'Total de Solicitações',
      value: totalSolicitacoes,
      icon: <FileText className="w-5 h-5" />,
      description: 'Todas as solicitações registradas',
      variant: 'default'
    },
    {
      title: 'Finalizados',
      value: finalizados,
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Processos concluídos',
      variant: 'success'
    },
    {
      title: 'Em Atraso',
      value: itensEmAtraso,
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Mais de 5 dias sem coleta',
      variant: 'danger'
    },
    {
      title: 'Desarquivados',
      value: desarquivados,
      icon: <Archive className="w-5 h-5" />,
      description: 'Documentos desarquivados',
      variant: 'default'
    },
    {
      title: 'Não Coletados',
      value: naoColetados,
      icon: <Clock className="w-5 h-5" />,
      description: 'Aguardando coleta',
      variant: 'warning'
    },
    {
      title: 'Solicitações do Mês',
      value: solicitacoesDoMes,
      icon: <Calendar className="w-5 h-5" />,
      description: 'Registradas este mês',
      variant: 'default'
    },
    {
      title: 'Com Prorrogação',
      value: comProrrogacao,
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Solicitaram prorrogação',
      variant: 'warning'
    },
    {
      title: 'Retirados pelo Setor',
      value: retiradosPeloSetor,
      icon: <Users className="w-5 h-5" />,
      description: 'Coletados pelos setores',
      variant: 'success'
    }
  ]

  const getCardVariantClasses = (variant: StatCard['variant']) => {
    const variants = {
      default: 'border-gray-200 bg-white',
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      danger: 'border-red-200 bg-red-50'
    }
    return variants[variant]
  }

  const getIconVariantClasses = (variant: StatCard['variant']) => {
    const variants = {
      default: 'text-gray-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    }
    return variants[variant]
  }

  const getValueVariantClasses = (variant: StatCard['variant']) => {
    const variants = {
      default: 'text-gray-900',
      success: 'text-green-900',
      warning: 'text-yellow-900',
      danger: 'text-red-900'
    }
    return variants[variant]
  }

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Alerta para itens em atraso */}
      {itensEmAtraso > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Atenção: {itensEmAtraso} {itensEmAtraso === 1 ? 'item' : 'itens'} em atraso
              </h3>
              <p className="text-sm text-red-700">
                {itensEmAtraso === 1 
                  ? 'Há 1 solicitação há mais de 5 dias sem coleta'
                  : `Há ${itensEmAtraso} solicitações há mais de 5 dias sem coleta`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={cn(
              'transition-all duration-200 hover:shadow-md',
              getCardVariantClasses(stat.variant)
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {stat.title}
                <div className={getIconVariantClasses(stat.variant)}>
                  {stat.icon}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold mb-1', getValueVariantClasses(stat.variant))}>
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">
                {stat.description}
              </p>
              {stat.trend && (
                <div className="flex items-center mt-2">
                  <Badge 
                    variant={stat.trend.isPositive ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo por status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{solicitados}</div>
              <div className="text-xs text-gray-600">Solicitados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">{desarquivados}</div>
              <div className="text-xs text-gray-600">Desarquivados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">{naoColetados}</div>
              <div className="text-xs text-gray-600">Não Coletados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{retiradosPeloSetor}</div>
              <div className="text-xs text-gray-600">Retirados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-800">{finalizados}</div>
              <div className="text-xs text-gray-600">Finalizados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{naoLocalizados}</div>
              <div className="text-xs text-gray-600">Não Localizados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{comProrrogacao}</div>
              <div className="text-xs text-gray-600">Com Prorrogação</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardStats
