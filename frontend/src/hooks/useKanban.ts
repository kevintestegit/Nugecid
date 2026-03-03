import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { kanbanService } from "../services/kanbanService";
import tarefasService from "@/services/tarefasService";
import type { DomainSyncEventDetail } from "./useDomainSyncSSE";
import type {
  CreateTarefaDto,
  UpdateTarefaDto,
} from "../services/kanbanService";
import { Projeto, Coluna, Tarefa } from "../components/kanban";
import { PrioridadeTarefa } from "@/types/kanban.types";

interface UseKanbanProps {
  projetoId: number;
}

interface UseKanbanReturn {
  projeto: Projeto | null;
  colunas: Coluna[];
  tarefas: Tarefa[];
  loading: boolean;
  error: string | null;

  // Projeto
  updateProjeto: (data: Partial<Projeto>) => Promise<void>;

  // Colunas
  createColuna: (
    data: Omit<Coluna, "id" | "projeto_id" | "ordem">,
  ) => Promise<void>;
  updateColuna: (id: number, data: Partial<Coluna>) => Promise<void>;
  deleteColuna: (id: number) => Promise<void>;
  moveColuna: (colunaId: number, newOrder: number) => Promise<void>;

  // Tarefas
  createTarefa: (data: Omit<Tarefa, "id" | "ordem">) => Promise<void>;
  updateTarefa: (id: number, data: Partial<Tarefa>) => Promise<void>;
  deleteTarefa: (id: number) => Promise<void>;
  moveTarefa: (
    tarefaId: number,
    sourceColunaId: number,
    targetColunaId: number,
    newOrder: number,
  ) => Promise<void>;
  reorderTarefas: (
    colunaId: number,
    tarefaIds: number[],
    movedTaskId?: number,
  ) => Promise<void>;

  // Utilitários
  refresh: () => Promise<void>;
}

const AUTO_SYNC_INTERVAL_MS = 30000;
const normalizeScope = (value?: string) => (value || "").trim().toLowerCase();

