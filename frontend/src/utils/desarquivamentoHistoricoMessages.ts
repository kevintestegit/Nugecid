import { type HistoricoItem } from "@/hooks/useDesarquivamentoHistorico";
import { StatusDesarquivamento } from "@/types";
import { getStatusLabel } from "@/utils/format";

type HistoricoChange = {
  field: string;
  from?: unknown;
  to?: unknown;
};

export type HistoricoMessageTone =
  | "create"
  | "status"
  | "update"
  | "comment"
  | "delete"
  | "default";

export interface HistoricoMessage {
  title: string;
  description: string;
  categoryLabel: string;
  tone: HistoricoMessageTone;
}

const STATUS_ALIASES: Record<string, StatusDesarquivamento> = {
  REARQUIVADO: StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO,
  REARQUIVAMENTO: StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO,
};

const STATUS_CANDIDATES = [
  StatusDesarquivamento.FINALIZADO,
  StatusDesarquivamento.DESARQUIVADO,
  StatusDesarquivamento.NAO_COLETADO,
  StatusDesarquivamento.SOLICITADO,
  StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO,
  StatusDesarquivamento.RETIRADO_PELO_SETOR,
  StatusDesarquivamento.NAO_LOCALIZADO,
  "REARQUIVADO",
  "REARQUIVAMENTO",
];

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  dataSolicitacao: "Data de solicitação",
  dataDesarquivamentoSAG: "Data de desarquivamento (SAG)",
  dataDevolucaoSetor: "Data de devolução pelo setor",
  prazoDesarquivamento: "Prazo de desarquivamento",
  prazoVencimento: "Prazo de vencimento",
  desarquivamentoFisicoDigital: "Tipo de desarquivamento",
  tipoDesarquivamento: "Tipo de desarquivamento",
  nomeCompleto: "Nome completo",
  numeroNicLaudoAuto: "Número NIC/Laudo/Auto",
  numeroProcesso: "Número do processo",
  tipoDocumento: "Tipo de documento",
  setorDemandante: "Setor demandante",
  servidorResponsavel: "Servidor responsável",
  finalidadeDesarquivamento: "Finalidade do desarquivamento",
  solicitacaoProrrogacao: "Solicitação de prorrogação",
  solicitacaoProrrogacaoTexto: "Justificativa da prorrogação",
  dadosAdicionais: "Observações",
  numeroOficio: "Número do ofício",
  urgente: "Urgente",
  instituto: "Instituto",
  requerente: "Requerente",
  responsavelId: "Responsável",
};

const BUSINESS_CHANGE_FIELDS = new Set([
  "status",
  "dataSolicitacao",
  "dataDesarquivamentoSAG",
  "dataDevolucaoSetor",
]);

const DATE_FIELDS = new Set([
  "dataSolicitacao",
  "dataDesarquivamentoSAG",
  "dataDevolucaoSetor",
  "prazoDesarquivamento",
  "prazoVencimento",
  "createdAt",
  "updatedAt",
]);

const NON_DETAILED_PATTERNS = [
  "nenhuma acao relevante registrada",
  "sem acoes detalhadas registradas",
  "ultima modificacao realizada na solicitacao",
];

const normalizeComparableText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isEmptyLike = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

const normalizeStatus = (value: unknown): StatusDesarquivamento | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  if (!normalized) return null;

  const canonical = STATUS_ALIASES[normalized] ?? normalized;
  const validStatusValues = Object.values(StatusDesarquivamento) as string[];
  if (!validStatusValues.includes(canonical)) return null;
  return canonical as StatusDesarquivamento;
};

const toStatusLabel = (value: unknown): string => {
  const normalizedStatus = normalizeStatus(value);
  if (normalizedStatus) {
    return getStatusLabel(normalizedStatus);
  }
  return String(value ?? "(vazio)");
};

