import React, { useState } from "react";
import {
  useDesarquivamentosLixeira,
  useRestoreDesarquivamento,
} from "../hooks/useDesarquivamentos";
import { Desarquivamento } from "../types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Trash2, RotateCcw, Calendar, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { ErrorState, EmptyFolder } from "@/components/ui/EmptyState";
import { TableLoading } from "@/components/ui/Loading";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";

const LixeiraPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const navigate = useNavigate();
  const [deleteItem, setDeleteItem] = useState<Desarquivamento | null>(null);

  const {
    data: lixeiraData,
    isLoading,
    error,
    refetch,
  } = useDesarquivamentosLixeira({ page, limit });

  const restoreDesarquivamento = useRestoreDesarquivamento();

  const handleDeleteClick = (desarquivamento: Desarquivamento) => {
    setDeleteItem(desarquivamento);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      // Chama endpoint de exclusão permanente (requer role ADMIN)
      await apiService.deleteDesarquivamentoPermanente(deleteItem.id);

      toast.success("Desarquivamento excluído permanentemente");
      setDeleteItem(null);
      refetch();
    } catch (error) {
      console.error("Erro ao excluir permanentemente:", error);
      toast.error("Erro ao excluir permanentemente. Verifique permissões.");
    }
  };

  const handleRestore = async (desarquivamento: Desarquivamento) => {
    try {
      // Validar se o ID é válido
      if (!desarquivamento.id || desarquivamento.id <= 0) {
        toast.error("ID do desarquivamento é inválido.");
        return;
      }

      await restoreDesarquivamento.mutateAsync(desarquivamento.id);

      toast.success(
        `Desarquivamento "${desarquivamento.numeroProcesso}" restaurado com sucesso!`,
      );

      // Forçar atualização da lista
      refetch();
    } catch (error) {
      toast.error("Erro ao restaurar desarquivamento. Tente novamente.");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pendente":
        return "secondary";
      case "em_andamento":
        return "default";
      case "concluido":
        return "default";
      case "cancelado":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case "urgente":
        return "destructive";
      case "normal":
        return "default";
      case "baixa":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <TableLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState
          description="Erro ao carregar itens da lixeira."
          action={{
            label: "Tentar novamente",
            onClick: () => refetch(),
          }}
          secondaryAction={{
            label: "Voltar",
            onClick: () => navigate("/desarquivamentos"),
          }}
        />
      </div>
    );
  }

  const desarquivamentos = lixeiraData?.data || [];
  const meta = lixeiraData?.meta;

  return (
    <div className="container mx-auto p-6">
      {/* Header glassmorphism */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/desarquivamentos")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Trash2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lixeira</h1>
              <p className="text-muted-foreground">
                Itens excluídos que podem ser restaurados
              </p>
            </div>
          </div>

          {meta && meta.total > 0 && (
            <div className="text-sm text-muted-foreground">
              {meta.total} {meta.total === 1 ? "item" : "itens"} na lixeira
            </div>
          )}
        </div>
      </div>

      {desarquivamentos.length === 0 ? (
        <EmptyFolder
          description="Não há itens excluídos para exibir."
          action={{
            label: "Voltar para desarquivamentos",
            onClick: () => navigate("/desarquivamentos"),
          }}
        />
      ) : (
        <div className="space-y-4">
          {desarquivamentos.map((desarquivamento) => (
            <Card
              key={desarquivamento.id}
              className="border-l-4 border-l-destructive/30 border-border/60 bg-card/85 backdrop-blur"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      Processo: {desarquivamento.numeroProcesso}
                    </CardTitle>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant={getStatusBadgeVariant(desarquivamento.status)}
                      >
                        {desarquivamento.status}
                      </Badge>
                      <Badge
                        variant={getTipoBadgeVariant(
                          desarquivamento.tipoDesarquivamento,
                        )}
                      >
                        {desarquivamento.tipoDesarquivamento}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRestore(desarquivamento)}
                    disabled={restoreDesarquivamento.isPending}
                    size="sm"
                    className="ml-4"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {restoreDesarquivamento.isPending
                      ? "Restaurando..."
                      : "Restaurar"}
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(desarquivamento)}
                    size="sm"
                    variant="destructive"
                    className="ml-2"
                  >
                    Excluir permanentemente
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Criado por:</span>
                      <span>{desarquivamento.usuario?.nome || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Criado em:</span>
                      <span>
                        {desarquivamento?.createdAt
                          ? format(
                              new Date(desarquivamento.createdAt),
                              "dd/MM/yyyy",
                              { locale: ptBR },
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Excluído em:</span>
                      <span>
                        {desarquivamento?.deletedAt
                          ? format(
                              new Date(desarquivamento.deletedAt),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR },
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {desarquivamento?.finalidadeDesarquivamento && (
                  <div className="mt-4">
                    <span className="font-medium">Finalidade:</span>
                    <p className="text-muted-foreground mt-1">
                      {desarquivamento.finalidadeDesarquivamento}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Paginação */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!meta.hasPrev}
                >
                  Anterior
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!meta.hasNext}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Confirm Dialog */}
      <EnhancedConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir permanentemente"
        description={`Tem certeza que deseja excluir permanentemente o processo ${deleteItem?.numeroProcesso}?`}
        variant="danger"
        confirmationType="text"
        confirmationKeyword="EXCLUIR"
        warningList={[
          "Esta ação é IRREVERSÍVEL",
          "O registro será removido permanentemente do banco de dados",
          "Todos os anexos e histórico serão perdidos",
          "Não será possível recuperar este item",
        ]}
      />
    </div>
  );
};

export default LixeiraPage;
