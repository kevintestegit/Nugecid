import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  User,
  Calendar,
  Flag,
  FileText,
  History,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import TarefaForm from "@/components/tarefas/TarefaForm";
import { useTarefas } from "@/hooks/useTarefas";
import { useUsers } from "@/hooks/useUsers";
import {
  Tarefa,
  StatusTarefa,
  PrioridadeTarefa,
  UpdateTarefaDto,
  HistoricoTarefa,
} from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";
import { AvatarGroup } from "@/components/kanban/Avatar";

const DetalheTarefaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTarefa, updateTarefa, deleteTarefa, getHistoricoTarefa, loading } =
    useTarefas();
  const { data: usersResponse, isLoading: loadingUsers } = useUsers({
    page: 1,
    limit: 1000,
  });
  const usuarios = usersResponse?.data ?? [];

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [historico, setHistorico] = useState<HistoricoTarefa[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingTarefa, setLoadingTarefa] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadTarefa = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingTarefa(true);
      const tarefaData = await getTarefa(parseInt(id));
      setTarefa(tarefaData);
    } catch (error) {
      console.error("Erro ao carregar tarefa:", error);
      toast.error("Erro ao carregar tarefa");
      navigate("/tarefas");
    } finally {
      setLoadingTarefa(false);
    }
  }, [getTarefa, id, navigate]);

  useEffect(() => {
    if (id) {
      loadTarefa();
    }
  }, [id, loadTarefa]);

  const loadHistorico = async () => {
    if (!id) return;

    try {
      setLoadingHistorico(true);
      const historicoData = await getHistoricoTarefa(parseInt(id));
      setHistorico(historicoData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleUpdate = async (data: UpdateTarefaDto) => {
    if (!tarefa) return;

    try {
      const tarefaAtualizada = await updateTarefa(tarefa.id, data);
      setTarefa(tarefaAtualizada);
      setIsEditing(false);
      toast.success("Tarefa atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!tarefa) return;

    try {
      await deleteTarefa(tarefa.id);
      toast.success("Tarefa excluída com sucesso!");
      navigate("/tarefas");
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast.error("Erro ao excluir tarefa");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleStatusChange = async (novoStatus: StatusTarefa) => {
    if (!tarefa) return;

    try {
      const tarefaAtualizada = await updateTarefa(tarefa.id, {
        estado: novoStatus,
      } as UpdateTarefaDto);
      setTarefa(tarefaAtualizada);
      toast.success("Status atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusIcon = (status: StatusTarefa) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return <Clock className="h-4 w-4" />;
      case StatusTarefa.EM_ANDAMENTO:
        return <PlayCircle className="h-4 w-4" />;
      case StatusTarefa.CONCLUIDA:
        return <CheckCircle className="h-4 w-4" />;
      case StatusTarefa.CANCELADA:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: StatusTarefa) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case StatusTarefa.EM_ANDAMENTO:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case StatusTarefa.CONCLUIDA:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case StatusTarefa.CANCELADA:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPrioridadeColor = (prioridade: PrioridadeTarefa) => {
    switch (prioridade) {
      case PrioridadeTarefa.BAIXA:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case PrioridadeTarefa.MEDIA:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case PrioridadeTarefa.ALTA:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case PrioridadeTarefa.CRITICA:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (loadingTarefa) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!tarefa) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Tarefa não encontrada
          </h2>
          <p className="text-muted-foreground mb-4">
            A tarefa que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => navigate("/tarefas")}>
            Voltar para Tarefas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header glassmorphism */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/tarefas")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {tarefa.titulo}
              </h1>
              <p className="text-muted-foreground">
                Detalhes da tarefa #{tarefa.id}
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Editar Tarefa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TarefaForm
                  tarefa={tarefa}
                  onSubmit={handleUpdate}
                  onCancel={() => setIsEditing(false)}
                  loading={loading || loadingUsers}
                  submitLabel="Salvar Alterações"
                  cancelLabel="Cancelar"
                  usuarios={usuarios}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Informações da Tarefa */}
              <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações da Tarefa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">
                      Descrição
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {tarefa.descricao || "Nenhuma descrição fornecida."}
                    </p>
                  </div>

                  {tarefa.observacoes && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">
                        Observações
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {tarefa.observacoes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tarefa.status !== StatusTarefa.EM_ANDAMENTO && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(StatusTarefa.EM_ANDAMENTO)
                        }
                        className="flex items-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar
                      </Button>
                    )}
                    {tarefa.status !== StatusTarefa.CONCLUIDA && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(StatusTarefa.CONCLUIDA)
                        }
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Concluir
                      </Button>
                    )}
                    {tarefa.status !== StatusTarefa.CANCELADA && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(StatusTarefa.CANCELADA)
                        }
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status e Prioridade */}
          <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className={`flex items-center gap-1 ${tarefa.status ? getStatusColor(tarefa.status as StatusTarefa) : ""}`}
                >
                  {tarefa.status
                    ? getStatusIcon(tarefa.status as StatusTarefa)
                    : null}
                  {tarefa.status
                    ? tarefa.status.replace("_", " ").toUpperCase()
                    : "STATUS INDEFINIDO"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <Badge
                  className={
                    tarefa.prioridade
                      ? getPrioridadeColor(tarefa.prioridade)
                      : ""
                  }
                >
                  {tarefa.prioridade
                    ? tarefa.prioridade.toUpperCase()
                    : "PRIORIDADE INDEFINIDA"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pessoas */}
          <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Pessoas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const responsaveis = tarefa.responsaveis?.length
                    ? tarefa.responsaveis
                    : tarefa.responsavel
                      ? [tarefa.responsavel]
                      : [];
                  if (responsaveis.length > 1) {
                    return (
                      <>
                        <AvatarGroup
                          usuarios={responsaveis}
                          size="xs"
                          max={4}
                        />
                        <div>
                          <p className="text-sm font-medium">Responsáveis</p>
                          <p className="text-sm text-muted-foreground">
                            {responsaveis
                              .map((usuario) => usuario.nome)
                              .join(", ")}
                          </p>
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {responsaveis[0]?.avatarUrl ||
                        responsaveis[0]?.avatar ? (
                          <img
                            src={
                              responsaveis[0]?.avatarUrl ??
                              responsaveis[0]?.avatar ??
                              undefined
                            }
                            alt={responsaveis[0]?.nome ?? "Responsável"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Responsável</p>
                        <p className="text-sm text-muted-foreground">
                          {responsaveis[0]?.nome || "Não atribuído"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {tarefa.criador?.avatarUrl || tarefa.criador?.avatar ? (
                    <img
                      src={
                        tarefa.criador?.avatarUrl ??
                        tarefa.criador?.avatar ??
                        undefined
                      }
                      alt={tarefa.criador?.nome ?? "Criador"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Criado por</p>
                  <p className="text-sm text-muted-foreground">
                    {tarefa.criador?.nome}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Criado em</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tarefa.createdAt || new Date())}
                  </p>
                </div>
              </div>

              {tarefa.prazo && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Prazo</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tarefa.prazo)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Atualizado em</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tarefa.updatedAt || new Date())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadHistorico}
                  disabled={loadingHistorico}
                >
                  {loadingHistorico ? "Carregando..." : "Carregar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {historico.length > 0 ? (
                <div className="space-y-3">
                  {historico.map((item, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-border pl-3 pb-3"
                    >
                      <p className="text-sm font-medium">{item.acao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.data_acao || new Date())} -{" "}
                        {item.usuario?.nome}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum histórico disponível
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Confirm Dialog */}
      <EnhancedConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${tarefa?.titulo}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta tarefa permanentemente"
        warningList={[
          "Esta ação não pode ser desfeita",
          "Todos os dados da tarefa serão perdidos",
          "O histórico será apagado",
        ]}
      />
    </div>
  );
};

export default DetalheTarefaPage;
