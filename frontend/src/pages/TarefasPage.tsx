import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  KanbanBoard,
  Coluna as KanbanColuna,
  Tarefa as KanbanTarefa,
  Projeto as KanbanProjeto,
  TaskDetailModal,
} from "@/components/kanban";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Loader2, RefreshCw, Plus, Columns, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";
import { SkeletonKanbanCard, Skeleton } from "@/components/ui/Skeleton";
import type {
  Coluna as KanbanDomainColumn,
  Tarefa as KanbanDomainTask,
  Usuario as KanbanDomainUser,
} from "@/types/kanban.types";
import { BoardTask, useTarefasBoardData } from "@/hooks/useTarefasBoardData";
import { useTarefasBoardActions } from "@/hooks/useTarefasBoardActions";
import { cn } from "@/utils/cn";

type ResponsibleFilter = "all" | "mine" | number;

const STORAGE_KEY = "tarefas.selectedProjectId";
const DENSITY_KEY = "tarefas.boardDensity";
type BoardDensity = "comfortable" | "compact";

const buildDomainUser = (
  responsavel: BoardTask["responsavel"] | undefined,
): KanbanDomainUser | undefined => {
  if (!responsavel) return undefined;
  return {
    id: responsavel.id,
    nome: responsavel.nome,
    usuario: responsavel.nome,
    avatar: responsavel.avatar,
    avatarUrl: responsavel.avatarUrl,
  };
};

const buildDomainColumn = (
  coluna: KanbanColuna | undefined,
  projetoId: number,
): KanbanDomainColumn | undefined => {
  if (!coluna) return undefined;
  return {
    id: coluna.id,
    nome: coluna.nome,
    cor: coluna.cor ?? "#3B82F6",
    ordem: coluna.ordem,
    ativa: true,
    projetoId,
  };
};

const buildDomainTask = (
  tarefa: BoardTask,
  projetoId: number,
  coluna?: KanbanColuna,
): KanbanDomainTask => {
  const now = new Date().toISOString();
  const colunaId = tarefa.colunaId ?? tarefa.coluna_id ?? 0;
  const responsaveis = tarefa.responsaveis
    ?.map((responsavel) => buildDomainUser(responsavel))
    .filter((value): value is KanbanDomainUser => Boolean(value));

  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    projetoId,
    colunaId,
    criadorId: 0,
    responsavelId: tarefa.responsavel?.id ?? tarefa.responsaveis?.[0]?.id,
    prazo: tarefa.prazo,
    prioridade: tarefa.prioridade,
    ordem: tarefa.ordem,
    tags: tarefa.tags,
    createdAt: now,
    updatedAt: now,
    responsavel: buildDomainUser(tarefa.responsavel),
    responsaveis: responsaveis?.length ? responsaveis : undefined,
    coluna: buildDomainColumn(coluna, projetoId),
  };
};

const TarefasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkPermission, isAuthenticated } = useAuth();

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  const [selectedResponsibleId, setSelectedResponsibleId] =
    useState<ResponsibleFilter>("all");
  const [detailTask, setDetailTask] = useState<KanbanDomainTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [boardDensity, setBoardDensity] = useState<BoardDensity>("comfortable");
  const {
    selectedProjectId,
    setSelectedProjectId,
    projectDetails,
    projects,
    columns,
    tasks,
    loadingProjects,
    loadingBoard,
    error,
    hasProjectsLoaded,
    hasBoardContent,
    loadProjects,
    loadBoardData,
  } = useTarefasBoardData({
    isAuthenticated,
    storageKey: STORAGE_KEY,
  });
  const {
    isMutating,
    deleteColumn,
    setDeleteColumn,
    deleteTask,
    setDeleteTask,
    columnDialog,
    setColumnDialog,
    columnDialogName,
    setColumnDialogName,
    handleMoveTask,
    handleReorderTasks,
    handleAddColumn,
    handleEditColumn,
    handleColumnDialogConfirm,
    handleDeleteColumn,
    handleConfirmDeleteColumn,
    handleAddTask,
    handleTaskEdit,
    handleTaskDelete,
    handleConfirmDeleteTask,
    handleRefresh,
    handleProjectSettings,
  } = useTarefasBoardActions({
    selectedProjectId,
    tasks,
    columns,
    projects,
    user,
    checkPermission,
    loadBoardData,
    loadProjects,
    hasBoardContent,
    hasProjectsLoaded,
  });

  useEffect(() => {
    const stored = localStorage.getItem(DENSITY_KEY);
    if (stored === "compact" || stored === "comfortable") {
      setBoardDensity(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DENSITY_KEY, boardDensity);
  }, [boardDensity]);

  useEffect(() => {
    setSelectedResponsibleId("all");
  }, [selectedProjectId]);

  const responsibleOptions = useMemo(() => {
    const unique = new Map<number, { id: number; nome: string }>();
    tasks.forEach((task) => {
      const responsaveis = task.responsaveis?.length
        ? task.responsaveis
        : task.responsavel
          ? [task.responsavel]
          : [];
      responsaveis.forEach((responsavel) => {
        unique.set(responsavel.id, {
          id: responsavel.id,
          nome: responsavel.nome || responsavel.usuario || "Usuário",
        });
      });
    });
    return Array.from(unique.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [tasks]);

  useEffect(() => {
    if (
      typeof selectedResponsibleId === "number" &&
      !responsibleOptions.some((option) => option.id === selectedResponsibleId)
    ) {
      setSelectedResponsibleId("all");
    }
  }, [responsibleOptions, selectedResponsibleId]);

  const boardTasks = useMemo(() => {
    if (selectedResponsibleId === "all") {
      return tasks;
    }

    if (selectedResponsibleId === "mine") {
      if (!user) return [];
      return tasks.filter(
        (task) =>
          task.responsaveis?.some(
            (responsavel) => responsavel.id === user.id,
          ) || task.responsavel?.id === user.id,
      );
    }

    return tasks.filter(
      (task) =>
        task.responsaveis?.some(
          (responsavel) => responsavel.id === selectedResponsibleId,
        ) || task.responsavel?.id === selectedResponsibleId,
    );
  }, [tasks, selectedResponsibleId, user]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const now = new Date();
    let overdue = 0;
    let upcomingWeek = 0;
    const priorities: Record<KanbanTarefa["prioridade"], number> = {
      baixa: 0,
      media: 0,
      alta: 0,
      critica: 0,
    };

    tasks.forEach((task) => {
      priorities[task.prioridade] = (priorities[task.prioridade] ?? 0) + 1;

      if (task.prazo) {
        const dueDate = new Date(task.prazo);
        if (!Number.isNaN(dueDate.getTime())) {
          if (dueDate < now) {
            overdue += 1;
          } else {
            const diffMs = dueDate.getTime() - now.getTime();
            if (diffMs <= 7 * 24 * 60 * 60 * 1000) {
              upcomingWeek += 1;
            }
          }
        }
      }
    });

    return { total, overdue, upcomingWeek, priorities };
  }, [tasks]);

  const handleProjectChange = useCallback(
    (value: string) => {
      const parsed = Number(value);
      setSelectedProjectId(Number.isNaN(parsed) ? null : parsed);
    },
    [setSelectedProjectId],
  );

  const handleResponsibleChange = useCallback((value: string) => {
    if (value === "all" || value === "mine") {
      setSelectedResponsibleId(value);
      return;
    }

    const parsed = Number(value);
    setSelectedResponsibleId(Number.isNaN(parsed) ? "all" : parsed);
  }, []);

  const handleTaskClick = useCallback(
    (tarefa: KanbanTarefa) => {
      if (!selectedProjectId) return;
      const boardTask = tarefa as BoardTask;
      const columnId = boardTask.colunaId ?? boardTask.coluna_id;
      const coluna = columns.find((item) => item.id === columnId);

      setDetailTask(buildDomainTask(boardTask, selectedProjectId, coluna));
      setIsDetailOpen(true);
    },
    [columns, selectedProjectId],
  );

  const normalizeText = useCallback(
    (value: string) =>
      value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim(),
    [],
  );

  const todoColumnId = useMemo(() => {
    const todo = columns.find((coluna) => {
      const name = normalizeText(coluna.nome ?? "");
      return (
        name === "a fazer" || name === "afazer" || name.startsWith("a fazer ")
      );
    });
    return todo?.id ?? null;
  }, [columns, normalizeText]);

  const progressColumnId = useMemo(() => {
    const progress = columns.find((coluna) => {
      const name = normalizeText(coluna.nome ?? "");
      return (
        name === "em progresso" ||
        name === "progresso" ||
        name.startsWith("em progresso ") ||
        name.includes("progresso")
      );
    });
    return progress?.id ?? null;
  }, [columns, normalizeText]);

  const canStartSelectedTask = useMemo(() => {
    if (!detailTask) return false;
    if (!todoColumnId || !progressColumnId) return false;
    return detailTask.colunaId === todoColumnId;
  }, [detailTask, progressColumnId, todoColumnId]);

  const handleStartTask = useCallback(async () => {
    if (!detailTask || !progressColumnId || !selectedProjectId) return;

    const sourceColunaId = detailTask.colunaId;
    if (!sourceColunaId) return;

    const newOrder = tasks.filter(
      (task) => (task.colunaId ?? task.coluna_id) === progressColumnId,
    ).length;
    await handleMoveTask(
      detailTask.id,
      sourceColunaId,
      progressColumnId,
      newOrder,
    );

    setDetailTask((prev) =>
      prev
        ? {
            ...prev,
            colunaId: progressColumnId,
            coluna_id: progressColumnId,
          }
        : prev,
    );
    toast.success("Tarefa iniciada");
  }, [detailTask, handleMoveTask, progressColumnId, selectedProjectId, tasks]);

  const showInitialBoardLoading =
    (loadingProjects && !hasProjectsLoaded) ||
    (loadingBoard && !hasBoardContent);
  const boardLoading = loadingBoard || loadingProjects;
  const boardRefreshing =
    (loadingProjects && hasProjectsLoaded) || (loadingBoard && hasBoardContent);
  const disableActions = boardLoading || isMutating;

  const projetoResumo: KanbanProjeto = projectDetails
    ? {
        id: projectDetails.id,
        nome: projectDetails.nome,
        descricao: projectDetails.descricao ?? "",
        cor: projectDetails.cor,
        data_criacao:
          projectDetails.createdAt ?? projectDetails.data_criacao ?? "",
        data_atualizacao:
          projectDetails.updatedAt ?? projectDetails.data_atualizacao ?? "",
        membros: projectDetails.membros,
      }
    : {
        id: 0,
        nome: "Projeto",
        descricao: "",
        cor: "#3B82F6",
        data_criacao: "",
        data_atualizacao: "",
      };

  return (
    <div className="relative space-y-6">
      {/* Radial gradient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Quadro de Tarefas
            </h1>
            <p className="mt-1 text-muted-foreground">
              Organize e acompanhe as atividades da equipe em tempo real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/tarefas/nova")}
              disabled={disableActions || !selectedProjectId}
              size="sm"
              className="border-border/60 bg-background/70 backdrop-blur"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova tarefa
            </Button>
            <Button
              variant="outline"
              onClick={handleAddColumn}
              disabled={disableActions || !selectedProjectId}
              size="sm"
              className="border-border/60 bg-background/70 backdrop-blur"
            >
              <Columns className="h-4 w-4 mr-2" />
              Nova coluna
            </Button>
            <div className="flex items-center rounded-full border border-border/60 bg-background/70 px-1 backdrop-blur">
              <Button
                type="button"
                variant={boardDensity === "comfortable" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setBoardDensity("comfortable")}
                className="rounded-full px-3"
              >
                Confortável
              </Button>
              <Button
                type="button"
                variant={boardDensity === "compact" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setBoardDensity("compact")}
                className="rounded-full px-3"
              >
                Compacto
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={boardLoading}
              size="sm"
            >
              {boardLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="warning" className="border-red-500/20 bg-red-500/10">
          <AlertTitle>Algo deu errado</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters card */}
      <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
        <CardContent className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedProjectId?.toString() ?? ""}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    {projeto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(selectedResponsibleId)}
              onValueChange={handleResponsibleChange}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                <SelectItem value="mine">Minhas tarefas</SelectItem>
                {responsibleOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {boardRefreshing && projects.length ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sincronizando quadro
              </span>
            ) : null}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {responsibleOptions.length} responsável(is)
            </div>
            <Badge variant="secondary">{tasks.length} tarefa(s)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Total de tarefas
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Atrasadas
            </p>
            <p className="text-2xl font-semibold text-red-600">
              {stats.overdue}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Próximos 7 dias
            </p>
            <p className="text-2xl font-semibold text-blue-600">
              {stats.upcomingWeek}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/60 p-4 space-y-1 text-xs text-muted-foreground backdrop-blur">
            <p className="font-semibold text-foreground">Por prioridade</p>
            <p>
              Crítica:{" "}
              <span className="font-medium text-red-600">
                {stats.priorities.critica}
              </span>
            </p>
            <p>
              Alta:{" "}
              <span className="font-medium text-orange-600">
                {stats.priorities.alta}
              </span>
            </p>
            <p>
              Média:{" "}
              <span className="font-medium text-yellow-600">
                {stats.priorities.media}
              </span>
            </p>
            <p>
              Baixa:{" "}
              <span className="font-medium text-green-600">
                {stats.priorities.baixa}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Board area */}
      {showInitialBoardLoading ? (
        <div className="min-h-[500px] rounded-xl border border-border/60 bg-card/85 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, colIndex) => (
              <div key={colIndex} className="flex-shrink-0 w-80">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <Skeleton
                    variant="text"
                    height={24}
                    width="60%"
                    className="mb-4"
                  />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, cardIndex) => (
                      <SkeletonKanbanCard key={cardIndex} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-border/60 bg-card/85 py-16 text-center shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
          <CardContent>
            <p className="mb-4 text-lg text-muted-foreground">
              Nenhum projeto encontrado.
            </p>
            <Button onClick={() => navigate("/projetos")} className="gap-2">
              <Columns className="h-4 w-4" />
              Criar primeiro projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="min-h-[500px] rounded-xl border border-border/60 bg-card/85 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
          <KanbanBoard
            projeto={projetoResumo}
            colunas={columns}
            tarefas={boardTasks}
            onMoveTask={handleMoveTask}
            onReorderTasks={handleReorderTasks}
            onAddColumn={handleAddColumn}
            onEditColumn={handleEditColumn}
            onDeleteColumn={(colunaId) => {
              const coluna = columns.find((item) => item.id === colunaId);
              handleDeleteColumn(colunaId, coluna?.nome ?? "Coluna");
            }}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
            onTaskEdit={(tarefa) => handleTaskEdit(tarefa.id, tarefa.criadorId)}
            onTaskDelete={(taskId) => {
              const task = tasks.find((item) => item.id === taskId);
              handleTaskDelete(taskId, task?.titulo ?? "Tarefa");
            }}
            onProjectSettings={handleProjectSettings}
            loading={boardLoading || isMutating}
            density={boardDensity}
          />
        </div>
      )}

      {/* Enhanced Confirm Dialogs */}
      <EnhancedConfirmDialog
        isOpen={deleteColumn !== null}
        onClose={() => setDeleteColumn(null)}
        onConfirm={handleConfirmDeleteColumn}
        title="Excluir coluna"
        description={`Tem certeza que deseja excluir a coluna "${deleteColumn?.nome}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta coluna permanentemente"
        warningList={[
          "Certifique-se de que não há tarefas importantes nela",
          "Esta ação não pode ser desfeita",
          "Todas as tarefas da coluna podem ser perdidas",
        ]}
      />

      <EnhancedConfirmDialog
        isOpen={deleteTask !== null}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${deleteTask?.titulo}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta tarefa permanentemente"
        warningList={[
          "Esta ação não pode ser desfeita",
          "Todos os dados da tarefa serão perdidos",
        ]}
      />

      <TaskDetailModal
        open={isDetailOpen}
        task={detailTask}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailTask(null);
        }}
        onRefresh={async () => {
          if (selectedProjectId) {
            await loadBoardData(selectedProjectId, { silent: true });
          }
        }}
        onOpenTask={(taskId) => navigate(`/tarefas/${taskId}`)}
        openTaskLabel="Abrir página"
        canStartTask={canStartSelectedTask}
        onStartTask={handleStartTask}
      />

      {/* Column name dialog (add / rename) */}
      <Dialog
        open={columnDialog.open}
        onOpenChange={(open) => {
          if (!open) setColumnDialog((prev) => ({ ...prev, open: false }));
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {columnDialog.mode === "add" ? "Nova Coluna" : "Renomear Coluna"}
            </DialogTitle>
            <DialogDescription>
              {columnDialog.mode === "add"
                ? "Digite o nome da nova coluna."
                : "Altere o nome da coluna."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleColumnDialogConfirm();
            }}
          >
            <Input
              autoFocus
              placeholder="Nome da coluna"
              value={columnDialogName}
              onChange={(e) => setColumnDialogName(e.target.value)}
              className="mb-4"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setColumnDialog((prev) => ({ ...prev, open: false }))
                }
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!columnDialogName.trim()}>
                {columnDialog.mode === "add" ? "Criar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TarefasPage;
