import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { kanbanService } from "@/services/kanbanService";
import {
  Coluna as KanbanColuna,
  Tarefa as KanbanTarefa,
} from "@/components/kanban";
import {
  PrioridadeTarefa,
  Usuario as KanbanDomainUser,
} from "@/types/kanban.types";

export interface ProjetoResumo {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  createdAt?: string;
  updatedAt?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  membros?: { usuario?: KanbanDomainUser }[];
}

interface ColunaResponse {
  id: number;
  nome: string;
  cor?: string;
  ordem?: number;
  projetoId?: number;
  projeto_id?: number;
  ativa?: boolean;
  limiteWip?: number;
  limite_wip?: number;
}

interface TarefaResponse {
  id: number;
  titulo: string;
  descricao?: string;
  prioridade?: string;
  prazo?: string;
  ordem?: number;
  colunaId?: number;
  coluna_id?: number;
  coluna?: { id: number };
  projetoId?: number;
  projeto_id?: number;
  criadorId?: number;
  criador_id?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  responsavel?: {
    id: number;
    nome: string;
    avatarUrl?: string;
    avatar?: string;
  };
  responsaveis?: {
    id: number;
    nome: string;
    avatarUrl?: string;
    avatar?: string;
  }[];
  tags?: string[];
  comentarios?: KanbanTarefa["comentarios"];
}

export interface ProjetoDetalhado extends ProjetoResumo {
  colunas?: ColunaResponse[];
  tarefas?: TarefaResponse[];
}

export type BoardTask = KanbanTarefa & { coluna_id: number; colunaId?: number };

const normalizePriority = (value?: string): KanbanTarefa["prioridade"] => {
  if (!value) return PrioridadeTarefa.MEDIA;
  const normalized = value.toLowerCase();
  if (
    normalized === "baixa" ||
    normalized === "media" ||
    normalized === "alta" ||
    normalized === "critica"
  ) {
    return normalized as PrioridadeTarefa;
  }
  return PrioridadeTarefa.MEDIA;
};

const mapColumns = (
  data: ColunaResponse[] | undefined,
  fallbackProjectId: number,
): KanbanColuna[] => {
  if (!data) return [];
  return data
    .map((coluna) => ({
      id: coluna.id,
      nome: coluna.nome,
      cor: coluna.cor ?? "#3B82F6",
      ordem: coluna.ordem ?? 1,
      projetoId: coluna.projetoId ?? coluna.projeto_id ?? fallbackProjectId,
      projeto_id: coluna.projetoId ?? coluna.projeto_id ?? fallbackProjectId,
      wipLimit: coluna.limiteWip ?? coluna.limite_wip,
      limite_wip: coluna.limiteWip ?? coluna.limite_wip,
    }))
    .sort((a, b) => a.ordem - b.ordem);
};

const mapTasks = (
  data: TarefaResponse[] | undefined,
  fallbackProjectId: number,
): BoardTask[] => {
  if (!data) return [];

  const grouped = new Map<number, BoardTask[]>();

  data.forEach((item) => {
    const columnId = item.colunaId ?? item.coluna_id ?? item.coluna?.id ?? 0;
    if (!columnId) return;

    const responsaveis =
      item.responsaveis?.map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome,
        usuario: usuario.nome,
        avatar: usuario.avatarUrl ?? usuario.avatar,
        avatarUrl: usuario.avatarUrl,
      })) ?? [];
    const responsavel = item.responsavel
      ? {
          id: item.responsavel.id,
          nome: item.responsavel.nome,
          usuario: item.responsavel.nome,
          avatar: item.responsavel.avatarUrl ?? item.responsavel.avatar,
          avatarUrl: item.responsavel.avatarUrl,
        }
      : undefined;

    const base: BoardTask = {
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao ?? "",
      projetoId: item.projetoId ?? item.projeto_id ?? fallbackProjectId,
      prioridade: normalizePriority(item.prioridade),
      prazo: item.prazo ?? undefined,
      responsavel,
      responsaveis: responsaveis.length
        ? responsaveis
        : responsavel
          ? [responsavel]
          : [],
      criadorId: item.criadorId ?? item.criador_id ?? 0,
      comentarios: Array.isArray(item.comentarios)
        ? (item.comentarios as KanbanTarefa["comentarios"])
        : undefined,
      ordem: item.ordem ?? 0,
      tags: Array.isArray(item.tags) ? item.tags : [],
      coluna_id: columnId,
      colunaId: columnId,
      createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
      updatedAt: item.updatedAt ?? item.updated_at ?? new Date().toISOString(),
    };

    const list = grouped.get(columnId) ?? [];
    list.push(base);
    grouped.set(columnId, list);
  });

  const result: BoardTask[] = [];
  grouped.forEach((list) => {
    list
      .sort((a, b) => a.ordem - b.ordem || a.id - b.id)
      .forEach((task, index) => {
        task.ordem = index + 1;
        result.push(task);
      });
  });

  return result;
};

