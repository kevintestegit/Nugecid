export interface OcrDetectedSignature {
  label: string;
  signerName: string | null;
  matchedLine: string;
  context: string[];
  confidence: "high" | "medium" | "low";
}

const SIGNATURE_HINTS: Array<{
  regex: RegExp;
  label: string;
  confidence: "high" | "medium" | "low";
}> = [
  {
    regex: /assinad[oa]?\s+por/i,
    label: "Assinado por",
    confidence: "high",
  },
  {
    regex: /recebid[oa]?\s+por/i,
    label: "Recebido por",
    confidence: "high",
  },
  {
    regex: /assinatura/i,
    label: "Assinatura",
    confidence: "medium",
  },
  {
    regex: /respons[aá]vel/i,
    label: "Responsável",
    confidence: "medium",
  },
  {
    regex: /servidor/i,
    label: "Servidor",
    confidence: "low",
  },
  {
    regex: /protocolo/i,
    label: "Protocolo",
    confidence: "low",
  },
];

const NON_NAME_TOKENS = new Set([
  "ASSINATURA",
  "ASSINADO",
  "ASSINADA",
  "ASSINADO POR",
  "ASSINATURA DO SERVIDOR",
  "DATA",
  "DEVOLUCAO",
  "DEVOLUÇÃO",
  "RETIRADA",
  "PROTOCOLO",
  "RECEBIDO",
  "RECEBIDA",
  "RESPONSAVEL",
  "RESPONSÁVEL",
  "SERVIDOR",
  "SETOR",
  "NOME",
  "DOCUMENTO",
  "PROCESSO",
  "SOLICITACAO",
  "SOLICITAÇÃO",
]);

function normalizeOcrLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractCandidateNames(line: string): string[] {
  const matches =
    line.match(/\b[A-ZÀ-Ú][A-ZÀ-Ú'`.-]+(?:\s+[A-ZÀ-Ú][A-ZÀ-Ú'`.-]+){1,5}\b/g) ||
    [];

  const unique = new Set<string>();

  for (const match of matches) {
    const candidate = normalizeOcrLine(match);
    const candidateWords = candidate.split(/\s+/);
    if (candidate.length < 8 || candidate.length > 120) {
      continue;
    }

    if (NON_NAME_TOKENS.has(candidate)) {
      continue;
    }

    if (candidateWords.some((word) => NON_NAME_TOKENS.has(word))) {
      continue;
    }

    if (/\d/.test(candidate)) {
      continue;
    }

    unique.add(candidate);
  }

  return Array.from(unique);
}

export function analyzeOcrTextForSignatures(text?: string | null): {
  possibleNames: string[];
  signatures: OcrDetectedSignature[];
  rawText: string | null;
} {
  const rawText = normalizeOcrLine(text || "") ? String(text) : null;
  if (!rawText) {
    return { possibleNames: [], signatures: [], rawText: null };
  }

  const lines = rawText.split(/\r?\n/).map(normalizeOcrLine).filter(Boolean);

  const possibleNames = Array.from(
    new Set(lines.flatMap((line) => extractCandidateNames(line))),
  ).slice(0, 12);

  const signatures: OcrDetectedSignature[] = [];

  lines.forEach((line, index) => {
    const hint = SIGNATURE_HINTS.find(({ regex }) => regex.test(line));
    if (!hint) {
      return;
    }

    const context = lines.slice(Math.max(0, index - 1), index + 3);
    const signerName =
      Array.from(
        new Set(
          context.flatMap((contextLine) => extractCandidateNames(contextLine)),
        ),
      )[0] || null;

    signatures.push({
      label: hint.label,
      signerName,
      matchedLine: line,
      context,
      confidence: hint.confidence,
    });
  });

  const dedupedSignatures = Array.from(
    new Map(
      signatures.map((signature) => [
        `${signature.label}:${signature.signerName || ""}:${signature.matchedLine}`,
        signature,
      ]),
    ).values(),
  ).slice(0, 10);

  return {
    possibleNames,
    signatures: dedupedSignatures,
    rawText,
  };
}
