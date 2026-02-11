import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/AlertDialog';
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog';
import { ProjectCard } from '../components/kanban/ProjectCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Plus,
  Star,
  Archive,
  Filter,
  Loader2
} from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { kanbanService } from '../services/kanbanService';
import { toast } from 'sonner';

interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  ativo: boolean;
  favorito?: boolean;
  total_tarefas?: number;
  total_membros?: number;
  progresso?: number;
}

interface ProjetosPageState {
  projetos: Projeto[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterStatus: 'todos' | 'ativos' | 'arquivados' | 'favoritos';
}

interface ProjectFormValues {
  nome: string;
  descricao?: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const ProjetosPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkPermission, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<ProjetosPageState>({
    projetos: [],
    loading: true,
    error: null,
    searchTerm: '',
    filterStatus: 'todos'
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [deleteProject, setDeleteProject] = useState<Projeto | null>(null);
  const [archiveProject, setArchiveProject] = useState<Projeto | null>(null);

  // Carregar projetos
  type ProjetoApi = Projeto & {
    created_at?: string;
    updated_at?: string;
    createdAt?: string;
    updatedAt?: string;
    data_criacao?: string;
    data_atualizacao?: string;
    ativo?: boolean;
    favorito?: boolean;
  };

  const loadProjetos = useCallback(async () => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, projetos: [], loading: false, error: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await kanbanService.getProjetos();
      const projetos = Array.isArray(response) ? (response as unknown as ProjetoApi[]) : [];
      const normalized = projetos.map((p) => ({
        ...p,
        data_criacao: p.data_criacao || p.created_at || p.createdAt || undefined,
        data_atualizacao: p.data_atualizacao || p.updated_at || p.updatedAt || undefined,
        ativo: p.ativo !== undefined ? p.ativo : true,
      }));

      setState(prev => ({
        ...prev,
        projetos: normalized,
        loading: false
      }));
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setState(prev => ({
        ...prev,
        error: getApiErrorMessage(error, 'Erro ao carregar projetos'),
        loading: false
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProjetos();
  }, [loadProjetos]);

  // Filtrar projetos
  const filteredProjetos = state.projetos.filter(projeto => {
    const matchesSearch = projeto.nome.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         (projeto.descricao?.toLowerCase().includes(state.searchTerm.toLowerCase()) || false);
    
    const matchesFilter = (() => {
      switch (state.filterStatus) {
        case 'ativos':
          return projeto.ativo;
        case 'arquivados':
          return !projeto.ativo;
        case 'favoritos':
          return projeto.favorito;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  });

  // Handlers
  const handleCreateProject = () => {
    if (!checkPermission('create', 'projetos')) {
      toast.error('Você não tem permissão para criar projetos');
      return;
    }
    setShowCreateModal(true);
  };

  const handleEditProject = (projeto: Projeto) => {
    if (!checkPermission('update', 'projetos')) {
      toast.error('Você não tem permissão para editar projetos');
      return;
    }
    setSelectedProject(projeto);
    setShowEditModal(true);
  };

  const handleCreateProjectSubmit = async (values: ProjectFormValues) => {
    setIsCreatingProject(true);
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() || undefined,
      };
      await kanbanService.createProjeto(payload);
      toast.success('Projeto criado com sucesso');
      setShowCreateModal(false);
      await loadProjetos();
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error(getApiErrorMessage(error, 'Erro ao criar projeto'));
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleUpdateProjectSubmit = async (values: ProjectFormValues) => {
    if (!selectedProject) {
      return;
    }
    setIsUpdatingProject(true);
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() || undefined,
      };
      await kanbanService.updateProjeto(selectedProject.id, payload);
      toast.success('Projeto atualizado com sucesso');
      setShowEditModal(false);
      setSelectedProject(null);
      await loadProjetos();
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error(getApiErrorMessage(error, 'Erro ao atualizar projeto'));
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProject(null);
  };
  const handleDeleteProject = (projeto: Projeto) => {
    if (!checkPermission('delete', 'projetos')) {
      toast.error('Você não tem permissão para excluir projetos');
      return;
    }
    setDeleteProject(projeto);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProject) return;

    try {
      await kanbanService.deleteProjeto(deleteProject.id);
      toast.success('Projeto excluído com sucesso');
      setDeleteProject(null);
      loadProjetos();
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast.error(getApiErrorMessage(error, 'Erro ao excluir projeto'));
    }
  };

  const handleToggleFavorite = async (projeto: Projeto) => {
    try {
      // Implementar toggle favorito quando a API estiver disponível
      toast.info('Funcionalidade em desenvolvimento');
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      toast.error(getApiErrorMessage(error, 'Erro ao alterar favorito'));
    }
  };

  const handleArchiveProject = (projeto: Projeto) => {
    setArchiveProject(projeto);
  };

  const handleConfirmArchive = async () => {
    if (!archiveProject) return;

    try {
      // Implementar arquivamento quando a API estiver disponível
      toast.info('Funcionalidade em desenvolvimento');
      setArchiveProject(null);
    } catch (error) {
      console.error('Erro ao arquivar projeto:', error);
      toast.error(getApiErrorMessage(error, 'Erro ao arquivar projeto'));
    }
  };

  const handleOpenProject = (projeto: Projeto) => {
    navigate(`/projetos/${projeto.id}`);
  };

  const handleOpenBoard = (projeto: Projeto) => {
    navigate(`/kanban/${projeto.id}`);
  };

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} showImage={false} lines={4} />
          ))}
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <h3 className="font-semibold">Erro ao carregar projetos</h3>
          <p>{state.error}</p>
          <div className="mt-4">
            <Button onClick={loadProjetos}>
              Tentar Novamente
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        title="Projetos"
        description="Gerencie seus projetos Kanban e acompanhe o progresso"
        breadcrumb={[{ label: 'Workspace' }, { label: 'Projetos' }]}
        actions={(
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </Button>
        )}
        className="mb-8"
      />

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar projetos..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={state.filterStatus === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, filterStatus: 'todos' }))}
            className="rounded-full"
          >
            Todos
          </Button>
          <Button
            variant={state.filterStatus === 'ativos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, filterStatus: 'ativos' }))}
            className="rounded-full"
          >
            Ativos
          </Button>
          <Button
            variant={state.filterStatus === 'favoritos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, filterStatus: 'favoritos' }))}
            className="rounded-full"
          >
            <Star className="w-4 h-4 mr-1" />
            Favoritos
          </Button>
          <Button
            variant={state.filterStatus === 'arquivados' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, filterStatus: 'arquivados' }))}
            className="rounded-full"
          >
            <Archive className="w-4 h-4 mr-1" />
            Arquivados
          </Button>
        </div>
      </div>

      {/* Lista de Projetos */}
      {filteredProjetos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/70 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="text-gray-400 mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {state.searchTerm || state.filterStatus !== 'todos' 
              ? 'Nenhum projeto encontrado' 
              : 'Comece sua jornada'
            }
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {state.searchTerm || state.filterStatus !== 'todos'
              ? 'Não encontramos projetos com os filtros atuais. Tente buscar por outro termo.'
              : 'Crie seu primeiro projeto para organizar tarefas e colaborar com sua equipe.'
            }
          </p>
          {(!state.searchTerm && state.filterStatus === 'todos') && (
            <Button onClick={handleCreateProject} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Projeto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjetos.map((projeto) => (
            <ProjectCard
              key={projeto.id}
              projeto={projeto}
              onClick={() => handleOpenProject(projeto)}
              onEdit={() => handleEditProject(projeto)}
              onDelete={() => handleDeleteProject(projeto)}
              onArchive={() => handleArchiveProject(projeto)}
              onToggleFavorite={() => handleToggleFavorite(projeto)}
              onMembers={() => toast.info('Acesse o quadro do projeto para gerenciar membros')}
              onOpenBoard={() => handleOpenBoard(projeto)}
            />
          ))}
          
          {/* Card para criar novo projeto (opcional, visualmente agradável) */}
          <button 
             onClick={handleCreateProject}
             className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors text-gray-500 dark:text-gray-400 group min-h-[250px]"
          >
             <div className="w-11 h-11 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 flex items-center justify-center mb-4 transition-colors">
               <Plus className="w-5 h-5 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
             </div>
             <span className="font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Criar Novo Projeto</span>
          </button>
        </div>
      )}

      <ProjectModal
        open={showCreateModal}
        title="Novo projeto"
        description="Defina o nome e descrição do novo projeto."
        submitLabel="Criar projeto"
        loading={isCreatingProject}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProjectSubmit}
      />
      <ProjectModal
        open={showEditModal && !!selectedProject}
        title="Editar projeto"
        description="Atualize as informações do projeto selecionado."
        submitLabel="Salvar alterações"
        loading={isUpdatingProject}
        initialData={selectedProject ? { nome: selectedProject.nome, descricao: selectedProject.descricao ?? '' } : undefined}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateProjectSubmit}
      />

      {/* Enhanced Confirm Dialogs */}
      <EnhancedConfirmDialog
        isOpen={deleteProject !== null}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir projeto"
        description={`Tem certeza que deseja excluir o projeto "${deleteProject?.nome}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir este projeto permanentemente"
        warningList={[
          'Esta ação não pode ser desfeita',
          'Todas as tarefas do projeto serão perdidas',
          'Os membros perderão acesso ao projeto'
        ]}
      />

      <EnhancedConfirmDialog
        isOpen={archiveProject !== null}
        onClose={() => setArchiveProject(null)}
        onConfirm={handleConfirmArchive}
        title={archiveProject?.ativo ? 'Arquivar projeto' : 'Desarquivar projeto'}
        description={`Tem certeza que deseja ${archiveProject?.ativo ? 'arquivar' : 'desarquivar'} o projeto "${archiveProject?.nome}"?`}
        variant="warning"
        confirmationType="none"
      />
    </div>
  );
};

function ProjectModal({
  open,
  title,
  description,
  submitLabel,
  loading,
  initialData,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  loading?: boolean;
  initialData?: ProjectFormValues;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
}) {
  const defaultValues: ProjectFormValues = { nome: '', descricao: '' };
  const [formValues, setFormValues] = React.useState<ProjectFormValues>(defaultValues);

  React.useEffect(() => {
    if (open) {
      setFormValues({
        nome: initialData?.nome ?? '',
        descricao: initialData?.descricao ?? '',
      });
    }
  }, [open, initialData]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues.nome.trim()) {
      return;
    }
    onSubmit({
      nome: formValues.nome.trim(),
      descricao: formValues.descricao?.trim() || '',
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome *</Label>
            <Input
              id="project-name"
              value={formValues.nome}
              onChange={(event) => setFormValues(prev => ({ ...prev, nome: event.target.value }))}
              placeholder="Ex.: Projeto Kanban"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Descrição</Label>
            <Textarea
              id="project-description"
              value={formValues.descricao}
              onChange={(event) => setFormValues(prev => ({ ...prev, descricao: event.target.value }))}
              placeholder="Detalhes ou objetivos do projeto"
              disabled={loading}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formValues.nome.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ProjetosPage;
