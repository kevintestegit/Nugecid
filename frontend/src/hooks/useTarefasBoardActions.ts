import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import tarefasService from "@/services/tarefasService";
import { kanbanService } from "@/services/kanbanService";
import { BoardTask, ProjetoResumo } from "@/hooks/useTarefasBoardData";

type BoardPermissionChecker = (action: string, resource?: string) => boolean;

type UserRoleLike = {
  id: number;
  role?: {
    name?: string | null;
  } | null;
} | null;

type KanbanColumn = {
  id: number;
  nome: string;
};

type ColumnDialogState = {
  open: boolean;
  mode: "add" | "edit";
  columnId?: number;
  initialName: string;
};

interface UseTarefasBoardActionsParams {
  selectedProjectId: number | null;
  tasks: BoardTask[];
  columns: KanbanColumn[];
  projects: ProjetoResumo[];
  user: UserRoleLike;
  checkPermission: BoardPermissionChecker;
  loadBoardData: (
    projectId: number,
    options?: { silent?: boolean },
  ) => Promise<void>;
  loadProjects: (options?: { silent?: boolean }) => Promise<void>;
  hasBoardContent: boolean;
  hasProjectsLoaded: boolean;
}

const isRegularUserWithoutOwnership = (
  user: UserRoleLike,
  taskCreatorId?: number,
) => user?.role?.name === "usuario" && taskCreatorId !== user.id;

