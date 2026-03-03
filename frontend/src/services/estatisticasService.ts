import { api } from "./api";

export interface CardData {
  totalDesarquivamentos: number;
  atendimentosPendentes: number;
  atendimentosEsteMes: number;
  requisicoesPendentes?: number;
  requisicoesEsteMes?: number;
  recentes?: Array<{ id: number; [key: string]: unknown }>; // Opcional, caso o backend envie
}

export interface FiltrosEstatisticas {
  dataInicio?: string;
  dataFim?: string;
}

export interface ChartData {
  name: string;
  total?: number;
  value?: number;
}

export const getCardData = async (
  filtros?: FiltrosEstatisticas,
): Promise<CardData> => {
  const params = new URLSearchParams();
  if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
  if (filtros?.dataFim) params.append("dataFim", filtros.dataFim);

  const response = await api.get<{ success: boolean; data: CardData }>(
    `/estatisticas/cards${params.toString() ? "?" + params.toString() : ""}`,
  );
  return response.data?.data as CardData;
};

export const getRequisicoesPorMes = async (
  filtros?: FiltrosEstatisticas,
): Promise<ChartData[]> => {
  const params = new URLSearchParams();
  if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
  if (filtros?.dataFim) params.append("dataFim", filtros.dataFim);

  const response = await api.get<{ success: boolean; data: ChartData[] }>(
    `/estatisticas/requisicoes-por-mes${params.toString() ? "?" + params.toString() : ""}`,
  );
  return (response.data?.data as ChartData[]) ?? [];
};

// Alias para compatibilidade
export const getAtendimentosPorMes = getRequisicoesPorMes;

export const getStatusDistribuicao = async (
  filtros?: FiltrosEstatisticas,
): Promise<ChartData[]> => {
  const params = new URLSearchParams();
  if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
  if (filtros?.dataFim) params.append("dataFim", filtros.dataFim);

  const response = await api.get<{ success: boolean; data: ChartData[] }>(
    `/estatisticas/status-distribuicao${params.toString() ? "?" + params.toString() : ""}`,
  );
  return (response.data?.data as ChartData[]) ?? [];
};

export const exportRelatorioPdf = async (
  filtros?: FiltrosEstatisticas,
): Promise<void> => {
  const params = new URLSearchParams();
  if (filtros?.dataInicio) params.append("dataInicio", filtros.dataInicio);
  if (filtros?.dataFim) params.append("dataFim", filtros.dataFim);

  const response = await api.get(
    `/estatisticas/pdf${params.toString() ? "?" + params.toString() : ""}`,
    { responseType: "blob" },
  );

  // Criar URL temporária para o blob e fazer download
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-estatisticas-${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportRelatorioMensalPdf = async (
  ano: number,
  mes: number,
  pagina?: number,
  limite?: number,
): Promise<void> => {
  const params = new URLSearchParams();
  if (pagina) params.append("pagina", pagina.toString());
  if (limite) params.append("limite", limite.toString());

  const response = await api.get(
    `/estatisticas/pdf-mensal/${ano}/${mes}${params.toString() ? "?" + params.toString() : ""}`,
    { responseType: "blob" },
  );

  // Criar URL temporária para o blob e fazer download
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-mensal-${ano}-${mes.toString().padStart(2, "0")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
