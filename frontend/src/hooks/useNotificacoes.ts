import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  notificacoesService,
  Notificacao,
  EstatisticasNotificacoes,
} from "../services/notificacoesService";

export type { Notificacao };

export const useNotificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState<Notificacao[]>([]);
  const [estatisticas, setEstatisticas] =
    useState<EstatisticasNotificacoes | null>(null);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const [loadingNaoLidas, setLoadingNaoLidas] = useState(false);
  const [loadingEstatisticas, setLoadingEstatisticas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(
    typeof document !== "undefined" ? !document.hidden : true,
  );

  const isMountedRef = useRef(true);
  const notificacoesReqIdRef = useRef(0);
  const naoLidasReqIdRef = useRef(0);
  const estatisticasReqIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Buscar todas as notificações
  const fetchNotificacoes = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      lida?: boolean;
      tipo?: string;
      prioridade?: string;
    }) => {
      const requestId = ++notificacoesReqIdRef.current;
      try {
        setLoadingNotificacoes(true);
        setError(null);

        const response = await notificacoesService.buscarNotificacoes(params);

        if (
          !isMountedRef.current ||
          requestId !== notificacoesReqIdRef.current
        ) {
          return response;
        }

        setNotificacoes(Array.isArray(response.data) ? response.data : []);
        return response;
      } catch (err: any) {
        if (
          !isMountedRef.current ||
          requestId !== notificacoesReqIdRef.current
        ) {
          throw err;
        }
        const errorMessage =
          err.response?.data?.message || "Erro ao buscar notificações";
        setError(errorMessage);
        console.error("Erro ao buscar notificações:", err);
        throw err;
      } finally {
        if (
          isMountedRef.current &&
          requestId === notificacoesReqIdRef.current
        ) {
          setLoadingNotificacoes(false);
        }
      }
    },
    [],
  );

  // Buscar apenas notificações não lidas
  const fetchNaoLidas = useCallback(async () => {
    const requestId = ++naoLidasReqIdRef.current;
    try {
      setLoadingNaoLidas(true);
      const data = await notificacoesService.buscarNaoLidas();

      if (!isMountedRef.current || requestId !== naoLidasReqIdRef.current) {
        return;
      }

      setNaoLidas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current || requestId !== naoLidasReqIdRef.current) {
        return;
      }
      setError("Erro ao carregar notificações não lidas");
      console.error("Erro ao buscar notificações não lidas:", err);
    } finally {
      if (isMountedRef.current && requestId === naoLidasReqIdRef.current) {
        setLoadingNaoLidas(false);
      }
    }
  }, []);

  // Buscar estatísticas
  const fetchEstatisticas = useCallback(async () => {
    const requestId = ++estatisticasReqIdRef.current;
    try {
      setLoadingEstatisticas(true);
      const data = await notificacoesService.buscarEstatisticas();

      if (!isMountedRef.current || requestId !== estatisticasReqIdRef.current) {
        return;
      }

      setEstatisticas(data);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current || requestId !== estatisticasReqIdRef.current) {
        return;
      }
      setError("Erro ao carregar estatísticas");
      console.error("Erro ao buscar estatísticas:", err);
    } finally {
      if (isMountedRef.current && requestId === estatisticasReqIdRef.current) {
        setLoadingEstatisticas(false);
      }
    }
  }, []);

  // Marcar notificação como lida
  const marcarComoLida = useCallback(async (id: number) => {
    try {
      await notificacoesService.marcarComoLida(id);

      // Atualizar estado local
      setNotificacoes((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, lida: true } : notif,
        ),
      );

      setNaoLidas((prev) => prev.filter((notif) => notif.id !== id));
      setEstatisticas((prev) => {
        if (!prev || prev.naoLidas <= 0) return prev;
        return {
          ...prev,
          naoLidas: Math.max(0, prev.naoLidas - 1),
          lidas: prev.lidas + 1,
        };
      });

      setError(null);
    } catch (err) {
      setError("Erro ao marcar notificação como lida");
      console.error("Erro ao marcar como lida:", err);
    }
  }, []);

  // Marcar todas como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await notificacoesService.marcarTodasComoLidas();

      // Atualizar estado local
      setNotificacoes((prev) =>
        prev.map((notif) => ({ ...notif, lida: true })),
      );

      setNaoLidas([]);
      setEstatisticas((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lidas: prev.lidas + prev.naoLidas,
          naoLidas: 0,
        };
      });
      setError(null);
    } catch (err) {
      setError("Erro ao marcar todas as notificações como lidas");
      console.error("Erro ao marcar todas como lidas:", err);
    }
  }, []);

  // Excluir notificação
  const excluirNotificacao = useCallback(async (id: number) => {
    try {
      await notificacoesService.excluir(id);

      let wasUnread = false;
      setNotificacoes((prev) => {
        const target = prev.find((notif) => notif.id === id);
        wasUnread = target ? !target.lida : false;
        return prev.filter((notif) => notif.id !== id);
      });
      setNaoLidas((prev) => prev.filter((notif) => notif.id !== id));

      setEstatisticas((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: Math.max(0, prev.total - 1),
          naoLidas: wasUnread ? Math.max(0, prev.naoLidas - 1) : prev.naoLidas,
          lidas: wasUnread ? prev.lidas : Math.max(0, prev.lidas - 1),
        };
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao excluir notificação";
      setError(errorMessage);
      console.error("Erro ao excluir notificação:", err);
      throw err;
    }
  }, []);

  // Polling para buscar novas notificações a cada 30 segundos
  useEffect(() => {
    if (!pollingEnabled || !isPageVisible) return;

    const interval = setInterval(async () => {
      try {
        if (
          typeof navigator !== "undefined" &&
          "onLine" in navigator &&
          !navigator.onLine
        ) {
          return;
        }
        await Promise.all([fetchNaoLidas(), fetchEstatisticas()]);
      } catch (err) {
        // Silenciar erros do polling para não spam no console
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchNaoLidas, fetchEstatisticas, pollingEnabled, isPageVisible]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchNaoLidas(), fetchEstatisticas()]);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    };

    loadInitialData();
  }, [fetchNaoLidas, fetchEstatisticas]);

  const loading = useMemo(
    () => loadingNotificacoes || loadingNaoLidas || loadingEstatisticas,
    [loadingNotificacoes, loadingNaoLidas, loadingEstatisticas],
  );

  return {
    // Estados
    notificacoes,
    naoLidas,
    estatisticas,
    loading,
    loadingNotificacoes,
    loadingNaoLidas,
    loadingEstatisticas,
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
