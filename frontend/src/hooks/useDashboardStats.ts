import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Desarquivamento } from '@/types';

export interface DashboardStatsData {
  totalDesarquivamentos: number;
  atendimentosPendentes?: number;
  requisicoesPendentes?: number;
  pendentesAtrasados?: number;
  atendimentosEsteMes: number;
  recentes: Desarquivamento[];
  urgentes?: number;
  porTipo?: Record<string, number>;
  porStatus?: Record<string, number>;
  totalMesAnterior?: number;
  pendentesMesAnterior?: number;
}

export interface DashboardStatsResponse {
  statusCode: number;
  message: string;
  data: DashboardStatsData;
}

export const QUERY_KEYS = {
  dashboardStats: ['dashboardStats'] as const,
};

export function useDashboardStats() {
  return useQuery<DashboardStatsResponse, Error>({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: async () => {
      const response = await api.get('/estatisticas/cards');
      return response.data;
    },
    staleTime: 30000, // 30s para reduzir refetch agressivo mantendo frescor
    retry: 2,
  });
}
