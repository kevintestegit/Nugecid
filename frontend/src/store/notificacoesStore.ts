import { create } from "zustand";
import {
  notificacoesService,
  Notificacao,
  EstatisticasNotificacoes,
  NotificacoesResponse,
} from "@/services/notificacoesService";

interface NotificacoesState {
  // --- Data ---
  naoLidas: Notificacao[];
  totalNaoLidas: number;
  estatisticas: EstatisticasNotificacoes | null;

  // --- SSE connection ---
  sseConnected: boolean;

  // --- Loading / Error ---
  loading: boolean;
  error: string | null;

  // --- Actions ---
  /** Replace the full unread list (called on SSE init). */
  setNaoLidas: (notificacoes: Notificacao[], total: number) => void;

  /** Add a single new notification pushed by SSE. */
  addNotificacao: (notificacao: Notificacao) => void;

  /** Mark a single notification as read (optimistic + API). */
  marcarComoLida: (id: number) => Promise<void>;

  /** Mark all notifications as read (optimistic + API). */
  marcarTodasComoLidas: () => Promise<void>;

  /** Delete a notification (optimistic + API). */
  excluirNotificacao: (id: number) => Promise<void>;

  /** Fetch unread notifications from the REST API (fallback / initial load). */
  fetchNaoLidas: () => Promise<void>;

  /** Fetch paginated notifications list (for the history page). */
  fetchNotificacoes: (params?: {
    page?: number;
    limit?: number;
    lida?: boolean;
    tipo?: string;
    prioridade?: string;
  }) => Promise<NotificacoesResponse>;

  /** Fetch statistics. */
  fetchEstatisticas: () => Promise<void>;

  /** Set SSE connection state. */
  setSseConnected: (connected: boolean) => void;

  /** Set error. */
  setError: (error: string | null) => void;
}

export const useNotificacoesStore = create<NotificacoesState>((set, get) => ({
  // --- Initial state ---
  naoLidas: [],
  totalNaoLidas: 0,
  estatisticas: null,
  sseConnected: false,
  loading: false,
  error: null,

  // --- Actions ---

  setNaoLidas: (notificacoes, total) => {
    set({ naoLidas: notificacoes, totalNaoLidas: total });
  },

  addNotificacao: (notificacao) => {
    set((state) => {
      // Avoid duplicates
      if (state.naoLidas.some((n) => n.id === notificacao.id)) {
        return state;
      }
      const updated = [notificacao, ...state.naoLidas];
      return {
        naoLidas: updated,
        totalNaoLidas: state.totalNaoLidas + 1,
      };
    });
  },

  marcarComoLida: async (id) => {
    // Optimistic update
    set((state) => ({
      naoLidas: state.naoLidas.filter((n) => n.id !== id),
      totalNaoLidas: Math.max(0, state.totalNaoLidas - 1),
      estatisticas: state.estatisticas
        ? {
            ...state.estatisticas,
            naoLidas: Math.max(0, state.estatisticas.naoLidas - 1),
            lidas: state.estatisticas.lidas + 1,
          }
        : null,
    }));
    try {
      await notificacoesService.marcarComoLida(id);
    } catch {
      // Revert on error - refetch
      get().fetchNaoLidas();
    }
  },

  marcarTodasComoLidas: async () => {
    const prevNaoLidas = get().naoLidas;
    const prevTotal = get().totalNaoLidas;
    // Optimistic
    set((state) => ({
      naoLidas: [],
      totalNaoLidas: 0,
      estatisticas: state.estatisticas
        ? {
            ...state.estatisticas,
            lidas: state.estatisticas.lidas + state.estatisticas.naoLidas,
            naoLidas: 0,
          }
        : null,
    }));
    try {
      await notificacoesService.marcarTodasComoLidas();
    } catch {
      // Revert
      set({ naoLidas: prevNaoLidas, totalNaoLidas: prevTotal });
    }
  },

  excluirNotificacao: async (id) => {
    const prev = get().naoLidas;
    const wasUnread = prev.some((n) => n.id === id);
    // Optimistic
    set((state) => ({
      naoLidas: state.naoLidas.filter((n) => n.id !== id),
      totalNaoLidas: wasUnread
        ? Math.max(0, state.totalNaoLidas - 1)
        : state.totalNaoLidas,
      estatisticas: state.estatisticas
        ? {
            ...state.estatisticas,
            total: Math.max(0, state.estatisticas.total - 1),
            naoLidas: wasUnread
              ? Math.max(0, state.estatisticas.naoLidas - 1)
              : state.estatisticas.naoLidas,
            lidas: wasUnread
              ? state.estatisticas.lidas
              : Math.max(0, state.estatisticas.lidas - 1),
          }
        : null,
    }));
    try {
      await notificacoesService.excluir(id);
    } catch {
      // Revert
      set({ naoLidas: prev });
    }
  },

  fetchNaoLidas: async () => {
    try {
      set({ loading: true, error: null });
      const data = await notificacoesService.buscarNaoLidas();
      const arr = Array.isArray(data) ? data : [];
      set({ naoLidas: arr, totalNaoLidas: arr.length, loading: false });
    } catch {
      set({ error: "Erro ao carregar notificações não lidas", loading: false });
    }
  },

  fetchNotificacoes: async (params) => {
    const response = await notificacoesService.buscarNotificacoes(params);
    return response;
  },

  fetchEstatisticas: async () => {
    try {
      const data = await notificacoesService.buscarEstatisticas();
      set({ estatisticas: data });
    } catch {
      // Silent - statistics are not critical
    }
  },

  setSseConnected: (connected) => {
    set({ sseConnected: connected });
  },

  setError: (error) => {
    set({ error });
  },
}));
