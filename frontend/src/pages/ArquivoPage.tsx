import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { NovaPastaModal } from "@/components/arquivos/NovaPastaModal";
import { EditarPastaModal } from "@/components/arquivos/EditarPastaModal";

import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Upload,
  Filter,
  Eye,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileSpreadsheet,
  Image,
  Grid3X3,
  List,
  Tag,
  MapPin,
  Calendar,
  Hash,
  Download,
  Loader2,
} from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/utils/cn";
import { usePastas, Pasta, CreatePastaInput } from "@/hooks/usePastas";
import { usePlanilhasControle } from "@/hooks/usePlanilhasControle";
import { toast } from "sonner";
import { SpreadsheetPreview } from "@/components/ui/SpreadsheetPreview";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";
import {
  EmptyState,
  ErrorState,
  NoDataAvailable,
  NoResultsFound,
} from "@/components/ui/EmptyState";
import { TableLoading } from "@/components/ui/Loading";

interface Caixa {
  id: string;
  numero: string;
  conteudo: string;
  localizacao: string;
  prateleira: string;
  pasta: string;
  dataArquivamento: string;
  responsavel: string;
  observacoes?: string;
}

interface ArquivoRibeiraSala {
  id: string;
  titulo: string;
  descricao: string;
  fotos: string[];
}

interface ArquivoRibeiraEtiqueta {
  foto: string;
  arquivo: string;
  sala: string;
  caixas: string[];
  controles: string[];
  periodos: string[];
  classificacao: string;
  tipoDocumento: string;
  confiancaMedia: number | null;
  textoResumo: string;
}

const ARQUIVO_RIBEIRA_ETIQUETAS_JSON =
  "/assets/arquivo-ribeira/arquivo-ribeira-etiquetas.json";
const ARQUIVO_RIBEIRA_ETIQUETAS_CSV =
  "/assets/arquivo-ribeira/arquivo-ribeira-etiquetas.csv";

const arquivoRibeiraSalas: ArquivoRibeiraSala[] = [
  {
    id: "instituto-identificacao",
    titulo: "Sala Instituto de Identificação",
    descricao: "Fotos classificadas pelo OCR como Instituto de Identificação.",
    fotos: [
      "IMG_8215",
      "IMG_8219",
      "IMG_8220",
      "IMG_8221",
      "IMG_8222",
      "IMG_8223",
      "IMG_8225",
      "IMG_8226",
      "IMG_8228",
      "IMG_8231",
      "IMG_8234",
      "IMG_8235",
      "IMG_8236",
      "IMG_8238",
      "IMG_8240",
      "IMG_8241",
      "IMG_8242",
      "IMG_8247",
      "IMG_8248",
      "IMG_8250",
      "IMG_8251",
      "IMG_8252",
      "IMG_8257",
      "IMG_8258",
      "IMG_8259",
      "IMG_8264",
      "IMG_8265",
      "IMG_8266",
      "IMG_8267",
      "IMG_8268",
      "IMG_8269",
      "IMG_8270",
      "IMG_8274",
      "IMG_8275",
    ],
  },
  {
    id: "iml",
    titulo: "Sala do IML",
    descricao: "Fotos classificadas pelo OCR como IML.",
    fotos: [
      "IMG_8199",
      "IMG_8201",
      "IMG_8202",
      "IMG_8208",
      "IMG_8209",
      "IMG_8211",
      "IMG_8212",
      "IMG_8213",
      "IMG_8214",
      "IMG_8218",
      "IMG_8237",
      "IMG_8239",
      "IMG_8271",
    ],
  },
  {
    id: "a-classificar",
    titulo: "Fotos a classificar",
    descricao:
      "Fotos com texto detectado, mas sem sala identificada com segurança.",
    fotos: [
      "IMG_8198",
      "IMG_8200",
      "IMG_8203",
      "IMG_8204",
      "IMG_8205",
      "IMG_8206",
      "IMG_8207",
      "IMG_8216",
      "IMG_8217",
      "IMG_8224",
      "IMG_8227",
      "IMG_8229",
      "IMG_8230",
      "IMG_8232",
      "IMG_8243",
      "IMG_8244",
      "IMG_8245",
      "IMG_8246",
      "IMG_8249",
      "IMG_8254",
      "IMG_8260",
      "IMG_8261",
      "IMG_8262",
      "IMG_8263",
      "IMG_8272",
      "IMG_8273",
      "IMG_8276",
      "IMG_8277",
      "IMG_8278",
    ],
  },
];

