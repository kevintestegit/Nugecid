import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data para o padrão brasileiro (dd/MM/yyyy)
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      // Para evitar problemas de timezone, força interpretação local
      // Se a string está no formato YYYY-MM-DD, adiciona horário local
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateObj = new Date(date + "T00:00:00");
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) return "-";

    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Formata uma data e hora para o padrão brasileiro (dd/MM/yyyy HH:mm)
 */
export const formatDateTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "-";

  try {
    let dateObj: Date;

    if (typeof date === "string") {
      // Para evitar problemas de timezone, força interpretação local
      // Se a string está no formato YYYY-MM-DD, adiciona horário local
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateObj = new Date(date + "T00:00:00");
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) return "-";

    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Formata apenas a hora (HH:mm)
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";

    return format(dateObj, "HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Calcula a diferença em dias entre duas datas
 */
export const getDaysDifference = (
  startDate: string | Date,
  endDate: string | Date = new Date(),
): number => {
  try {
    const start =
      typeof startDate === "string" ? parseISO(startDate) : startDate;
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

    if (!isValid(start) || !isValid(end)) return 0;

    return differenceInDays(end, start);
  } catch {
    return 0;
  }
};

/**
 * Verifica se uma data está vencida (considerando prazo de atendimento)
 */
export const isOverdue = (
  prazoAtendimento: string | Date | null | undefined,
): boolean => {
  if (!prazoAtendimento) return false;

  try {
    const prazo =
      typeof prazoAtendimento === "string"
        ? parseISO(prazoAtendimento)
        : prazoAtendimento;
    if (!isValid(prazo)) return false;

    return getDaysDifference(prazo, new Date()) > 0;
  } catch {
    return false;
  }
};

/**
 * Formata uma data para input do tipo date (yyyy-MM-dd)
 */
export const formatDateForInput = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";

    return format(dateObj, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

/**
 * Formata uma data de forma relativa (ex: "há 2 dias", "em 3 dias")
 */
export const formatRelativeDate = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";

    const days = getDaysDifference(new Date(), dateObj);

    if (days === 0) return "Hoje";
    if (days === 1) return "Amanhã";
    if (days === -1) return "Ontem";
    if (days > 0) return `Em ${days} dias`;
    return `Há ${Math.abs(days)} dias`;
  } catch {
    return "-";
  }
};
