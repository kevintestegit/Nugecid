import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccessToken } from "@/utils/tokenStorage";

export interface DomainSyncEventDetail {
  scope: string;
  action: string;
  entityId?: number | string;
  entityType?: string;
  actorId?: number | null;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

const RECONNECT_BASE_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

export const useDomainSyncSSE = () => {
  const { user, isAuthenticated } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const useTokenFallbackRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current || !isAuthenticated || !user) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const accessToken = useTokenFallbackRef.current ? getAccessToken() : null;
    const streamUrl = accessToken
      ? `/api/sync/stream?token=${encodeURIComponent(accessToken)}`
      : "/api/sync/stream";
    const eventSource = new EventSource(streamUrl, {
      withCredentials: true,
    });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      reconnectAttemptsRef.current = 0;
    };

    eventSource.addEventListener("domain-change", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as DomainSyncEventDetail;
        window.dispatchEvent(
          new CustomEvent<DomainSyncEventDetail>("sgc:domain-sync", {
            detail: payload,
          }),
        );
      } catch {
        // Silent
      }
    });

    eventSource.onerror = () => {
      if (!isMountedRef.current) {
        return;
      }

      eventSource.close();

      if (!useTokenFallbackRef.current && getAccessToken()) {
        useTokenFallbackRef.current = true;
        connect();
        return;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
  }, [isAuthenticated, user]);

  useEffect(() => {
    isMountedRef.current = true;
    useTokenFallbackRef.current = false;
    connect();

    return () => {
      isMountedRef.current = false;
      useTokenFallbackRef.current = false;
      cleanup();
    };
  }, [cleanup, connect]);
};

export default useDomainSyncSSE;
