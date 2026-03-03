import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  ClipboardList,
  Calendar,
  User,
  AlertTriangle,
  MessageCircle,
  Send,
  Loader2,
  Printer,
  Eye,
  ChevronDown,
  Copy,
  Check,
  Download,
} from "lucide-react";
import {
  useDesarquivamento,
  useDesarquivamentoComments,
  useAddDesarquivamentoComment,
  useDownloadTermoDocx,
} from "@/hooks/useDesarquivamentos";
import {
  useDesarquivamentoHistorico,
  type HistoricoItem,
} from "@/hooks/useDesarquivamentoHistorico";
import {
  getStatusLabel,
  getTipoDesarquivamentoLabel,
  formatDate,
} from "@/utils/format";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { printRearquivamento } from "./print-templates";
import brasaorn from "@/components/img/Brasão-RN.png";
import brasaoitep from "@/components/img/brasao-itep-optimized.png";
import { getInstitutoLabel } from "@/constants/institutos";
import axios from "axios";
import type {
  Desarquivamento,
  StatusDesarquivamento,
  TipoDesarquivamento,
} from "@/types";
interface DesarquivamentoDetailModalProps {
  id: number;
  onClose: () => void;
}

/** Shape of a related record returned by the /api/nugecid/:id/related endpoint */
interface RelatedRecord {
  id: number;
  status?: string;
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

interface DetailRowData {
  index: number;
  type: string;
  name: string;
  code: string;
  observation: string;
}

const STATUS_ALIAS_MAP: Record<string, string> = {
  REARQUIVADO: "REARQUIVAMENTO_SOLICITADO",
  REARQUIVAMENTO: "REARQUIVAMENTO_SOLICITADO",
};

const STATUS_CANDIDATES = [
  "REARQUIVAMENTO_SOLICITADO",
  "RETIRADO_PELO_SETOR",
  "NAO_LOCALIZADO",
  "NAO_COLETADO",
  "DESARQUIVADO",
  "FINALIZADO",
  "SOLICITADO",
  "REARQUIVADO",
  "REARQUIVAMENTO",
];

const isValidTimestamp = (value?: string): value is string => {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
};

const normalizeStatusValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  if (!normalized) return null;

  return STATUS_ALIAS_MAP[normalized] ?? normalized;
};

const normalizeComparableText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const extractStatusFromDetailsText = (detailsText: unknown): string | null => {
  if (typeof detailsText !== "string" || !detailsText.trim()) return null;

  const comparableText = normalizeComparableText(detailsText);

  for (const statusCandidate of STATUS_CANDIDATES) {
    const candidate = normalizeComparableText(statusCandidate);
    const candidateWithSpaces = candidate.replace(/_/g, " ");

    if (
      comparableText.includes(candidate) ||
      comparableText.includes(candidateWithSpaces)
    ) {
      return normalizeStatusValue(statusCandidate);
    }
  }

  return null;
};

const extractStatusFromHistoricoItem = (
  historyItem: HistoricoItem,
): string | null => {
  const statusChange = historyItem.details?.changes?.status;

  if (statusChange && typeof statusChange === "object") {
    const changeRecord = statusChange as { to?: unknown; from?: unknown };
    const normalizedFromChange = normalizeStatusValue(
      changeRecord.to ?? changeRecord.from,
    );
    if (normalizedFromChange) {
      return normalizedFromChange;
    }
  }

  const normalizedStatusChange = normalizeStatusValue(statusChange);
  if (normalizedStatusChange) {
    return normalizedStatusChange;
  }

  return extractStatusFromDetailsText(historyItem.details?.details);
};

export const DesarquivamentoDetailModal: React.FC<
  DesarquivamentoDetailModalProps
