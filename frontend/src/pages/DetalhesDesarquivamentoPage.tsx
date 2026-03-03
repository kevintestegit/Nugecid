import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useDesarquivamento,
  useDownloadTermoPdf,
  useDownloadTermoDocx,
  useDesarquivamentoComments,
  useAddDesarquivamentoComment,
} from "@/hooks/useDesarquivamentos";
import { useDesarquivamentoHistorico } from "@/hooks/useDesarquivamentoHistorico";
import {
  useDesarquivamentosAnexos,
  useUploadDesarquivamentoAnexo,
  useDownloadDesarquivamentoAnexo,
  useDeleteDesarquivamentoAnexo,
  useViewDesarquivamentoAnexo,
  useUpdateDesarquivamentoAnexo,
} from "@/hooks/useDesarquivamentosAnexos";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageLoading } from "@/components/ui/Loading";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  ArrowLeft,
  Edit,
  FileText,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MessageCircle,
  Send,
  Loader2,
  Upload,
  Download,
  Trash2,
  Paperclip,
  X,
  Copy,
  Check,
} from "lucide-react";
import { getStatusLabel } from "@/utils/format";
import { StatusDesarquivamento, DesarquivamentoAnexo } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { ImagePreviewModal } from "@/components/desarquivamentos/ImagePreviewModal";
import { AnexosSection } from "@/components/desarquivamentos/AnexosSection";
import { HistoricoTimeline } from "@/components/desarquivamentos/HistoricoTimeline";
import { getInstitutoLabel } from "@/constants/institutos";
import {
  buildHistoricoMessage,
  isBusinessHistoricoEntry,
  type HistoricoMessageTone,
} from "@/utils/desarquivamentoHistoricoMessages";

const DetalhesDesarquivamentoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: response, isLoading, error } = useDesarquivamento(id);
  const desarquivamento = response?.data;
  const isIdValid = id ? !isNaN(parseInt(id, 10)) : false;
  const canGerarTermo = [
    StatusDesarquivamento.DESARQUIVADO,
    StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO,
  ].includes(desarquivamento?.status as StatusDesarquivamento);

  const downloadPdfMutation = useDownloadTermoPdf();
  const downloadDocxMutation = useDownloadTermoDocx();

  const { data: commentsResponse, isLoading: isLoadingComments } =
    useDesarquivamentoComments(Number(id));
  const { data: historicoAcoes = [] } = useDesarquivamentoHistorico(Number(id));
  const comments = commentsResponse?.data ?? [];
  const addCommentMutation = useAddDesarquivamentoComment(Number(id));
  const [commentText, setCommentText] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Anexos - Separados por tipo
  const { data: anexosDesarquivamento, isLoading: isLoadingAnexosDesarq } =
    useDesarquivamentosAnexos(Number(id), "desarquivamento");
  const { data: anexosRearquivamento, isLoading: isLoadingAnexosRearq } =
    useDesarquivamentosAnexos(Number(id), "rearquivamento");

  const uploadAnexoMutation = useUploadDesarquivamentoAnexo();
  const downloadAnexoMutation = useDownloadDesarquivamentoAnexo();
  const deleteAnexoMutation = useDeleteDesarquivamentoAnexo();
  const viewAnexoMutation = useViewDesarquivamentoAnexo();
  const updateAnexoMutation = useUpdateDesarquivamentoAnexo();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAnexo, setPreviewAnexo] = useState<DesarquivamentoAnexo | null>(
    null,
  );

  const canEdit =
    user?.role?.name === "admin" || user?.role?.name === "coordenador";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (!previousOverflow || previousOverflow === "hidden") {
      document.body.style.overflow = "auto";
    }

    return () => {
      if (!previousOverflow) {
        document.body.style.overflow = "";
      } else {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, []);

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
      const message =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      toast.error(message || "Não foi possível adicionar o comentário.");
    }
  };

  const handleUploadDesarquivamento = async (
    file: File,
    descricao: string,
    anexarAoProcesso?: boolean,
  ) => {
    if (!id) return;
    await uploadAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      file,
      descricao: descricao.trim() || undefined,
      tipoAnexo: "desarquivamento",
      anexarAoProcesso,
    });
  };

  const handleUploadRearquivamento = async (
    file: File,
    descricao: string,
    anexarAoProcesso?: boolean,
  ) => {
    if (!id) return;
    await uploadAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      file,
      descricao: descricao.trim() || undefined,
      tipoAnexo: "rearquivamento",
      anexarAoProcesso,
    });
  };

  const handleCopyToClipboard = async (value?: string, fieldKey?: string) => {
    if (!value) return;

    const markAsCopied = () => {
      setCopiedField(fieldKey ?? null);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldKey ? null : prev));
      }, 2000);
    };

    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand("copy");
        if (successful) {
          markAsCopied();
        } else {
          throw new Error("execCommand falhou");
        }
      } catch (error) {
        toast.error("Não foi possível copiar o conteúdo.");
      } finally {
        document.body.removeChild(textArea);
      }
    };

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        markAsCopied();
        return;
      } catch (error) {
        // fallback abaixo
      }
    }

    fallbackCopy();
  };

  const handleDownloadTermo = (format: "pdf" | "docx") => {
    if (!id || isNaN(Number(id))) {
      toast.error("Identificador invalido para o termo.");
      return;
    }

    if (!canGerarTermo) {
      toast.error(
        "Somente solicitacoes com status DESARQUIVADO ou REARQUIVAMENTO_SOLICITADO podem gerar termos.",
      );
      return;
    }

    const mutation =
      format === "pdf" ? downloadPdfMutation : downloadDocxMutation;

    mutation.mutate(Number(id), {
      onSuccess: () => {
        toast.success(
          format === "pdf"
            ? "Termo em PDF gerado com sucesso."
            : "Termo em Word gerado com sucesso.",
        );
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel gerar o termo.";
        toast.error(message);
      },
    });
  };

  const handleDownloadAnexo = async (anexoId: number) => {
    if (!id) return;

    const allAnexos = [
      ...(anexosDesarquivamento ?? []),
      ...(anexosRearquivamento ?? []),
    ];
    const anexo = allAnexos.find((a) => a.id === anexoId);

    if (!anexo) {
      toast.error("Anexo não encontrado");
      return;
    }

    try {
      let blob: Blob;

      // Se anexo tem URL (vem do backend com URL correta), usar ela
      if (anexo.url) {
        const response = await fetch(anexo.url, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Erro ao baixar anexo");
        blob = await response.blob();
      } else if (anexo.desarquivamentoId) {
        // Anexo de solicitação
        blob = await downloadAnexoMutation.mutateAsync({
          desarquivamentoId: Number(id),
          anexoId,
        });
      } else if (anexo.numeroProcesso) {
        // Anexo de processo
        const encodedProcesso = encodeURIComponent(anexo.numeroProcesso);
        const response = await fetch(
          `/api/nugecid/processo/${encodedProcesso}/anexos/${anexoId}/download`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) throw new Error("Erro ao baixar anexo");
        blob = await response.blob();
      } else {
        throw new Error("Anexo sem vínculo válido");
      }

      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = anexo?.nomeOriginal || "anexo";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      toast.error("Erro ao baixar anexo.");
    }
  };

  const handleDeleteAnexo = async (anexoId: number) => {
    if (!id) return;
    await deleteAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      anexoId,
    });
  };

  const handleViewAnexo = async (anexo: DesarquivamentoAnexo) => {
    if (!id) return;

    try {
      let blob: Blob;

      // Se anexo tem previewUrl (URL correta do backend), usar ela
      if (anexo.previewUrl) {
        const response = await fetch(anexo.previewUrl, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Erro ao carregar visualização");
        blob = await response.blob();
      } else if (anexo.desarquivamentoId) {
        // Anexo de solicitação
        blob = await viewAnexoMutation.mutateAsync({
          desarquivamentoId: Number(id),
          anexoId: anexo.id,
        });
      } else if (anexo.numeroProcesso) {
        // Anexo de processo
        const encodedProcesso = encodeURIComponent(anexo.numeroProcesso);
        const response = await fetch(
          `/api/nugecid/processo/${encodedProcesso}/anexos/${anexo.id}/view`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) throw new Error("Erro ao carregar visualização");
        blob = await response.blob();
      } else {
        throw new Error("Anexo sem vínculo válido");
      }

      // Criar URL temporária do blob
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewAnexo(anexo);
    } catch (error: unknown) {
      toast.error("Erro ao carregar visualização.");
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewAnexo(null);
  };

  const handleUpdateDescricao = async (
    anexoId: number | string,
    descricao: string,
  ) => {
    if (!id) return;
    await updateAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      anexoId: Number(anexoId),
      descricao,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Data inválida";
    }
  };

  const getHistoryDotColor = (tone: HistoricoMessageTone): string => {
    switch (tone) {
      case "create":
        return "bg-blue-500";
      case "status":
        return "bg-cyan-500";
      case "update":
        return "bg-green-500";
      case "comment":
        return "bg-amber-500";
      case "delete":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const historicoRelevante = useMemo(
    () =>
      historicoAcoes
        .filter(isBusinessHistoricoEntry)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        ),
    [historicoAcoes],
  );

  const historicoResumo = useMemo(() => {
    if (historicoRelevante.length > 0) {
      return historicoRelevante.slice(-5).map((evento) => {
        const mensagem = buildHistoricoMessage(evento);
        return {
          id: String(evento.id),
          timestamp: evento.timestamp,
          title: mensagem.title,
          description: mensagem.description,
          dotColor: getHistoryDotColor(mensagem.tone),
          source: "audit" as const,
        };
      });
    }

    if (!desarquivamento) {
      return [];
    }

    const eventosMinimos = [
      {
        id: "registro-created",
        timestamp: desarquivamento.createdAt,
        title: "Solicitação criada",
        description: "Registro de criação disponível nos dados do documento.",
        dotColor: "bg-blue-500",
        source: "registro" as const,
      },
    ];

    if (desarquivamento.status !== StatusDesarquivamento.SOLICITADO) {
      eventosMinimos.push({
        id: "registro-status",
        timestamp: desarquivamento.updatedAt || desarquivamento.createdAt,
        title: `Status alterado para: ${getStatusLabel(desarquivamento.status)}`,
        description:
          "Mudança de status identificada pelos campos atuais do documento.",
        dotColor:
          desarquivamento.status === StatusDesarquivamento.FINALIZADO
            ? "bg-green-500"
            : "bg-cyan-500",
        source: "registro" as const,
      });
    } else if (
      desarquivamento.updatedAt &&
      desarquivamento.updatedAt !== desarquivamento.createdAt
    ) {
      eventosMinimos.push({
        id: "registro-update",
        timestamp: desarquivamento.updatedAt,
        title: "Dados da solicitação atualizados",
        description:
          "Atualização identificada pelos campos atuais do documento.",
        dotColor: "bg-green-500",
        source: "registro" as const,
      });
    }

    if (desarquivamento.dataDesarquivamentoSAG) {
      eventosMinimos.push({
        id: "registro-data-sag",
        timestamp:
          desarquivamento.dataDesarquivamentoSAG || desarquivamento.updatedAt,
        title: "Data de desarquivamento (SAG) registrada",
        description: `Valor informado: ${formatDate(
          desarquivamento.dataDesarquivamentoSAG,
        )}.`,
        dotColor: "bg-blue-500",
        source: "registro" as const,
      });
    }

    if (desarquivamento.dataDevolucaoSetor) {
      eventosMinimos.push({
        id: "registro-data-devolucao",
        timestamp:
          desarquivamento.dataDevolucaoSetor || desarquivamento.updatedAt,
        title: "Data de devolução pelo setor registrada",
        description: `Valor informado: ${formatDate(
          desarquivamento.dataDevolucaoSetor,
        )}.`,
        dotColor: "bg-blue-500",
        source: "registro" as const,
      });
    }

    return eventosMinimos
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      .slice(-5);
  }, [desarquivamento, historicoRelevante]);

  const usandoHistoricoMinimo =
    historicoRelevante.length === 0 &&
    historicoResumo.length > 0 &&
    historicoResumo.every((evento) => evento.source === "registro");

  if (isLoading) {
    return <PageLoading />;
  }

  if (!isIdValid) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            ID Inválido
          </h3>
          <p className="mb-4 text-muted-foreground">
            O ID fornecido na URL é inválido.
          </p>
          <Button
            onClick={() => navigate("/desarquivamentos")}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  if (error || !desarquivamento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Solicitação não encontrada
          </h3>
          <p className="mb-4 text-muted-foreground">
            A solicitação que você está procurando não existe ou foi removida.
          </p>
          <Button
            onClick={() => navigate("/desarquivamentos")}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: StatusDesarquivamento) => {
    switch (status) {
      case StatusDesarquivamento.FINALIZADO:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case StatusDesarquivamento.NAO_LOCALIZADO:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case StatusDesarquivamento.DESARQUIVADO:
        return <Eye className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: StatusDesarquivamento) => {
    switch (status) {
      case StatusDesarquivamento.FINALIZADO:
        return "default";
      case StatusDesarquivamento.NAO_LOCALIZADO:
        return "destructive";
      case StatusDesarquivamento.DESARQUIVADO:
        return "secondary";
      default:
        return "outline";
    }
  };

  // Removido prazoVencimento pois não existe na entidade
  const isPrazoVencido = false;

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(135%_95%_at_10%_8%,rgba(56,189,248,0.22),transparent_55%),radial-gradient(120%_85%_at_90%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0))] dark:bg-[radial-gradient(135%_95%_at_10%_8%,rgba(14,116,144,0.28),transparent_55%),radial-gradient(120%_85%_at_90%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.75)] backdrop-blur md:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/desarquivamentos")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Solicitação #{desarquivamento?.numeroSolicitacao || "N/A"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Detalhes da solicitação de desarquivamento
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            {canEdit && (
              <>
                <Button asChild>
                  <Link to={`/desarquivamentos/${id}/editar`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTermo("pdf")}
                  title={
                    !canGerarTermo
                      ? "Somente solicitacoes com status DESARQUIVADO ou REARQUIVAMENTO_SOLICITADO podem gerar termos."
                      : undefined
                  }
                  disabled={downloadPdfMutation.isPending || !canGerarTermo}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {downloadPdfMutation.isPending ? "Baixando..." : "Termo PDF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTermo("docx")}
                  title={
                    !canGerarTermo
                      ? "Somente solicitacoes com status DESARQUIVADO ou REARQUIVAMENTO_SOLICITADO podem gerar termos."
                      : undefined
                  }
                  disabled={downloadDocxMutation.isPending || !canGerarTermo}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {downloadDocxMutation.isPending
                    ? "Baixando..."
                    : "Termo Word"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(desarquivamento.status)}
              <div>
                <CardTitle>Status da Solicitação</CardTitle>
                <CardDescription>Situação atual do processo</CardDescription>
              </div>
            </div>
            <Badge variant={getStatusColor(desarquivamento.status)}>
              {getStatusLabel(desarquivamento.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="text-foreground">
                {formatDate(desarquivamento.createdAt)}
              </p>
            </div>
            {desarquivamento.updatedAt &&
              desarquivamento.updatedAt !== desarquivamento.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Última Atualização
                  </p>
                  <p className="text-foreground">
                    {formatDate(desarquivamento.updatedAt)}
                  </p>
                </div>
              )}
            <div>
              <p className="text-sm text-muted-foreground">
                Prazo de Vencimento
              </p>
              <p className="text-muted-foreground/70">Não definido</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Solicitação */}
        <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Número NIC/LAUDO/AUTO
              </p>
              <p className="font-mono text-lg font-medium">
                {desarquivamento.numeroNicLaudoAuto || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Número do Processo
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-mono text-lg font-medium break-all">
                  {desarquivamento.numeroProcesso || "N/A"}
                </p>
                {desarquivamento.numeroProcesso && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyToClipboard(
                          desarquivamento.numeroProcesso,
                          "numeroProcesso",
                        )
                      }
                      className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Copiar número do processo"
                      aria-label="Copiar número do processo"
                    >
                      {copiedField === "numeroProcesso" ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {copiedField === "numeroProcesso" && (
                      <span className="text-xs text-emerald-600">Copiado</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Nº do Ofício</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-mono text-lg font-medium break-all">
                  {desarquivamento.numeroOficio || "N/A"}
                </p>
                {desarquivamento.numeroOficio && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyToClipboard(
                          desarquivamento.numeroOficio,
                          "numeroOficio",
                        )
                      }
                      className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Copiar número do ofício"
                      aria-label="Copiar número do ofício"
                    >
                      {copiedField === "numeroOficio" ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {copiedField === "numeroOficio" && (
                      <span className="text-xs text-emerald-600">Copiado</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Tipo de Desarquivamento
              </p>
              <Badge variant="outline" className="mt-1">
                {desarquivamento.tipoDesarquivamento}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Documento</p>
              <p className="text-foreground">{desarquivamento.tipoDocumento}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instituto</p>
              <p className="text-foreground">
                {getInstitutoLabel(desarquivamento.instituto)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requerente</p>
              <p className="text-foreground">
                {desarquivamento.requerente || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Setor Demandante</p>
              <p className="text-foreground">
                {desarquivamento.setorDemandante}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Servidor Responsável
              </p>
              <p className="text-foreground">
                {desarquivamento.servidorResponsavel}
              </p>
            </div>
            {desarquivamento.urgente && (
              <div>
                <p className="text-sm text-muted-foreground">Prioridade</p>
                <Badge variant="destructive" className="mt-1">
                  URGENTE
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Requerente */}
        <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Requerente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome Completo</p>
              <p className="font-medium">{desarquivamento.nomeCompleto}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Usuário Solicitante
              </p>
              <p className="font-medium">
                {desarquivamento.usuario?.nome || "N/A"}
              </p>
            </div>
            {desarquivamento.responsavel && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Responsável pelo Atendimento
                </p>
                <p className="font-medium">
                  {desarquivamento.responsavel.nome}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="font-medium">
                {formatDate(
                  desarquivamento.createdAt || desarquivamento.dataSolicitacao,
                )}
              </p>
            </div>
            {desarquivamento.dataDesarquivamentoSAG && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Data do Desarquivamento - SAG
                </p>
                <p className="font-medium">
                  {formatDate(desarquivamento.dataDesarquivamentoSAG)}
                </p>
              </div>
            )}
            {desarquivamento.dataDevolucaoSetor && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Data da Devolução pelo Setor
                </p>
                <p className="font-medium">
                  {formatDate(desarquivamento.dataDevolucaoSetor)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Justificativa e Prazos */}
      <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Justificativa e Prazos
          </CardTitle>
          <CardDescription>
            Finalidade, justificativa e prazos da solicitação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-2">
              Finalidade do Desarquivamento *
            </p>
            <p className="text-foreground whitespace-pre-wrap bg-background/60 p-3 rounded-md border border-border/60">
              {desarquivamento.finalidadeDesarquivamento}
            </p>
          </div>

          {desarquivamento.justificativa && (
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-2">
                Justificativa
              </p>
              <p className="text-foreground whitespace-pre-wrap bg-background/60 p-3 rounded-md border border-border/60">
                {desarquivamento.justificativa}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {desarquivamento.prazoDesarquivamento && (
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Prazo de Desarquivamento
                </p>
                <p className="text-foreground text-base">
                  {formatDate(desarquivamento.prazoDesarquivamento)}
                </p>
              </div>
            )}

            {desarquivamento.prazoVencimento && (
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Prazo de Vencimento
                </p>
                <p
                  className={`text-base font-medium ${new Date(desarquivamento.prazoVencimento) < new Date() ? "text-red-600" : "text-foreground"}`}
                >
                  {formatDate(desarquivamento.prazoVencimento)}
                  {new Date(desarquivamento.prazoVencimento) < new Date() && (
                    <span className="ml-2 text-xs">(Vencido)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {desarquivamento.solicitacaoProrrogacao && (
            <div className="pt-2 border-t border-border/60">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Solicitação de Prorrogação
                </p>
                <Badge variant="secondary">Sim</Badge>
              </div>
              {desarquivamento.solicitacaoProrrogacaoTexto && (
                <p className="text-sm text-foreground bg-amber-50 p-3 rounded-md border border-amber-200 whitespace-pre-wrap">
                  {desarquivamento.solicitacaoProrrogacaoTexto}
                </p>
              )}
            </div>
          )}

          {desarquivamento.dadosAdicionais && (
            <div className="pt-2 border-t border-border/60">
              <p className="text-sm text-muted-foreground font-medium mb-2">
                Observações
              </p>
              <p className="text-foreground whitespace-pre-wrap bg-background/60 p-3 rounded-md border border-border/60">
                {desarquivamento.dadosAdicionais}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comentários */}
      <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários
          </CardTitle>
          <CardDescription>Comentários sobre esta solicitação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <textarea
              className="min-h-[90px] w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary/40 focus:ring-2 focus:ring-primary/25"
              placeholder="Escreva um comentário sobre esta solicitação..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={2000}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Registrado como{" "}
                <strong>{user?.nome || user?.usuario || "Usuário"}</strong>
              </span>
              <button
                type="submit"
                disabled={addCommentMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Comentário
              </button>
            </div>
          </form>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum comentário registrado até o momento.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-md border border-border/60 bg-background/55 px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">
                      {comment.authorName}
                    </span>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                    {comment.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Alterações */}
      <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico
          </CardTitle>
          <CardDescription>
            Últimos eventos relevantes da solicitação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usandoHistoricoMinimo && (
              <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline">Histórico mínimo</Badge>
                  <span className="text-xs font-medium text-sky-800">
                    Fonte: campos do documento
                  </span>
                </div>
                <p className="text-xs text-sky-900">
                  O log detalhado de ações não está disponível para este item.
                </p>
              </div>
            )}
            {historicoResumo.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">Dados Ausentes</Badge>
                  <span className="text-xs font-medium text-amber-800">
                    Tratamento: Sinalizar para revisão
                  </span>
                </div>
                <p className="text-sm text-amber-900">
                  Este documento não possui histórico de ações detalhado.
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Nenhuma inferência foi aplicada para preencher eventos não
                  registrados.
                </p>
              </div>
            ) : (
              historicoResumo.map((evento, index) => (
                <div
                  key={evento.id}
                  className={`flex items-start gap-3 ${
                    index < historicoResumo.length - 1
                      ? "border-b border-border/60 pb-4"
                      : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${evento.dotColor}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{evento.title}</p>
                      <span className="text-sm text-muted-foreground">
                        {evento.timestamp ? formatDate(evento.timestamp) : "-"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {evento.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Ações */}
      {desarquivamento?.id && (
        <HistoricoTimeline desarquivamentoId={desarquivamento.id} />
      )}

      {/* Anexos - Divididos em Desarquivamento e Rearquivamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnexosSection
          title="Anexos de Desarquivamento"
          description="Documentos relacionados ao desarquivamento"
          anexos={anexosDesarquivamento ?? []}
          isLoading={isLoadingAnexosDesarq}
          canEdit={canEdit}
          tipoAnexo="desarquivamento"
          numeroProcesso={desarquivamento?.numeroProcesso}
          onUpload={handleUploadDesarquivamento}
          onDownload={handleDownloadAnexo}
          onDelete={handleDeleteAnexo}
          onView={handleViewAnexo}
          onUpdateDescricao={handleUpdateDescricao}
          isUploading={uploadAnexoMutation.isPending}
        />

        <AnexosSection
          title="Anexos de Rearquivamento"
          description="Documentos relacionados ao rearquivamento"
          anexos={anexosRearquivamento ?? []}
          isLoading={isLoadingAnexosRearq}
          canEdit={canEdit}
          tipoAnexo="rearquivamento"
          numeroProcesso={desarquivamento?.numeroProcesso}
          onUpload={handleUploadRearquivamento}
          onDownload={handleDownloadAnexo}
          onDelete={handleDeleteAnexo}
          onView={handleViewAnexo}
          onUpdateDescricao={handleUpdateDescricao}
          isUploading={uploadAnexoMutation.isPending}
        />
      </div>

      {/* Modal de Visualização */}
      <ImagePreviewModal
        anexo={previewAnexo}
        previewUrl={previewUrl}
        onClose={closePreview}
        onUpdateDescricao={handleUpdateDescricao}
        onDownload={(anexoId) => handleDownloadAnexo(Number(anexoId))}
        canEdit={canEdit}
        allImages={[
          ...(anexosDesarquivamento ?? []),
          ...(anexosRearquivamento ?? []),
        ]}
      />
    </div>
  );
};

export default DetalhesDesarquivamentoPage;
