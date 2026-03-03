import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificacoesStore } from "@/store/notificacoesStore";
import { Notificacao } from "@/services/notificacoesService";

interface InitEventData {
  notificacoes: Notificacao[];
  total: number;
  timestamp: string;
}

interface NovaNotificacaoEventData {
  notificacao: Notificacao;
  timestamp: string;
}

const RECONNECT_BASE_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Connects to the SSE endpoint and pushes events into the Zustand store.
 * - `init` event: sets the full unread list (sent once on connection open).
 * - `nova-notificacao` event: adds a single new notification in real-time.
 * - `heartbeat` event: ignored (keeps connection alive).
 *
 * This hook should be mounted ONCE (in Layout or App), not per-component.
 */
export const useNotificacoesSSE = () => {
  const { user } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const { setNaoLidas, addNotificacao, setSseConnected, setError } =
    useNotificacoesStore();

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setSseConnected(false);
  }, [setSseConnected]);

  const connect = useCallback(() => {
    if (!user || !isMountedRef.current) return;

    // Clear any pending reconnect timeout to prevent double connections
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close previous connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Auth is handled via httpOnly cookies — no token query param needed
    const eventSource = new EventSource(`/api/notificacoes/stream`, {
      withCredentials: true,
    });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      if (!isMountedRef.current) return;
      setSseConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    // Handle "init" event — full batch of unread notifications on connect
    eventSource.addEventListener("init", (event: MessageEvent) => {
      try {
        const data: InitEventData = JSON.parse(event.data);
        setNaoLidas(data.notificacoes, data.total);
      } catch {
        // Silent
      }
    });

    // Handle "nova-notificacao" event — single new notification in real-time
    eventSource.addEventListener("nova-notificacao", (event: MessageEvent) => {
      try {
        const data: NovaNotificacaoEventData = JSON.parse(event.data);
        addNotificacao(data.notificacao);
        window.dispatchEvent(
          new CustomEvent("sgc:realtime-notificacao", {
            detail: { notificacao: data.notificacao },
          }),
        );
      } catch {
        // Silent
      }
    });

    // Handle legacy "notificacoes" event for backward compatibility
    eventSource.addEventListener("notificacoes", (event: MessageEvent) => {
      try {
        const data: InitEventData = JSON.parse(event.data);
        setNaoLidas(data.notificacoes, data.total);
      } catch {
        // Silent
      }
    });

    // Heartbeat is automatically handled by EventSource (no action needed)

    eventSource.onerror = () => {
      if (!isMountedRef.current) return;

      setSseConnected(false);
      eventSource.close();

      if (
        typeof navigator !== "undefined" &&
        "onLine" in navigator &&
        !navigator.onLine
      ) {
        setError("Sem conexão com a internet. Aguardando reconexão...");
      } else {
        setError("Conexão em tempo real instável. Tentando reconectar...");
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const attempts = reconnectAttemptsRef.current;
      const delay = Math.min(
        RECONNECT_BASE_DELAY_MS * Math.pow(2, attempts),
        MAX_RECONNECT_DELAY_MS,
      );
      reconnectAttemptsRef.current = attempts + 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, delay);
    };
  }, [user, setSseConnected, setError, setNaoLidas, addNotificacao]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);
};
