import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export interface HistoricoItem {
  id: number
  action: string
  actionLabel: string
  details: any
  timestamp: string
  user: {
    id: number
    nome: string
    usuario: string
  } | null
  ipAddress: string
  success: boolean
}

export const useDesarquivamentoHistorico = (desarquivamentoId: number) => {
  return useQuery({
    queryKey: ['desarquivamento-historico', desarquivamentoId],
    queryFn: async () => {
      const { data } = await api.get(`/nugecid/${desarquivamentoId}/historico`)
      return data.data as HistoricoItem[]
    },
    enabled: !!desarquivamentoId,
  })
}
