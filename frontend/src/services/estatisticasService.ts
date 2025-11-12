import { api } from './api';

export interface CardData {
  totalDesarquivamentos: number;
  atendimentosPendentes: number;
  atendimentosEsteMes: number;
  recentes?: any[]; // Opcional, caso o backend envie
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

export const exportRelatorioPdf = async (): Promise<void> => {
  const response = await api.get('/estatisticas/pdf', {
    responseType: 'blob',
  });

  // Criar URL temporária para o blob e fazer download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-estatisticas-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportRelatorioMensalPdf = async (ano: number, mes: number): Promise<void> => {
  const response = await api.get(`/estatisticas/pdf-mensal/${ano}/${mes}`, {
    responseType: 'blob',
  });

  // Criar URL temporária para o blob e fazer download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-mensal-${ano}-${mes.toString().padStart(2, '0')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};