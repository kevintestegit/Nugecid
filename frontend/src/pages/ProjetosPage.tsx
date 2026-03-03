import React, { useState, useDeferredValue, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/AlertDialog";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";
import { ProjectCard } from "../components/kanban/ProjectCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Star, Archive, Filter, Loader2 } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { toast } from "sonner";
import { ProjetoKanban, useProjetosKanban } from "@/hooks/useProjetosKanban";

interface ProjetosPageState {
  searchTerm: string;
  filterStatus: "todos" | "ativos" | "arquivados" | "favoritos";
}

interface ProjectFormValues {
  nome: string;
  descricao?: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
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
  const {
    projetos,
    isLoading,
    isFetching,
    error,
    refetch,
    createProjeto,
    updateProjeto,
    deleteProjeto: deleteProjetoMutation,
  } = useProjetosKanban(isAuthenticated);

  const [state, setState] = useState<ProjetosPageState>({
    searchTerm: "",
    filterStatus: "todos",
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjetoKanban | null>(
    null,
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjetoKanban | null>(
    null,
  );
  const [archiveProject, setArchiveProject] = useState<ProjetoKanban | null>(
    null,
  );
  const showInitialLoading = isLoading && projetos.length === 0;
  const isRefreshingProjects = isFetching && projetos.length > 0;
  const deferredSearchTerm = useDeferredValue(state.searchTerm);

  // Filtrar projetos
  const filteredProjetos = useMemo(
    () =>
      projetos.filter((projeto) => {
        const matchesSearch =
          projeto.nome
            .toLowerCase()
            .includes(deferredSearchTerm.toLowerCase()) ||
          projeto.descricao
            ?.toLowerCase()
            .includes(deferredSearchTerm.toLowerCase()) ||
          false;

        const matchesFilter = (() => {
          switch (state.filterStatus) {
            case "ativos":
              return projeto.ativo;
            case "arquivados":
              return !projeto.ativo;
            case "favoritos":
              return projeto.favorito;
            default:
              return true;
          }
        })();

        return matchesSearch && matchesFilter;
      }),
    [deferredSearchTerm, projetos, state.filterStatus],
  );

  // Handlers
  const handleCreateProject = () => {
    if (!checkPermission("create", "projetos")) {
      toast.error("Você não tem permissão para criar projetos");
      return;
    }
    setShowCreateModal(true);
  };

  const handleEditProject = (projeto: ProjetoKanban) => {
    if (!checkPermission("update", "projetos")) {
      toast.error("Você não tem permissão para editar projetos");
      return;
    }
    setSelectedProject(projeto);
    setShowEditModal(true);
  };

  const handleCreateProjectSubmit = async (values: ProjectFormValues) => {
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() || undefined,
      };
      await createProjeto.mutateAsync(payload);
      toast.success("Projeto criado com sucesso");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      toast.error(getApiErrorMessage(error, "Erro ao criar projeto"));
    }
  };

  const handleUpdateProjectSubmit = async (values: ProjectFormValues) => {
    if (!selectedProject) {
      return;
    }
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() || undefined,
      };
      await updateProjeto.mutateAsync({
        id: selectedProject.id,
        data: payload,
      });
      toast.success("Projeto atualizado com sucesso");
      setShowEditModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      toast.error(getApiErrorMessage(error, "Erro ao atualizar projeto"));
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProject(null);
  };
  const handleDeleteProject = (projeto: ProjetoKanban) => {
    if (!checkPermission("delete", "projetos")) {
      toast.error("Você não tem permissão para excluir projetos");
      return;
    }
    setDeleteProject(projeto);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProject) return;

    try {
      await deleteProjetoMutation.mutateAsync(deleteProject.id);
      toast.success("Projeto excluído com sucesso");
      setDeleteProject(null);
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast.error(getApiErrorMessage(error, "Erro ao excluir projeto"));
    }
  };

  const handleToggleFavorite = async (projeto: ProjetoKanban) => {
    try {
      // Implementar toggle favorito quando a API estiver disponível
      toast.info("Funcionalidade em desenvolvimento");
    } catch (error) {
      console.error("Erro ao alterar favorito:", error);
      toast.error(getApiErrorMessage(error, "Erro ao alterar favorito"));
    }
  };

  const handleArchiveProject = (projeto: ProjetoKanban) => {
    setArchiveProject(projeto);
  };

  const handleConfirmArchive = async () => {
    if (!archiveProject) return;

    try {
      // Implementar arquivamento quando a API estiver disponível
      toast.info("Funcionalidade em desenvolvimento");
      setArchiveProject(null);
    } catch (error) {
      console.error("Erro ao arquivar projeto:", error);
      toast.error(getApiErrorMessage(error, "Erro ao arquivar projeto"));
    }
  };

  const handleOpenProject = (projeto: ProjetoKanban) => {
    navigate(`/projetos/${projeto.id}`);
  };

  const handleOpenBoard = (projeto: ProjetoKanban) => {
    navigate(`/kanban/${projeto.id}`);
  };

  if (showInitialLoading) {
    return (
      <div className="relative space-y-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
          <Skeleton variant="text" width={200} height={28} className="mb-2" />
          <Skeleton variant="text" width={320} height={18} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <Skeleton
                variant="text"
                width="60%"
                height={20}
                className="mb-3"
              />
              <Skeleton
                variant="text"
                width="80%"
                height={14}
                className="mb-2"
              />
              <Skeleton
                variant="text"
                width="40%"
                height={14}
                className="mb-2"
              />
              <Skeleton variant="text" width="70%" height={14} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative space-y-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
        </div>
        <Alert variant="destructive">
          <h3 className="font-semibold">Erro ao carregar projetos</h3>
          <p>{getApiErrorMessage(error, "Erro ao carregar projetos")}</p>
          <div className="mt-4">
            <Button onClick={() => void refetch()}>Tentar Novamente</Button>
          </div>
        </Alert>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
              {isRefreshingProjects ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Atualizando
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-muted-foreground">
              Gerencie seus projetos Kanban e acompanhe o progresso
            </p>
          </div>
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar projetos..."
            value={state.searchTerm}
            onChange={(e) =>
              setState((prev) => ({ ...prev, searchTerm: e.target.value }))
            }
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={state.filterStatus === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setState((prev) => ({ ...prev, filterStatus: "todos" }))
            }
            className="rounded-full"
          >
            Todos
          </Button>
          <Button
            variant={state.filterStatus === "ativos" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setState((prev) => ({ ...prev, filterStatus: "ativos" }))
            }
            className="rounded-full"
          >
            Ativos
          </Button>
          <Button
            variant={state.filterStatus === "favoritos" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setState((prev) => ({ ...prev, filterStatus: "favoritos" }))
            }
            className="rounded-full"
          >
            <Star className="w-4 h-4 mr-1" />
            Favoritos
          </Button>
          <Button
            variant={
              state.filterStatus === "arquivados" ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              setState((prev) => ({ ...prev, filterStatus: "arquivados" }))
            }
            className="rounded-full"
          >
            <Archive className="w-4 h-4 mr-1" />
            Arquivados
          </Button>
        </div>
      </div>

      {/* Lista de Projetos */}
      {filteredProjetos.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border/60 bg-card/85 backdrop-blur">
          <div className="text-muted-foreground mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-background border border-border/60">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {deferredSearchTerm || state.filterStatus !== "todos"
              ? "Nenhum projeto encontrado"
              : "Comece sua jornada"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {deferredSearchTerm || state.filterStatus !== "todos"
              ? "Não encontramos projetos com os filtros atuais. Tente buscar por outro termo."
              : "Crie seu primeiro projeto para organizar tarefas e colaborar com sua equipe."}
          </p>
          {!deferredSearchTerm && state.filterStatus === "todos" && (
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
              onMembers={() =>
                toast.info("Acesse o quadro do projeto para gerenciar membros")
              }
              onOpenBoard={() => handleOpenBoard(projeto)}
            />
          ))}

          {/* Card para criar novo projeto */}
          <button
            onClick={handleCreateProject}
            className="flex flex-col items-center justify-center p-6 border border-dashed border-border/60 rounded-2xl hover:border-border hover:bg-muted/30 transition-colors text-muted-foreground group min-h-[250px]"
          >
            <div className="w-11 h-11 rounded-full bg-background border border-border/60 group-hover:border-border flex items-center justify-center mb-4 transition-colors">
              <Plus className="w-5 h-5 group-hover:text-foreground transition-colors" />
            </div>
            <span className="font-medium group-hover:text-foreground transition-colors">
              Criar Novo Projeto
            </span>
          </button>
        </div>
      )}

      <ProjectModal
        open={showCreateModal}
        title="Novo projeto"
        description="Defina o nome e descrição do novo projeto."
        submitLabel="Criar projeto"
        loading={createProjeto.isPending}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProjectSubmit}
      />
      <ProjectModal
        open={showEditModal && !!selectedProject}
        title="Editar projeto"
        description="Atualize as informações do projeto selecionado."
        submitLabel="Salvar alterações"
        loading={updateProjeto.isPending}
        initialData={
          selectedProject
            ? {
                nome: selectedProject.nome,
                descricao: selectedProject.descricao ?? "",
              }
            : undefined
        }
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
          "Esta ação não pode ser desfeita",
          "Todas as tarefas do projeto serão perdidas",
          "Os membros perderão acesso ao projeto",
        ]}
      />

      <EnhancedConfirmDialog
        isOpen={archiveProject !== null}
        onClose={() => setArchiveProject(null)}
        onConfirm={handleConfirmArchive}
        title={
          archiveProject?.ativo ? "Arquivar projeto" : "Desarquivar projeto"
        }
        description={`Tem certeza que deseja ${archiveProject?.ativo ? "arquivar" : "desarquivar"} o projeto "${archiveProject?.nome}"?`}
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
  const defaultValues: ProjectFormValues = { nome: "", descricao: "" };
  const [formValues, setFormValues] =
    React.useState<ProjectFormValues>(defaultValues);

  React.useEffect(() => {
    if (open) {
      setFormValues({
        nome: initialData?.nome ?? "",
        descricao: initialData?.descricao ?? "",
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
      descricao: formValues.descricao?.trim() || "",
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
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
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, nome: event.target.value }))
              }
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
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  descricao: event.target.value,
                }))
              }
              placeholder="Detalhes ou objetivos do projeto"
              disabled={loading}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
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