export const useKanban = ({ projetoId }: UseKanbanProps): UseKanbanReturn => {
  const { user, isAuthenticated, checkPermission } = useAuth();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [colunas, setColunas] = useState<Coluna[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type LegacyColuna = Partial<Coluna> & {
    projetoId?: number;
    projeto_id?: number;
    limite_wip?: number;
    wipLimit?: number;
  };

  type LegacyTarefa = Partial<Tarefa> & {
    coluna_id?: number;
    projeto_id?: number;
    responsavel_id?: number;
    criador_id?: number;
    created_at?: string;
    updated_at?: string;
    responsaveis?: Tarefa["responsaveis"];
  };

  type LegacyProjeto = Partial<Projeto> & {
    createdAt?: string;
    updatedAt?: string;
    created_at?: string;
    updated_at?: string;
  };

  const normalizePriority = (value?: string): Tarefa["prioridade"] => {
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

  const normalizeColuna = useCallback(
    (coluna: LegacyColuna): Coluna => {
      return {
        id: coluna.id ?? 0,
        nome: coluna.nome ?? "",
        cor: coluna.cor,
        ordem: coluna.ordem ?? 1,
        projetoId: coluna.projetoId ?? coluna.projeto_id ?? projetoId,
        projeto_id: coluna.projeto_id ?? coluna.projetoId ?? projetoId,
        wipLimit: coluna.wipLimit ?? coluna.limite_wip,
        limite_wip: coluna.limite_wip ?? coluna.wipLimit,
      };
    },
    [projetoId],
  );

  const normalizeTarefa = useCallback(
    (t: LegacyTarefa): Tarefa => {
      const responsaveis =
        t.responsaveis ?? (t.responsavel ? [t.responsavel] : []);
      return {
        id: t.id ?? 0,
        titulo: t.titulo ?? "",
        descricao: t.descricao ?? "",
        projetoId: t.projetoId ?? t.projeto_id ?? projetoId,
        colunaId: t.colunaId ?? t.coluna_id ?? 0,
        criadorId: t.criadorId ?? t.criador_id ?? 0,
        responsavelId: t.responsavelId ?? t.responsavel_id ?? undefined,
        prazo: t.prazo ?? undefined,
        prioridade: normalizePriority(t.prioridade),
        ordem: t.ordem ?? 1,
        tags: t.tags ?? [],
        createdAt: t.createdAt ?? t.created_at ?? new Date().toISOString(),
        updatedAt: t.updatedAt ?? t.updated_at ?? new Date().toISOString(),
        responsavel: t.responsavel,
        responsaveis,
        coluna: t.coluna,
        projeto: t.projeto,
        comentarios: t.comentarios,
        anexos: t.anexos,
        checklists: t.checklists,
      };
    },
    [projetoId],
  );

  const normalizeProjeto = useCallback(
    (p: LegacyProjeto): Projeto => {
      return {
        id: p.id ?? projetoId,
        nome: p.nome ?? "",
        descricao: p.descricao ?? "",
        cor: p.cor,
        data_criacao:
          p.data_criacao ??
          p.createdAt ??
          p.created_at ??
          new Date().toISOString(),
        data_atualizacao:
          p.data_atualizacao ??
          p.updatedAt ??
          p.updated_at ??
          new Date().toISOString(),
        membros: p.membros,
      };
    },
    [projetoId],
  );

  // Carregar dados iniciais
  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);

      if (!isAuthenticated) {
        setProjeto(null);
        setColunas([]);
        setTarefas([]);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);

        const [projetoData, colunasData, tarefasData] = await Promise.all([
          kanbanService.getProjeto(projetoId),
          kanbanService.getColunas(projetoId),
          kanbanService.getTarefas(projetoId),
        ]);

        setProjeto(normalizeProjeto(projetoData as LegacyProjeto));
        setColunas(
          Array.isArray(colunasData) ? colunasData.map(normalizeColuna) : [],
        );
        const tarefasArray = Array.isArray(tarefasData) ? tarefasData : [];
        setTarefas(tarefasArray.map(normalizeTarefa));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar dados";
        setError(message);
        if (!silent) {
          toast.error(message);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      isAuthenticated,
      projetoId,
      normalizeColuna,
      normalizeProjeto,
      normalizeTarefa,
    ],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const syncSilently = () => {
      if (
        typeof navigator !== "undefined" &&
        "onLine" in navigator &&
        !navigator.onLine
      ) {
        return;
      }
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      void loadData({ silent: true });
    };

    const interval = window.setInterval(syncSilently, AUTO_SYNC_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncSilently();
      }
    };
    const handleOnline = () => syncSilently();
    const handleDomainSync = (event: Event) => {
      const customEvent = event as CustomEvent<DomainSyncEventDetail>;
      const detail = customEvent.detail;
      const scope = normalizeScope(detail?.scope);
      if (scope !== "tarefas" && scope !== "projetos") {
        return;
      }

      const metadata = detail?.metadata as { projetoId?: unknown } | undefined;
      const metadataProjectId = Number(metadata?.projetoId);
      if (
        Number.isFinite(metadataProjectId) &&
        metadataProjectId > 0 &&
        metadataProjectId !== projetoId
      ) {
        return;
      }

      syncSilently();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("sgc:domain-sync", handleDomainSync);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("sgc:domain-sync", handleDomainSync);
    };
  }, [isAuthenticated, loadData, projetoId]);

  // Projeto
  const updateProjeto = useCallback(
    async (data: Partial<Projeto>) => {
      try {
        const updatedProjeto = await kanbanService.updateProjeto(
          projetoId,
          data,
        );
        setProjeto(normalizeProjeto(updatedProjeto as LegacyProjeto));
        toast.success("Projeto atualizado com sucesso!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar projeto";
        toast.error(message);
        throw err;
      }
    },
    [normalizeProjeto, projetoId],
  );

  // Colunas
  const createColuna = useCallback(
    async (data: Omit<Coluna, "id" | "projeto_id" | "ordem">) => {
      try {
        const payload = {
          nome: data.nome,
          cor: data.cor,
          wipLimit: data.limite_wip,
          projetoId,
          ordem: colunas.length + 1,
        };
        const newColuna = await kanbanService.createColuna(payload);
        setColunas((prev) => [...prev, normalizeColuna(newColuna)]);
        toast.success("Coluna criada com sucesso!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar coluna";
        toast.error(message);
        throw err;
      }
    },
    [colunas.length, normalizeColuna, projetoId],
  );

  const updateColuna = useCallback(
    async (id: number, data: Partial<Coluna>) => {
      try {
        const payload = {
          nome: data.nome,
          cor: data.cor,
          wipLimit: data.limite_wip,
          ordem: data.ordem,
        };
        const updatedColuna = await kanbanService.updateColuna(id, payload);
        setColunas((prev) =>
          prev.map((col) =>
            col.id === id ? normalizeColuna(updatedColuna) : col,
          ),
        );
        toast.success("Coluna atualizada com sucesso!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar coluna";
        toast.error(message);
        throw err;
      }
    },
    [normalizeColuna],
  );

  const deleteColuna = useCallback(async (id: number) => {
    try {
      await kanbanService.deleteColuna(id);
      setColunas((prev) => prev.filter((col) => col.id !== id));
      setTarefas((prev) => prev.filter((tarefa) => tarefa.colunaId !== id));
      toast.success("Coluna excluída com sucesso!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir coluna";
      toast.error(message);
      throw err;
    }
  }, []);

  const moveColuna = useCallback(async (colunaId: number, newOrder: number) => {
    try {
      await kanbanService.moveColuna(colunaId, newOrder);
      // Reordenar localmente
      setColunas((prev) => {
        const updated = [...prev];
        const colunaIndex = updated.findIndex((col) => col.id === colunaId);
        if (colunaIndex !== -1) {
          const [coluna] = updated.splice(colunaIndex, 1);
          updated.splice(newOrder, 0, { ...coluna, ordem: newOrder });
          return updated.map((col, index) => ({ ...col, ordem: index }));
        }
        return updated;
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao mover coluna";
      toast.error(message);
      throw err;
    }
  }, []);

  // Tarefas
  const createTarefa = useCallback(
    async (data: Omit<Tarefa, "id" | "ordem">) => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        throw new Error("Usuário não autenticado");
      }
      if (!checkPermission("create", "tarefas")) {
        toast.error("Você não tem permissão para criar tarefas");
        throw new Error("Sem permissão para criar tarefas");
      }

      try {
        const tarefasNaColuna = tarefas.filter(
          (t) => t.colunaId === data.colunaId,
        );
        const payload: CreateTarefaDto = {
          projetoId: data.projetoId,
          colunaId: data.colunaId,
          titulo: data.titulo,
          descricao: data.descricao,
          responsavelId: data.responsavelId,
          prazo: data.prazo,
          prioridade: data.prioridade,
          tags: data.tags,
          ordem: tarefasNaColuna.length + 1,
        };
        const newTarefa = await kanbanService.createTarefa(payload);
        setTarefas((prev) => [...prev, normalizeTarefa(newTarefa)]);
        toast.success("Tarefa criada com sucesso!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar tarefa";
        toast.error(message);
        throw err;
      }
    },
    [checkPermission, isAuthenticated, normalizeTarefa, tarefas, user],
  );

  const updateTarefa = useCallback(
    async (id: number, data: Partial<Tarefa>) => {
      if (!isAuthenticated || !user) {
        toast.error("Você precisa estar logado para atualizar tarefas");
        return;
      }
      if (!checkPermission("update", "tarefas")) {
        toast.error("Você não tem permissão para atualizar tarefas");
        return;
      }

      // Verificar se o usuário tem permissão para atualizar tarefas
      const tarefa = tarefas.find((t) => t.id === id);
      if (
        tarefa &&
        user.role?.name === "usuario" &&
        tarefa.criadorId !== user.id
      ) {
        toast.error("Você só pode atualizar suas próprias tarefas");
        return;
      }

      try {
        const payload: UpdateTarefaDto = {
          titulo: data.titulo,
          descricao: data.descricao,
          prioridade: data.prioridade,
          prazo: data.prazo,
          tags: data.tags,
          responsavelId: data.responsavelId,
          colunaId: data.colunaId,
          ordem: data.ordem,
        };
        const updatedTarefa = await kanbanService.updateTarefa(id, payload);
        setTarefas((prev) =>
          prev.map((tarefa) =>
            tarefa.id === id ? normalizeTarefa(updatedTarefa) : tarefa,
          ),
        );
        toast.success("Tarefa atualizada com sucesso!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar tarefa";
        toast.error(message);
        throw err;
      }
    },
    [checkPermission, isAuthenticated, normalizeTarefa, tarefas, user],
  );

  const deleteTarefa = useCallback(
    async (id: number) => {
      if (!isAuthenticated || !user) {
        toast.error("Você precisa estar logado para excluir tarefas");
        return;
      }
      if (!checkPermission("delete", "tarefas")) {
        toast.error("Você não tem permissão para excluir tarefas");
        return;
      }

      // Verificar se o usuário tem permissão para excluir tarefas
      const tarefa = tarefas.find((t) => t.id === id);
      if (
        tarefa &&
        user.role?.name === "usuario" &&
        tarefa.criadorId !== user.id
      ) {
        toast.error("Você só pode excluir suas próprias tarefas");
        return;
      }

      try {
        await kanbanService.deleteTarefa(id);
        setTarefas((prev) => prev.filter((tarefa) => tarefa.id !== id));
        toast.success("Tarefa excluída com sucesso!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao excluir tarefa";
        toast.error(message);
        throw err;
      }
    },
    [checkPermission, isAuthenticated, tarefas, user],
  );

  const moveTarefa = useCallback(
    async (
      tarefaId: number,
      _sourceColunaId: number,
      targetColunaId: number,
      newOrder: number,
    ) => {
      if (!isAuthenticated || !user) {
        toast.error("Você precisa estar logado para mover tarefas");
        return;
      }
      if (!checkPermission("update", "tarefas")) {
        toast.error("Você não tem permissão para mover tarefas");
        return;
      }

      const tarefa = tarefas.find((item) => item.id === tarefaId);
      if (
        tarefa &&
        user.role?.name === "usuario" &&
        tarefa.criadorId !== user.id
      ) {
        toast.error("Você só pode mover suas próprias tarefas");
        return;
      }

      try {
        const nextOrder = newOrder + 1;
        await tarefasService.moveTarefa(tarefaId, {
          colunaId: targetColunaId,
          ordem: nextOrder,
        });

        // Atualizar estado local
        setTarefas((prev) => {
          const updated = prev.map((tarefa) => {
            if (tarefa.id === tarefaId) {
              return { ...tarefa, colunaId: targetColunaId, ordem: nextOrder };
            }
            return tarefa;
          });

          // Reordenar tarefas na coluna de destino
          const targetTasks = updated
            .filter((t) => t.colunaId === targetColunaId)
            .sort((a, b) => a.ordem - b.ordem);

          return updated.map((tarefa) => {
            if (tarefa.colunaId === targetColunaId) {
              const index = targetTasks.findIndex((t) => t.id === tarefa.id);
              return { ...tarefa, ordem: index + 1 };
            }
            return tarefa;
          });
        });

        toast.success("Tarefa movida com sucesso!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao mover tarefa";
        toast.error(message);
        // Recarregar dados em caso de erro
        await loadData();
        throw err;
      }
    },
    [checkPermission, isAuthenticated, loadData, tarefas, user],
  );

  const reorderTarefas = useCallback(
    async (colunaId: number, tarefaIds: number[], movedTaskId?: number) => {
      if (movedTaskId === undefined) {
        return;
      }

      try {
        if (!isAuthenticated || !user) {
          toast.error("Você precisa estar logado para reordenar tarefas");
          return;
        }
        if (!checkPermission("update", "tarefas")) {
          toast.error("Você não tem permissão para reordenar tarefas");
          return;
        }

        const tarefa = tarefas.find((item) => item.id === movedTaskId);
        if (
          tarefa &&
          user.role?.name === "usuario" &&
          tarefa.criadorId !== user.id
        ) {
          toast.error("Você só pode reordenar suas próprias tarefas");
          return;
        }

        const newOrderIndex = tarefaIds.findIndex((id) => id === movedTaskId);
        if (newOrderIndex === -1) return;

        await tarefasService.moveTarefa(movedTaskId, {
          colunaId,
          ordem: newOrderIndex + 1,
        });

        // Atualizar ordem local
        setTarefas((prev) =>
          prev.map((tarefa) => {
            if (tarefa.colunaId === colunaId) {
              const orderIndex = tarefaIds.indexOf(tarefa.id);
              return { ...tarefa, ordem: orderIndex + 1 };
            }
            return tarefa;
          }),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao reordenar tarefas";
        toast.error(message);
        // Recarregar dados em caso de erro
        await loadData();
        throw err;
      }
    },
    [checkPermission, isAuthenticated, loadData, tarefas, user],
  );

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    projeto,
    colunas,
    tarefas,
    loading,
    error,
    updateProjeto,
    createColuna,
    updateColuna,
    deleteColuna,
    moveColuna,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    moveTarefa,
    reorderTarefas,
    refresh,
  };
};