> = ({ id, onClose }) => {
  const { data: response, isLoading } = useDesarquivamento(id);
  const navigate = useNavigate();
  const item = response?.data;
  const { data: commentsResponse, isLoading: isLoadingComments } =
    useDesarquivamentoComments(id);
  const comments = commentsResponse?.data ?? [];
  const addCommentMutation = useAddDesarquivamentoComment(id);
  const downloadDocxMutation = useDownloadTermoDocx();
  const { data: historico = [] } = useDesarquivamentoHistorico(id);
  const [commentText, setCommentText] = useState("");
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const previousBodyOverflowRef = useRef<string>("");
  const previousHtmlOverflowRef = useRef<string>("");
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const printDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const html = document.documentElement;
    previousBodyOverflowRef.current = document.body.style.overflow;
    previousHtmlOverflowRef.current = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    const handleClickOutside = (event: MouseEvent) => {
      if (
        printDropdownRef.current &&
        !printDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPrintDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      setIsMounted(false);
      document.body.style.overflow =
        previousBodyOverflowRef.current &&
        previousBodyOverflowRef.current.trim().length > 0
          ? previousBodyOverflowRef.current
          : "auto";
      html.style.overflow =
        previousHtmlOverflowRef.current &&
        previousHtmlOverflowRef.current.trim().length > 0
          ? previousHtmlOverflowRef.current
          : "auto";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleViewDetails = useCallback(() => {
    onClose();
    navigate(`/desarquivamentos/${id}`);
  }, [id, navigate, onClose]);

  const handleEdit = useCallback(() => {
    onClose();
    navigate(`/desarquivamentos/${id}/editar`);
  }, [id, navigate, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Enter") {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "TEXTAREA" ||
            target.tagName === "INPUT" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        handleViewDetails();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleViewDetails, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.error("Digite um comentário antes de enviar.");
      return;
    }

    try {
      await addCommentMutation.mutateAsync(trimmed);
      setCommentText("");
      toast.success("Comentário adicionado com sucesso.");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message as string | undefined) ||
          "Não foi possível adicionar o comentário."
        : error instanceof Error
          ? error.message
          : "Não foi possível adicionar o comentário.";
      toast.error(message);
    }
  };

  const placeholderTemplate = useMemo(
    () => ({
      processoEletronico: "{{processo_eletronico}}",
      tipoDocumentoPrimeiroItem: "{{tipo_documento_1}}",
      nomePrimeiroItem: "{{nome_1}}",
      numeroPrimeiroItem: "{{numero_1}}",
    }),
    [],
  );

  const movimentacaoDates = useMemo(() => {
    const normalizedCurrentStatus = normalizeStatusValue(item?.status);

    const fallbackDataDesarquivamentoFromStatus =
      isValidTimestamp(item?.updatedAt) &&
      !!normalizedCurrentStatus &&
      [
        "DESARQUIVADO",
        "REARQUIVAMENTO_SOLICITADO",
        "FINALIZADO",
        "RETIRADO_PELO_SETOR",
      ].includes(normalizedCurrentStatus)
        ? item.updatedAt
        : undefined;

    const fallbackDataDevolucaoFromStatus =
      isValidTimestamp(item?.updatedAt) &&
      !!normalizedCurrentStatus &&
      ["REARQUIVAMENTO_SOLICITADO", "FINALIZADO"].includes(
        normalizedCurrentStatus,
      )
        ? item.updatedAt
        : undefined;

    const fallback = {
      dataDesarquivamentoSAG:
        item?.dataDesarquivamentoSAG || fallbackDataDesarquivamentoFromStatus,
      dataDevolucaoSetor:
        item?.dataDevolucaoSetor || fallbackDataDevolucaoFromStatus,
    };

    if (!item || historico.length === 0) {
      return fallback;
    }

    const statusTimeline = [...historico]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      .map((historyItem) => ({
        timestamp: historyItem.timestamp,
        status: extractStatusFromHistoricoItem(historyItem),
      }))
      .filter(
        (
          event,
        ): event is {
          timestamp: string;
          status: string;
        } => isValidTimestamp(event.timestamp) && !!event.status,
      );

    const findFirstStatusTimestamp = (
      targetStatuses: readonly string[],
    ): string | undefined =>
      statusTimeline.find((event) => targetStatuses.includes(event.status))
        ?.timestamp;

    const historyDataDesarquivamento = findFirstStatusTimestamp([
      "DESARQUIVADO",
    ]);

    const historyDataDevolucaoSetor = findFirstStatusTimestamp([
      "REARQUIVAMENTO_SOLICITADO",
      "FINALIZADO",
    ]);

    return {
      dataDesarquivamentoSAG:
        item.dataDesarquivamentoSAG ||
        historyDataDesarquivamento ||
        fallbackDataDesarquivamentoFromStatus,
      dataDevolucaoSetor:
        item.dataDevolucaoSetor ||
        historyDataDevolucaoSetor ||
        fallbackDataDevolucaoFromStatus,
    };
  }, [historico, item]);

  const handlePrintDesarquivamento = async () => {
    if (!item) {
      toast.error("Nao foi possivel localizar os dados para gerar o termo.");
      return;
    }

    try {
      // Buscar registros relacionados pelo mesmo número de processo
      const relatedResponse = await fetch(`/api/nugecid/${item.id}/related`, {
        credentials: "include",
      });

      if (!relatedResponse.ok) {
        throw new Error("Erro ao buscar registros relacionados");
      }

      const relatedData = await relatedResponse.json();
      const relatedRecords = relatedData.success ? relatedData.data : [item];

      const eligibleRecords = (relatedRecords || []).filter(
        (record: RelatedRecord) => {
          const statusValue = String(record?.status ?? "")
            .trim()
            .toUpperCase();
          return statusValue === "DESARQUIVADO";
        },
      );

      if (!eligibleRecords.length) {
        toast.error(
          "Somente registros desarquivados podem gerar o termo de impressão.",
        );
        return;
      }

      const baseHref =
        window.location.origin + (import.meta.env?.BASE_URL ?? "/");
      const toAbs = (url: string) => new URL(url, baseHref).toString();

      const logoRN = toAbs(brasaorn);
      const logoITEP = toAbs(brasaoitep);

      const escapeHtml = (value: unknown): string => {
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

      const userName = escapeHtml(
        user?.nome || user?.usuario || "Usuário não identificado",
      );
      const matricula = escapeHtml(
        user?.matricula || "Matrícula não informada",
      );
      const assinaturaDate = new Date();
      const dataAssinatura = escapeHtml(
        assinaturaDate.toLocaleDateString("pt-BR"),
      );
      const horaAssinatura = escapeHtml(
        assinaturaDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );

      // Gerar linhas para todos os registros elegíveis com numeração sequencial
      const detailRows: DetailRowData[] = eligibleRecords
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

          const inferredQuantity =
            typeof record.quantidadeItens === "number" &&
            record.quantidadeItens > 0
              ? record.quantidadeItens
              : rawItems.length > 0
                ? rawItems.length
                : fallbackIdentifiers.length;
          const normalizedQuantity =
            inferredQuantity > 0 ? inferredQuantity : 1;

          const baseType = escapeHtml(
            record.tipoDocumento ||
              (record.tipoDesarquivamento
                ? getTipoDesarquivamentoLabel(record.tipoDesarquivamento)
                : ""),
          );

          // Para cada registro, gerar as linhas correspondentes
          const recordRows = fallbackIdentifiers.map(
            (code: string, localIndex: number) => {
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
                  ? (current?.observacao ??
                    current?.descricao ??
                    current?.detalhe)
                  : undefined;

              return {
                index: globalIndex + 1, // Numeração sequencial global
                type: escapeHtml(typeValue ?? baseType),
                name: escapeHtml(nameValue ?? record.nomeCompleto ?? "-"),
                code: escapeHtml(code ?? "-"),
                observation: escapeHtml(observationValue ?? ""),
              };
            },
          );

          return recordRows;
        })
        .flat();

      const processNumber = escapeHtml(
        item.numeroProcesso || String(item.id ?? "-"),
      );
      // Data "agora" (no cliente) para o termo impresso
      const hoje = new Date();
      const dataRetirada = escapeHtml(
        typeof formatDate === "function"
          ? formatDate(hoje)
          : hoje.toLocaleDateString("pt-BR"),
      );
      const tipoDocumentoPrincipal = escapeHtml(
        item.tipoDocumento ||
          getTipoDesarquivamentoLabel(item.tipoDesarquivamento),
      );
      const nomeRegistro = escapeHtml(item.nomeCompleto ?? "-");

      const rowsHtml = detailRows
        .map((row: DetailRowData) => {
          const isFirstRow = row.index === 1;
          const typeCell = isFirstRow
            ? placeholderTemplate.tipoDocumentoPrimeiroItem
            : row.type;
          const nameCell = isFirstRow
            ? placeholderTemplate.nomePrimeiroItem
            : row.name;
          const numberCell = isFirstRow
            ? placeholderTemplate.numeroPrimeiroItem
            : row.code;

          return `
      <tr>
        <td class="col-idx">${row.index}</td>
        <td class="col-type">${typeCell}</td>
        <td class="col-name">${nameCell}</td>
        <td class="col-num">${numberCell}</td>
      </tr>`;
        })
        .join("");

      const templateHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title> </title>
  <base href="${baseHref}">
  <style>
    :root {
      --page-padding-x: 10mm;
      --header-height: 115px;
      --footer-height: 80px;
      --page-height: 297mm;
      --page-margin: 10mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 12pt;
      margin: 0;
      color: #000;
    }
    .hdr-text{
      font-family: "Liberation Serif", "Times New Roman", serif;
      font-size: 10pt;
    }  
    p { margin: 0; }
    .center { text-align: center; }
    .mt-8 { margin-top: 6pt; }
    .mt-12 { margin-top: 8pt; }
    .mb-7 { margin-bottom: 5pt; }
    .mb-0 { margin-bottom: 0; }

    /* Tabela do cabeçalho com logos e textos institucionais */
    .hdr { width: 100%; border-collapse: collapse; }
    .hdr td { vertical-align: top; }
    .hdr .logo { width: 95.25pt; text-align: center; }
    .hdr .miolo { width: 341.25pt; }
    .hdr .logo-dir { width: 83.25pt; text-align: left; }
    
    /* Título */
    h1 { margin: 6pt 0 5pt 0; font-size: 14pt; text-align: center; text-transform: none; }

    /* Tabelas principais com borda preta 0.75pt e faixas cinza */
    table.borda { width: 100%; border: 0.75pt solid #000; border-collapse: collapse; }
    table.borda td, table.borda th { border: 0.75pt solid #000; padding: 3pt 5pt; }
    .faixa { background: #bfbfbf; }
    .fs10 { font-size: 10pt; }
    .fs11 { font-size: 11pt; }
    .fs12 { font-size: 12pt; }
    .sub { font-size: 9pt; }
    .right { text-align: right; }
    .center { text-align: center; }
    .vermelho { color: red; }

    /* Larguras do bloco "TIPO DE DOCUMENTO" (2 células no corpo) */
    .col-idx { width: 19.2pt; text-align: center; }
    .col-type { width: 75.45pt; }
    .col-name { width: 169.9pt; text-align: center; }
    .col-num { width: 181.2pt; text-align: center; }

    /* Linhas de assinatura (grossas) */
    .ass-linha { border-bottom: 1.5pt solid #000; height: 16pt; margin-bottom: 2pt; }

    /* Rodapé com linha superior */
    .rodape { border-top: 0.75pt solid #000; padding-top: 2pt; margin-top: 5pt; }
    .autenticacao { margin-top: 20pt; font-size: 10pt; text-align: center; }

    /* Documento completo com cabeçalho e rodapé repetíveis */
    table.documento-completo {
      width: 100%;
      border-collapse: collapse;
    }
    table.documento-completo tbody {
      height: 100%;
    }
    table.documento-completo thead {
      display: table-header-group;
    }
    table.documento-completo tfoot {
      display: table-footer-group;
    }
    table.documento-completo thead td,
    table.documento-completo tfoot td {
      border: none;
      padding: 0;
    }

    /* Bloco de assinaturas - nunca quebrar entre páginas */
    .assinaturas-bloco {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 20pt;
    }

    @page {
      margin: 10mm;
    }

    @media print {
      .faixa {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      td[style*="background-color"] {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Cabeçalho e rodapé repetem em cada página */
      table.documento-completo thead {
        display: table-header-group;
      }
      table.documento-completo tfoot {
        display: table-footer-group;
      }
      /*
       * Em documento curto (1 página), empurra o tfoot para o final da folha.
       * O valor usa margem de segurança para evitar criar página em branco.
       */
      table.documento-completo {
        min-height: 274mm;
      }
      table.documento-completo tbody > tr > td {
        vertical-align: top;
      }
      /* Bloco de assinaturas nunca quebra */
      .assinaturas-bloco {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .autenticacao { margin-top: 20pt; page-break-inside: avoid; text-align: center; }
    }
  </style>
</head>
<body>
  <table class="documento-completo">
    <thead>
      <tr>
        <td>
          <table class="hdr">
            <tr style="height:75pt;">
              <td class="logo">
                <img src="${logoRN}" alt="Brasão RN" height="100" />
              </td>
              <td class="miolo" style="line-height: 1.2;">
                <p class="center fs10 hdr-text"><strong>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</strong><br/>
                <strong>SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</strong><br/>
                <strong>POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE</strong><br/>
                <strong>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID</strong></p>
                <p class="center fs10 hdr-text"><strong>ARQUIVO GERAL - PCIRN</strong></p>
              </td>
              <td class="logo-dir">
                <img src="${logoITEP}" alt="Brasão ITEP" height="100" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <td>
          <div class="rodape fs10 center" style="line-height: 1.3; border-top: 0.75pt solid #000; padding-top: 8pt; margin-top: 15pt;">
            <p>Polícia Científica do Rio Grande do Norte - PCIRN</p>
            <p>Núcleo de Gestão do Conhecimento, Informação Documentação e Memória - NUGECID</p>
            <p>Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928</p>
            <p>Email: arquivogeral@pci.rn.gov.br</p>
          </div>
        </td>
      </tr>
    </tfoot>
    <tbody>
      <tr>
        <td>
          <!-- Título -->
          <h1><strong>TERMO DE DESARQUIVAMENTO DE DOCUMENTO</strong></h1>

          <!-- Intro -->
          <p class="center mb-7 fs12" style="text-align:justify">Ao servidor responsável pelo desarquivamento compete ter ciência que esta solicitação de desarquivamento de documento deve estar vinculada a uma demanda da Polícia Científica do Rio Grande do Norte, ou jurisdição de órgão público através de autoridade competente.</p>
          <p class="fs12" style="text-indent:35.4pt; text-align:justify;">
            Estar ciente quanto às orientações e normativas descritas na portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe sobre o acesso e o fluxo de desarquivamento de documentos no âmbito do Setor de Arquivo Geral da Polícia Científica do Rio Grande do Norte.
          </p>

          <!-- Nº Processo Eletrônico -->
          <table class="borda mt-12">
            <tbody>
              <tr>
                <td colspan="4" class="faixa center fs12" style="background-color: #bfbfbf !important;"><strong>Nº. DE PROCESSO ELETRÔNICO</strong></td>
              </tr>
              <tr>
                <td colspan="4" class="faixa center fs12">
                  ${placeholderTemplate.processoEletronico || ""}
                </td>
              </tr>

              <!-- Cabeçalho de itens -->
              <tr class="faixa">
                <td class="center fs12" colspan="2" style="width: 124.65pt;">
                  <strong>TIPO DE DOCUMENTO</strong><br/>
                  <span class="sub">Ex: Prontuário, Laudo, Parecer, Relatório.</span>
                </td>
                <td class="center fs12" style="width: 169.9pt;"><strong>NOME</strong></td>
                <td class="center fs12" style="width: 181.2pt;"><strong>NÚMERO</strong></td>
              </tr>

              <!-- Linhas geradas -->
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Espaço -->
          <p class="mb-0" style="line-height:100%; margin-top: 6pt;">&nbsp;</p>

          <!-- Assinaturas - bloco que não deve ser quebrado -->
          <div class="assinaturas-bloco">
            <table class="borda">
              <tbody>
                <tr class="faixa">
                  <td style="width: 201.6pt;">
                    <p class="center fs11"><strong>SETOR DE ARQUIVO GERAL</strong></p>
                    <p class="center sub">Responsável pela ENTREGA</p>
                  </td>
                  <td colspan="2">
                    <p class="center fs11"><strong>SETOR SOLICITANTE</strong></p>
                    <p class="center sub">Responsável pelo RECEBIMENTO</p>
                  </td>
                </tr>
                <tr>
                  <td rowspan="5" style="vertical-align:middle; text-align:center;">
                    <div class="ass-linha"></div>
                    <p class="center fs11"><strong>ASSINATURA</strong></p>
                  </td>
                  <td class="fs11 vermelho" style="width:103.2pt;"><strong>SETOR</strong></td>
                  <td class="fs11" style="width:144.5pt;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="fs11 vermelho"><strong>ASSINATURA DO SERVIDOR</strong></td>
                  <td class="fs11">&nbsp;</td>
                </tr>
                <tr>
                  <td class="fs11 vermelho"><strong>MATRÍCULA</strong></td>
                  <td class="fs11">&nbsp;</td>
                </tr>
                <tr>
                  <td class="fs11 vermelho"><strong>DATA DE RETIRADA</strong></td>
                  <td class="fs11">${dataRetirada || "&nbsp;"}</td>
                </tr>
                <tr>
                  <td class="fs11 vermelho"><strong>DATA DE DEVOLUÇÃO</strong></td>
                  <td class="fs11">&nbsp;</td>
                </tr>
              </tbody>
            </table>

            <!-- Nota -->
            <p class="center fs10 mt-8"><strong>* Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe quanto aos prazos e instruções normativas.</strong></p>

            <div class="autenticacao fs10 center">
              <p><em>Documento assinado digitalmente por ${userName} às ${horaAssinatura} - ${dataAssinatura}.</em></p>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

      const placeholderValues: Record<string, string> = {
        [placeholderTemplate.processoEletronico]: processNumber,
        [placeholderTemplate.tipoDocumentoPrimeiroItem]:
          detailRows[0]?.type ?? "-",
        [placeholderTemplate.nomePrimeiroItem]: detailRows[0]?.name ?? "-",
        [placeholderTemplate.numeroPrimeiroItem]: detailRows[0]?.code ?? "-",
      };

      const html = Object.entries(placeholderValues).reduce(
        (result, [placeholder, value]) => {
          return result.split(placeholder).join(value);
        },
        templateHtml,
      );

      const printWindow = window.open("", "_blank", "width=900,height=650");
      if (!printWindow) {
        toast.error("Nao foi possivel abrir a janela de impressao.");
        return;
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
        setTimeout(tryPrint, 300);
      } else {
        let loaded = 0;
        const failSafe = window.setTimeout(tryPrint, 2000);
        const done = () => {
          loaded++;
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
      }
    } catch (error) {
      console.error("Erro ao gerar termo:", error);
      toast.error("Erro ao gerar termo de impressão");
    }
  };

  const handleDownloadDocx = async () => {
    if (!item) {
      toast.error(
        "Não foi possível localizar os dados para gerar o documento.",
      );
      return;
    }

    try {
      await downloadDocxMutation.mutateAsync(id);
      toast.success("Documento DOCX baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar DOCX:", error);
      toast.error("Erro ao baixar documento DOCX");
    }
  };

  const handlePrintRearquivamento = async () => {
    if (!item) {
      toast.error("Não foi possível localizar os dados para gerar o termo.");
      return;
    }

    try {
      // Buscar registros relacionados pelo mesmo número de processo com status REARQUIVAMENTO_SOLICITADO
      const relatedResponse = await fetch(`/api/nugecid/${item.id}/related`, {
        credentials: "include",
      });

      if (!relatedResponse.ok) {
        throw new Error("Erro ao buscar registros relacionados");
      }

      const relatedData = await relatedResponse.json();
      const relatedRecords = relatedData.success ? relatedData.data : [item];

      // Filtrar apenas registros com status REARQUIVAMENTO_SOLICITADO
      const eligibleRecords = (relatedRecords || []).filter(
        (record: RelatedRecord) => {
          const statusValue = String(record?.status ?? "")
            .trim()
            .toUpperCase();
          return statusValue === "REARQUIVAMENTO_SOLICITADO";
        },
      );

      if (!eligibleRecords.length) {
        toast.error(
          'Somente registros com status "Rearquivamento Solicitado" podem gerar o termo de rearquivamento.',
        );
        return;
      }

      const escapeHtml = (value: unknown): string => {
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

      const userName = escapeHtml(
        user?.nome || user?.usuario || "Usuário não identificado",
      );
      const matricula = escapeHtml(
        user?.matricula || "Matrícula não informada",
      );
      const assinaturaDate = new Date();
      const dataAssinatura = escapeHtml(
        assinaturaDate.toLocaleDateString("pt-BR"),
      );
      const horaAssinatura = escapeHtml(
        assinaturaDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );

      const processNumber = escapeHtml(
        item.numeroProcesso || String(item.id ?? "-"),
      );
      const dataHoraRecebimento = escapeHtml(formatDate(new Date()) || "-");

      // Montar lista de itens para o template (NIC/Laudo no campo NÚMERO, tipoDocumento - NomeCompleto no campo DESCRIÇÃO)
      const itens = eligibleRecords.map((record: RelatedRecord) => {
        const tipo =
          record.tipoDocumento ||
          (record.tipoDesarquivamento
            ? getTipoDesarquivamentoLabel(record.tipoDesarquivamento)
            : "") ||
          "";
        const nome = record.nomeCompleto || "";
        const descricao =
          tipo && nome ? `${tipo} - ${nome}` : tipo || nome || "";

        return {
          numeroNicLaudoAuto: record.numeroNicLaudoAuto || "",
          descricao,
        };
      });

      printRearquivamento({
        processNumber,
        dataHoraRecebimento,
        userName,
        matricula,
        dataAssinatura,
        horaAssinatura,
        itens,
      });
    } catch (error) {
      console.error("Erro ao gerar termo de rearquivamento:", error);
      toast.error("Erro ao gerar termo de rearquivamento");
    }
  };

  if (!isMounted) {
    return null;
  }

  const modalNode = (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
      }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhes da Solicitação
              </h3>
              <p className="text-sm text-gray-500">
                Informações completas do desarquivamento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : item ? (
            <>
              {/* Cards de Resumo no Topo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    Tipo
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {getTipoDesarquivamentoLabel(item.tipoDesarquivamento)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    Status
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {getStatusLabel(item.status)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium mb-1">
                    Criação
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(item.createdAt || item.dataSolicitacao)}
                  </div>
                </div>
                {item.urgente && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-xs text-red-600 font-medium mb-1">
                      Prioridade
                    </div>
                    <div className="text-lg font-semibold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      URGENTE
                    </div>
                  </div>
                )}
              </div>

              {/* Informações do Documento */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Informações do Documento
                  </h4>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <DetailRow label="Nome Completo" value={item.nomeCompleto} />
                  <DetailRow
                    label="Nº NIC/Laudo/Auto/IT"
                    value={
                      item.numeroNicLaudoAuto?.startsWith("MISSING-")
                        ? "N/A"
                        : item.numeroNicLaudoAuto
                    }
                  />
                  <DetailRow
                    label="Nº Processo"
                    value={item.numeroProcesso}
                    copyable
                  />
                  <DetailRow
                    label="Tipo de Documento"
                    value={item.tipoDocumento}
                  />
                  {item.quantidadeItens && (
                    <DetailRow
                      label="Quantidade de Itens"
                      value={item.quantidadeItens}
                    />
                  )}
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Observações
                    </div>
                    <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap break-words">
                      {item.dadosAdicionais || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Setor e Responsável */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Setor e Responsável
                  </h4>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <DetailRow
                    label="Setor Demandante"
                    value={item.setorDemandante}
                  />
                  <DetailRow
                    label="Servidor Responsável"
                    value={item.servidorResponsavel}
                  />
                  <DetailRow
                    label="Instituto"
                    value={getInstitutoLabel(item.instituto)}
                  />
                  <DetailRow label="Requerente" value={item.requerente} />
                  <DetailRow
                    label="Nº do Ofício"
                    value={item.numeroOficio}
                    copyable
                  />
                </div>
              </div>

              {/* Justificativa e Prazos */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Justificativa e Finalidade
                  </h4>
                </div>
                <div className="p-5 space-y-4">
                  {item.justificativa && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Justificativa
                      </div>
                      <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap break-words">
                        {item.justificativa}
                      </div>
                    </div>
                  )}
                  <DetailRow
                    label="Finalidade do Desarquivamento"
                    value={item.finalidadeDesarquivamento}
                    fullWidth
                  />
                  {(item.prazoDesarquivamento || item.prazoVencimento) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3 border-t border-gray-200">
                      {item.prazoDesarquivamento && (
                        <DetailRow
                          label="Prazo de Desarquivamento"
                          value={formatDate(item.prazoDesarquivamento)}
                        />
                      )}
                      {item.prazoVencimento && (
                        <DetailRow
                          label="Prazo de Vencimento"
                          value={formatDate(item.prazoVencimento)}
                          highlight={
                            new Date(item.prazoVencimento) < new Date()
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Prazos e Datas */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Prazos e Movimentação
                  </h4>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  <DetailRow
                    label="Data de Criação"
                    value={formatDate(item.createdAt || item.dataSolicitacao)}
                  />
                  <DetailRow
                    label="Data Desarquivamento - SAG"
                    value={
                      movimentacaoDates.dataDesarquivamentoSAG
                        ? formatDate(movimentacaoDates.dataDesarquivamentoSAG)
                        : "Aguardando"
                    }
                    highlight={!movimentacaoDates.dataDesarquivamentoSAG}
                  />
                  <DetailRow
                    label="Data Devolução pelo Setor"
                    value={
                      movimentacaoDates.dataDevolucaoSetor
                        ? formatDate(movimentacaoDates.dataDevolucaoSetor)
                        : "Aguardando"
                    }
                    highlight={!movimentacaoDates.dataDevolucaoSetor}
                  />
                </div>
              </div>

              {/* Prorrogação */}
              {(item.solicitacaoProrrogacao ||
                item.solicitacaoProrrogacaoTexto) && (
                <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
                  <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-700" />
                    <h4 className="text-base font-semibold text-amber-900">
                      Solicitação de Prorrogação
                    </h4>
                  </div>
                  <div className="p-5">
                    <DetailRow
                      label="Prorrogação Solicitada"
                      value={item.solicitacaoProrrogacao ? "SIM" : "NÃO"}
                    />
                    {item.solicitacaoProrrogacaoTexto && (
                      <div className="mt-3">
                        <div className="text-sm font-semibold text-amber-800 mb-2">
                          Justificativa:
                        </div>
                        <div className="text-sm text-gray-800 bg-white rounded-lg p-3 border border-amber-200">
                          {item.solicitacaoProrrogacaoTexto}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comentários */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Comentários
                  </h4>
                </div>
                <div className="p-5 space-y-4">
                  <form onSubmit={handleSubmitComment} className="space-y-3">
                    <textarea
                      className="w-full min-h-[100px] rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Adicione um comentário sobre esta solicitação..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Comentando como{" "}
                        <strong className="text-gray-700">
                          {user?.nome || user?.usuario || "Usuário"}
                        </strong>
                      </span>
                      <button
                        type="submit"
                        disabled={addCommentMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      >
                        {addCommentMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Enviar
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {isLoadingComments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Nenhum comentário registrado até o momento.
                        </p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 border-l-4 border-indigo-500 rounded-lg px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                            <span className="font-bold text-gray-800 flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {comment.authorName}
                            </span>
                            <span className="text-gray-500">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                            {comment.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Registro não encontrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <div className="relative" ref={printDropdownRef}>
            <button
              onClick={() => setShowPrintDropdown(!showPrintDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Imprimir Termo
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showPrintDropdown ? "rotate-0" : "rotate-180"}`}
              />
            </button>

            {showPrintDropdown && (
              <div className="absolute bottom-full mb-2 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => {
                    setShowPrintDropdown(false);
                    handlePrintDesarquivamento();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors flex items-center gap-2 rounded-t-lg"
                >
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Desarquivamento
                  </span>
                </button>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={() => {
                    setShowPrintDropdown(false);
                    handlePrintRearquivamento();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors flex items-center gap-2 rounded-b-lg"
                >
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Rearquivamento
                  </span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              onClose();
              navigate(`/desarquivamentos/${id}`);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Ver Detalhes Completos
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

const copyTextSafely = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // fallback below
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let successful = false;
  try {
    successful = document.execCommand("copy");
  } catch (error) {
    successful = false;
  } finally {
    document.body.removeChild(textArea);
  }
  return successful;
};

const DetailRow = ({
  label,
  value,
  fullWidth = false,
  highlight = false,
  copyable = false,
}: {
  label: string;
  value?: string | number | boolean | null;
  fullWidth?: boolean;
  highlight?: boolean;
  copyable?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    if (copied) {
      timer = window.setTimeout(() => setCopied(false), 1500);
    }
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [copied]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      const success = await copyTextSafely(String(value));
      if (!success) {
        throw new Error("Copy command was unsuccessful");
      }
      setCopied(true);
    } catch (error) {
      console.error("Erro ao copiar número do processo:", error);
      toast.error("Não foi possível copiar o valor.");
    }
  };

  const baseValueClasses = `text-sm font-medium break-words ${
    highlight ? "text-orange-600 italic" : "text-gray-900"
  }`;

  if (!copyable) {
    return (
      <div className={fullWidth ? "md:col-span-2" : ""}>
        <div className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          {label}
        </div>
        <div className={baseValueClasses}>{value || "-"}</div>
      </div>
    );
  }

  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <div className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </div>
      <div className={`${baseValueClasses} flex items-center gap-2`}>
        <span className="font-mono break-all">{value || "-"}</span>
        {value && (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Copiar valor"
              aria-label="Copiar valor"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            {copied && (
              <span className="text-xs text-emerald-600">Copiado</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Detail = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm text-gray-900 break-words">{value || "-"}</div>
  </div>
);

export default DesarquivamentoDetailModal;
