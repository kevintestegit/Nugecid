import React, { useMemo } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import {
  useDesarquivamento,
  useUpdateDesarquivamento,
} from "@/hooks/useDesarquivamentos";
import DesarquivamentoForm from "@/components/forms/DesarquivamentoForm";
import { PageLoading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import {
  CreateDesarquivamentoDto,
  UpdateDesarquivamentoDto,
  TipoDesarquivamento,
} from "@/types";
import { normalizeDesarquivamentoData } from "@/utils/normalization";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const EditDesarquivamentoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isValidId = typeof id === "string" && /^\d+$/.test(id);
  const { data: response, isLoading, error } = useDesarquivamento(id!);
  const updateDesarquivamento = useUpdateDesarquivamento();

  const desarquivamento = response?.data;

  const toDateInput = (value?: string | Date) => {
    if (!value) return undefined;
    try {
      if (typeof value === "string") {
        // Se vier como ISO/string, use a parte YYYY-MM-DD diretamente (evita timezone)
        const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (m) return m[1];
      }
      const d = new Date(value);
      if (isNaN(d.getTime())) return undefined;
      // Usa componentes UTC para evitar "voltar um dia" em timezones negativos
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return undefined;
    }
  };

  const initialFormData = useMemo(() => {
    if (!desarquivamento) return undefined;
    return {
      tipoDesarquivamento: desarquivamento.tipoDesarquivamento,
      nomeCompleto: desarquivamento.nomeCompleto,
      numeroNicLaudoAuto: desarquivamento.numeroNicLaudoAuto || "",
      numeroProcesso: desarquivamento.numeroProcesso,
      tipoDocumento: desarquivamento.tipoDocumento,
      dataSolicitacao: toDateInput(desarquivamento.dataSolicitacao)!,
      dataDesarquivamentoSAG: toDateInput(
        desarquivamento.dataDesarquivamentoSAG,
      ),
      dataDevolucaoSetor: toDateInput(desarquivamento.dataDevolucaoSetor),
      setorDemandante: desarquivamento.setorDemandante,
      servidorResponsavel: desarquivamento.servidorResponsavel,
      finalidadeDesarquivamento: desarquivamento.finalidadeDesarquivamento,
      solicitacaoProrrogacao: !!desarquivamento.solicitacaoProrrogacao,
      solicitacaoProrrogacaoTexto:
        desarquivamento.solicitacaoProrrogacaoTexto || "",
      dadosAdicionais: desarquivamento.dadosAdicionais || "",
      numeroOficio: desarquivamento.numeroOficio || "",
      instituto: desarquivamento.instituto || "",
      requerente: desarquivamento.requerente || "",
    };
  }, [desarquivamento]);

  if (!isValidId) {
    return <Navigate to="/404" replace />;
  }

  const handleSubmit = async (data: CreateDesarquivamentoDto) => {
    const {
      tipoDesarquivamento,
      numeroNicLaudoAuto,
      dataDesarquivamentoSAG,
      dataDevolucaoSetor,
      dataSolicitacao,
      ...rest
    } = data;

    if (!dataSolicitacao) {
      toast.error("Data da solicita\u00e7\u00e3o inv\u00e1lida.");
      return;
    }

    const payload: UpdateDesarquivamentoDto = {
      desarquivamentoFisicoDigital: tipoDesarquivamento as TipoDesarquivamento,
      nomeCompleto: rest.nomeCompleto.trim(),
      numeroProcesso: rest.numeroProcesso.trim(),
      tipoDocumento: rest.tipoDocumento.trim(),
      dataSolicitacao,
      setorDemandante: rest.setorDemandante.trim(),
      servidorResponsavel: rest.servidorResponsavel.trim(),
      finalidadeDesarquivamento:
        rest.finalidadeDesarquivamento?.trim() || undefined,
      solicitacaoProrrogacao: rest.solicitacaoProrrogacao,
      solicitacaoProrrogacaoTexto:
        rest.solicitacaoProrrogacaoTexto?.trim() || undefined,
      dadosAdicionais: rest.dadosAdicionais?.trim() || undefined,
      numeroOficio: rest.numeroOficio?.trim() || undefined,
      instituto: rest.instituto?.trim() || undefined,
      requerente: rest.requerente?.trim() || undefined,
    };

    if (numeroNicLaudoAuto && numeroNicLaudoAuto.trim()) {
      payload.numeroNicLaudoAuto = numeroNicLaudoAuto.trim();
    }

    if (dataDesarquivamentoSAG) {
      payload.dataDesarquivamentoSAG = dataDesarquivamentoSAG;
    }

    // Sempre incluir dataDevolucaoSetor (null se vazio) para permitir remoção
    payload.dataDevolucaoSetor = dataDevolucaoSetor || undefined;

    if ("urgente" in rest && typeof rest.urgente !== "undefined") {
      payload.urgente = rest.urgente;
    }

    // Aplica normalização completa antes de enviar
    const normalizedPayload = normalizeDesarquivamentoData(
      payload as unknown as Record<string, unknown>,
    );

    try {
      await updateDesarquivamento.mutateAsync({
        id: id!,
        data: normalizedPayload,
      });
      toast.success("Solicita\u00e7\u00e3o atualizada com sucesso!");
      navigate(`/desarquivamentos/${id}`);
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        "Erro ao atualizar solicita\u00e7\u00e3o";
      toast.error(message);
      throw error;
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !desarquivamento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Solicitação não encontrada
          </h3>
          <p className="text-muted-foreground mb-4">
            A solicitação que você está tentando editar não existe ou foi
            removida.
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

  return (
    <div className="space-y-6">
      {/* Header glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/desarquivamentos/${id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Editar Solicitação #{desarquivamento?.numeroSolicitacao}
            </h1>
            <p className="text-muted-foreground mt-1">
              Modifique os dados da solicitação de desarquivamento
            </p>
          </div>
        </div>
      </div>

      <DesarquivamentoForm
        initialData={initialFormData}
        onSubmit={handleSubmit}
        isLoading={updateDesarquivamento.isPending}
        isEdit
      />
    </div>
  );
};

export default EditDesarquivamentoPage;
