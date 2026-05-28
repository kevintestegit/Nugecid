import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  useDesarquivamentos,
  useDeleteDesarquivamento,
} from "@/hooks/useDesarquivamentos";
import { useDesarquivamentosImport } from "@/hooks/useDesarquivamentosImport";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { DateRange } from "@/components/ui/DateRangeInput";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
// Modal customizado será implementado inline
import {
  Plus,
  Trash2,
  RefreshCw,
  Upload,
  FileText,
  Printer,
  AlertCircle,
  Download,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreVertical,
  X,
} from "lucide-react";
import {
  StatusDesarquivamento,
  TipoSolicitacao,
  TipoDesarquivamento,
  Desarquivamento,
  DesarquivamentoPrintCandidate,
} from "@/types";
import {
  formatDate,
  getStatusLabel,
  getTipoDesarquivamentoLabel,
} from "@/utils/format";
import { toast } from "sonner";
import { TableLoading } from "@/components/ui/Loading";
import { ImportModal } from "@/components/desarquivamentos/ImportModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { DesarquivamentosFiltersCard } from "@/components/desarquivamentos/DesarquivamentosFiltersCard";
import { DesarquivamentoTableRow } from "@/components/desarquivamentos/DesarquivamentoTableRow";
import DesarquivamentoDetailModal from "@/components/desarquivamentos/DesarquivamentoDetailModal";
import { AdminConfirmDialog } from "@/components/ui/AdminConfirmDialog";
import "@/styles/desarquivamentos.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import axios from "axios";
import { printHtmlDocument } from "@/components/desarquivamentos/print-utils";
import brasaorn from "@/components/img/Brasão-RN.png";
import brasaoitep from "@/components/img/brasao-itep-optimized.png";

type SortOrder = "ASC" | "DESC";

type SortField =
  | "tipoDesarquivamento"
  | "status"
  | "nomeCompleto"
  | "numeroNicLaudoAuto"
  | "numeroProcesso"
  | "tipoDocumento"
  | "createdAt"
  | "dataDesarquivamentoSAG"
  | "dataDevolucaoSetor"
  | "setorDemandante"
  | "servidorResponsavel"
  | "finalidadeDesarquivamento"
  | "solicitacaoProrrogacao";

const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).replace(
    /[&<>"']/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[match] || match,
  );
};

const DesarquivamentosPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [tipoDesarquivamentoFilter, setTipoDesarquivamentoFilter] =
    useState<string>("all");
  const [institutoFilter, setInstitutoFilter] = useState<string>("all");
  const [requerenteFilter, setRequerenteFilter] = useState<string>("all");
  const [atencaoNecessariaFilter, setAtencaoNecessariaFilter] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
  // Exibir todos em uma única página (até 100 itens)
  const [pageSize] = useState(100);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    item: Desarquivamento | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [isPrintTermsModalOpen, setIsPrintTermsModalOpen] = useState(false);
  const [isLoadingPrintTerms, setIsLoadingPrintTerms] = useState(false);
  const [printCandidates, setPrintCandidates] = useState<
    DesarquivamentoPrintCandidate[]
  >([]);
  const [selectedPrintIds, setSelectedPrintIds] = useState<number[]>([]);
  const [printProcessSearch, setPrintProcessSearch] = useState("");
  const printTermsButtonRef = useRef<HTMLButtonElement | null>(null);
  const printSearchInputRef = useRef<HTMLInputElement | null>(null);
  const printDialogRef = useRef<HTMLDivElement | null>(null);
  const printReturnFocusRef = useRef<HTMLElement | null>(null);

  // Read URL query parameters on component mount
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    const atencaoNecessariaFromUrl =
      searchParams.get("atencaoNecessaria") === "true";

    setStatusFilter(
      statusFromUrl && statusFromUrl !== "all" ? statusFromUrl : "all",
    );
    setAtencaoNecessariaFilter(atencaoNecessariaFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: StatusDesarquivamento;
    }) => {
      const payload = { status };
      return apiService.updateDesarquivamento(id, payload);
    },
    onSuccess: () => {
      setEditingStatusId(null);
      toast.success("Status atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["desarquivamentos"] });
    },
    onError: (error: Error) => {
      setEditingStatusId(null);
      const message = error?.message || "Erro ao atualizar status";
      toast.error(`Erro ao atualizar status: ${message}`);
    },
  });

  // Query parameters
  const queryParams = useMemo(() => {
    const toYMD = (d?: Date | null, isEndDate = false) => {
      if (!d) return undefined;

      // Se for data final, adiciona 1 dia para incluir o dia completo
      const dateToFormat = isEndDate ? new Date(d) : d;
      if (isEndDate) {
        dateToFormat.setDate(dateToFormat.getDate() + 1);
      }

      const yyyy = dateToFormat.getFullYear();
      const mm = String(dateToFormat.getMonth() + 1).padStart(2, "0");
      const dd = String(dateToFormat.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder,
      search: debouncedSearchTerm || undefined,
      status:
        statusFilter !== "all"
          ? [statusFilter as StatusDesarquivamento]
          : undefined,
      tipo: tipoFilter !== "all" ? (tipoFilter as TipoSolicitacao) : undefined,
      tipoDesarquivamento:
        tipoDesarquivamentoFilter !== "all"
          ? (tipoDesarquivamentoFilter as TipoDesarquivamento)
          : undefined,
      instituto: institutoFilter !== "all" ? institutoFilter : undefined,
      requerente: requerenteFilter !== "all" ? requerenteFilter : undefined,
      atencaoNecessaria: atencaoNecessariaFilter || undefined,
      startDate: toYMD(dateRange.startDate, false),
      endDate: toYMD(dateRange.endDate, true),
    };
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    debouncedSearchTerm,
    statusFilter,
    tipoFilter,
    tipoDesarquivamentoFilter,
    institutoFilter,
    requerenteFilter,
    atencaoNecessariaFilter,
    dateRange,
  ]);

  const { data, isLoading, isFetching, error, refetch } =
    useDesarquivamentos(queryParams);
  const hasLoadedRows = (data?.data?.length ?? 0) > 0;
  const deleteDesarquivamento = useDeleteDesarquivamento();
  const { isLoading: isImporting } = useDesarquivamentosImport(() => {
    refetch();
    setIsImportModalOpen(false);
  });

  const handleDeleteClick = (item: Desarquivamento) => {
    // Verificar se o ID existe e é válido
    if (!item || !item.id) {
      toast.error("Erro", {
        description: "Não foi possível identificar o registro para exclusão.",
        duration: 5000,
      });
      return;
    }

    setDeleteConfirm({ isOpen: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.item) {
      const itemId = deleteConfirm.item.id;
      const itemNic = deleteConfirm.item.numeroNicLaudoAuto || "N/A";

      try {
        // Verificar se o ID não é nulo, undefined ou zero
        if (itemId === null || itemId === undefined || itemId === 0) {
          toast.error("ID inválido", {
            description: "O ID do desarquivamento não é válido.",
            duration: 5000,
          });
          setDeleteConfirm({ isOpen: false, item: null });
          return;
        }

        const result = await deleteDesarquivamento.mutateAsync(itemId);

        // Verifica se a exclusão foi bem-sucedida
        if (result?.success) {
          toast.success("Desarquivamento excluído com sucesso!", {
            description: `O item foi removido do banco de dados e movido para a lixeira.`,
            duration: 5000,
          });

          // A atualização da lista agora é gerenciada pelo onSuccess do hook useDeleteDesarquivamento
          // O refetch() manual foi removido para evitar condições de corrida.
        } else {
          toast.error("Erro na exclusão", {
            description: "A exclusão não foi confirmada pelo servidor.",
          });
        }

        setDeleteConfirm({ isOpen: false, item: null });
      } catch (error: unknown) {
        const errorTimestamp = new Date().toISOString();
        console.error(
          `[${errorTimestamp}] FRONTEND - ERRO NA EXCLUSÃO:`,
          error,
        );

        let errorMessage = "Erro desconhecido";
        if (axios.isAxiosError(error)) {
          console.error(`[${errorTimestamp}] Detalhes do erro:`, {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack,
          });
          errorMessage =
            ((error.response?.data as Record<string, unknown>)
              ?.message as string) ??
            error.message ??
            "Erro desconhecido";
        } else if (error instanceof Error) {
          console.error(`[${errorTimestamp}] Detalhes do erro:`, {
            message: error.message,
            stack: error.stack,
          });
          errorMessage = error.message;
        }
        toast.error("Falha ao excluir desarquivamento", {
          description: `Erro: ${errorMessage}`,
          duration: 7000,
        });

        setDeleteConfirm({ isOpen: false, item: null });
      }
    } else {
      console.warn(
        `[${new Date().toISOString()}] ⚠️ FRONTEND - handleDeleteConfirm chamado sem item selecionado`,
      );
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, item: null });
  };

  const handleExportPlanilha = async () => {
    try {
      toast.info("Gerando planilha...", { duration: 2000 });

      // Aplicar os mesmos filtros ativos na exportação
      const exportParams: Record<string, string | number | Date> = {};

      if (searchTerm) exportParams.search = searchTerm;
      if (statusFilter !== "all") exportParams.status = statusFilter;
      if (tipoFilter !== "all") exportParams.tipo = tipoFilter;
      if (tipoDesarquivamentoFilter !== "all")
        exportParams.tipoDesarquivamento = tipoDesarquivamentoFilter;
      if (dateRange.startDate) exportParams.dataInicio = dateRange.startDate;
      if (dateRange.endDate) exportParams.dataFim = dateRange.endDate;
      exportParams.sortBy = sortBy;
      exportParams.sortOrder = sortOrder;

      const blob = await apiService.exportDesarquivamentos(exportParams);

      // Criar link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `desarquivamentos_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Planilha exportada com sucesso!");
    } catch (error: unknown) {
      console.error("Erro ao exportar planilha:", error);
      toast.error("Erro ao exportar planilha", {
        description:
          error instanceof Error ? error.message : "Tente novamente mais tarde",
      });
    }
  };

  const fetchAllDesarquivamentosForPrint = async (): Promise<
    DesarquivamentoPrintCandidate[]
  > => {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const allItems: DesarquivamentoPrintCandidate[] = [];

    do {
      const response = await apiService.getPrintCandidates({
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });

      if (Array.isArray(response?.data)) {
        allItems.push(...response.data);
      }

      totalPages = response?.meta?.totalPages ?? 1;
      page += 1;
    } while (page <= totalPages);

    return allItems;
  };

  const closePrintTermsModal = useCallback(() => {
    setIsPrintTermsModalOpen(false);

    window.setTimeout(() => {
      const returnTarget =
        printReturnFocusRef.current ?? printTermsButtonRef.current;
      returnTarget?.focus();
    }, 0);
  }, []);

  useEffect(() => {
    if (!isPrintTermsModalOpen) {
      return;
    }

    const focusTimeout = window.setTimeout(() => {
      printSearchInputRef.current?.focus();
    }, 0);

    const getFocusableElements = () => {
      const dialog = printDialogRef.current;
      if (!dialog) {
        return [];
      }

      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          [
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(","),
        ),
      ).filter((element) => !element.hasAttribute("aria-hidden"));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePrintTermsModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        printDialogRef.current?.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimeout);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePrintTermsModal, isPrintTermsModalOpen]);

  const handleOpenPrintTermsModal = async () => {
    try {
      printReturnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : printTermsButtonRef.current;
      setIsLoadingPrintTerms(true);
      const records = await fetchAllDesarquivamentosForPrint();

      if (!records.length) {
        toast.error("Não há termos disponíveis para impressão.");
        return;
      }

      setPrintCandidates(records);
      setSelectedPrintIds([]);
      setPrintProcessSearch("");
      setIsPrintTermsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar termos para impressão:", error);
      toast.error("Erro ao carregar termos para impressão");
    } finally {
      setIsLoadingPrintTerms(false);
    }
  };

  const handlePrintSelectedTerms = () => {
    const selectedItems = printCandidates.filter((candidate) =>
      selectedPrintIds.includes(candidate.id),
    );

    if (!selectedItems.length) {
      toast.error("Selecione pelo menos um termo para impressão.");
      return;
    }

    const baseHref =
      window.location.origin + (import.meta.env?.BASE_URL ?? "/");
    const toAbs = (url: string) => new URL(url, baseHref).toString();
    const logoRN = toAbs(brasaorn);
    const logoITEP = toAbs(brasaoitep);
    const userName = escapeHtml(
      user?.nome || user?.usuario || "Usuário não identificado",
    );
    const printedAt = new Date();
    const dataImpressao = escapeHtml(printedAt.toLocaleDateString("pt-BR"));
    const horaImpressao = escapeHtml(
      printedAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );

    const rowsHtml = selectedItems
      .map((item, index) => {
        const tipo = item.tipoDocumento || "-";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.numeroProcesso || "-")}</td>
            <td>${escapeHtml(tipo)}</td>
            <td>${escapeHtml(item.nomeCompleto || "-")}</td>
            <td>${escapeHtml(item.numeroNicLaudoAuto || "-")}</td>
          </tr>
        `;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <base href="${baseHref}">
  <title>Impressão de Termos</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      color: #000;
    }
    .documento-completo {
      width: 100%;
      border-collapse: collapse;
    }
    .documento-completo thead {
      display: table-header-group;
    }
    .documento-completo tfoot {
      display: table-footer-group;
    }
    .documento-completo thead td,
    .documento-completo tfoot td {
      border: none;
      padding: 0;
    }
    .hdr { width: 100%; border-collapse: collapse; }
    .hdr td { vertical-align: top; }
    .hdr-text{
      font-family: "Liberation Serif", "Times New Roman", serif;
      font-size: 10pt;
    }
    .logo { width: 96px; text-align: center; }
    .miolo { text-align: center; padding: 4px 8px; }
    .logo-dir { width: 96px; text-align: center; }
    .content {
      padding: 10mm;
    }
    h1 {
      font-size: 14pt;
      margin: 0 0 8pt;
      text-transform: uppercase;
      text-align: center;
      font-weight: bold;
    }
    p {
      margin: 0 0 14px;
      font-size: 12px;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .termos-table th, .termos-table td {
      border: 1px solid #111827;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    .termos-table th {
      background: #e5e7eb;
      font-weight: 700;
    }
    .autenticacao {
      margin-top: 16pt;
      font-size: 10pt;
      text-align: center;
      color: #111827;
    }
    .rodape {
      border-top: 0.75pt solid #000;
      padding-top: 8pt;
      margin-top: 10pt;
      text-align: center;
      line-height: 1.3;
      font-size: 10pt;
    }
    @media print {
      @page { size: A4; margin: 10mm; }
      body { margin: 0; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .documento-completo thead { display: table-header-group; }
      .documento-completo tfoot { display: table-footer-group; }
    }
  </style>
</head>
<body>
  <table class="documento-completo">
    <thead>
      <tr>
        <td>
          <table class="hdr">
            <tr>
              <td class="logo">
                <img src="${logoRN}" alt="Brasão RN" height="90" />
              </td>
              <td class="miolo">
                <p class="hdr-text"><strong>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</strong></p>
                <p class="hdr-text"><strong>SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA E DA DEFESA SOCIAL</strong></p>
                <p class="hdr-text"><strong>POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE</strong></p>
                <p class="hdr-text"><strong>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID</strong></p>
                <p class="hdr-text"><strong>SETOR DE ARQUIVO GERAL - SAG</strong></p>
              </td>
              <td class="logo-dir">
                <img src="${logoITEP}" alt="Brasão ITEP" height="90" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <td>
          <div class="rodape">
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
        <td class="content">
          <h1>Termos de Desarquivamento por Processos</h1>
          <p>Total selecionado: ${selectedItems.length}</p>
          <table class="termos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nº processo eletrônico</th>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Número</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="autenticacao">
            <p><em>Documento impresso por ${userName} às ${horaImpressao} - ${dataImpressao}.</em></p>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

    closePrintTermsModal();
    printHtmlDocument(html);
  };

  const filteredPrintCandidates = useMemo(() => {
    const normalizedSearch = printProcessSearch.trim().toLowerCase();
    if (!normalizedSearch) return printCandidates;

    const terms = normalizedSearch
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!terms.length) return printCandidates;

    return printCandidates.filter((candidate) => {
      const processNumber = String(
        candidate.numeroProcesso || "",
      ).toLowerCase();
      return terms.some((term) => processNumber.includes(term));
    });
  }, [printCandidates, printProcessSearch]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);

    // Update URL query parameters
    const newSearchParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newSearchParams.delete("status");
    } else {
      newSearchParams.set("status", value);
    }

    if (atencaoNecessariaFilter && value !== StatusDesarquivamento.SOLICITADO) {
      setAtencaoNecessariaFilter(false);
      newSearchParams.delete("atencaoNecessaria");
    }

    setSearchParams(newSearchParams);
  };

  const clearAtencaoNecessariaFilter = () => {
    setAtencaoNecessariaFilter(false);
    setCurrentPage(1);

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("atencaoNecessaria");
    setSearchParams(newSearchParams);
  };

  const handleTipoFilter = (value: string) => {
    setTipoFilter(value);
    setCurrentPage(1);
  };

  const handleTipoDesarquivamentoFilter = (value: string) => {
    setTipoDesarquivamentoFilter(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
    setCurrentPage(1);
  };

  const handleOpenDetails = useMemo(
    () => (id: number) => setDetailId(id || null),
    [],
  );

  const handleStartEditStatus = useMemo(
    () => (id: number) => setEditingStatusId(id),
    [],
  );

  const handleUpdateStatus = useMemo(
    () => (id: number, status: StatusDesarquivamento) =>
      updateStatus.mutate({ id, status }),
    [updateStatus],
  );

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />;
    }

    if (sortOrder === "ASC") {
      return <ArrowUp className="h-3.5 w-3.5 shrink-0" />;
    }

    return <ArrowDown className="h-3.5 w-3.5 shrink-0" />;
  };

  const handleSort = (field: SortField) => {
    setCurrentPage(1);

    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      return;
    }

    setSortBy(field);
    setSortOrder("ASC");
  };

  const renderSortableHeader = (label: string, field: SortField) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 text-left font-medium text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Ordenar por ${label}`}
    >
      <span>{label}</span>
      {getSortIcon(field)}
    </button>
  );

  const canEdit =
    user?.role?.name === "admin" || user?.role?.name === "coordenador";
  const canDelete = user?.role?.name === "admin";

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar as solicitações.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Solicitações de Desarquivamento
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as solicitações do sistema
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-border/60 bg-background/70 backdrop-blur"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              ref={printTermsButtonRef}
              onClick={handleOpenPrintTermsModal}
              variant="outline"
              size="sm"
              disabled={isLoadingPrintTerms}
              className="border-border/60 bg-background/70 backdrop-blur"
            >
              <Printer className="h-4 w-4 mr-2" />
              {isLoadingPrintTerms ? "Carregando..." : "Imprimir Termos"}
            </Button>
            {canDelete && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-border/60 bg-background/70 backdrop-blur"
              >
                <Link to="/desarquivamentos/lixeira">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Lixeira
                </Link>
              </Button>
            )}
            {canEdit && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/60 bg-background/70 backdrop-blur"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Planilha
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsImportModalOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Planilha
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPlanilha}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Planilha
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  asChild
                  size="sm"
                  className="hover:scale-100 bg-primary/90"
                >
                  <Link to="/desarquivamentos/novo">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Registro
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <DesarquivamentosFiltersCard
        atencaoNecessariaFilter={atencaoNecessariaFilter}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        dateRange={dateRange}
        tipoDesarquivamentoFilter={tipoDesarquivamentoFilter}
        institutoFilter={institutoFilter}
        requerenteFilter={requerenteFilter}
        onClearAtencaoNecessariaFilter={clearAtencaoNecessariaFilter}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onDateRangeChange={handleDateRangeChange}
        onTipoDesarquivamentoFilter={handleTipoDesarquivamentoFilter}
        onInstitutoFilter={setInstitutoFilter}
        onRequerenteFilter={setRequerenteFilter}
      />

      {/* Table */}
      <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
        {isFetching && hasLoadedRows ? (
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-xl bg-primary/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/60" />
          </div>
        ) : null}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Solicitações
            {isFetching && hasLoadedRows ? (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </CardTitle>
          <CardDescription>
            {data?.meta?.total
              ? `${data.meta.total} ${data.meta.total === 1 ? "solicitação encontrada" : "solicitações encontradas"}`
              : "Nenhuma solicitação encontrada"}
            {atencaoNecessariaFilter &&
              " em atenção necessária (mais de 5 dias)."}
            {isFetching && hasLoadedRows ? " Atualizando resultados..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !hasLoadedRows ? (
            <TableLoading />
          ) : (
            <div className="space-y-4">
              {data?.data && data.data.length > 0 ? (
                <div
                  role="list"
                  aria-label="Solicitações em formato de cartões"
                  className="grid gap-3 lg:hidden"
                >
                  {data.data.map((item) => (
                    <article
                      key={item.id}
                      role="listitem"
                      className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-[0_14px_34px_-32px_rgba(15,23,42,0.8)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                item.status === StatusDesarquivamento.FINALIZADO
                                  ? "default"
                                  : item.status ===
                                      StatusDesarquivamento.NAO_LOCALIZADO
                                    ? "destructive"
                                    : item.status ===
                                        StatusDesarquivamento.DESARQUIVADO
                                      ? "secondary"
                                      : "outline"
                              }
                              className="text-xs"
                            >
                              {getStatusLabel(item.status)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.tipoDesarquivamento
                                ? getTipoDesarquivamentoLabel(
                                    item.tipoDesarquivamento,
                                  )
                                : "-"}
                            </Badge>
                          </div>
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {item.nomeCompleto || "-"}
                          </h3>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Ações da solicitação"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {item.id ? (
                              <DropdownMenuItem
                                onSelect={() => handleOpenDetails(item.id)}
                              >
                                Ver detalhes
                              </DropdownMenuItem>
                            ) : null}
                            {canEdit && item.id ? (
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/desarquivamentos/${item.id}/editar`}
                                >
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                            {canDelete && item.id ? (
                              <DropdownMenuItem
                                onSelect={() => handleDeleteClick(item)}
                              >
                                Excluir
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="font-medium text-muted-foreground">
                            Processo
                          </dt>
                          <dd className="break-words font-mono text-foreground">
                            {item.numeroProcesso || "-"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">
                            NIC/Laudo
                          </dt>
                          <dd className="break-words font-mono text-foreground">
                            {item.numeroNicLaudoAuto || "-"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">
                            Documento
                          </dt>
                          <dd className="text-foreground">
                            {item.tipoDocumento || "-"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-muted-foreground">
                            Criação
                          </dt>
                          <dd className="text-foreground">
                            {formatDate(item.createdAt || item.dataSolicitacao)}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => item.id && handleOpenDetails(item.id)}
                          aria-label={`Ver detalhes da solicitação ${item.numeroProcesso || item.id}`}
                        >
                          Ver detalhes
                        </Button>
                        {canEdit && item.id ? (
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/desarquivamentos/${item.id}/editar`}>
                              Editar
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="lg:hidden">
                  <div className="rounded-xl border border-dashed border-border/60 bg-background/70 px-4 py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium text-foreground">
                      Nenhuma solicitação encontrada
                    </p>
                    <p className="mt-1 text-xs">
                      {searchTerm ||
                      statusFilter !== "all" ||
                      tipoFilter !== "all" ||
                      tipoDesarquivamentoFilter !== "all"
                        ? "Tente ajustar os filtros de busca"
                        : "Comece criando uma nova solicitação"}
                    </p>
                  </div>
                </div>
              )}

              <div className="hidden lg:block">
                <Table
                  className="compact-desarquivamentos"
                  containerClassName="overflow-x-auto overflow-y-auto"
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {renderSortableHeader(
                          "Físico/Digital",
                          "tipoDesarquivamento",
                        )}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader("Status", "status")}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader("Nome", "nomeCompleto")}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader(
                          "NIC/Laudo",
                          "numeroNicLaudoAuto",
                        )}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader("Processo", "numeroProcesso")}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader("Documento", "tipoDocumento")}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader("Criação", "createdAt")}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader(
                          "Desarquivamento",
                          "dataDesarquivamentoSAG",
                        )}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader(
                          "Devolução",
                          "dataDevolucaoSetor",
                        )}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader("Setor", "setorDemandante")}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader(
                          "Responsável",
                          "servidorResponsavel",
                        )}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader(
                          "Finalidade",
                          "finalidadeDesarquivamento",
                        )}
                      </TableHead>
                      <TableHead>
                        {renderSortableHeader(
                          "Prorrogação",
                          "solicitacaoProrrogacao",
                        )}
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data && data.data.length > 0 ? (
                      data.data.map((item) => (
                        <DesarquivamentoTableRow
                          key={item.id}
                          item={item}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          editingStatusId={editingStatusId}
                          onStartEditStatus={handleStartEditStatus}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenDetails={handleOpenDetails}
                          onDelete={handleDeleteClick}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma solicitação encontrada</p>
                            <p className="text-sm mt-1">
                              {searchTerm ||
                              statusFilter !== "all" ||
                              tipoFilter !== "all" ||
                              tipoDesarquivamentoFilter !== "all"
                                ? "Tente ajustar os filtros de busca"
                                : "Comece criando uma nova solicitação"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.meta && data.meta.total > pageSize && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                    {Math.min(currentPage * pageSize, data.meta.total)} de{" "}
                    {data.meta.total} resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de{" "}
                      {Math.ceil(data.meta.total / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={
                        currentPage >= Math.ceil(data.meta.total / pageSize)
                      }
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isPrintTermsModalOpen
        ? createPortal(
            <>
              <div
                aria-hidden="true"
                className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm"
                onClick={closePrintTermsModal}
              />
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
                <div
                  ref={printDialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="print-terms-title"
                  aria-describedby="print-terms-description"
                  tabIndex={-1}
                  className="w-full max-w-3xl rounded-lg border border-border bg-background shadow-2xl pointer-events-auto"
                >
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                      <h3
                        id="print-terms-title"
                        className="text-base font-semibold text-foreground"
                      >
                        Selecionar termos para impressão
                      </h3>
                      <p
                        id="print-terms-description"
                        className="text-sm text-muted-foreground"
                      >
                        Selecione os processos para imprimir no mesmo documento.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={closePrintTermsModal}
                      aria-label="Fechar modal de impressão"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3 px-5 py-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="print-process-search"
                        className="text-sm font-medium text-foreground"
                      >
                        Buscar por nº de processo
                      </label>
                      <input
                        ref={printSearchInputRef}
                        id="print-process-search"
                        type="text"
                        value={printProcessSearch}
                        onChange={(event) =>
                          setPrintProcessSearch(event.target.value)
                        }
                        placeholder="Digite um ou mais processos (separe por vírgula ou ;)"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPrintIds(
                            filteredPrintCandidates.map(
                              (candidate) => candidate.id,
                            ),
                          )
                        }
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted"
                      >
                        Marcar visíveis
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPrintIds([])}
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted"
                      >
                        Limpar seleção
                      </button>
                    </div>

                    <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                      {filteredPrintCandidates.map((candidate) => {
                        const selected = selectedPrintIds.includes(
                          candidate.id,
                        );
                        const tipo = candidate.tipoDocumento || "-";

                        return (
                          <label
                            key={candidate.id}
                            className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                              checked={selected}
                              onChange={(event) => {
                                const { checked } = event.target;
                                setSelectedPrintIds((current) => {
                                  if (checked) {
                                    if (current.includes(candidate.id)) {
                                      return current;
                                    }
                                    return [...current, candidate.id];
                                  }

                                  return current.filter(
                                    (id) => id !== candidate.id,
                                  );
                                });
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                Processo: {candidate.numeroProcesso || "-"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                Tipo: {tipo || "-"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                Nome: {candidate.nomeCompleto || "-"} | Número:{" "}
                                {candidate.numeroNicLaudoAuto || "-"}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                      {filteredPrintCandidates.length === 0 && (
                        <p className="px-2 py-3 text-sm text-muted-foreground">
                          Nenhum processo encontrado para o filtro informado.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                    <button
                      type="button"
                      onClick={closePrintTermsModal}
                      className="rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintSelectedTerms}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                      Imprimir selecionados
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          refetch();
          setIsImportModalOpen(false);
        }}
      />

      {detailId && (
        <DesarquivamentoDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      <AdminConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Excluir Solicitação"
        description={`Tem certeza que deseja excluir a solicitação ${deleteConfirm.item?.numeroNicLaudoAuto}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default DesarquivamentosPage;
