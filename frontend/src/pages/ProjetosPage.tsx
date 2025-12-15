import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Alert } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/AlertDialog';
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog';
import {
  Plus,
  Calendar,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Star,
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

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

  // Formatação de data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sem data';
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return 'Sem data';
    return parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obter cor de progresso
  const getProgressColor = (progresso: number) => {
    if (progresso >= 80) return 'bg-green-500';
    if (progresso >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus projetos Kanban
          </p>
        </div>
        
        <Button onClick={handleCreateProject} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar projetos..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-2">
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
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {state.searchTerm || state.filterStatus !== 'todos' 
              ? 'Nenhum projeto encontrado' 
              : 'Nenhum projeto criado'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {state.searchTerm || state.filterStatus !== 'todos'
              ? 'Tente ajustar os filtros ou termo de busca'
              : 'Crie seu primeiro projeto para começar'
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
            <Card key={projeto.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {projeto.cor && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: projeto.cor }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 
                        className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
                        onClick={() => handleOpenProject(projeto)}
                      >
                        {projeto.nome}
                      </h3>
                      {projeto.descricao && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {projeto.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(projeto)}
                      className={`p-1 ${projeto.favorito ? 'text-yellow-500' : 'text-gray-400'}`}
                    >
                      <Star className="w-4 h-4" fill={projeto.favorito ? 'currentColor' : 'none'} />
                    </Button>
                    
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === projeto.id ? null : projeto.id);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>

                      {/* Menu dropdown */}
                      {openMenuId === projeto.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[160px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleEditProject(projeto);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleArchiveProject(projeto);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Archive className="w-4 h-4" />
                            {projeto.ativo ? 'Arquivar' : 'Desarquivar'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleDeleteProject(projeto);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(projeto.data_criacao)}
                  </div>
                  {projeto.total_membros !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {projeto.total_membros}
                    </div>
                  )}
                </div>

                {/* Progresso */}
                {projeto.progresso !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-medium">{projeto.progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(projeto.progresso)}`}
                        style={{ width: `${projeto.progresso}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={projeto.ativo ? 'default' : 'secondary'}>
                      {projeto.ativo ? 'Ativo' : 'Arquivado'}
                    </Badge>
                    {projeto.total_tarefas !== undefined && (
                      <Badge variant="outline">
                        {projeto.total_tarefas} tarefa(s)
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleOpenProject(projeto)}
                    className="gap-2"
                  >
                    Abrir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