export const useTarefasBoardActions = ({
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
}: UseTarefasBoardActionsParams) => {
  const navigate = useNavigate();
  const [isMutating, setIsMutating] = useState(false);
  const [deleteColumn, setDeleteColumn] = useState<{
    id: number;
    nome: string;
  } | null>(null);
  const [deleteTask, setDeleteTask] = useState<{
    id: number;
    titulo: string;
  } | null>(null);
  const [columnDialog, setColumnDialog] = useState<ColumnDialogState>({
    open: false,
    mode: "add",
    initialName: "",
  });
  const [columnDialogName, setColumnDialogName] = useState("");

  const handleMoveTask = useCallback(
    async (
      taskId: number,
      _sourceColumnId: number,
      targetColumnId: number,
      targetIndex: number,
    ) => {
      if (!selectedProjectId) return;

      setIsMutating(true);

      try {
        const tarefa = tasks.find((item) => item.id === taskId);
        if (!checkPermission("update", "tarefas")) {
          toast.error("Você não tem permissão para mover tarefas.");
          return;
        }
        if (isRegularUserWithoutOwnership(user, tarefa?.criadorId)) {
          toast.error("Você só pode mover suas próprias tarefas.");
          return;
        }

        await tarefasService.moveTarefa(taskId, {
          colunaId: targetColumnId,
          ordem: targetIndex + 1,
        });

        await loadBoardData(selectedProjectId, { silent: true });
        toast.success("Tarefa movida com sucesso!");
      } catch {
        toast.error("Não foi possível mover a tarefa.");
        await loadBoardData(selectedProjectId, { silent: true });
      } finally {
        setIsMutating(false);
      }
    },
    [checkPermission, loadBoardData, selectedProjectId, tasks, user],
  );

  const handleReorderTasks = useCallback(
    async (colunaId: number, orderedIds: number[], movedTaskId?: number) => {
      if (!selectedProjectId || movedTaskId === undefined) return;
      const newIndex = orderedIds.findIndex((id) => id === movedTaskId);
      if (newIndex === -1) return;

      setIsMutating(true);

      try {
        const tarefa = tasks.find((item) => item.id === movedTaskId);
        if (!checkPermission("update", "tarefas")) {
          toast.error("Você não tem permissão para reordenar tarefas.");
          return;
        }
        if (isRegularUserWithoutOwnership(user, tarefa?.criadorId)) {
          toast.error("Você só pode reordenar suas próprias tarefas.");
          return;
        }

        await tarefasService.moveTarefa(movedTaskId, {
          colunaId,
          ordem: newIndex + 1,
        });

        await loadBoardData(selectedProjectId, { silent: true });
      } catch (error) {
        console.error("Erro ao reordenar tarefas:", error);
        toast.error("Não foi possível reordenar as tarefas.");
        await loadBoardData(selectedProjectId, { silent: true });
      } finally {
        setIsMutating(false);
      }
    },
    [checkPermission, loadBoardData, selectedProjectId, tasks, user],
  );

  const handleAddColumn = useCallback(async () => {
    if (!selectedProjectId) return;
    setColumnDialog({ open: true, mode: "add", initialName: "" });
    setColumnDialogName("");
  }, [selectedProjectId]);

  const handleEditColumn = useCallback(
    async (coluna: KanbanColumn) => {
      if (!selectedProjectId) return;
      setColumnDialog({
        open: true,
        mode: "edit",
        columnId: coluna.id,
        initialName: coluna.nome,
      });
      setColumnDialogName(coluna.nome);
    },
    [selectedProjectId],
  );

  const handleColumnDialogConfirm = useCallback(async () => {
    const nome = columnDialogName.trim();
    if (!nome || !selectedProjectId) return;

    setColumnDialog((prev) => ({ ...prev, open: false }));
    setIsMutating(true);

    try {
      if (columnDialog.mode === "add") {
        await kanbanService.createColuna({
          projetoId: selectedProjectId,
          nome,
          ordem: columns.length + 1,
        });
        toast.success("Coluna criada com sucesso!");
      } else if (columnDialog.columnId) {
        if (nome === columnDialog.initialName) return;
        await kanbanService.updateColuna(columnDialog.columnId, { nome });
        toast.success("Coluna atualizada com sucesso!");
      }
      await loadBoardData(selectedProjectId, { silent: true });
    } catch (error) {
      console.error(
        columnDialog.mode === "add"
          ? "Erro ao criar coluna:"
          : "Erro ao atualizar coluna:",
        error,
      );
      toast.error(
        columnDialog.mode === "add"
          ? "Não foi possível criar a coluna."
          : "Não foi possível atualizar a coluna.",
      );
    } finally {
      setIsMutating(false);
    }
  }, [
    columnDialog,
    columnDialogName,
    columns.length,
    loadBoardData,
    selectedProjectId,
  ]);

  const handleDeleteColumn = useCallback(
    (colunaId: number, colunaNome: string) => {
      setDeleteColumn({ id: colunaId, nome: colunaNome });
    },
    [],
  );

  const handleConfirmDeleteColumn = useCallback(async () => {
    if (!selectedProjectId || !deleteColumn) return;

    setIsMutating(true);
    try {
      await kanbanService.deleteColuna(deleteColumn.id);
      toast.success("Coluna excluída com sucesso!");
      await loadBoardData(selectedProjectId, { silent: true });
    } catch (error) {
      console.error("Erro ao excluir coluna:", error);
      toast.error("Não foi possível excluir a coluna.");
      await loadBoardData(selectedProjectId, { silent: true });
    } finally {
      setIsMutating(false);
      setDeleteColumn(null);
    }
  }, [deleteColumn, loadBoardData, selectedProjectId]);

  const handleAddTask = useCallback(
    (colunaId?: number) => {
      if (!selectedProjectId) {
        toast.error("Selecione um projeto para criar tarefas.");
        return;
      }
      if (!checkPermission("create", "tarefas")) {
        toast.error("Você não tem permissão para criar tarefas");
        return;
      }

      navigate("/tarefas/nova", {
        state: {
          projetoId: selectedProjectId,
          colunaId: colunaId ?? null,
        },
      });
    },
    [checkPermission, navigate, selectedProjectId],
  );

  const handleTaskEdit = useCallback(
    (taskId: number, taskCreatorId?: number) => {
      if (!checkPermission("update", "tarefas")) {
        toast.error("Você não tem permissão para editar tarefas");
        return;
      }
      if (isRegularUserWithoutOwnership(user, taskCreatorId)) {
        toast.error("Você só pode editar suas próprias tarefas");
        return;
      }
      navigate(`/tarefas/${taskId}`);
    },
    [checkPermission, navigate, user],
  );

  const handleTaskDelete = useCallback(
    (taskId: number, taskTitulo: string) => {
      const tarefa = tasks.find((item) => item.id === taskId);
      if (!tarefa) return;

      if (!checkPermission("delete", "tarefas")) {
        toast.error("Você não tem permissão para excluir tarefas");
        return;
      }
      if (isRegularUserWithoutOwnership(user, tarefa.criadorId)) {
        toast.error("Você só pode excluir suas próprias tarefas");
        return;
      }

      setDeleteTask({ id: taskId, titulo: taskTitulo });
    },
    [checkPermission, tasks, user],
  );

  const handleConfirmDeleteTask = useCallback(async () => {
    if (!selectedProjectId || !deleteTask) return;

    setIsMutating(true);
    try {
      await tarefasService.deleteTarefa(deleteTask.id);
      toast.success("Tarefa removida com sucesso!");
      await loadBoardData(selectedProjectId, { silent: true });
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast.error("Não foi possível excluir a tarefa.");
      await loadBoardData(selectedProjectId, { silent: true });
    } finally {
      setIsMutating(false);
      setDeleteTask(null);
    }
  }, [deleteTask, loadBoardData, selectedProjectId]);

  const handleRefresh = useCallback(() => {
    if (selectedProjectId) {
      void loadBoardData(selectedProjectId, { silent: hasBoardContent });
    } else {
      void loadProjects({ silent: hasProjectsLoaded });
    }
  }, [
    hasBoardContent,
    hasProjectsLoaded,
    loadBoardData,
    loadProjects,
    selectedProjectId,
  ]);

  const handleProjectSettings = useCallback(() => {
    navigate("/projetos");
  }, [navigate]);

  return {
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
    hasProjects: projects.length > 0,
  };
};
