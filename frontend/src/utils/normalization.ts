/**
 * Normaliza strings conforme o backend espera
 * Remove acentos, converte para uppercase e faz trim
 */
export function normalize(value: string): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/**
 * Normaliza tipo de desarquivamento para valores aceitos pelo backend
 */
export function normalizeTipoDesarquivamento(value: string): string {
  if (!value) return "FISICO";

  const normalized = normalize(value);

  if (normalized.includes("DIGITAL")) return "DIGITAL";
  if (normalized.includes("NAO") && normalized.includes("LOCALIZADO"))
    return "NAO_LOCALIZADO";
  if (normalized.includes("FISICO")) return "FISICO";

  // Default para FISICO se não reconhecer
  return "FISICO";
}

/**
 * Normaliza status para valores aceitos pelo backend
 */
export function normalizeStatus(value: string): string {
  if (!value) return "SOLICITADO";

  const normalized = normalize(value);

  if (normalized.includes("FINALIZADO")) return "FINALIZADO";
  if (normalized.includes("DESARQUIVADO")) return "DESARQUIVADO";
  if (normalized.includes("NAO") && normalized.includes("COLETADO"))
    return "NAO_COLETADO";
  if (normalized.includes("REARQUIVAMENTO")) return "REARQUIVAMENTO_SOLICITADO";
  if (normalized.includes("RETIRADO")) return "RETIRADO_PELO_SETOR";
  if (normalized.includes("NAO") && normalized.includes("LOCALIZADO"))
    return "NAO_LOCALIZADO";

  return "SOLICITADO";
}

/**
 * Normaliza data YYYY-MM-DD para ISO 8601
 */
export function normalizeDate(
  value: string | Date | undefined | null,
): string | undefined {
  if (!value) return undefined;

  try {
    // Se já for uma string ISO 8601, retorna como está
    if (typeof value === "string" && value.includes("T")) {
      return value;
    }

    // Se for YYYY-MM-DD, converte para ISO 8601
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00.000Z").toISOString();
    }

    // Se for Date object, converte para ISO 8601
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Tenta criar Date e converter
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (error) {
    console.error("[normalization] Erro ao normalizar data:", error);
  }

  return undefined;
}

/**
 * Limita o tamanho de uma string ao máximo especificado
 */
export function truncateString(
  value: string | undefined,
  maxLength: number,
): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
}

/**
 * Aplica normalização em um objeto CreateDesarquivamentoDto antes de enviar ao backend
 */
export function normalizeDesarquivamentoData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    ...data,
  };

  // Só normaliza se o campo estiver presente
  if (data.tipoDesarquivamento) {
    normalized.tipoDesarquivamento = normalizeTipoDesarquivamento(
      String(data.tipoDesarquivamento),
    );
  }

  if (data.desarquivamentoFisicoDigital) {
    normalized.desarquivamentoFisicoDigital = normalizeTipoDesarquivamento(
      String(data.desarquivamentoFisicoDigital),
    );
  }

  if (data.status) {
    normalized.status = normalizeStatus(String(data.status));
  }

  // Normaliza datas para ISO 8601
  const dateFields = [
    "dataSolicitacao",
    "dataDesarquivamentoSAG",
    "dataDevolucaoSetor",
  ];
  for (const field of dateFields) {
    if (data[field]) {
      const normalizedDate = normalizeDate(
        data[field] instanceof Date
          ? (data[field] as Date)
          : String(data[field]),
      );
      if (normalizedDate) {
        normalized[field] = normalizedDate;
      }
    }
  }

  // Limita o tamanho de campos de texto
  if (data.numeroNicLaudoAuto) {
    normalized.numeroNicLaudoAuto = truncateString(
      String(data.numeroNicLaudoAuto),
      100,
    );
  }

  if (data.nomeCompleto) {
    normalized.nomeCompleto = truncateString(String(data.nomeCompleto), 255);
  }

  if (data.numeroProcesso) {
    normalized.numeroProcesso = truncateString(String(data.numeroProcesso), 50);
  }

  if (data.tipoDocumento) {
    normalized.tipoDocumento = truncateString(String(data.tipoDocumento), 100);
  }

  if (data.numeroOficio) {
    normalized.numeroOficio = truncateString(String(data.numeroOficio), 255);
  }

  if (data.setorDemandante) {
    normalized.setorDemandante = truncateString(
      String(data.setorDemandante),
      255,
    );
  }

  if (data.servidorResponsavel) {
    normalized.servidorResponsavel = truncateString(
      String(data.servidorResponsavel),
      255,
    );
  }

  if (data.solicitacaoProrrogacaoTexto) {
    normalized.solicitacaoProrrogacaoTexto = truncateString(
      String(data.solicitacaoProrrogacaoTexto),
      2000,
    );
  }

  if (data.dadosAdicionais) {
    normalized.dadosAdicionais = truncateString(
      String(data.dadosAdicionais),
      2000,
    );
  }

  return normalized;
}
