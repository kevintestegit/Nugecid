import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/services/api";

type HistoricoChanges = Record<
  string,
  {
    from?: unknown;
    to?: unknown;
  }
>;

type HistoricoChangeValue =
  | {
      from?: unknown;
      to?: unknown;
    }
  | unknown;

interface HistoricoDetails {
  details?: string;
  changes?: HistoricoChanges;
  [key: string]: unknown;
}

export interface HistoricoItem {
  id: number;
  action: string;
  actionLabel: string;
  details: HistoricoDetails;
  timestamp: string;
  user: {
    id: number;
    nome: string;
    usuario: string;
  } | null;
  ipAddress: string;
  success: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  STATUS_CHANGE: "Alteração de status",
  COMMENT_ADD: "Comentário adicionado",
  ATTACHMENT_ADD: "Anexo adicionado",
  ATTACHMENT_DELETE: "Anexo removido",
};

const normalizeAction = (action?: string): string => {
  if (!action) return "UNKNOWN";
  return action.trim().toUpperCase();
};

const toIsoOrNow = (value?: string): string => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
};

const normalizeHistoricoChanges = (
  value: unknown,
): HistoricoChanges | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const rawChanges = value as Record<string, HistoricoChangeValue>;
  const normalized = Object.entries(rawChanges).reduce<HistoricoChanges>(
    (acc, [key, changeValue]) => {
      if (!key) return acc;

      if (
        changeValue &&
        typeof changeValue === "object" &&
        ("from" in (changeValue as Record<string, unknown>) ||
          "to" in (changeValue as Record<string, unknown>))
      ) {
        const changeRecord = changeValue as { from?: unknown; to?: unknown };
        acc[key] = {
          from: changeRecord.from,
          to: changeRecord.to,
        };
        return acc;
      }

      acc[key] = { to: changeValue };
      return acc;
    },
    {},
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const normalizeHistoricoItem = (item: unknown): HistoricoItem | null => {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const action = normalizeAction(String(raw.action ?? "UNKNOWN"));
  const detailsRawRecord = toRecord(raw.details);
  const detailsRaw = detailsRawRecord as HistoricoDetails;
  const originalDataRecord = toRecord(detailsRawRecord.originalData);
  const changesRaw = detailsRawRecord.changes ?? originalDataRecord.changes;
  const changes = normalizeHistoricoChanges(changesRaw);

  return {
    id,
    action,
    actionLabel:
      (typeof raw.actionLabel === "string" && raw.actionLabel.trim()) ||
      ACTION_LABELS[action] ||
      action,
    details: {
      ...detailsRaw,
      changes,
    },
    timestamp: toIsoOrNow(String(raw.timestamp ?? raw.createdAt ?? "")),
    user:
      raw.user && typeof raw.user === "object"
        ? ({
            id: Number((raw.user as Record<string, unknown>).id) || 0,
            nome: String(
              (raw.user as Record<string, unknown>).nome ?? "Usuário",
            ),
            usuario: String(
              (raw.user as Record<string, unknown>).usuario ?? "",
            ),
          } as HistoricoItem["user"])
        : null,
    ipAddress: typeof raw.ipAddress === "string" ? raw.ipAddress : "",
    success: raw.success !== false,
  };
};

const normalizeHistoricoResponse = (payload: unknown): HistoricoItem[] => {
  const list = Array.isArray(payload) ? payload : [];
  return list
    .map(normalizeHistoricoItem)
    .filter((item): item is HistoricoItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
};

export const useDesarquivamentoHistorico = (desarquivamentoId: number) => {
  const isValidId = Number.isFinite(desarquivamentoId) && desarquivamentoId > 0;

  return useQuery({
    queryKey: ["desarquivamento-historico", desarquivamentoId],
    queryFn: async () => {
      const { data } = await api.get(`/nugecid/${desarquivamentoId}/historico`);
      const payload = data?.data ?? data;
      return normalizeHistoricoResponse(payload);
    },
    enabled: isValidId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: (failureCount: number, error: Error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return false;
      return failureCount < 2;
    },
  });
};