const totalArquivoRibeiraFotos = arquivoRibeiraSalas.reduce(
  (total, sala) => total + sala.fotos.length,
  0,
);

const formatFileSize = (bytes?: number): string => {
  if (!bytes || Number.isNaN(bytes)) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
};

const formatDate = (value?: string): string => {
  if (!value) {
    return "Data desconhecida";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Data desconhecida";
  }

  return parsed.toLocaleDateString("pt-BR");
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const normalizeArquivoRibeiraEtiqueta = (
  value: unknown,
): ArquivoRibeiraEtiqueta | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.foto !== "string" || typeof row.arquivo !== "string") {
    return null;
  }

  return {
    foto: row.foto,
    arquivo: row.arquivo,
    sala: typeof row.sala === "string" ? row.sala : "A classificar",
    caixas: toStringArray(row.caixas),
    controles: toStringArray(row.controles),
    periodos: toStringArray(row.periodos),
    classificacao:
      typeof row.classificacao === "string" ? row.classificacao : "",
    tipoDocumento:
      typeof row.tipoDocumento === "string" ? row.tipoDocumento : "",
    confiancaMedia:
      typeof row.confiancaMedia === "number" ? row.confiancaMedia : null,
    textoResumo: typeof row.textoResumo === "string" ? row.textoResumo : "",
  };
};

const formatOcrList = (values: string[]): string =>
  values.length ? values.join(", ") : "Não identificado";

const formatOcrConfidence = (value: number | null): string =>
  value === null ? "Sem confiança" : `${Math.round(value * 100)}%`;

const ArquivoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkPermission } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "pastas" | "planilhas" | "caixas" | "fotos-ribeira"
  >("pastas");
  const [deletePastaId, setDeletePastaId] = useState<string | null>(null);
  const [deletePlanilhaItem, setDeletePlanilhaItem] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [pendingPlanilhaId, setPendingPlanilhaId] = useState<string | null>(
    null,
  );
  const [etiquetasOcr, setEtiquetasOcr] = useState<ArquivoRibeiraEtiqueta[]>(
    [],
  );
  const [isLoadingEtiquetasOcr, setIsLoadingEtiquetasOcr] = useState(false);
  const [etiquetasOcrError, setEtiquetasOcrError] = useState<string | null>(
    null,
  );
  const [previewRibeiraFoto, setPreviewRibeiraFoto] = useState<{
    salaId: string;
    foto: string;
  } | null>(null);
  const [highlightedPlanilhaId, setHighlightedPlanilhaId] = useState<
    string | null
  >(null);
  const canManageArquivos =
    checkPermission("create", "arquivos") ||
    checkPermission("update", "arquivos") ||
    checkPermission("delete", "arquivos");

  const ensureManagePermission = () => {
    if (canManageArquivos) {
      return true;
    }
    toast.error("Você não tem permissão para alterar arquivos ou planilhas.");
    return false;
  };

  const planilhaInputRef = useRef<HTMLInputElement | null>(null);
  const {
    planilhas: planilhasControle,
    isLoading: isLoadingPlanilhas,
    uploadPlanilha,
    isUploadingPlanilha,
    deletePlanilha,
    isDeletingPlanilha,
    planilhaGeral,
    isLoadingPlanilhaGeral,
    planilhaGeralError,
    refetchPlanilhaGeral,
  } = usePlanilhasControle();

  const {
    pastas,
    isLoading,
    error,
    createPasta,
    deletePasta,
    updatePasta,
    isUpdatingPasta,
  } = usePastas();
  const safePastas = useMemo<Pasta[]>(
    () => (Array.isArray(pastas) ? pastas : []),
    [pastas],
  );
  const [caixas] = useState<Caixa[]>([]);

  useEffect(() => {
    if (activeTab !== "fotos-ribeira" || etiquetasOcr.length) {
      return;
    }

    const controller = new AbortController();

    const loadEtiquetasOcr = async () => {
      setIsLoadingEtiquetasOcr(true);
      setEtiquetasOcrError(null);

      try {
        const response = await fetch(ARQUIVO_RIBEIRA_ETIQUETAS_JSON, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Falha ao carregar dados OCR do Arquivo Ribeira.");
        }

        const payload: unknown = await response.json();
        const rows = Array.isArray(payload)
          ? payload
              .map(normalizeArquivoRibeiraEtiqueta)
              .filter((item): item is ArquivoRibeiraEtiqueta => item !== null)
          : [];

        setEtiquetasOcr(rows);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setEtiquetasOcrError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar dados OCR do Arquivo Ribeira.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingEtiquetasOcr(false);
        }
      }
    };

    void loadEtiquetasOcr();

    return () => {
      controller.abort();
    };
  }, [activeTab, etiquetasOcr.length]);

  const totalPastas = safePastas.length;
  const totalImagens = useMemo(
    () => safePastas.reduce((acc, pasta) => acc + pasta.imagens, 0),
    [safePastas],
  );
  const totalPlanilhas = useMemo(
    () => safePastas.reduce((acc, pasta) => acc + pasta.planilhas, 0),
    [safePastas],
  );
  const [editingPasta, setEditingPasta] = useState<Pasta | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const planilhasControleIds = useMemo(
    () => new Set(planilhasControle.map((planilha) => planilha.id)),
    [planilhasControle],
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const queryFromUrl = searchParams.get("q");
    const planilhaIdFromUrl = searchParams.get("planilhaId");

    if (
      tabFromUrl === "pastas" ||
      tabFromUrl === "planilhas" ||
      tabFromUrl === "caixas" ||
      tabFromUrl === "fotos-ribeira"
    ) {
      setActiveTab(tabFromUrl);
    }

    if (queryFromUrl) {
      setSearchTerm(queryFromUrl);
    }

    if (planilhaIdFromUrl) {
      setPendingPlanilhaId(planilhaIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      !pendingPlanilhaId ||
      activeTab !== "planilhas" ||
      !planilhasControle.some((planilha) => planilha.id === pendingPlanilhaId)
    ) {
      return;
    }

    setHighlightedPlanilhaId(pendingPlanilhaId);
    setPendingPlanilhaId(null);

    const params = new URLSearchParams(searchParams);
    params.delete("planilhaId");
    setSearchParams(params, { replace: true });

    const timeout = window.setTimeout(() => {
      const target = document.getElementById(
        `planilha-card-${pendingPlanilhaId}`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedPlanilhaId(null);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [
    activeTab,
    pendingPlanilhaId,
    planilhasControle,
    searchParams,
    setSearchParams,
  ]);

  const planilhaGeralSections = useMemo(() => {
    if (!planilhaGeral?.linhas?.length) {
      return [];
    }

    const colunasBase =
      planilhaGeral.colunas && planilhaGeral.colunas.length > 0
        ? planilhaGeral.colunas
        : Object.keys(planilhaGeral.linhas[0] ?? {});

    if (!planilhaGeral.grupos?.length) {
      return [
        {
          id: "planilha-geral",
          titulo: planilhaGeral.linhas[0]?.Planilha || "Planilha Consolidada",
          subtitulo: `${planilhaGeral.totalItens} item(s)`,
          planilhaId:
            planilhaGeral.grupos?.[0]?.planilhas?.[0]?.planilhaId ||
            planilhaGeral.linhas[0]?.planilhaId,
          sheetName:
            planilhaGeral.grupos?.[0]?.planilhas?.[0]?.sheetName ?? "Principal",
          linhas: planilhaGeral.linhas,
          colunas: colunasBase,
          pastaNome: planilhaGeral.linhas[0]?.Pasta || undefined,
        },
      ];
    }

    const sections: Array<{
      id: string;
      titulo: string;
      subtitulo: string;
      planilhaId?: string;
      sheetName?: string;
      linhas: Record<string, string>[];
      colunas: string[];
      pastaNome?: string;
    }> = [];

    planilhaGeral.grupos.forEach((grupo) => {
      grupo.planilhas.forEach((planilha) => {
        const linhasFiltradas = planilhaGeral.linhas.filter((linha) => {
          const linhaPasta =
            linha["Pasta"] ??
            linha["Prateleira/NºTOMBO"] ??
            linha["Prateleira"] ??
            "";
          const linhaPlanilha = linha["Planilha"] ?? "";
          const pastaMatches =
            !grupo.pastaNome ||
            linhaPasta === grupo.pastaNome ||
            linhaPasta === grupo.pastaId;
          const planilhaMatches =
            !planilha.planilhaNome ||
            !linhaPlanilha ||
            linhaPlanilha === planilha.planilhaNome;

          return pastaMatches && planilhaMatches;
        });

        sections.push({
          id: `${grupo.pastaId}-${planilha.planilhaId}`,
          titulo: planilha.planilhaNome || grupo.pastaNome || "Planilha",
          subtitulo: `Aba: ${planilha.sheetName || "Principal"} (${planilha.totalItens} ${
            planilha.totalItens === 1 ? "item" : "itens"
          })`,
          planilhaId: planilha.planilhaId,
          sheetName: planilha.sheetName,
          linhas: linhasFiltradas.length
            ? linhasFiltradas
            : planilhaGeral.linhas,
          colunas: colunasBase,
          pastaNome: grupo.pastaNome,
        });
      });
    });

    return sections;
  }, [planilhaGeral]);

  const handleAddPasta = async (novaPasta: CreatePastaInput) => {
    if (!ensureManagePermission()) return;
    await createPasta(novaPasta);
    setShowUploadModal(false);
  };

  const handleUpdatePasta = async (values: {
    nome: string;
    descricao: string;
    tags: string[];
  }) => {
    if (!editingPasta || !ensureManagePermission()) return;
    try {
      await updatePasta({
        id: editingPasta.id,
        ...values,
      });
      toast.success("Pasta atualizada com sucesso!");
      setShowEditModal(false);
      setEditingPasta(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível atualizar a pasta.");
    }
  };

  const handleDelete = (pastaId: string) => {
    if (!ensureManagePermission()) return;
    setDeletePastaId(pastaId);
  };

  const handleConfirmDeletePasta = async () => {
    if (!deletePastaId || !ensureManagePermission()) return;

    try {
      await deletePasta(deletePastaId);
      toast.success("Pasta excluída com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível excluir a pasta.");
    } finally {
      setDeletePastaId(null);
    }
  };

  const handleSelectPlanilha = () => {
    if (!ensureManagePermission()) return;
    planilhaInputRef.current?.click();
  };

  const handleUploadPlanilhaChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!ensureManagePermission()) {
      event.target.value = "";
      return;
    }

    try {
      await uploadPlanilha(file);
      toast.success("Planilha adicionada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar a planilha.");
    } finally {
      event.target.value = "";
    }
  };

  const handleDeletePlanilha = (planilhaId: string, planilhaNome: string) => {
    if (!planilhaId || !ensureManagePermission()) return;
    setDeletePlanilhaItem({ id: planilhaId, nome: planilhaNome });
  };

  const handleConfirmDeletePlanilha = async () => {
    if (!deletePlanilhaItem || !ensureManagePermission()) return;

    try {
      await deletePlanilha(deletePlanilhaItem.id);
      toast.success("Planilha removida com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível remover a planilha.");
    } finally {
      setDeletePlanilhaItem(null);
    }
  };

  const previewRibeiraSala = previewRibeiraFoto
    ? arquivoRibeiraSalas.find((sala) => sala.id === previewRibeiraFoto.salaId)
    : undefined;
  const previewRibeiraIndex =
    previewRibeiraSala && previewRibeiraFoto
      ? previewRibeiraSala.fotos.indexOf(previewRibeiraFoto.foto)
      : -1;
  const previewRibeiraCurrentFoto =
    previewRibeiraSala && previewRibeiraIndex >= 0
      ? previewRibeiraSala.fotos[previewRibeiraIndex]
      : undefined;

  const movePreviewRibeiraFoto = useCallback(
    (direction: -1 | 1) => {
      if (!previewRibeiraSala || previewRibeiraIndex < 0) {
        return;
      }

      const nextIndex =
        (previewRibeiraIndex + direction + previewRibeiraSala.fotos.length) %
        previewRibeiraSala.fotos.length;

      setPreviewRibeiraFoto({
        salaId: previewRibeiraSala.id,
        foto: previewRibeiraSala.fotos[nextIndex],
      });
    },
    [previewRibeiraIndex, previewRibeiraSala],
  );

  useEffect(() => {
    if (!previewRibeiraFoto) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        movePreviewRibeiraFoto(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        movePreviewRibeiraFoto(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePreviewRibeiraFoto, previewRibeiraFoto]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredPastas = useMemo(() => {
    if (!normalizedSearchTerm) {
      return safePastas;
    }

    return safePastas.filter((pasta) => {
      const nomeMatch = pasta.nome.toLowerCase().includes(normalizedSearchTerm);
      const tagMatch = pasta.tags.some((tag) =>
        tag.toLowerCase().includes(normalizedSearchTerm),
      );
      return nomeMatch || tagMatch;
    });
  }, [safePastas, normalizedSearchTerm]);

  const filteredCaixas = useMemo(() => {
    if (!normalizedSearchTerm) {
      return caixas;
    }

    return caixas.filter(
      (caixa) =>
        caixa.numero.toLowerCase().includes(normalizedSearchTerm) ||
        caixa.conteudo.toLowerCase().includes(normalizedSearchTerm) ||
        caixa.localizacao.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [caixas, normalizedSearchTerm]);

  return (
    <div className="relative space-y-6 text-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
              arquivo operacional
            </p>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3 md:text-3xl">
              <span className="rounded-xl bg-primary/10 p-2 ring-1 ring-white/70 shadow-sm backdrop-blur">
                <FolderOpen className="h-6 w-6 text-primary" />
              </span>
              Arquivo - NUGECID/SAG
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de gerenciamento do acervo documental do Núcleo de Gestão
              do Conhecimento, Informação, Documentação e Memória.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                if (!ensureManagePermission()) return;
                setShowUploadModal(true);
              }}
              disabled={!canManageArquivos}
              title={
                canManageArquivos
                  ? undefined
                  : "Apenas administradores ou coordenadores podem criar pastas"
              }
              className="flex items-center gap-2 text-sm bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nova Pasta
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-sm border-border/60 bg-background/70 backdrop-blur"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedFilter("todos")}>
                  Todas as pastas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("recentes")}>
                  Recentes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedFilter("destacadas")}
                >
                  Destacadas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-sm border border-border/60 bg-card/85 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]">
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Total de Pastas</span>
              <FolderOpen className="h-4 w-4" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {totalPastas}
            </p>
          </CardContent>
        </Card>
        <Card className="text-sm border border-border/60 bg-card/85 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]">
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Fotos Registradas</span>
              <Image className="h-4 w-4" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {totalImagens}
            </p>
          </CardContent>
        </Card>
        <Card className="text-sm border border-border/60 bg-card/85 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]">
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Planilhas Anexadas</span>
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {totalPlanilhas}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={activeTab === "pastas" ? "default" : "outline"}
            onClick={() => setActiveTab("pastas")}
            className={cn(
              activeTab === "pastas"
                ? "bg-primary/90"
                : "border-border/60 bg-background/70 backdrop-blur",
              "text-[11px] font-semibold uppercase tracking-[0.08em]",
            )}
          >
            Pastas
          </Button>
          <Button
            variant={activeTab === "planilhas" ? "default" : "outline"}
            onClick={() => setActiveTab("planilhas")}
            className={cn(
              activeTab === "planilhas"
                ? "bg-primary/90"
                : "border-border/60 bg-background/70 backdrop-blur",
              "text-[11px] font-semibold uppercase tracking-[0.08em]",
            )}
          >
            Planilhas
          </Button>
          <Button
            variant={activeTab === "caixas" ? "default" : "outline"}
            onClick={() => setActiveTab("caixas")}
            className={cn(
              activeTab === "caixas"
                ? "bg-primary/90"
                : "border-border/60 bg-background/70 backdrop-blur",
              "text-[11px] font-semibold uppercase tracking-[0.08em]",
            )}
          >
            Caixas Documentais
          </Button>
          <Button
            variant={activeTab === "fotos-ribeira" ? "default" : "outline"}
            onClick={() => setActiveTab("fotos-ribeira")}
            className={cn(
              activeTab === "fotos-ribeira"
                ? "bg-primary/90"
                : "border-border/60 bg-background/70 backdrop-blur",
              "text-[11px] font-semibold uppercase tracking-[0.08em]",
            )}
          >
            Fotos Ribeira
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Realizar uma busca"
          />
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {activeTab === "pastas" && (
        <>
          {isLoading ? (
            <TableLoading />
          ) : error ? (
            <ErrorState description="Não foi possível carregar as pastas do arquivo." />
          ) : filteredPastas.length ? (
            <div
              className={cn(
                "grid gap-6",
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1",
              )}
            >
              {filteredPastas.map((pasta) => (
                <Card
                  key={pasta.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/arquivo/${pasta.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/arquivo/${pasta.id}`);
                    }
                  }}
                  className="cursor-pointer border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] transition-all hover:border-primary/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {pasta.nome}
                        </CardTitle>
                        <CardDescription className="mt-1 text-[11px] text-muted-foreground">
                          {pasta.descricao}
                        </CardDescription>
                      </div>
                      {canManageArquivos && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditingPasta(pasta);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(pasta.id);
                              }}
                              className="text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Criada em{" "}
                      {new Date(pasta.dataCriacao).toLocaleDateString("pt-BR")}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 text-xs">
                          <Image className="h-4 w-4" />
                          {pasta.imagens}{" "}
                          {pasta.imagens === 1 ? "imagem" : "imagens"}
                        </span>
                        <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-600 text-xs">
                          <FileSpreadsheet className="h-4 w-4" />
                          {pasta.planilhas}{" "}
                          {pasta.planilhas === 1 ? "planilha" : "planilhas"}
                        </span>
                      </div>
                      {pasta.tags.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {pasta.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[11px] px-2 py-1 flex items-center gap-1"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground">
                        Clique para visualizar os anexos, adicionar novas
                        imagens e consultar os itens desta prateleira.
                      </div>
                      <Button
                        variant="outline"
                        className="w-full text-sm py-2"
                        onClick={() => navigate(`/arquivo/${pasta.id}`)}
                      >
                        Ver prateleira
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : normalizedSearchTerm ? (
            <NoResultsFound
              title="Nenhuma pasta encontrada"
              description="Tente ajustar a busca ou os filtros do arquivo."
            />
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="Nenhuma pasta encontrada"
              description="Crie uma pasta para organizar imagens e planilhas."
              action={
                canManageArquivos
                  ? {
                      label: "Nova Pasta",
                      onClick: () => setShowUploadModal(true),
                    }
                  : undefined
              }
            />
          )}
        </>
      )}

      {activeTab === "caixas" && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de Caixas Documentais</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Controle detalhado das caixas arquivadas com suas respectivas
              localizacoes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Número
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Conteúdo
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Localização
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Responsável
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaixas.map((caixa) => (
                    <tr
                      key={caixa.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{caixa.numero}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{caixa.conteudo}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {caixa.localizacao}
                        </div>
                      </td>
                      <td className="py-3 px-4">{caixa.responsavel}</td>
                      <td className="py-3 px-4">
                        {new Date(caixa.dataArquivamento).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filteredCaixas.length ? (
              normalizedSearchTerm ? (
                <NoResultsFound
                  title="Nenhuma caixa documental encontrada"
                  description="Tente ajustar a busca para localizar caixas cadastradas."
                  variant="compact"
                />
              ) : (
                <NoDataAvailable
                  title="Nenhuma caixa documental cadastrada"
                  description="Ainda não há caixas documentais para exibir."
                  variant="compact"
                />
              )
            ) : null}
          </CardContent>
        </Card>
      )}

      {activeTab === "fotos-ribeira" && (
        <div className="space-y-6">
          <Card className="border border-border/60 bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Image className="h-5 w-5 text-primary" />
                Galeria Arquivo Ribeira
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {totalArquivoRibeiraFotos} fotos novas da mudança de prédio,
                organizadas por sala a partir do OCR local.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/60 bg-card/85">
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    Etiquetas OCR
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Dados extraídos das etiquetas pelo PP-OCRv6 local.
                  </CardDescription>
                </div>
                <a
                  href={ARQUIVO_RIBEIRA_ETIQUETAS_CSV}
                  download
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-border/60 bg-background/70 px-4 text-sm font-semibold text-foreground transition hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar planilha CSV
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEtiquetasOcr ? (
                <div className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                  Carregando etiquetas OCR...
                </div>
              ) : etiquetasOcrError ? (
                <ErrorState
                  title="Erro ao carregar etiquetas OCR"
                  description={etiquetasOcrError}
                />
              ) : etiquetasOcr.length ? (
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Foto</th>
                        <th className="px-4 py-3 font-semibold">Sala</th>
                        <th className="px-4 py-3 font-semibold">Caixas</th>
                        <th className="px-4 py-3 font-semibold">Controles</th>
                        <th className="px-4 py-3 font-semibold">Períodos</th>
                        <th className="px-4 py-3 font-semibold">
                          Classificação
                        </th>
                        <th className="px-4 py-3 font-semibold">
                          Tipo documento
                        </th>
                        <th className="px-4 py-3 font-semibold">Confiança</th>
                        <th className="px-4 py-3 font-semibold">Texto OCR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {etiquetasOcr.map((etiqueta) => (
                        <tr
                          key={`${etiqueta.foto}-${etiqueta.arquivo}`}
                          className="align-top transition hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {etiqueta.foto}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {etiqueta.sala}
                          </td>
                          <td className="px-4 py-3">
                            {formatOcrList(etiqueta.caixas)}
                          </td>
                          <td className="px-4 py-3">
                            {formatOcrList(etiqueta.controles)}
                          </td>
                          <td className="px-4 py-3">
                            {formatOcrList(etiqueta.periodos)}
                          </td>
                          <td className="px-4 py-3">
                            {etiqueta.classificacao || "Não identificado"}
                          </td>
                          <td className="px-4 py-3">
                            {etiqueta.tipoDocumento || "Não identificado"}
                          </td>
                          <td className="px-4 py-3">
                            {formatOcrConfidence(etiqueta.confiancaMedia)}
                          </td>
                          <td className="max-w-[320px] px-4 py-3 text-xs text-muted-foreground">
                            <span className="line-clamp-3">
                              {etiqueta.textoResumo ||
                                "Nenhum texto reconhecido"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <NoDataAvailable
                  title="Nenhuma etiqueta OCR disponível"
                  description="Execute o OCR das fotos Ribeira para gerar os dados das etiquetas."
                  variant="compact"
                />
              )}
            </CardContent>
          </Card>

          {arquivoRibeiraSalas.map((sala) => (
            <section key={sala.id} className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {sala.titulo}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {sala.descricao} {sala.fotos.length} fotos.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sala.fotos.map((foto) => (
                  <button
                    key={foto}
                    type="button"
                    aria-label={`Abrir ${foto}`}
                    onClick={() =>
                      setPreviewRibeiraFoto({ salaId: sala.id, foto })
                    }
                    className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_16px_38px_-32px_rgba(15,23,42,0.72)] transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <img
                      src={`/assets/arquivo-ribeira/${foto}.jpg`}
                      alt={`${foto} - ${sala.titulo}`}
                      loading="lazy"
                      className="aspect-[4/3] w-full bg-muted object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                      <span className="font-medium text-foreground">
                        {foto}
                      </span>
                      <span className="text-muted-foreground">Abrir</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {activeTab === "planilhas" && (
        <div className="space-y-6">
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Upload de Planilha
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Faça upload de uma nova planilha de controle
              </p>
              <Button
                onClick={handleSelectPlanilha}
                disabled={!canManageArquivos || isUploadingPlanilha}
                title={
                  canManageArquivos
                    ? undefined
                    : "Apenas administradores ou coordenadores podem enviar planilhas"
                }
                className="px-6"
              >
                {isUploadingPlanilha ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Planilha
                  </>
                )}
              </Button>
              <input
                ref={planilhaInputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleUploadPlanilhaChange}
              />
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-muted/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">
                Planilha Geral Consolidada
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Visualize em uma única visão todos os itens catalogados nas
                planilhas das pastas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {planilhaGeralError ? (
                <ErrorState
                  description="Não foi possível carregar a planilha geral."
                  action={{
                    label: "Tentar novamente",
                    onClick: () => refetchPlanilhaGeral(),
                  }}
                />
              ) : null}

              {isLoadingPlanilhaGeral ? (
                <TableLoading />
              ) : planilhaGeralSections.length ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Pastas com planilhas
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {planilhaGeral.totalPastas}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Planilhas processadas
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {planilhaGeral.totalPlanilhas}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Itens catalogados
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {planilhaGeral.totalItens}
                      </p>
                    </div>
                  </div>

                  {planilhaGeral.grupos.length ? (
                    <div className="flex flex-wrap gap-2">
                      {planilhaGeral.grupos.map((grupo) => (
                        <Badge
                          key={grupo.pastaId}
                          variant="secondary"
                          className="text-[11px] font-medium"
                        >
                          {grupo.pastaNome || "Pasta"} - {grupo.totalItens}{" "}
                          {grupo.totalItens === 1 ? "item" : "itens"}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {planilhaGeralSections.length ? (
                    <div className="space-y-5">
                      {planilhaGeralSections.map((section) => (
                        <div
                          key={section.id}
                          className="rounded-xl border border-border/60 bg-background/80 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                {section.titulo}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {section.subtitulo}
                                {section.pastaNome
                                  ? ` • ${section.pastaNome}`
                                  : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (section.planilhaId) {
                                  window.open(
                                    `/api/planilhas/${section.planilhaId}/download`,
                                    "_blank",
                                    "noopener",
                                  );
                                }
                              }}
                              disabled={
                                !section.planilhaId ||
                                !planilhasControleIds.has(section.planilhaId)
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Baixar planilha
                            </Button>
                          </div>
                          <div className="mt-4">
                            {section.linhas.length ? (
                              <SpreadsheetPreview
                                headers={section.colunas}
                                data={section.linhas}
                                maxHeight="max-h-[420px]"
                                showRowNumbers
                              />
                            ) : (
                              <NoDataAvailable
                                title="Nenhum item encontrado"
                                description="Nenhum item foi encontrado para esta planilha."
                                variant="compact"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : planilhaGeral.linhas.length ? (
                    <SpreadsheetPreview
                      headers={planilhaGeral.colunas}
                      data={planilhaGeral.linhas}
                      maxHeight="max-h-[480px]"
                      showRowNumbers
                    />
                  ) : (
                    <NoDataAvailable
                      title="Nenhum dado consolidado"
                      description="Nenhum dado consolidado disponível no momento."
                    />
                  )}
                </>
              ) : (
                <NoDataAvailable
                  title="Nenhuma planilha encontrada"
                  description="Nenhuma planilha foi encontrada nas pastas cadastradas."
                />
              )}
            </CardContent>
          </Card>

          {isLoadingPlanilhas ? (
            <TableLoading />
          ) : planilhasControle.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {planilhasControle.map((planilha) => (
                <Card
                  key={planilha.id}
                  id={`planilha-card-${planilha.id}`}
                  className={cn(
                    "border border-border/60 bg-muted/10 transition-colors hover:border-primary/60",
                    highlightedPlanilhaId === planilha.id &&
                      "border-primary/60 bg-primary/5 ring-1 ring-primary/30",
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          <span className="break-all">
                            {planilha.nomeOriginal || "Planilha"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(planilha.dataUpload)}
                          {" - "}
                          {formatFileSize(planilha.tamanhoBytes)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (planilha.url) {
                              window.open(planilha.url, "_blank", "noopener");
                            }
                          }}
                          disabled={!planilha.url}
                          aria-label="Baixar planilha"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canManageArquivos && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeletePlanilha(
                                planilha.id,
                                planilha.nomeOriginal || "Planilha",
                              )
                            }
                            disabled={isDeletingPlanilha}
                            aria-label="Remover planilha"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileSpreadsheet}
              title="Nenhuma planilha cadastrada"
              description="Nenhuma planilha geral manual cadastrada até o momento."
              variant="card"
              action={
                canManageArquivos
                  ? {
                      label: "Adicionar Planilha",
                      onClick: handleSelectPlanilha,
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      <Dialog
        open={Boolean(previewRibeiraCurrentFoto && previewRibeiraSala)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewRibeiraFoto(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl gap-3 overflow-hidden border-border/60 bg-card/95 p-4 backdrop-blur sm:p-5">
          {previewRibeiraCurrentFoto && previewRibeiraSala ? (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle>
                  Visualização {previewRibeiraCurrentFoto}
                </DialogTitle>
                <DialogDescription>
                  {previewRibeiraIndex + 1} de {previewRibeiraSala.fotos.length}{" "}
                  - {previewRibeiraSala.titulo}
                </DialogDescription>
              </DialogHeader>

              <div className="relative flex min-h-0 items-center justify-center rounded-lg bg-muted/40">
                <img
                  src={`/assets/arquivo-ribeira/${previewRibeiraCurrentFoto}.jpg`}
                  alt={`${previewRibeiraCurrentFoto} ampliada - ${previewRibeiraSala.titulo}`}
                  className="max-h-[72vh] w-auto max-w-full object-contain"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Foto anterior"
                  onClick={() => movePreviewRibeiraFoto(-1)}
                  className="absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border-white/40 bg-background/85 shadow-lg backdrop-blur"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Próxima foto"
                  onClick={() => movePreviewRibeiraFoto(1)}
                  className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border-white/40 bg-background/85 shadow-lg backdrop-blur"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <NovaPastaModal
        isOpen={canManageArquivos && showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onAddPasta={handleAddPasta}
      />

      <EditarPastaModal
        isOpen={canManageArquivos && showEditModal && Boolean(editingPasta)}
        pasta={editingPasta}
        onClose={() => {
          setShowEditModal(false);
          setEditingPasta(null);
        }}
        onSubmit={handleUpdatePasta}
        isSubmitting={isUpdatingPasta}
      />

      {/* Enhanced Confirm Dialogs */}
      <EnhancedConfirmDialog
        isOpen={canManageArquivos && deletePastaId !== null}
        onClose={() => setDeletePastaId(null)}
        onConfirm={handleConfirmDeletePasta}
        title="Excluir pasta"
        description="Tem certeza que deseja excluir esta pasta?"
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta pasta permanentemente"
        warningList={[
          "Esta ação não pode ser desfeita",
          "Todos os arquivos da pasta serão perdidos",
          "Imagens e planilhas serão removidas",
        ]}
      />

      <EnhancedConfirmDialog
        isOpen={canManageArquivos && deletePlanilhaItem !== null}
        onClose={() => setDeletePlanilhaItem(null)}
        onConfirm={handleConfirmDeletePlanilha}
        title="Remover planilha"
        description={`Tem certeza que deseja remover a planilha "${deletePlanilhaItem?.nome}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo remover esta planilha permanentemente"
        warningList={[
          "Esta ação não pode ser desfeita",
          "Os dados da planilha serão perdidos",
        ]}
      />
    </div>
  );
};

export default ArquivoPage;
