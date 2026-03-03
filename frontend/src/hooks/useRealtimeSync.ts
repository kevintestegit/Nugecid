import { useCallback, useEffect, useRef } from "react";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import type { Notificacao } from "@/services/notificacoesService";
import type { DomainSyncEventDetail } from "@/hooks/useDomainSyncSSE";

const GLOBAL_SYNC_INTERVAL_MS = 45000;
const MIN_GLOBAL_SYNC_GAP_MS = 5000;

const DASHBOARD_QUERY_KEY = ["dashboardStats"] as const;
const DESARQUIVAMENTOS_QUERY_KEY = ["desarquivamentos"] as const;
const DESARQUIVAMENTOS_LIXEIRA_QUERY_KEY = [
  "desarquivamentos-lixeira",
] as const;
const DESARQUIVAMENTO_COMMENTS_QUERY_KEY = [
  "desarquivamento-comments",
] as const;
const DESARQUIVAMENTO_HISTORICO_QUERY_KEY = [
  "desarquivamento-historico",
] as const;
const USER_TASKS_QUERY_KEY = ["userTasks"] as const;
const TAREFAS_QUERY_KEY = ["tarefas"] as const;
const PROJETOS_QUERY_KEY = ["projetos"] as const;
const ONLINE_USERS_QUERY_KEY = ["onlineUsers"] as const;
const PASTAS_QUERY_KEY = ["pastas"] as const;
const PASTAS_ITEM_SEARCH_QUERY_KEY = ["pastas", "item-search"] as const;
const PLANILHAS_QUERY_KEY = ["planilhas-controle"] as const;
const PLANILHAS_GERAL_QUERY_KEY = ["planilhas-controle", "geral"] as const;
const USERS_QUERY_KEY = ["users"] as const;
const GLOBAL_SEARCH_QUERY_KEY = ["global-search"] as const;
const CORE_SYNC_QUERY_KEYS = [
  DASHBOARD_QUERY_KEY,
  USER_TASKS_QUERY_KEY,
  ONLINE_USERS_QUERY_KEY,
] as const;

interface RealtimeNotificationEventDetail {
  notificacao?: Notificacao;
}

const normalizeNotificationType = (value?: string): string =>
  (value || "").trim().toLowerCase();
const normalizeScope = (value?: string): string =>
  (value || "").trim().toLowerCase();

const includesPath = (value: string | undefined, path: string): boolean =>
  Boolean(value?.toLowerCase().includes(path));

const mapNotificationToQueryKeys = (notificacao: Notificacao): QueryKey[] => {
  const keys: QueryKey[] = [DASHBOARD_QUERY_KEY];
  const type = normalizeNotificationType(notificacao.tipo);
  const link = notificacao.link;

  if (
    type === "solicitacao_pendente" ||
    type === "novo_processo" ||
    type === "novo_desarquivamento" ||
    Boolean(notificacao.processoId) ||
    Boolean(notificacao.solicitacaoId) ||
    includesPath(link, "/desarquivamentos")
  ) {
    keys.push(DESARQUIVAMENTOS_QUERY_KEY);
  }

  if (
    type === "mencao" ||
    type === "tarefa_atribuida" ||
    type === "tarefa_alterada" ||
    type === "tarefa_comentada" ||
    type === "prazo_proximo" ||
    type === "tarefa_atrasada" ||
    Boolean(notificacao.tarefaId) ||
    includesPath(link, "/tarefas")
  ) {
    keys.push(USER_TASKS_QUERY_KEY);
    keys.push(TAREFAS_QUERY_KEY);
    keys.push(PROJETOS_QUERY_KEY);
  }

  if (
    type === "pasta_criada" ||
    includesPath(link, "/arquivo") ||
    includesPath(link, "/pastas")
  ) {
    keys.push(PASTAS_QUERY_KEY);
    keys.push(PLANILHAS_QUERY_KEY);
  }

  if (type === "evento_auditoria") {
    keys.push(ONLINE_USERS_QUERY_KEY);
    keys.push(USERS_QUERY_KEY);
  }

  return keys;
};

