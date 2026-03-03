import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Info } from "lucide-react";
import { UpdateDesarquivamentoDto } from "@/types";
import {
  useDesarquivamento,
  useUpdateDesarquivamento,
} from "@/hooks/useDesarquivamentos";
import { Button } from "@/components/ui/Button";
import DesarquivamentoForm from "@/components/nugecid/DesarquivamentoForm";
import { PageLoading } from "@/components/ui";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

interface NugecidEditPageProps {
  className?: string;
}

const NugecidEditPage: React.FC<NugecidEditPageProps> = ({ className }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const updateDesarquivamento = useUpdateDesarquivamento();

  const { data: response, isLoading, error } = useDesarquivamento(id);
  const desarquivamento = response?.data;

  const handleSubmit = async (data: UpdateDesarquivamentoDto) => {
    try {
      const result = await updateDesarquivamento.mutateAsync({
        id: id!,
        data,
      });
      const updated = result.data;

      toast.success("Registro atualizado com sucesso!", {
        description: `Código: ${updated?.codigoBarras || updated?.id || id}`,
      });

      // Redirecionar para a página de detalhes
      navigate(`/nugecid/${id}`);
    } catch (error: unknown) {
      console.error("Erro ao atualizar registro:", error);

      const axiosErr = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        "Erro interno do servidor";

      toast.error("Erro ao atualizar registro", {
        description: errorMessage,
      });

      throw error; // Re-throw para que o form possa lidar com o estado de loading
    }
  };

  const handleCancel = () => {
    navigate(`/nugecid/${id}`);
  };

  // Loading state
  if (isLoading) {
    return <PageLoading />;
  }

  // Error state
  if (error) {
    return (
      <div className={cn("container mx-auto px-4 py-6 max-w-4xl", className)}>
        <div className="text-center py-12">
          <div className="text-destructive mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Erro ao carregar registro
          </h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || "Não foi possível carregar os dados do registro"}
          </p>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => navigate("/nugecid")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à Lista
            </Button>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!desarquivamento) {
    return (
      <div className={cn("container mx-auto px-4 py-6 max-w-4xl", className)}>
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Registro não encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            O registro solicitado não existe ou foi removido
          </p>
          <Button variant="outline" onClick={() => navigate("/nugecid")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Lista
          </Button>
        </div>
      </div>
    );
  }

  // Check if can edit
  const canEdit = !["FINALIZADO", "NAO_COLETADO", "NAO_LOCALIZADO"].includes(
    desarquivamento.status,
  );

  if (!canEdit) {
    return (
      <div className={cn("container mx-auto px-4 py-6 max-w-4xl", className)}>
        <div className="text-center py-12">
          <div className="text-yellow-600 dark:text-yellow-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Registro não pode ser editado
          </h2>
          <p className="text-muted-foreground mb-4">
            Este registro está com status &ldquo;{desarquivamento.status}&rdquo;
            e não pode ser modificado
          </p>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => navigate("/nugecid")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à Lista
            </Button>
            <Button onClick={() => navigate(`/nugecid/${id}`)}>
              Ver Detalhes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("container mx-auto px-4 py-6 max-w-4xl", className)}>
      {/* Header glassmorphism */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/nugecid/${id}`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Edit className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Editar Registro NUGECID
              </h1>
              <p className="text-muted-foreground mt-1">
                Código:{" "}
                <span className="font-mono font-medium">
                  {desarquivamento.codigoBarras}
                </span>
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="mt-4 flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate("/nugecid")}
                  className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  NUGECID
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-muted-foreground/60">/</span>
                  <button
                    onClick={() => navigate(`/nugecid/${id}`)}
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {desarquivamento.codigoBarras}
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-muted-foreground/60">/</span>
                  <span className="text-sm font-medium text-foreground">
                    Editar
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <div className="p-6">
          <DesarquivamentoForm
            initialData={desarquivamento}
            onSubmit={(data) => handleSubmit(data as UpdateDesarquivamentoDto)}
            onCancel={handleCancel}
            isLoading={updateDesarquivamento.isPending}
            isEdit={true}
          />
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 backdrop-blur">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Informações sobre Edição
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • Apenas registros pendentes ou em andamento podem ser editados
          </li>
          <li>• Alterações serão registradas no histórico do sistema</li>
          <li>• O código de barras não pode ser alterado</li>
          <li>• Notificações serão enviadas sobre as alterações</li>
        </ul>
      </div>
    </div>
  );
};

export default NugecidEditPage;
