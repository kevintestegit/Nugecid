import { getTipoDesarquivamentoLabel } from "@/utils/format";
import type { TipoDesarquivamento } from "@/types";

/** Shape of a related record returned by the /api/nugecid/:id/related endpoint */
export interface RelatedRecord {
  id: number;
  status?: string;
  numeroProcesso?: string;
  tipoDocumento?: string;
  tipoDesarquivamento?: TipoDesarquivamento;
  nomeCompleto?: string;
  numeroNicLaudoAuto?: string;
  quantidadeItens?: number;
  itens?: Array<{
    tipo?: string;
    tipoDocumento?: string;
    descricaoTipo?: string;
    nome?: string;
    registro?: string;
    titulo?: string;
    observacao?: string;
    descricao?: string;
    detalhe?: string;
  }>;
}

export interface DetailRowData {
  index: number;
  type: string;
  name: string;
  code: string;
  observation: string;
}

export const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(
    /[&<>"']/g,
    (match) =>
      ({
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#39;",
        "<": "&lt;",
        ">": "&gt;",
      })[match] || match,
  );
};

export const fetchRelatedRecords = async (
  id: number,
): Promise<RelatedRecord[]> => {
  const relatedResponse = await fetch(`/api/nugecid/${id}/related`, {
    credentials: "include",
  });

  if (!relatedResponse.ok) {
    throw new Error("Erro ao buscar registros relacionados");
  }

  const relatedData = await relatedResponse.json();
  return relatedData.success ? relatedData.data : [];
};

export const buildDetailRows = (
  records: RelatedRecord[],
  placeholderType = "",
): DetailRowData[] =>
  records
    .map((record: RelatedRecord, globalIndex: number) => {
      const rawItems = Array.isArray(record?.itens) ? record.itens : [];
      const identifiers = (record.numeroNicLaudoAuto || "")
        .split(/[,;]+/)
        .map((part: string) => part.trim())
        .filter(Boolean);
      const fallbackIdentifiers =
        identifiers.length > 0
          ? identifiers
          : [record.numeroNicLaudoAuto || "-"];

      const baseType = escapeHtml(
        record.tipoDocumento ||
          (record.tipoDesarquivamento
            ? getTipoDesarquivamentoLabel(record.tipoDesarquivamento)
            : placeholderType),
      );

      return fallbackIdentifiers.map((code: string, localIndex: number) => {
        const current = rawItems[localIndex];
        const typeValue =
          current && typeof current === "object"
            ? (current?.tipo ??
              current?.tipoDocumento ??
              current?.descricaoTipo)
            : undefined;
        const nameValue =
          current && typeof current === "object"
            ? (current?.nome ?? current?.registro ?? current?.titulo)
            : undefined;
        const observationValue =
          current && typeof current === "object"
            ? (current?.observacao ?? current?.descricao ?? current?.detalhe)
            : undefined;

        return {
          index: globalIndex + 1,
          type: escapeHtml(typeValue ?? baseType),
          name: escapeHtml(nameValue ?? record.nomeCompleto ?? "-"),
          code: escapeHtml(code ?? "-"),
          observation: escapeHtml(observationValue ?? ""),
        };
      });
    })
    .flat();

export const printHtmlDocument = (
  html: string,
  options?: { fallbackDelayMs?: number },
) => {
  const printWindow = window.open("", "_blank", "width=900,height=650");
  if (!printWindow) {
    throw new Error("Nao foi possivel abrir a janela de impressao.");
  }

  printWindow.document.write(html);
  printWindow.document.close();

  let hasPrinted = false;
  const tryPrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const imgs = Array.from(printWindow.document.images || []);
  if (imgs.length === 0) {
    window.setTimeout(tryPrint, options?.fallbackDelayMs ?? 300);
    return;
  }

  let loaded = 0;
  const failSafe = window.setTimeout(tryPrint, 2000);
  const done = () => {
    loaded += 1;
    if (loaded === imgs.length) {
      window.clearTimeout(failSafe);
      tryPrint();
    }
  };

  imgs.forEach((img) => {
    if (img.complete) {
      done();
    } else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }
  });
};