const formatDateTime = (value: unknown): string => {
  if (isEmptyLike(value)) return "(vazio)";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFieldValue = (field: string, value: unknown): string => {
  if (isEmptyLike(value)) return "(vazio)";
  if (field === "status") return toStatusLabel(value);
  if (field === "solicitacaoProrrogacao" || field === "urgente")
    return value ? "Sim" : "Não";
  if (DATE_FIELDS.has(field)) return formatDateTime(value);
  return String(value);
};

const getFieldLabel = (field: string): string => FIELD_LABELS[field] ?? field;

const extractChanges = (item: HistoricoItem): HistoricoChange[] => {
  const changesRecord = item.details?.changes;
  if (!changesRecord || typeof changesRecord !== "object") return [];

  return Object.entries(changesRecord).map(([field, change]) => ({
    field,
    from: change?.from,
    to: change?.to,
  }));
};

const extractDetailsText = (item: HistoricoItem): string => {
  return typeof item.details?.details === "string"
    ? item.details.details.trim()
    : "";
};

const hasStructuredChanges = (item: HistoricoItem): boolean =>
  extractChanges(item).length > 0;

const isNonDetailedText = (detailsText: string): boolean => {
  const comparable = normalizeComparableText(detailsText);
  if (!comparable) return true;
  return NON_DETAILED_PATTERNS.some((pattern) => comparable.includes(pattern));
};

const extractLegacyStatusFromDetails = (
  detailsText: string,
): StatusDesarquivamento | null => {
  const comparable = normalizeComparableText(detailsText).toUpperCase();
  if (!comparable) return null;

  for (const candidate of STATUS_CANDIDATES) {
    const normalizedCandidate = normalizeComparableText(candidate)
      .replace(/\s+/g, "_")
      .toUpperCase();
    const candidateWithSpaces = normalizedCandidate.replace(/_/g, " ");

    if (
      comparable.includes(normalizedCandidate) ||
      comparable.includes(candidateWithSpaces)
    ) {
      return normalizeStatus(candidate);
    }
  }

  return null;
};

const buildFieldChangeSentence = (change: HistoricoChange): string => {
  const fieldLabel = getFieldLabel(change.field);
  const fromValue = formatFieldValue(change.field, change.from);
  const toValue = formatFieldValue(change.field, change.to);

  if (isEmptyLike(change.from)) {
    return `${fieldLabel}: valor informado "${toValue}"`;
  }

  return `${fieldLabel}: de "${fromValue}" para "${toValue}"`;
};

export const isRelevantHistoricoEntry = (item: HistoricoItem): boolean => {
  if (item.action === "VIEW") return false;
  if (hasStructuredChanges(item)) return true;

  if (["CREATE", "DELETE", "RESTORE", "COMMENT_ADD"].includes(item.action)) {
    return true;
  }

  const detailsText = extractDetailsText(item);
  if (!detailsText) return false;

  return !isNonDetailedText(detailsText);
};

export const isBusinessHistoricoEntry = (item: HistoricoItem): boolean => {
  if (!isRelevantHistoricoEntry(item)) return false;

  if (item.action === "CREATE") return true;

  const changes = extractChanges(item);
  if (changes.length > 0) {
    const changedFields = new Set(changes.map((change) => change.field));

    if (changedFields.has("status")) return true;
    if (changedFields.has("dataDesarquivamentoSAG")) return true;
    if (changedFields.has("dataDevolucaoSetor")) return true;

    return [...changedFields].every((field) =>
      BUSINESS_CHANGE_FIELDS.has(field),
    );
  }

  const detailsText = extractDetailsText(item);
  if (!detailsText || isNonDetailedText(detailsText)) return false;

  return extractLegacyStatusFromDetails(detailsText) !== null;
};

export const isActionHistoricoEntry = (item: HistoricoItem): boolean => {
  if (!isRelevantHistoricoEntry(item)) return false;
  return !isBusinessHistoricoEntry(item);
};

export const buildHistoricoMessage = (item: HistoricoItem): HistoricoMessage => {
  const changes = extractChanges(item);
  const statusChange = changes.find((change) => change.field === "status");
  const nonStatusChanges = changes.filter((change) => change.field !== "status");

  if (statusChange) {
    const newStatusLabel = toStatusLabel(statusChange.to);
    const previousStatusLabel = toStatusLabel(statusChange.from);
    const additionalChanges =
      nonStatusChanges.length > 0
        ? ` Campos adicionais atualizados: ${nonStatusChanges
            .map(buildFieldChangeSentence)
            .join("; ")}.`
        : "";

    return {
      title: `Status alterado para: ${newStatusLabel}`,
      description:
        (!isEmptyLike(statusChange.from)
          ? `Status anterior: ${previousStatusLabel}.`
          : "Mudança de status registrada.") + additionalChanges,
      categoryLabel: "Alteração de Status",
      tone: "status",
    };
  }

  if (item.action === "CREATE") {
    return {
      title: "Solicitação criada",
      description: item.user
        ? `Solicitação registrada por ${item.user.nome}.`
        : "Solicitação registrada no sistema.",
      categoryLabel: "Criação",
      tone: "create",
    };
  }

  if (item.action === "COMMENT_ADD") {
    return {
      title: "Comentário adicionado",
      description: item.user
        ? `Comentário registrado por ${item.user.nome}.`
        : "Comentário registrado na solicitação.",
      categoryLabel: "Comentário",
      tone: "comment",
    };
  }

  if (item.action === "DELETE") {
    return {
      title: "Solicitação removida",
      description:
        "Registro removido da listagem principal (soft delete/lixeira).",
      categoryLabel: "Exclusão",
      tone: "delete",
    };
  }

  if (item.action === "RESTORE") {
    return {
      title: "Solicitação restaurada",
      description: "Registro restaurado da lixeira para a listagem principal.",
      categoryLabel: "Restauração",
      tone: "update",
    };
  }

  if (changes.length === 1) {
    const [singleChange] = changes;
    const fieldLabel = getFieldLabel(singleChange.field);
    const fromValue = formatFieldValue(singleChange.field, singleChange.from);
    const toValue = formatFieldValue(singleChange.field, singleChange.to);
    const valueWasEmpty = isEmptyLike(singleChange.from);

    return {
      title: `${fieldLabel} atualizado`,
      description: valueWasEmpty
        ? `Valor informado: "${toValue}".`
        : `Alterado de "${fromValue}" para "${toValue}".`,
      categoryLabel: "Atualização",
      tone: "update",
    };
  }

  if (changes.length > 1) {
    const preview = changes.slice(0, 3).map(buildFieldChangeSentence).join("; ");
    const overflow =
      changes.length > 3 ? ` (+${changes.length - 3} campos adicionais)` : "";

    return {
      title: "Dados da solicitação atualizados",
      description: `Alterações registradas: ${preview}${overflow}.`,
      categoryLabel: "Atualização",
      tone: "update",
    };
  }

  const fallbackDetails = extractDetailsText(item);
  const statusFromLegacyDetails =
    fallbackDetails && !isNonDetailedText(fallbackDetails)
      ? extractLegacyStatusFromDetails(fallbackDetails)
      : null;

  if (statusFromLegacyDetails) {
    return {
      title: `Status alterado para: ${getStatusLabel(statusFromLegacyDetails)}`,
      description: "Mudança de status identificada em registro legado.",
      categoryLabel: "Alteração de Status",
      tone: "status",
    };
  }

  if (fallbackDetails && !isNonDetailedText(fallbackDetails)) {
    return {
      title: "Atualização registrada",
      description: fallbackDetails,
      categoryLabel: item.actionLabel || "Ação",
      tone: "default",
    };
  }

  return {
    title:
      item.action === "UPDATE"
        ? "Atualização sem detalhamento"
        : item.actionLabel || "Ação registrada",
    description:
      item.action === "UPDATE"
        ? "Este evento não contém diffs estruturados para auditoria."
        : "Evento registrado no histórico da solicitação.",
    categoryLabel: item.actionLabel || "Ação",
    tone: "default",
  };
};
