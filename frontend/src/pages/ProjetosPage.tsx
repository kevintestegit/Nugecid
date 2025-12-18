import React, { useState, useEffect } from 'react';
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

const ProjetosPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  
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
  const loadProjetos = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await kanbanService.getProjetos();
      const projetos = (Array.isArray(response) ? response : (response as any)?.data || []) as any[];
      const normalized = projetos.map((p) => ({
        ...p,
        data_criacao: p.data_criacao || p.created_at || p.createdAt || null,
        data_atualizacao: p.data_atualizacao || p.updated_at || p.updatedAt || null,
        ativo: p.ativo !== undefined ? p.ativo : true,
      }));

      setState(prev => ({
        ...prev,
        projetos: normalized,
        loading: false
      }));
    } catch (error: any) {
      console.error('Erro ao carregar projetos:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar projetos',
        loading: false
      }));
    }
  };

  useEffect(() => {
    loadProjetos();
  }, []);

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
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      const message = error?.response?.data?.message || error?.message || 'Erro ao criar projeto';
      toast.error(message);
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
    } catch (error: any) {
      console.error('Erro ao atualizar projeto:', error);
      const message = error?.response?.data?.message || error?.message || 'Erro ao atualizar projeto';
      toast.error(message);
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
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      toast.error(error.message || 'Erro ao excluir projeto');
    }
  };

  const handleToggleFavorite = async (projeto: Projeto) => {
    try {
      // Implementar toggle favorito quando a API estiver disponível
      toast.info('Funcionalidade em desenvolvimento');
    } catch (error: any) {
      console.error('Erro ao alterar favorito:', error);
      toast.error(error.message || 'Erro ao alterar favorito');
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
    } catch (error: any) {
      console.error('Erro ao arquivar projeto:', error);
      toast.error(error.message || 'Erro ao arquivar projeto');
    }
  };

  const handleOpenProject = (projeto: Projeto) => {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projetos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus projetos Kanban e acompanhe o progresso
          </p>
        </div>
        
        <Button onClick={handleCreateProject} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
          >
            Todos
          </Button>
          <Button
            variant={state.filterStatus === 'ativos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, filterStatus: 'ativos' }))}
          >
            Ativos
          </Button>
          <Button
            variant={state.filterStatus === 'favoritos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, filterStatus: 'favoritos' }))}
          >
            <Star className="w-4 h-4 mr-1" />
            Favoritos
          </Button>
          <Button
            variant={state.filterStatus === 'arquivados' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, filterStatus: 'arquivados' }))}
          >
            <Archive className="w-4 h-4 mr-1" />
            Arquivados
          </Button>
        </div>
      </div>

      {/* Lista de Projetos */}
      {filteredProjetos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700">
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
            />
          ))}
          
          {/* Card para criar novo projeto (opcional, visualmente agradável) */}
          <button 
             onClick={handleCreateProject}
             className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-gray-500 dark:text-gray-400 group min-h-[250px]"
          >
             <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 flex items-center justify-center mb-4 transition-colors">
               <Plus className="w-6 h-6 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
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
