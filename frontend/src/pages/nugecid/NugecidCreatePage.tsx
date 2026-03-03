import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Info } from "lucide-react";
import { CreateDesarquivamentoDto } from "@/types";
import { useCreateDesarquivamento } from "@/hooks/useDesarquivamentos";
import { Button } from "@/components/ui/Button";
import DesarquivamentoForm from "@/components/nugecid/DesarquivamentoForm";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

interface NugecidCreatePageProps {
  className?: string;
}

const NugecidCreatePage: React.FC<NugecidCreatePageProps> = ({ className }) => {
  const navigate = useNavigate();
  const createDesarquivamento = useCreateDesarquivamento();

  const handleSubmit = async (data: CreateDesarquivamentoDto) => {
    try {
      const result = await createDesarquivamento.mutateAsync(
        data as CreateDesarquivamentoDto,
      );
      const created = result.data;

      toast.success("Registro criado com sucesso!", {
        description: `Código: ${created?.codigoBarras || created?.id || "novo registro"}`,
      });

      // Redirecionar para a página de detalhes do registro criado
      if (created?.id) {
        navigate(`/nugecid/${created.id}`);
      } else {
        navigate("/nugecid");
      }
    } catch (error: unknown) {
      console.error("Erro ao criar registro:", error);

      const axiosErr = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        "Erro interno do servidor";

      toast.error("Erro ao criar registro", {
        description: errorMessage,
      });

      throw error; // Re-throw para que o form possa lidar com o estado de loading
    }
  };

  const handleCancel = () => {
    navigate("/nugecid");
  };

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
              onClick={() => navigate("/nugecid")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Novo Registro NUGECID
              </h1>
              <p className="text-muted-foreground mt-1">
                Preencha as informações para criar um novo registro de
                desarquivamento
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
                  <span className="text-sm font-medium text-foreground">
                    Novo Registro
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
            onSubmit={(data) => handleSubmit(data as CreateDesarquivamentoDto)}
            onCancel={handleCancel}
            isLoading={createDesarquivamento.isPending}
          />
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 backdrop-blur">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Info className="h-4 w-4 text-primary" />
          Informações Importantes
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Todos os campos marcados com (*) são obrigatórios</li>
          <li>
            • O código de barras será gerado automaticamente após a criação
          </li>
          <li>• Solicitações urgentes têm prioridade no processamento</li>
          <li>• Você receberá notificações sobre o andamento da solicitação</li>
        </ul>
      </div>
    </div>
  );
};

export default NugecidCreatePage;
