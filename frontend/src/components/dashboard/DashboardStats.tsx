import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Link } from 'react-router-dom'
import { StatusDesarquivamento } from '@/types'

interface DashboardStatsData {
  total: number;
  pendentes: number;
  urgentes: number;
  porTipo: Record<string, number>;
  porStatus: Record<string, number>;
  porInstituto?: Record<string, number>;
  recentes: any[];
  // Dados do mês anterior para comparação
  totalMesAnterior?: number;
  pendentesMesAnterior?: number;
}

interface DashboardStatsProps {
  data: DashboardStatsData
  isLoading?: boolean
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data, isLoading = false }) => {
  const calcularTendencia = (atual: number, anterior?: number) => {
    if (!anterior || anterior === 0) return { porcentagem: 0, tipo: 'neutro' as const }
    
    const diferenca = atual - anterior
    const porcentagem = Math.round((diferenca / anterior) * 100)
    
    if (porcentagem > 5) return { porcentagem, tipo: 'alta' as const }
    if (porcentagem < -5) return { porcentagem, tipo: 'baixa' as const }
    return { porcentagem, tipo: 'neutro' as const }
  }

  const tendenciaTotal = calcularTendencia(data?.total || 0, data?.totalMesAnterior)
  const tendenciaPendentes = calcularTendencia(data?.pendentes || 0, data?.pendentesMesAnterior)

  const urgentesCount = data?.urgentes || 0

  const statsCards = [
    {
      title: 'Total de Solicitações',
      value: data?.total || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-l-blue-500',
      tendencia: tendenciaTotal,
      link: '/desarquivamentos'
    },
    {
      title: 'Atenção necessária',
      value: data?.pendentes || 0,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-l-red-500',
      tendencia: tendenciaPendentes,
      destaque: (data?.pendentes || 0) > 0,
      link: `/desarquivamentos?status=${StatusDesarquivamento.SOLICITADO}`
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              </CardHeader>
              <CardContent>
                <div className="h-9 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.tendencia.tipo === 'alta' ? TrendingUp : 
                           stat.tendencia.tipo === 'baixa' ? TrendingDown : Minus
          
          return (
            <Link key={index} to={stat.link}>
              <Card
                className={cn(
                  "hover:shadow-lg transition-all duration-200 border-l-4 cursor-pointer",
                  stat.borderColor,
                  stat.destaque && "ring-2 ring-red-200 shadow-lg"
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("p-2.5 rounded-lg", stat.bgColor)}>
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-foreground">
                      {(stat.value ?? 0).toLocaleString()}
                    </div>
                    
                    {/* Indicador de tendência */}
                    {stat.tendencia.porcentagem !== 0 && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                        stat.tendencia.tipo === 'alta' && "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
                        stat.tendencia.tipo === 'baixa' && "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                        stat.tendencia.tipo === 'neutro' && "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400"
                      )}>
                        <TrendIcon className="h-3 w-3" />
                        <span>{Math.abs(stat.tendencia.porcentagem)}%</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.tendencia.tipo === 'alta' && `↗️ ${stat.tendencia.porcentagem}% em relação ao mês anterior`}
                    {stat.tendencia.tipo === 'baixa' && `↘️ ${stat.tendencia.porcentagem}% em relação ao mês anterior`}
                    {stat.tendencia.tipo === 'neutro' && '→ Sem mudanças significativas'}
                  </p>

                  {stat.destaque && stat.value === 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                      ✓ Tudo em dia
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Urgentes - Destaque especial */}
      {urgentesCount > 0 && (
        <Link to="/desarquivamentos?urgente=true">
          <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20 hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Solicitações Urgentes</p>
                    <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {urgentesCount}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Gráfico por Instituto */}
      {data.porInstituto && Object.keys(data.porInstituto).length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Desarquivamentos por Instituto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.porInstituto).map(([instituto, count]) => {
                const total = Object.values(data.porInstituto || {}).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0
                const instituteName = instituto === 'IC' ? 'Instituto de Criminalística' :
                                     instituto === 'II' ? 'Instituto de Identificação' :
                                     instituto === 'IML' ? 'Instituto de Medicina Legal' : instituto
                
                return (
                  <div key={instituto} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{instituteName}</span>
                      <span className="text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={cn(
                          "h-2.5 rounded-full transition-all",
                          instituto === 'IC' ? "bg-blue-600" :
                          instituto === 'II' ? "bg-green-600" :
                          instituto === 'IML' ? "bg-purple-600" : "bg-gray-600"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardStats
