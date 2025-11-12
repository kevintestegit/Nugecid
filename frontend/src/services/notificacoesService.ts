import { api } from './api';

type ApiResponseEnvelope<T> = {
  success: boolean
  statusCode: number
  timestamp: string
  path: string
  method: string
  data: T
  meta?: any
}

const unwrap = <T>(response: { data: any }): T => {
  if (!response) return undefined as T

  const payload = response.data?.data ?? response.data
  return payload as T
}

export interface Notificacao {
  id: number;
  tipo: 
    | 'solicitacao_pendente' 
    | 'novo_processo'
    | 'mencao'
    | 'tarefa_atribuida'
    | 'tarefa_alterada'
    | 'tarefa_comentada'
    | 'prazo_proximo'
    | 'tarefa_atrasada'
    | 'projeto_atualizado';
  titulo: string;
  descricao: string;
  detalhes?: Record<string, any>;
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  lida: boolean;
  usuarioId: number;
  solicitacaoId?: number;
  processoId?: number;
  tarefaId?: number;
  projetoId?: number;
  remetenteId?: number;
  link?: string;
  remetente?: {
    id: number;
    nome: string;
  };
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
    const response = await api.get<ApiResponseEnvelope<NotificacoesResponse>>(this.baseUrl, {
      params,
    });
    return unwrap<NotificacoesResponse>(response);
  }

  /**
   * Buscar apenas notificações não lidas
   */
  async buscarNaoLidas(): Promise<Notificacao[]> {
    try {
      const response = await api.get<ApiResponseEnvelope<NotificacoesResponse>>(`${this.baseUrl}/nao-lidas`);
      const payload = unwrap<NotificacoesResponse>(response);
      if (Array.isArray(payload?.data)) {
        return payload.data;
      }
      return Array.isArray(payload as any) ? (payload as any) : [];
    } catch (err: any) {
      console.error('Erro detalhado ao buscar não lidas:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: `${this.baseUrl}/nao-lidas`
      });
      // Em caso de erro, retornar array vazio em vez de lançar erro
      return [];
    }
  }

  /**
   * Buscar uma notificação específica por ID
   */
  async buscarPorId(id: number): Promise<Notificacao> {
    const response = await api.get<ApiResponseEnvelope<Notificacao>>(`${this.baseUrl}/${id}`);
    return unwrap<Notificacao>(response);
  }

  /**
   * Criar uma nova notificação
   */
  async criar(data: CreateNotificacaoDto): Promise<Notificacao> {
    const response = await api.post<ApiResponseEnvelope<Notificacao>>(this.baseUrl, data);
    return unwrap<Notificacao>(response);
  }

  /**
   * Marcar notificação como lida
   */
  async marcarComoLida(id: number): Promise<Notificacao> {
    const response = await api.patch<ApiResponseEnvelope<Notificacao>>(`${this.baseUrl}/${id}/marcar-lida`);
    return unwrap<Notificacao>(response);
  }

  /**
   * Marcar notificação como não lida
   */
  async marcarComoNaoLida(id: number): Promise<Notificacao> {
    const response = await api.patch<ApiResponseEnvelope<Notificacao>>(`${this.baseUrl}/${id}/marcar-nao-lida`);
    return unwrap<Notificacao>(response);
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async marcarTodasComoLidas(): Promise<{ affected: number }> {
    const response = await api.patch<ApiResponseEnvelope<{ affected: number }>>(`${this.baseUrl}/marcar-todas-lidas`);
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
    try {
      const response = await api.get<ApiResponseEnvelope<EstatisticasNotificacoes>>(`${this.baseUrl}/estatisticas`);
      return unwrap<EstatisticasNotificacoes>(response);
    } catch (err: any) {
      console.error('Erro detalhado ao buscar estatísticas:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: `${this.baseUrl}/estatisticas`
      });
      // Em caso de erro, retornar estatísticas vazias
      return {
        total: 0,
        naoLidas: 0,
        lidas: 0,
        porTipo: {},
        porPrioridade: {}
      };
    }
  }

  /**
   * Verificar solicitações pendentes manualmente
   */
  async verificarSolicitacoesPendentes(): Promise<{ message: string; notificacoesCriadas: number }> {
    const response = await api.post<ApiResponseEnvelope<{ message: string; notificacoesCriadas: number }>>(
      `${this.baseUrl}/verificar-pendentes`
    );
    return unwrap<{ message: string; notificacoesCriadas: number }>(response);
  }

  /**
   * Verificar tarefas com prazo próximo
   */
  async verificarPrazos(): Promise<{ notificacoesCriadas: number }> {
    const response = await api.post<ApiResponseEnvelope<{ notificacoesCriadas: number }>>(
      `${this.baseUrl}/verificar-prazos`
    );
    return unwrap<{ notificacoesCriadas: number }>(response);
  }

  /**
   * Verificar tarefas atrasadas
   */
  async verificarAtrasadas(): Promise<{ notificacoesCriadas: number }> {
    const response = await api.post<ApiResponseEnvelope<{ notificacoesCriadas: number }>>(
      `${this.baseUrl}/verificar-atrasadas`
    );
    return unwrap<{ notificacoesCriadas: number }>(response);
  }

  /**
   * Buscar notificações por tipo
   */
  async buscarPorTipo(tipo: 'SOLICITACAO_PENDENTE' | 'NOVO_PROCESSO', params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificacoesResponse> {
    const response = await api.get<ApiResponseEnvelope<NotificacoesResponse>>(`${this.baseUrl}/tipo/${tipo}`, {
      params,
    });
    return unwrap<NotificacoesResponse>(response);
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
