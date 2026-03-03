import {
  TipoDesarquivamento,
  TipoSolicitacao,
  StatusDesarquivamento,
} from "@/types";

export const getTipoDesarquivamentoLabel = (
  tipo: TipoDesarquivamento,
): string => {
  const labels: Record<TipoDesarquivamento, string> = {
    [TipoDesarquivamento.FISICO]: "Físico",
    [TipoDesarquivamento.DIGITAL]: "Digital",
    [TipoDesarquivamento.NAO_LOCALIZADO]: "Não Localizado",
  };
  return labels[tipo] || tipo;
};

export const getTipoSolicitacaoLabel = (tipo: TipoSolicitacao): string => {
  const labels: Record<TipoSolicitacao, string> = {
    [TipoSolicitacao.DESARQUIVAMENTO]: "Desarquivamento",
    [TipoSolicitacao.COPIA]: "Cópia",
    [TipoSolicitacao.VISTA]: "Vista",
    [TipoSolicitacao.CERTIDAO]: "Certidão",
  };
  return labels[tipo] || tipo;
};

export const getStatusLabel = (status: StatusDesarquivamento): string => {
  const labels: Record<StatusDesarquivamento, string> = {
    [StatusDesarquivamento.FINALIZADO]: "Finalizado",
    [StatusDesarquivamento.DESARQUIVADO]: "Desarquivado",
    [StatusDesarquivamento.NAO_COLETADO]: "Não Coletado",
    [StatusDesarquivamento.SOLICITADO]: "Solicitado",
    [StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO]:
      "Rearquivamento Solicitado",
    [StatusDesarquivamento.RETIRADO_PELO_SETOR]: "Retirado pelo Setor",
    [StatusDesarquivamento.NAO_LOCALIZADO]: "Não Localizado",
  };
  return labels[status] || status;
};

export const getTipoLabel = (tipo: TipoSolicitacao): string => {
  return getTipoSolicitacaoLabel(tipo);
};

const ISO_DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_UTC_MIDNIGHT_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T\s]00:00:00(?:\.\d{1,3})?(?:Z|[+-]00:00)$/i;

const parseDateForDisplay = (value: string | Date): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return null;
  }

  const dateOnlyMatch = normalizedValue.match(ISO_DATE_ONLY_REGEX);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const utcMidnightMatch = normalizedValue.match(ISO_UTC_MIDNIGHT_REGEX);
  if (utcMidnightMatch) {
    const [, year, month, day] = utcMidnightMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "-";

  const date = parseDateForDisplay(dateString);
  if (!date) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
