import { useState, useEffect, useCallback } from 'react';
import { 
  notificacoesService, 
  Notificacao, 
  NotificacoesResponse, 
  EstatisticasNotificacoes 
} from '../services/notificacoesService';

export const useNotificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState<Notificacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasNotificacoes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(true);

  // Buscar todas as notificações
  const fetchNotificacoes = useCallback(async (params?: {
    page?: number;
    limit?: number;
    lida?: boolean;
    tipo?: string;
    prioridade?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificacoesService.buscarNotificacoes(params);
      
      setNotificacoes(response.data);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao buscar notificações';
      setError(errorMessage);
      console.error('Erro ao buscar notificações:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar apenas notificações não lidas
  const fetchNaoLidas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificacoesService.buscarNaoLidas();
      // Garantir que data sempre seja um array
      setNaoLidas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar notificações não lidas');
      console.error('Erro ao buscar notificações não lidas:', err);
      // Em caso de erro, definir como array vazio
      setNaoLidas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar estatísticas
  const fetchEstatisticas = useCallback(async () => {
    try {
      const data = await notificacoesService.buscarEstatisticas();
      setEstatisticas(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error('Erro ao buscar estatísticas:', err);
      // Em caso de erro, definir estatísticas vazias
      setEstatisticas({
        total: 0,
        naoLidas: 0,
        lidas: 0,
        porTipo: {},
        porPrioridade: {}
      });
    }
  }, []);

  // Marcar notificação como lida
  const marcarComoLida = useCallback(async (id: number) => {
    try {
      await notificacoesService.marcarComoLida(id);
      
      // Atualizar estado local
      setNotificacoes(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );
      
      setNaoLidas(prev => prev.filter(notif => notif.id !== id));
      
      setError(null);
    } catch (err) {
      setError('Erro ao marcar notificação como lida');
      console.error('Erro ao marcar como lida:', err);
    }
  }, []);

  // Marcar todas como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await notificacoesService.marcarTodasComoLidas();
      
      // Atualizar estado local
      setNotificacoes(prev => 
        prev.map(notif => ({ ...notif, lida: true }))
      );
      
      setNaoLidas([]);
      setError(null);
    } catch (err) {
      setError('Erro ao marcar todas as notificações como lidas');
      console.error('Erro ao marcar todas como lidas:', err);
    }
  }, []);

  // Excluir notificação
  const excluirNotificacao = useCallback(async (id: number) => {
    try {
      await notificacoesService.excluir(id);
      
      // Atualizar estado local
      const notificacaoExcluida = notificacoes.find(n => n.id === id);
      
      setNotificacoes(prev => prev.filter(notif => notif.id !== id));
      setNaoLidas(prev => prev.filter(notif => notif.id !== id));
      
      // Atualizar estatísticas
      if (estatisticas && notificacaoExcluida) {
        setEstatisticas(prev => prev ? {
          ...prev,
          total: prev.total - 1,
          naoLidas: notificacaoExcluida.lida ? prev.naoLidas : prev.naoLidas - 1,
          lidas: notificacaoExcluida.lida ? prev.lidas - 1 : prev.lidas
        } : null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir notificação';
      setError(errorMessage);
      console.error('Erro ao excluir notificação:', err);
      throw err;
    }
  }, [notificacoes, estatisticas]);

  // Polling para buscar novas notificações a cada 30 segundos
  useEffect(() => {
    if (!pollingEnabled) return;

    const interval = setInterval(async () => {
      try {
        await fetchNaoLidas();
        await fetchEstatisticas();
      } catch (err) {
        // Silenciar erros do polling para não spam no console
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchNaoLidas, fetchEstatisticas, pollingEnabled]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchNaoLidas(),
          fetchEstatisticas()
        ]);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };

    loadInitialData();
  }, [fetchNaoLidas, fetchEstatisticas]);

  return {
    // Estados
    notificacoes,
    naoLidas,
    estatisticas,
    loading,
    error,
    pollingEnabled,
    
    // Ações
    fetchNotificacoes,
    fetchNaoLidas,
    fetchEstatisticas,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    setPollingEnabled,
    
    // Computed values
    totalNaoLidas: naoLidas.length,
    hasNotificacoes: naoLidas.length > 0,
  };
};