const mapDomainEventToQueryKeys = (
  event: DomainSyncEventDetail,
): QueryKey[] => {
  const keys: QueryKey[] = [DASHBOARD_QUERY_KEY];
  const scope = normalizeScope(event.scope);

  if (scope === "desarquivamentos") {
    keys.push(DESARQUIVAMENTOS_QUERY_KEY);
    keys.push(DESARQUIVAMENTOS_LIXEIRA_QUERY_KEY);
    keys.push(DESARQUIVAMENTO_COMMENTS_QUERY_KEY);
    keys.push(DESARQUIVAMENTO_HISTORICO_QUERY_KEY);
  }

  if (scope === "tarefas") {
    keys.push(USER_TASKS_QUERY_KEY);
    keys.push(TAREFAS_QUERY_KEY);
    keys.push(PROJETOS_QUERY_KEY);
  }

  if (scope === "projetos") {
    keys.push(PROJETOS_QUERY_KEY);
    keys.push(USER_TASKS_QUERY_KEY);
    keys.push(TAREFAS_QUERY_KEY);
  }

  if (scope === "pastas") {
    keys.push(PASTAS_QUERY_KEY);
    keys.push(PASTAS_ITEM_SEARCH_QUERY_KEY);
  }

  if (scope === "planilhas") {
    keys.push(PLANILHAS_QUERY_KEY);
    keys.push(PLANILHAS_GERAL_QUERY_KEY);
    keys.push(PASTAS_QUERY_KEY);
  }

  if (scope === "usuarios") {
    keys.push(USERS_QUERY_KEY);
    keys.push(ONLINE_USERS_QUERY_KEY);
  }

  if (scope === "online-users") {
    keys.push(ONLINE_USERS_QUERY_KEY);
  }

  if (scope === "global-search") {
    keys.push(GLOBAL_SEARCH_QUERY_KEY);
  }

  return keys;
};

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  const lastGlobalSyncAtRef = useRef(0);

  const invalidateAndRefetch = useCallback(
    (queryKey: QueryKey) => {
      queryClient.invalidateQueries({ queryKey, exact: false });
      queryClient.refetchQueries({ queryKey, type: "active", exact: false });
    },
    [queryClient],
  );

  const refetchActiveQueries = useCallback(
    (force = false) => {
      const now = Date.now();
      if (
        !force &&
        now - lastGlobalSyncAtRef.current < MIN_GLOBAL_SYNC_GAP_MS
      ) {
        return;
      }
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      if (
        typeof navigator !== "undefined" &&
        "onLine" in navigator &&
        !navigator.onLine
      ) {
        return;
      }

      lastGlobalSyncAtRef.current = now;
      CORE_SYNC_QUERY_KEYS.forEach((queryKey) => {
        invalidateAndRefetch(queryKey);
      });
    },
    [invalidateAndRefetch],
  );

  useEffect(() => {
    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent<RealtimeNotificationEventDetail>;
      const notificacao = customEvent.detail?.notificacao;
      if (!notificacao) {
        return;
      }

      const keys = mapNotificationToQueryKeys(notificacao);
      const uniqueKeys = new Map<string, QueryKey>();
      keys.forEach((key) => {
        uniqueKeys.set(JSON.stringify(key), key);
      });

      uniqueKeys.forEach((key) => invalidateAndRefetch(key));
    };

    window.addEventListener(
      "sgc:realtime-notificacao",
      handleRealtimeNotification,
    );
    return () => {
      window.removeEventListener(
        "sgc:realtime-notificacao",
        handleRealtimeNotification,
      );
    };
  }, [invalidateAndRefetch]);

  useEffect(() => {
    const handleDomainSync = (event: Event) => {
      const customEvent = event as CustomEvent<DomainSyncEventDetail>;
      const payload = customEvent.detail;
      if (!payload?.scope) {
        return;
      }

      const keys = mapDomainEventToQueryKeys(payload);
      const uniqueKeys = new Map<string, QueryKey>();
      keys.forEach((key) => {
        uniqueKeys.set(JSON.stringify(key), key);
      });
      uniqueKeys.forEach((key) => invalidateAndRefetch(key));
    };

    window.addEventListener("sgc:domain-sync", handleDomainSync);
    return () => {
      window.removeEventListener("sgc:domain-sync", handleDomainSync);
    };
  }, [invalidateAndRefetch]);

  useEffect(() => {
    refetchActiveQueries(true);

    const interval = window.setInterval(() => {
      refetchActiveQueries();
    }, GLOBAL_SYNC_INTERVAL_MS);

    const handleVisibility = () => {
      if (!document.hidden) {
        refetchActiveQueries(true);
      }
    };

    const handleOnline = () => {
      refetchActiveQueries(true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [refetchActiveQueries]);
};

export default useRealtimeSync;
