import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Desarquivamento } from '@/types';

export interface DashboardStatsData {
  totalDesarquivamentos: number;
  atendimentosPendentes: number;
  atendimentosEsteMes: number;
  recentes: Desarquivamento[];
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
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}
