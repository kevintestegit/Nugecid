import { api } from './api';

export interface Notificacao {
  id: number;
  tipo: 'solicitacao_pendente' | 'novo_processo';
  titulo: string;
  descricao: string;
  detalhes?: Record<string, any>;
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  lida: boolean;
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
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
  tipo: 'solicitacao_pendente' | 'novo_processo';
  titulo: string;
  descricao: string;
  detalhes?: Record<string, any>;
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
}

export class NotificacoesService {
  private baseUrl = '/notificacoes';

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
    const response = await api.get<NotificacoesResponse>(this.baseUrl, {
      params,
    });
    return response.data;
  }

  /**
   * Buscar apenas notificações não lidas
   */
  async buscarNaoLidas(): Promise<Notificacao[]> {
    try {
      const response = await api.get<NotificacoesResponse>(`${this.baseUrl}/nao-lidas`);
      return response.data.data;
    } catch (err: any) {
      console.error('Erro detalhado ao buscar não lidas:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: `${this.baseUrl}/nao-lidas`
      });
      throw err;
    }
  }

  /**
   * Buscar uma notificação específica por ID
   */
  async buscarPorId(id: number): Promise<Notificacao> {
    const response = await api.get<Notificacao>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Criar uma nova notificação
   */
  async criar(data: CreateNotificacaoDto): Promise<Notificacao> {
    const response = await api.post<Notificacao>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Marcar notificação como lida
   */
  async marcarComoLida(id: number): Promise<Notificacao> {
    const response = await api.patch<Notificacao>(`${this.baseUrl}/${id}/marcar-lida`);
    return response.data;
  }

  /**
   * Marcar notificação como não lida
   */
  async marcarComoNaoLida(id: number): Promise<Notificacao> {
    const response = await api.patch<Notificacao>(`${this.baseUrl}/${id}/marcar-nao-lida`);
    return response.data;
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async marcarTodasComoLidas(): Promise<{ affected: number }> {
    const response = await api.patch<{ affected: number }>(`${this.baseUrl}/marcar-todas-lidas`);
    return response.data;
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
    try {
      const response = await api.get<EstatisticasNotificacoes>(`${this.baseUrl}/estatisticas`);
      return response.data;
    } catch (err: any) {
      console.error('Erro detalhado ao buscar estatísticas:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: `${this.baseUrl}/estatisticas`
      });
      throw err;
    }
  }

  /**
   * Verificar solicitações pendentes manualmente
   */
  async verificarSolicitacoesPendentes(): Promise<{ message: string; notificacoesCriadas: number }> {
    const response = await api.post<{ message: string; notificacoesCriadas: number }>(
      `${this.baseUrl}/verificar-pendentes`
    );
    return response.data;
  }

  /**
   * Buscar notificações por tipo
   */
  async buscarPorTipo(tipo: 'SOLICITACAO_PENDENTE' | 'NOVO_PROCESSO', params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificacoesResponse> {
    const response = await api.get<NotificacoesResponse>(`${this.baseUrl}/tipo/${tipo}`, {
      params,
    });
    return response.data;
  }

  /**
   * Buscar notificações de solicitações pendentes
   */
  async buscarSolicitacoesPendentes(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificacoesResponse> {
    return this.buscarPorTipo('SOLICITACAO_PENDENTE', params);
  }

  /**
   * Buscar notificações de novos processos
   */
  async buscarNovosProcessos(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificacoesResponse> {
    return this.buscarPorTipo('NOVO_PROCESSO', params);
  }
}

// Instância singleton do serviço
export const notificacoesService = new NotificacoesService();

// Export default para compatibilidade
export default notificacoesService;