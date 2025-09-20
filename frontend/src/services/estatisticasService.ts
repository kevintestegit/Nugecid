import { api } from './api';

export interface CardData {
  totalDesarquivamentos: number;
  atendimentosPendentes: number;
  atendimentosEsteMes: number;
}

export interface ChartData {
  name: string;
  total?: number;
  value?: number;
}

export const getCardData = async (): Promise<CardData> => {
  const response = await api.get<{ success: boolean; data: CardData }>('/estatisticas/cards');
  return response.data?.data as CardData;
};

export const getAtendimentosPorMes = async (): Promise<ChartData[]> => {
  const response = await api.get<{ success: boolean; data: ChartData[] }>('/estatisticas/atendimentos-por-mes');
  return (response.data?.data as ChartData[]) ?? [];
};

export const getStatusDistribuicao = async (): Promise<ChartData[]> => {
  const response = await api.get<{ success: boolean; data: ChartData[] }>('/estatisticas/status-distribuicao');
  return (response.data?.data as ChartData[]) ?? [];
};