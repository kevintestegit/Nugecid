import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  KanbanBoard,
  Projeto,
  Coluna,
  Tarefa,
  TaskDetailModal,
  ProjectMembersModal,
  CreateProjectModal,
  EditProjectModal,
  CreateColumnModal,
  EditColumnModal,
  CreateTaskModal,
  EditTaskModal,
  ProjectSettingsModal,
} from "../components/kanban";
import { useKanban } from "../hooks/useKanban";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Loading } from "../components/ui/Loading";
import { Alert } from "../components/ui/Alert";
import { EnhancedConfirmDialog } from "../components/ui/EnhancedConfirmDialog";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface KanbanPageProps {
  // Para quando usado como componente independente
  projectId?: number;
}

interface KanbanPageContentProps {
  projectId: number;
}

const KanbanPageContent: React.FC<KanbanPageContentProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();

  // Estados dos modais
  const [modals, setModals] = useState({
    createProject: false,
    editProject: false,
    createColumn: false,
    editColumn: false,
    createTask: false,
    editTask: false,
    taskDetail: false,
    projectSettings: false,
    projectMembers: false,
  });

  // Estados para dados selecionados
  const [selectedColumn, setSelectedColumn] = useState<Coluna | null>(null);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);

  // Estados para confirmação de exclusão
  const [deleteColumn, setDeleteColumn] = useState<{
    id: number;
    nome: string;
  } | null>(null);
  const [deleteTask, setDeleteTask] = useState<{
    id: number;
    titulo: string;
  } | null>(null);

  // Hook do Kanban
  const kanban = useKanban({ projetoId: projectId });

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

  const todoColumnId = useMemo(() => {
    const colunas = Array.isArray(kanban.colunas) ? kanban.colunas : [];
    const todo = colunas.find((coluna) => {
      const name = normalizeText(coluna.nome ?? "");
      return (
        name === "a fazer" || name === "afazer" || name.startsWith("a fazer ")
      );
    });
    return todo?.id ?? null;
  }, [kanban.colunas]);

  const progressColumnId = useMemo(() => {
    const colunas = Array.isArray(kanban.colunas) ? kanban.colunas : [];
    const progress = colunas.find((coluna) => {
      const name = normalizeText(coluna.nome ?? "");
      return (
        name === "em progresso" ||
        name === "progresso" ||
        name.startsWith("em progresso ") ||
        name.includes("progresso")
      );
    });
    return progress?.id ?? null;
  }, [kanban.colunas]);

  const canStartSelectedTask = useMemo(() => {
    if (!selectedTask) return false;
    if (!todoColumnId || !progressColumnId) return false;
    const taskColunaId =
      (selectedTask as unknown as { coluna_id?: number }).coluna_id ??
      selectedTask.colunaId;
    return taskColunaId === todoColumnId;
  }, [selectedTask, todoColumnId, progressColumnId]);

  const handleStartTask = async (task: Tarefa) => {
    if (!progressColumnId) {
      toast.error('Coluna "Em Progresso" não encontrada');
      return;
    }

    const sourceColunaId =
      (task as unknown as { coluna_id?: number }).coluna_id ?? task.colunaId;
    if (!sourceColunaId) return;

    const newOrder = kanban.tarefas.filter((t) => {
      const colunaId =
        (t as unknown as { coluna_id?: number }).coluna_id ?? t.colunaId;
      return colunaId === progressColumnId;
    }).length;

    await handleMoveTask(task.id, sourceColunaId, progressColumnId, newOrder);
    setSelectedTask((prev) =>
      prev
        ? ({
            ...prev,
            colunaId: progressColumnId,
            coluna_id: progressColumnId,
          } as Tarefa)
        : prev,
    );
    toast.success("Tarefa iniciada");
  };

  // Handlers dos modais
  const openModal = (
    modalName: keyof typeof modals,
    data?: Coluna | Tarefa | number,
  ) => {
    if (modalName === "editColumn" && data) setSelectedColumn(data as Coluna);
    if (modalName === "editTask" && data) setSelectedTask(data as Tarefa);
    if (modalName === "createTask" && data) setSelectedColumnId(data as number);

    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));

    // Limpar dados selecionados
    if (modalName === "editColumn") setSelectedColumn(null);
    if (modalName === "editTask") setSelectedTask(null);
    if (modalName === "createTask") setSelectedColumnId(null);
  };

  // Handlers do Kanban
  const handleMoveTask = async (
    tarefaId: number,
    sourceColunaId: number,
    targetColunaId: number,
    newOrder: number,
  ) => {
    try {
      await kanban.moveTarefa(
        tarefaId,
        sourceColunaId,
        targetColunaId,
        newOrder,
      );
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    }
  };

  const handleReorderTasks = async (
    colunaId: number,
    tarefaIds: number[],
    movedTaskId?: number,
  ) => {
    try {
      await kanban.reorderTarefas(colunaId, tarefaIds, movedTaskId);
    } catch (error) {
      console.error("Erro ao reordenar tarefas:", error);
    }
  };

  const handleAddColumn = () => {
    openModal("createColumn");
  };

  const handleEditColumn = (coluna: Coluna) => {
    openModal("editColumn", coluna);
  };

  const handleDeleteColumn = (colunaId: number, colunaNome: string) => {
    setDeleteColumn({ id: colunaId, nome: colunaNome });
  };

  const handleConfirmDeleteColumn = async () => {
    if (!deleteColumn) return;
    try {
      await kanban.deleteColuna(deleteColumn.id);
      toast.success("Coluna excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir coluna:", error);
      toast.error("Erro ao excluir coluna");
    } finally {
      setDeleteColumn(null);
    }
  };

  const handleAddTask = (colunaId: number) => {
    if (!checkPermission("create", "tarefas")) {
      toast.error("Você não tem permissão para criar tarefas");
      return;
    }
    openModal("createTask", colunaId);
  };

  const handleTaskClick = (tarefa: Tarefa) => {
    setSelectedTask(tarefa);
    openModal("taskDetail", tarefa);
  };

  const handleTaskEdit = (tarefa: Tarefa) => {
    if (!checkPermission("update", "tarefas")) {
      toast.error("Você não tem permissão para editar tarefas");
      return;
    }
    // Usuários comuns só podem editar suas próprias tarefas
    if (user?.role?.name === "usuario" && tarefa.criadorId !== user.id) {
      toast.error("Você só pode editar suas próprias tarefas");
      return;
    }
    openModal("editTask", tarefa);
  };

  const handleTaskDelete = (tarefaId: number, tarefaTitulo: string) => {
    const tarefa = kanban.tarefas.find((t) => t.id === tarefaId);
    if (!tarefa) return;

    if (!checkPermission("delete", "tarefas")) {
      toast.error("Você não tem permissão para excluir tarefas");
      return;
    }
    // Usuários comuns só podem excluir suas próprias tarefas
    if (user?.role?.name === "usuario" && tarefa.criadorId !== user.id) {
      toast.error("Você só pode excluir suas próprias tarefas");
      return;
    }

    setDeleteTask({ id: tarefaId, titulo: tarefaTitulo });
  };

  const handleConfirmDeleteTask = async () => {
    if (!deleteTask) return;
    try {
      await kanban.deleteTarefa(deleteTask.id);
      toast.success("Tarefa excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast.error("Erro ao excluir tarefa");
    } finally {
      setDeleteTask(null);
    }
  };

  const handleProjectSettings = () => {
    openModal("projectSettings");
  };

  const handleProjectMembers = () => {
    openModal("projectMembers");
  };

  // Loading state
  if (kanban.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  // Error state
  if (kanban.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <h3 className="font-semibold">Erro ao carregar projeto</h3>
          <p>{kanban.error}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => navigate("/projetos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
            <Button onClick={kanban.refresh}>Tentar Novamente</Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Project not found
  if (!kanban.projeto) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <h3 className="font-semibold">Projeto não encontrado</h3>
          <p>
            O projeto solicitado não foi encontrado ou você não tem permissão
            para acessá-lo.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/projetos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-background">
      <KanbanBoard
        projeto={kanban.projeto}
        colunas={kanban.colunas}
        tarefas={kanban.tarefas}
        onMoveTask={handleMoveTask}
        onReorderTasks={handleReorderTasks}
        onAddColumn={handleAddColumn}
        onEditColumn={handleEditColumn}
        onDeleteColumn={(colunaId) => {
          const coluna = kanban.colunas.find((c) => c.id === colunaId);
          handleDeleteColumn(colunaId, coluna?.nome ?? "Coluna");
        }}
        onAddTask={handleAddTask}
        onTaskClick={handleTaskClick}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={(tarefaId) => {
          const tarefa = kanban.tarefas.find((t) => t.id === tarefaId);
          handleTaskDelete(tarefaId, tarefa?.titulo ?? "Tarefa");
        }}
        onProjectSettings={handleProjectSettings}
        onProjectMembers={handleProjectMembers}
        onProjectReports={() =>
          toast.info("Funcionalidade de relatórios em desenvolvimento")
        }
        loading={kanban.loading}
      />

      {/* Modais */}
      <CreateProjectModal
        isOpen={modals.createProject}
        onClose={() => closeModal("createProject")}
        onSuccess={kanban.refresh}
      />

      <EditProjectModal
        isOpen={modals.editProject}
        onClose={() => closeModal("editProject")}
        project={kanban.projeto}
        onSuccess={kanban.refresh}
      />

      <CreateColumnModal
        isOpen={modals.createColumn}
        onClose={() => closeModal("createColumn")}
        projectId={projectId!}
        onSuccess={kanban.refresh}
      />

      <EditColumnModal
        isOpen={modals.editColumn}
        onClose={() => closeModal("editColumn")}
        column={selectedColumn}
        onSuccess={kanban.refresh}
      />

      <CreateTaskModal
        isOpen={modals.createTask}
        onClose={() => closeModal("createTask")}
        columnId={selectedColumnId}
        onSuccess={kanban.refresh}
      />

      <EditTaskModal
        isOpen={modals.editTask}
        onClose={() => closeModal("editTask")}
        task={selectedTask}
        onSuccess={kanban.refresh}
      />

      <TaskDetailModal
        open={modals.taskDetail}
        onClose={() => {
          closeModal("taskDetail");
          setSelectedTask(null);
        }}
        task={selectedTask}
        onRefresh={kanban.refresh}
        canStartTask={canStartSelectedTask}
        onStartTask={handleStartTask}
      />

      <ProjectMembersModal
        open={modals.projectMembers}
        onClose={() => closeModal("projectMembers")}
        projetoId={projectId!}
        initialMembers={
          kanban.projeto?.membros as
            | {
                id: number;
                papel: "admin" | "editor" | "viewer";
                usuario?: import("@/types/kanban.types").Usuario;
              }[]
            | undefined
        }
        onChanged={kanban.refresh}
      />

      <ProjectSettingsModal
        isOpen={modals.projectSettings}
        onClose={() => closeModal("projectSettings")}
        project={kanban.projeto}
        onSuccess={kanban.refresh}
      />

      {/* Diálogos de confirmação */}
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
          "Esta ação não pode ser desfeita",
          "Todas as tarefas da coluna podem ser perdidas",
          "O histórico da coluna será apagado",
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
          "O histórico da tarefa será apagado",
        ]}
      />
    </div>
  );
};

const KanbanPage: React.FC<KanbanPageProps> = ({
  projectId: propProjectId,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const parsedParam = id ? Number(id) : null;
  const resolvedId = propProjectId ?? parsedParam;
  const isValidId =
    typeof resolvedId === "number" &&
    Number.isFinite(resolvedId) &&
    resolvedId > 0;

  if (!isValidId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <h3 className="font-semibold">Projeto inválido</h3>
          <p>O ID do projeto não foi encontrado ou é inválido.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/projetos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return <KanbanPageContent projectId={resolvedId} />;
};

export default KanbanPage;