export const useTarefasBoardData = ({
  isAuthenticated,
  storageKey,
}: {
  isAuthenticated: boolean;
  storageKey: string;
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [projectDetails, setProjectDetails] = useState<ProjetoDetalhado | null>(
    null,
  );
  const [projects, setProjects] = useState<ProjetoResumo[]>([]);
  const [columns, setColumns] = useState<KanbanColuna[]>([]);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasProjectsLoaded = projects.length > 0;
  const hasBoardContent =
    columns.length > 0 || tasks.length > 0 || !!projectDetails;

  const loadProjects = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!isAuthenticated) {
        setProjects([]);
        setSelectedProjectId(null);
        setProjectDetails(null);
        setColumns([]);
        setTasks([]);
        setLoadingProjects(false);
        return;
      }

      setLoadingProjects(!silent);
      try {
        const response = await kanbanService.getProjetos();
        const lista = (response as ProjetoResumo[]) ?? [];
        setProjects(lista);

        if (!lista.length) {
          setSelectedProjectId(null);
          setProjectDetails(null);
          setColumns([]);
          setTasks([]);
          localStorage.removeItem(storageKey);
          return;
        }

        const storedId = localStorage.getItem(storageKey);
        let nextId: number | null = storedId ? Number(storedId) : null;
        if (nextId && !lista.some((proj) => proj.id === nextId)) {
          nextId = null;
        }
        if (!nextId) {
          nextId = lista[0].id;
        }

        setSelectedProjectId(nextId);
      } catch (err) {
        console.error("Erro ao carregar projetos:", err);
        setError("Não foi possível carregar os projetos no momento.");
        if (!silent) {
          toast.error("Não foi possível carregar os projetos.");
        }
      } finally {
        if (!silent) {
          setLoadingProjects(false);
        }
      }
    },
    [isAuthenticated, storageKey],
  );

  const loadBoardData = useCallback(
    async (projectId: number, options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!isAuthenticated) {
        setProjectDetails(null);
        setColumns([]);
        setTasks([]);
        setLoadingBoard(false);
        return;
      }

      setLoadingBoard(!silent);
      try {
        setError(null);
        const response = await kanbanService.getProjeto(projectId);
        const project = response as ProjetoDetalhado;

        setProjectDetails(project);
        setColumns(mapColumns(project.colunas, project.id));
        setTasks(mapTasks(project.tarefas, project.id));
      } catch (err) {
        setError("Não foi possível carregar o quadro de tarefas.");
        if (!silent) {
          toast.error("Não foi possível carregar o quadro de tarefas.");
          setColumns([]);
          setTasks([]);
        }
      } finally {
        if (!silent) {
          setLoadingBoard(false);
        }
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(storageKey, String(selectedProjectId));
      void loadBoardData(selectedProjectId);
    }
  }, [loadBoardData, selectedProjectId, storageKey]);

  return {
    selectedProjectId,
    setSelectedProjectId,
    projectDetails,
    setProjectDetails,
    projects,
    columns,
    setColumns,
    tasks,
    setTasks,
    loadingProjects,
    loadingBoard,
    error,
    setError,
    hasProjectsLoaded,
    hasBoardContent,
    loadProjects,
    loadBoardData,
  };
};
