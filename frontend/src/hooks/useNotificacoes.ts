import { useEffect, useRef } from "react";
import { useNotificacoesStore } from "@/store/notificacoesStore";
import { useNotificacoesSSE } from "./useNotificacoesSSE";

export type { Notificacao } from "@/services/notificacoesService";

/**
 * Convenience hook that wires up SSE, polling fallback, and exposes the Zustand store.
 *
 * Mount this ONCE high in the component tree (e.g. Layout).
 * Other components can just use `useNotificacoesStore()` directly for reads.
 */
export const useNotificacoes = () => {
  const store = useNotificacoesStore();
  const sseConnected = useNotificacoesStore((state) => state.sseConnected);
  const fetchNaoLidas = useNotificacoesStore((state) => state.fetchNaoLidas);
  const fetchEstatisticas = useNotificacoesStore(
    (state) => state.fetchEstatisticas,
  );
  const isMountedRef = useRef(true);

  // Initialize SSE connection (writes into the Zustand store)
  useNotificacoesSSE();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Visibility tracking for polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When page becomes visible again and SSE is not connected, refresh data
      if (!document.hidden && !sseConnected) {
        fetchNaoLidas();
        fetchEstatisticas();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchEstatisticas, fetchNaoLidas, sseConnected]);

  // Polling fallback — only active when SSE is NOT connected
  useEffect(() => {
    if (sseConnected) return;

    const interval = setInterval(() => {
      if (
        typeof navigator !== "undefined" &&
        "onLine" in navigator &&
        !navigator.onLine
      ) {
        return;
      }
      fetchNaoLidas();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNaoLidas, sseConnected]);

  // Initial data load
  useEffect(() => {
    fetchNaoLidas();
    fetchEstatisticas();
  }, [fetchEstatisticas, fetchNaoLidas]);

  return {
    // State (from Zustand store)
    naoLidas: store.naoLidas,
    estatisticas: store.estatisticas,
    loading: store.loading,
    error: store.error,
    sseConnected: store.sseConnected,
    totalNaoLidas: store.totalNaoLidas,
    hasNotificacoes: store.totalNaoLidas > 0,

    // Actions (from Zustand store)
    marcarComoLida: store.marcarComoLida,
    marcarTodasComoLidas: store.marcarTodasComoLidas,
    excluirNotificacao: store.excluirNotificacao,
    fetchNotificacoes: store.fetchNotificacoes,
    fetchNaoLidas: store.fetchNaoLidas,
    fetchEstatisticas: store.fetchEstatisticas,
  };
};
