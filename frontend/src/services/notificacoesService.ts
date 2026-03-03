import { api } from "./api";

type ApiResponseEnvelope<T> = {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  data: T;
  meta?: Record<string, unknown>;
};

const unwrap = <T>(response: { data: unknown }): T => {
  if (!response) return undefined as T;

  const payload =
    (response.data as Record<string, unknown>)?.data ?? response.data;
  return payload as T;
};

export interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  descricao: string;
  detalhes?: Record<string, unknown>;
  prioridade: "critica" | "alta" | "media" | "baixa";
  lida: boolean;
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
  tarefaId?: number;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificacoesResponse {
  data: Notificacao[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EstatisticasNotificacoes {
  total: number;
  naoLidas: number;
  lidas: number;
  porTipo: Record<string, number>;
  porPrioridade: Record<string, number>;
}

export interface CreateNotificacaoDto {
  tipo: "solicitacao_pendente" | "novo_processo";
  titulo: string;
  descricao: string;
  detalhes?: Record<string, unknown>;
  prioridade: "critica" | "alta" | "media" | "baixa";
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
}

export class NotificacoesService {
  private baseUrl = "/notificacoes";

  /**
   * Buscar todas as notificações com filtros e paginação
   */
  async buscarNotificacoes(params?: {
    page?: number;
    limit?: number;
    lida?: boolean;
    tipo?: string;
    prioridade?: string;
  }): Promise<NotificacoesResponse> {
    const response = await api.get<ApiResponseEnvelope<NotificacoesResponse>>(
      this.baseUrl,
      {
        params,
      },
    );
    return unwrap<NotificacoesResponse>(response);
  }

  /**
   * Buscar apenas notificações não lidas
   */
  async buscarNaoLidas(): Promise<Notificacao[]> {
    const response = await api.get<ApiResponseEnvelope<NotificacoesResponse>>(
      `${this.baseUrl}/nao-lidas`,
    );
    const payload = unwrap<NotificacoesResponse>(response);
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return Array.isArray(payload as unknown)
      ? (payload as unknown as Notificacao[])
      : [];
  }

  /**
   * Buscar uma notificação específica por ID
   */
  async buscarPorId(id: number): Promise<Notificacao> {
    const response = await api.get<ApiResponseEnvelope<Notificacao>>(
      `${this.baseUrl}/${id}`,
    );
    return unwrap<Notificacao>(response);
  }

  /**
   * Criar uma nova notificação
   */
  async criar(data: CreateNotificacaoDto): Promise<Notificacao> {
    const response = await api.post<ApiResponseEnvelope<Notificacao>>(
      this.baseUrl,
      data,
    );
    return unwrap<Notificacao>(response);
  }

  /**
   * Marcar notificação como lida
   */
  async marcarComoLida(id: number): Promise<Notificacao> {
    const response = await api.patch<ApiResponseEnvelope<Notificacao>>(
      `${this.baseUrl}/${id}/marcar-lida`,
    );
    return unwrap<Notificacao>(response);
  }

  /**
   * Marcar notificação como não lida
   */
  async marcarComoNaoLida(id: number): Promise<Notificacao> {
    const response = await api.patch<ApiResponseEnvelope<Notificacao>>(
      `${this.baseUrl}/${id}/marcar-nao-lida`,
    );
    return unwrap<Notificacao>(response);
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async marcarTodasComoLidas(): Promise<{ affected: number }> {
    const response = await api.patch<ApiResponseEnvelope<{ affected: number }>>(
      `${this.baseUrl}/marcar-todas-lidas`,
    );
    return unwrap<{ affected: number }>(response);
  }

  /**
   * Excluir uma notificação
   */
  async excluir(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Buscar estatísticas das notificações
   */
  async buscarEstatisticas(): Promise<EstatisticasNotificacoes> {
    const response = await api.get<
      ApiResponseEnvelope<EstatisticasNotificacoes>
    >(`${this.baseUrl}/estatisticas`);
    return unwrap<EstatisticasNotificacoes>(response);
  }

  /**
   * Verificar solicitações pendentes manualmente
   */
  async verificarSolicitacoesPendentes(): Promise<{
    message: string;
    notificacoesCriadas: number;
  }> {
    const response = await api.post<
      ApiResponseEnvelope<{ message: string; notificacoesCriadas: number }>
    >(`${this.baseUrl}/verificar-pendentes`);
    return unwrap<{ message: string; notificacoesCriadas: number }>(response);
  }

  /**
   * Verificar tarefas com prazo próximo
   */
  async verificarPrazos(): Promise<{ notificacoesCriadas: number }> {
    const response = await api.post<
      ApiResponseEnvelope<{ notificacoesCriadas: number }>
    >(`${this.baseUrl}/verificar-prazos`);
    return unwrap<{ notificacoesCriadas: number }>(response);
  }

  /**
   * Verificar tarefas atrasadas
   */
  async verificarAtrasadas(): Promise<{ notificacoesCriadas: number }> {
    const response = await api.post<
      ApiResponseEnvelope<{ notificacoesCriadas: number }>
    >(`${this.baseUrl}/verificar-atrasadas`);
    return unwrap<{ notificacoesCriadas: number }>(response);
  }

  /**
   * Buscar notificações por tipo
   */
  async buscarPorTipo(
    tipo: "SOLICITACAO_PENDENTE" | "NOVO_PROCESSO",
    params?: {
      page?: number;
      limit?: number;
    },
  ): Promise<NotificacoesResponse> {
    const response = await api.get<ApiResponseEnvelope<NotificacoesResponse>>(
      `${this.baseUrl}/tipo/${tipo}`,
      {
        params,
      },
    );
    return unwrap<NotificacoesResponse>(response);
  }

  /**
   * Buscar notificações de solicitações pendentes
   */
  async buscarSolicitacoesPendentes(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificacoesResponse> {
    return this.buscarPorTipo("SOLICITACAO_PENDENTE", params);
  }

  /**
   * Buscar notificações de novos processos
   */
  async buscarNovosProcessos(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificacoesResponse> {
    return this.buscarPorTipo("NOVO_PROCESSO", params);
  }
}

// Instância singleton do serviço
export const notificacoesService = new NotificacoesService();

// Export default para compatibilidade
export default notificacoesService;
