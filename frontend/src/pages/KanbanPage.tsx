import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KanbanBoard, Projeto, Coluna, Tarefa } from '../components/kanban';
import { useKanban } from '../hooks/useKanban';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { EnhancedConfirmDialog } from '../components/ui/EnhancedConfirmDialog';
import { ArrowLeft, Settings, Users, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

// Modais (serão criados posteriormente)
const CreateProjectModal = ({ isOpen, onClose, onSuccess }: any) => null;
const EditProjectModal = ({ isOpen, onClose, project, onSuccess }: any) => null;
const CreateColumnModal = ({ isOpen, onClose, projectId, onSuccess }: any) => null;
const EditColumnModal = ({ isOpen, onClose, column, onSuccess }: any) => null;
const CreateTaskModal = ({ isOpen, onClose, columnId, onSuccess }: any) => null;
const EditTaskModal = ({ isOpen, onClose, task, onSuccess }: any) => null;
const TaskDetailModal = ({ isOpen, onClose, task }: any) => null;
const ProjectSettingsModal = ({ isOpen, onClose, project, onSuccess }: any) => null;

interface KanbanPageProps {
  // Para quando usado como componente independente
  projectId?: number;
}

const KanbanPage: React.FC<KanbanPageProps> = ({ projectId: propProjectId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  
  // Usar projectId do prop ou da URL
  const projectId = propProjectId || (id ? parseInt(id, 10) : null);
  
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
  });
  
  // Estados para dados selecionados
  const [selectedColumn, setSelectedColumn] = useState<Coluna | null>(null);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);

  // Estados para confirmação de exclusão
  const [deleteColumn, setDeleteColumn] = useState<{ id: number; nome: string } | null>(null);
  const [deleteTask, setDeleteTask] = useState<{ id: number; titulo: string } | null>(null);

  // Hook do Kanban
  const kanban = useKanban({ projetoId: projectId! });

  // Verificar se projectId é válido
  useEffect(() => {
    if (!projectId) {
      toast.error('ID do projeto não encontrado');
      navigate('/projetos');
    }
  }, [projectId, navigate]);

  // Handlers dos modais
  const openModal = (modalName: keyof typeof modals, data?: any) => {
    if (modalName === 'editColumn' && data) setSelectedColumn(data);
    if (modalName === 'editTask' && data) setSelectedTask(data);
    if (modalName === 'createTask' && data) setSelectedColumnId(data);
    
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    
    // Limpar dados selecionados
    if (modalName === 'editColumn') setSelectedColumn(null);
    if (modalName === 'editTask') setSelectedTask(null);
    if (modalName === 'createTask') setSelectedColumnId(null);
  };

  // Handlers do Kanban
  const handleMoveTask = async (tarefaId: number, sourceColunaId: number, targetColunaId: number, newOrder: number) => {
    try {
      await kanban.moveTarefa(tarefaId, sourceColunaId, targetColunaId, newOrder);
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
    }
  };

  const handleReorderTasks = async (colunaId: number, tarefaIds: number[]) => {
    try {
      await kanban.reorderTarefas(colunaId, tarefaIds);
    } catch (error) {
      console.error('Erro ao reordenar tarefas:', error);
    }
  };

  const handleAddColumn = () => {
    openModal('createColumn');
  };

  const handleEditColumn = (coluna: Coluna) => {
    openModal('editColumn', coluna);
  };

  const handleDeleteColumn = (colunaId: number, colunaNome: string) => {
    setDeleteColumn({ id: colunaId, nome: colunaNome });
  };

  const handleConfirmDeleteColumn = async () => {
    if (!deleteColumn) return;
    try {
      await kanban.deleteColuna(deleteColumn.id);
      toast.success('Coluna excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      toast.error('Erro ao excluir coluna');
    } finally {
      setDeleteColumn(null);
    }
  };

  const handleAddTask = (colunaId: number) => {
    if (!checkPermission('create', 'tarefas')) {
      toast.error('Você não tem permissão para criar tarefas');
      return;
    }
    openModal('createTask', colunaId);
  };

  const handleTaskClick = (tarefa: Tarefa) => {
    openModal('taskDetail', tarefa);
  };

  const handleTaskEdit = (tarefa: Tarefa) => {
    if (!checkPermission('update', 'tarefas')) {
      toast.error('Você não tem permissão para editar tarefas');
      return;
    }
    // Usuários comuns só podem editar suas próprias tarefas
    if (user?.role?.name === 'usuario' && tarefa.criado_por_id !== user.id) {
      toast.error('Você só pode editar suas próprias tarefas');
      return;
    }
    openModal('editTask', tarefa);
  };

  const handleTaskDelete = (tarefaId: number, tarefaTitulo: string) => {
    const tarefa = kanban.tarefas.find(t => t.id === tarefaId);
    if (!tarefa) return;

    if (!checkPermission('delete', 'tarefas')) {
      toast.error('Você não tem permissão para excluir tarefas');
      return;
    }
    // Usuários comuns só podem excluir suas próprias tarefas
    if (user?.role?.name === 'usuario' && tarefa.criado_por_id !== user.id) {
      toast.error('Você só pode excluir suas próprias tarefas');
      return;
    }

    setDeleteTask({ id: tarefaId, titulo: tarefaTitulo });
  };

  const handleConfirmDeleteTask = async () => {
    if (!deleteTask) return;
    try {
      await kanban.deleteTarefa(deleteTask.id);
      toast.success('Tarefa excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    } finally {
      setDeleteTask(null);
    }
  };

  const handleProjectSettings = () => {
    openModal('projectSettings');
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
            <Button variant="outline" onClick={() => navigate('/projetos')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
            <Button onClick={kanban.refresh}>
              Tentar Novamente
            </Button>
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
          <p>O projeto solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/projetos')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header da página */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projetos')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Projetos
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center gap-3">
              {kanban.projeto.cor && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: kanban.projeto.cor }}
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {kanban.projeto.nome}
                </h1>
                {kanban.projeto.descricao && (
                  <p className="text-sm text-gray-600">
                    {kanban.projeto.descricao}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {kanban.tarefas.length} tarefa(s)
            </Badge>
            <Badge variant="outline">
              {kanban.colunas.length} coluna(s)
            </Badge>
            
            <div className="h-6 w-px bg-gray-300 mx-2" />
            
            <Button variant="ghost" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              Membros
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Relatórios
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProjectSettings}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          projeto={kanban.projeto}
          colunas={kanban.colunas}
          tarefas={kanban.tarefas}
          onMoveTask={handleMoveTask}
          onReorderTasks={handleReorderTasks}
          onAddColumn={handleAddColumn}
          onEditColumn={handleEditColumn}
          onDeleteColumn={handleDeleteColumn}
          onAddTask={handleAddTask}
          onTaskClick={handleTaskClick}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          onProjectSettings={handleProjectSettings}
          loading={kanban.loading}
        />
      </div>

      {/* Modais - serão implementados posteriormente */}
      <CreateProjectModal
        isOpen={modals.createProject}
        onClose={() => closeModal('createProject')}
        onSuccess={kanban.refresh}
      />
      
      <EditProjectModal
        isOpen={modals.editProject}
        onClose={() => closeModal('editProject')}
        project={kanban.projeto}
        onSuccess={kanban.refresh}
      />
      
      <CreateColumnModal
        isOpen={modals.createColumn}
        onClose={() => closeModal('createColumn')}
        projectId={projectId!}
        onSuccess={kanban.refresh}
      />
      
      <EditColumnModal
        isOpen={modals.editColumn}
        onClose={() => closeModal('editColumn')}
        column={selectedColumn}
        onSuccess={kanban.refresh}
      />
      
      <CreateTaskModal
        isOpen={modals.createTask}
        onClose={() => closeModal('createTask')}
        columnId={selectedColumnId}
        onSuccess={kanban.refresh}
      />
      
      <EditTaskModal
        isOpen={modals.editTask}
        onClose={() => closeModal('editTask')}
        task={selectedTask}
        onSuccess={kanban.refresh}
      />
      
      <TaskDetailModal
        isOpen={modals.taskDetail}
        onClose={() => closeModal('taskDetail')}
        task={selectedTask}
      />
      
      <ProjectSettingsModal
        isOpen={modals.projectSettings}
        onClose={() => closeModal('projectSettings')}
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
          'Esta ação não pode ser desfeita',
          'Todas as tarefas da coluna podem ser perdidas',
          'O histórico da coluna será apagado'
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
          'Esta ação não pode ser desfeita',
          'Todos os dados da tarefa serão perdidos',
          'O histórico da tarefa será apagado'
        ]}
      />
    </div>
  );
};

export default KanbanPage;