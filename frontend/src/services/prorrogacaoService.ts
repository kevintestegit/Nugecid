import { api } from "./api";
import { Desarquivamento } from "@/types";

export interface ProrrogacaoRequest {
  desarquivamentoId: string;
  aprovada: boolean;
  observacoes?: string;
  dataDecisao: string;
  usuarioResponsavel: string;
}

export interface ProrrogacaoResponse {
  id: string;
  desarquivamentoId: string;
  aprovada: boolean;
  observacoes?: string;
  dataDecisao: string;
  usuarioResponsavel: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificacaoConfig {
  diasParaAlerta: number;
  diasParaUrgente: number;
  enviarEmail: boolean;
  emailsNotificacao: string[];
}

class ProrrogacaoService {
  private baseUrl = "/nugecid/prorrogacoes";

  /**
   * Processar uma solicitação de prorrogação
   */
  async processarProrrogacao(
    request: ProrrogacaoRequest,
  ): Promise<ProrrogacaoResponse> {
    try {
      const response = await api.post<ProrrogacaoResponse>(
        `${this.baseUrl}/processar`,
        request,
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao processar prorrogação:", error);
      throw new Error("Falha ao processar prorrogação");
    }
  }

  /**
   * Listar todas as prorrogações de um desarquivamento
   */
  async listarProrrogacoes(
    desarquivamentoId: string,
  ): Promise<ProrrogacaoResponse[]> {
    try {
      const response = await api.get<ProrrogacaoResponse[]>(
        `${this.baseUrl}/desarquivamento/${desarquivamentoId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao listar prorrogações:", error);
      throw new Error("Falha ao carregar prorrogações");
    }
  }

  /**
   * Obter estatísticas de prorrogações
   */
  async obterEstatisticas(): Promise<{
    totalSolicitacoes: number;
    aprovadas: number;
    negadas: number;
    pendentes: number;
    porPrioridade: {
      alta: number;
      media: number;
      baixa: number;
    };
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/estatisticas`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      throw new Error("Falha ao carregar estatísticas");
    }
  }

  /**
   * Configurar notificações de prorrogação
   */
  async configurarNotificacoes(config: NotificacaoConfig): Promise<void> {
    try {
      await api.put(`${this.baseUrl}/configuracao/notificacoes`, config);
    } catch (error) {
      console.error("Erro ao configurar notificações:", error);
      throw new Error("Falha ao configurar notificações");
    }
  }

  /**
   * Obter configuração atual de notificações
   */
  async obterConfiguracaoNotificacoes(): Promise<NotificacaoConfig> {
    try {
      const response = await api.get<NotificacaoConfig>(
        `${this.baseUrl}/configuracao/notificacoes`,
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao obter configuração:", error);
      // Retornar configuração padrão em caso de erro
      return {
        diasParaAlerta: 7,
        diasParaUrgente: 10,
        enviarEmail: false,
        emailsNotificacao: [],
      };
    }
  }

  /**
   * Marcar notificação como lida
   */
  async marcarNotificacaoLida(desarquivamentoId: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/notificacoes/${desarquivamentoId}/lida`);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      // Não propagar o erro para não afetar a UX
    }
  }

  /**
   * Obter notificações não lidas
   */
  async obterNotificacoes(): Promise<{
    total: number;
    naoLidas: number;
    porPrioridade: {
      alta: number;
      media: number;
      baixa: number;
    };
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/notificacoes`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter notificações:", error);
      return {
        total: 0,
        naoLidas: 0,
        porPrioridade: {
          alta: 0,
          media: 0,
          baixa: 0,
        },
      };
    }
  }

  /**
   * Simular processamento de prorrogação (para desenvolvimento)
   */
  async simularProcessamento(
    desarquivamentoId: string,
    aprovada: boolean,
    observacoes?: string,
  ): Promise<void> {
    // Simular delay da API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    void desarquivamentoId;
    void aprovada;
    void observacoes;

    // Simulação de erro removida por segurança
    // Em produção, erros reais serão tratados adequadamente
  }

  /**
   * Verificar se um desarquivamento precisa de prorrogação
   */
  verificarNecessidadeProrrogacao(desarquivamento: Desarquivamento): {
    precisaProrrogacao: boolean;
    diasSolicitacao: number;
    prioridade: "alta" | "media" | "baixa";
    motivo: string;
  } {
    const hoje = new Date();
    const solicitacaoDate = new Date(desarquivamento.dataSolicitacao);
    const diffTime = hoje.getTime() - solicitacaoDate.getTime();
    const diasSolicitacao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let prioridade: "alta" | "media" | "baixa" = "baixa";
    let motivo = "Solicitação recente";
    let precisaProrrogacao = false;

    if (diasSolicitacao > 10) {
      prioridade = "alta";
      motivo = "Solicitação há mais de 10 dias - URGENTE";
      precisaProrrogacao = true;
    } else if (diasSolicitacao > 7) {
      prioridade = "media";
      motivo = "Solicitação há mais de 7 dias";
      precisaProrrogacao = true;
    } else if (diasSolicitacao > 5) {
      prioridade = "baixa";
      motivo = "Solicitação há mais de 5 dias";
      precisaProrrogacao = desarquivamento.solicitacaoProrrogacao;
    }

    return {
      precisaProrrogacao,
      diasSolicitacao,
      prioridade,
      motivo,
    };
  }
}

export const prorrogacaoService = new ProrrogacaoService();
export default prorrogacaoService;
