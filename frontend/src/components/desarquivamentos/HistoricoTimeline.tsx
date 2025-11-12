import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Clock, User, CheckCircle, XCircle } from 'lucide-react'
import { useDesarquivamentoHistorico, HistoricoItem } from '@/hooks/useDesarquivamentoHistorico'
import { formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

interface HistoricoTimelineProps {
  desarquivamentoId: number
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'UPDATE':
      return <Clock className="h-4 w-4 text-blue-500" />
    case 'DELETE':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'DELETE':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export const HistoricoTimeline: React.FC<HistoricoTimelineProps> = ({ desarquivamentoId }) => {
  const { data: historico, isLoading, error } = useDesarquivamentoHistorico(desarquivamentoId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
          <CardDescription className="text-red-500">
            Erro ao carregar histórico
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!historico || historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
          <CardDescription>Nenhuma ação registrada</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Ações
        </CardTitle>
        <CardDescription>
          {historico.length} {historico.length === 1 ? 'ação registrada' : 'ações registradas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha vertical da timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Items da timeline */}
          <div className="space-y-6">
            {historico.map((item, index) => (
              <div key={item.id} className="relative pl-10">
                {/* Ponto da timeline */}
                <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background">
                  {getActionIcon(item.action)}
                </div>

                {/* Conteúdo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn('text-xs', getActionColor(item.action))}>
                      {item.actionLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  {item.user && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{item.user.nome}</span>
                    </div>
                  )}

                  {item.details?.details && (
                    <p className="text-sm text-foreground">
                      {item.details.details}
                    </p>
                  )}

                  {/* Detalhes adicionais (se houver mudanças) */}
                  {item.details?.changes && Object.keys(item.details.changes).length > 0 && (
                    <div className="mt-2 rounded-lg border border-border bg-muted/50 p-3 text-xs space-y-1">
                      <div className="font-semibold text-muted-foreground">Alterações:</div>
                      {Object.entries(item.details.changes).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-foreground">{key}:</span>
                          <span className="text-muted-foreground">
                            {value?.from ?? '(vazio)'} → {value?.to ?? '(vazio)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
