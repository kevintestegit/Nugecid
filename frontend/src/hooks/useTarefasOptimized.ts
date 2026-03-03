import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import type {
  Tarefa,
  CreateTarefaDto,
  UpdateTarefaDto,
  QueryTarefaDto,
  MoveTarefaDto,
  PaginatedResponse,
  ApiResponse,
  HistoricoTarefa,
} from "@/types";

type FetchTarefasParams = QueryTarefaDto & {
  forceRefresh?: boolean;
};

// Tipagem para o estado consolidado
interface TarefasState {
  tarefas: Tarefa[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
  lastFetch: number | null;
}

// Cache em memória com TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 60000; // 1 minuto de cache

class TarefasCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar se não expirou
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    // Invalidar todas as entradas que começam com a chave
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(key)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton de cache
const globalCache = new TarefasCache();

interface EstatisticasTarefas {
  total: number;
  pendentes: number;
  em_andamento: number;
  concluidas: number;
  canceladas: number;
}

interface UseTarefasOptimizedReturn {
  tarefas: Tarefa[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  total: number;
  estatisticas: EstatisticasTarefas;

  // Operações CRUD
  fetchTarefas: (params?: FetchTarefasParams) => Promise<void>;
  createTarefa: (data: CreateTarefaDto) => Promise<Tarefa | null>;
  updateTarefa: (id: number, data: UpdateTarefaDto) => Promise<Tarefa | null>;
  deleteTarefa: (id: number) => Promise<boolean>;
  getTarefa: (id: number) => Promise<Tarefa | null>;

  // Operações específicas
  moveTarefa: (id: number, data: MoveTarefaDto) => Promise<Tarefa | null>;
  getTarefasAtrasadas: (projetoId: number) => Promise<Tarefa[]>;
  getHistoricoTarefa: (id: number) => Promise<HistoricoTarefa[]>;

  // Utilitários
  refresh: () => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

export const useTarefasOptimized = (
  initialParams?: QueryTarefaDto,
): UseTarefasOptimizedReturn => {
  const { isAuthenticated, user } = useAuth();

  // Estado consolidado para evitar múltiplos re-renders
  const [state, setState] = useState<TarefasState>({
    tarefas: [],
    loading: false,
    error: null,
    pagination: { currentPage: 1, totalPages: 0, total: 0 },
    lastFetch: null,
  });

  const lastParamsRef = useRef<FetchTarefasParams | undefined>(initialParams);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const invalidateCache = useCallback(() => {
    globalCache.invalidate("tarefas");
  }, []);

  const buildCacheKey = useCallback((params?: FetchTarefasParams): string => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined),
    );
    return `tarefas:${JSON.stringify(cleanParams)}`;
  }, []);

  const fetchTarefas = useCallback(
    async (params?: FetchTarefasParams) => {
      if (!isAuthenticated || !user) {
        setState((prev) => ({ ...prev, error: "Usuário não autenticado" }));
        return;
      }

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const cacheKey = buildCacheKey(params);
      const cached = globalCache.get<PaginatedResponse<Tarefa>>(cacheKey);

      // Se tem cache válido e não está forçando refresh, usar cache
      if (cached && !params?.forceRefresh) {
        setState((prev) => ({
          ...prev,
          tarefas: cached.data,
          pagination: {
            currentPage: cached.meta?.page || 1,
            totalPages: cached.meta?.totalPages || 0,
            total: cached.meta?.total || cached.data.length,
          },
          loading: false,
        }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const queryParams = new URLSearchParams();
        if (params?.projetoId)
          queryParams.append("projetoId", params.projetoId.toString());
        if (params?.colunaId)
          queryParams.append("colunaId", params.colunaId.toString());
        if (params?.responsavelId)
          queryParams.append("responsavelId", params.responsavelId.toString());
        if (params?.criadorId)
          queryParams.append("criadorId", params.criadorId.toString());
        if (params?.prioridade) {
          const prioridadeValue = Array.isArray(params.prioridade)
            ? params.prioridade.join(",")
            : params.prioridade;
          queryParams.append("prioridade", prioridadeValue);
        }
        if (params?.search) queryParams.append("search", params.search);
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params?.sortOrder)
          queryParams.append("sortOrder", params.sortOrder);
        if (params?.incluirExcluidas)
          queryParams.append(
            "incluirExcluidas",
            params.incluirExcluidas.toString(),
          );

        const response = await api.get<PaginatedResponse<Tarefa>>(
          `/tarefas?${queryParams.toString()}`,
          { signal: abortControllerRef.current.signal },
        );

        if (response.data.success) {
          const data = response.data.data;
          const meta = response.data.meta;

          // Salvar no cache
          globalCache.set(cacheKey, response.data);

          setState({
            tarefas: data,
            loading: false,
            error: null,
            pagination: {
              currentPage: meta?.page || 1,
              totalPages: meta?.totalPages || 0,
              total: meta?.total || data.length,
            },
            lastFetch: Date.now(),
          });
          lastParamsRef.current = params;
        } else {
          throw new Error("Erro ao buscar tarefas");
        }
      } catch (err: unknown) {
        // Ignorar erros de abort
        if (axios.isCancel(err)) return;

        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao buscar tarefas";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
      }
    },
    [isAuthenticated, user, buildCacheKey],
  );

  const createTarefa = useCallback(
    async (data: CreateTarefaDto): Promise<Tarefa | null> => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        return null;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await api.post<ApiResponse<Tarefa>>("/tarefas", data);

        if (response.data.success && response.data.data) {
          const novaTarefa = response.data.data;

          setState((prev) => ({
            ...prev,
            tarefas: [novaTarefa, ...prev.tarefas],
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total + 1,
            },
            loading: false,
          }));

          // Invalidar cache
          globalCache.invalidate("tarefas");
          toast.success("Tarefa criada com sucesso!");
          return novaTarefa;
        } else {
          throw new Error(response.data.message || "Erro ao criar tarefa");
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao criar tarefa";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
        return null;
      }
    },
    [isAuthenticated, user],
  );

  const updateTarefa = useCallback(
    async (id: number, data: UpdateTarefaDto): Promise<Tarefa | null> => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        return null;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await api.patch<ApiResponse<Tarefa>>(
          `/tarefas/${id}`,
          data,
        );

        if (response.data.success && response.data.data) {
          const tarefaAtualizada = response.data.data;

          setState((prev) => ({
            ...prev,
            tarefas: prev.tarefas.map((t) =>
              t.id === id ? tarefaAtualizada : t,
            ),
            loading: false,
          }));

          globalCache.invalidate("tarefas");
          toast.success("Tarefa atualizada com sucesso!");
          return tarefaAtualizada;
        } else {
          throw new Error(response.data.message || "Erro ao atualizar tarefa");
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao atualizar tarefa";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
        return null;
      }
    },
    [isAuthenticated, user],
  );

  const deleteTarefa = useCallback(
    async (id: number): Promise<boolean> => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        return false;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await api.delete<ApiResponse>(`/tarefas/${id}`);

        if (response.data.success) {
          setState((prev) => ({
            ...prev,
            tarefas: prev.tarefas.filter((t) => t.id !== id),
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total - 1,
            },
            loading: false,
          }));

          globalCache.invalidate("tarefas");
          toast.success("Tarefa excluída com sucesso!");
          return true;
        } else {
          throw new Error(response.data.message || "Erro ao excluir tarefa");
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao excluir tarefa";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
        return false;
      }
    },
    [isAuthenticated, user],
  );

  const getTarefa = useCallback(
    async (id: number): Promise<Tarefa | null> => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        return null;
      }

      // Verificar cache primeiro
      const cached = state.tarefas.find((t) => t.id === id);
      if (cached) return cached;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await api.get<ApiResponse<Tarefa>>(`/tarefas/${id}`);

        if (response.data.success && response.data.data) {
          setState((prev) => ({ ...prev, loading: false }));
          return response.data.data;
        } else {
          throw new Error(response.data.message || "Erro ao buscar tarefa");
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao buscar tarefa";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
        return null;
      }
    },
    [isAuthenticated, user, state.tarefas],
  );

  const moveTarefa = useCallback(
    async (id: number, data: MoveTarefaDto): Promise<Tarefa | null> => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        return null;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await api.patch<ApiResponse<Tarefa>>(
          `/tarefas/${id}/mover`,
          data,
        );

        if (response.data.success && response.data.data) {
          const tarefaMovida = response.data.data;

          setState((prev) => ({
            ...prev,
            tarefas: prev.tarefas.map((t) => (t.id === id ? tarefaMovida : t)),
            loading: false,
          }));

          globalCache.invalidate("tarefas");
          toast.success("Tarefa movida com sucesso!");
          return tarefaMovida;
        } else {
          throw new Error(response.data.message || "Erro ao mover tarefa");
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao mover tarefa";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
        return null;
      }
    },
    [isAuthenticated, user],
  );

  const getTarefasAtrasadas = useCallback(
    async (projetoId: number): Promise<Tarefa[]> => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        return [];
      }

      const cacheKey = `tarefas:atrasadas:${projetoId}`;
      const cached = globalCache.get<Tarefa[]>(cacheKey);
      if (cached) return cached;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await api.get<ApiResponse<Tarefa[]>>(
          `/tarefas/atrasadas/${projetoId}`,
        );

        if (response.data.success && response.data.data) {
          globalCache.set(cacheKey, response.data.data);
          setState((prev) => ({ ...prev, loading: false }));
          return response.data.data;
        } else {
          throw new Error(
            response.data.message || "Erro ao buscar tarefas atrasadas",
          );
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao buscar tarefas atrasadas";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
        return [];
      }
    },
    [isAuthenticated, user],
  );

  const getHistoricoTarefa = useCallback(
    async (id: number): Promise<HistoricoTarefa[]> => {
      if (!isAuthenticated || !user) {
        toast.error("Usuário não autenticado");
        return [];
      }

      const cacheKey = `tarefas:historico:${id}`;
      const cached = globalCache.get<HistoricoTarefa[]>(cacheKey);
      if (cached) return cached;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await api.get<ApiResponse<HistoricoTarefa[]>>(
          `/tarefas/${id}/historico`,
        );

        if (response.data.success && response.data.data) {
          globalCache.set(cacheKey, response.data.data);
          setState((prev) => ({ ...prev, loading: false }));
          return response.data.data;
        } else {
          throw new Error(response.data.message || "Erro ao buscar histórico");
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Erro ao buscar histórico";

        setState((prev) => ({ ...prev, loading: false, error: message }));
        toast.error(message);
        return [];
      }
    },
    [isAuthenticated, user],
  );

  const refresh = useCallback(async () => {
    globalCache.invalidate("tarefas");
    if (lastParamsRef.current) {
      await fetchTarefas({
        ...lastParamsRef.current,
        forceRefresh: true,
      } as QueryTarefaDto);
    } else {
      await fetchTarefas();
    }
  }, [fetchTarefas]);

  // Cálculo de estatísticas memoizado
  const estatisticas = useMemo((): EstatisticasTarefas => {
    const stats = {
      total: state.tarefas.length,
      pendentes: 0,
      em_andamento: 0,
      concluidas: 0,
      canceladas: 0,
    };

    state.tarefas.forEach((tarefa) => {
      const colunaNome = (tarefa.coluna?.nome || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (
        colunaNome.includes("conclu") ||
        colunaNome.includes("feito") ||
        colunaNome.includes("done")
      ) {
        stats.concluidas++;
      } else if (
        colunaNome.includes("progresso") ||
        colunaNome.includes("andamento") ||
        colunaNome.includes("doing")
      ) {
        stats.em_andamento++;
      } else if (
        colunaNome.includes("cancelad") ||
        colunaNome.includes("arquivad")
      ) {
        stats.canceladas++;
      } else {
        stats.pendentes++;
      }
    });

    return stats;
  }, [state.tarefas]);

  // Auto-fetch no mount com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialParams && isAuthenticated && user) {
        fetchTarefas(initialParams);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTarefas, initialParams, isAuthenticated, user]);

  return {
    tarefas: state.tarefas,
    loading: state.loading,
    error: state.error,
    totalPages: state.pagination.totalPages,
    currentPage: state.pagination.currentPage,
    total: state.pagination.total,
    estatisticas,
    fetchTarefas,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    getTarefa,
    moveTarefa,
    getTarefasAtrasadas,
    getHistoricoTarefa,
    refresh,
    clearError,
    invalidateCache,
  };
};

export default useTarefasOptimized;
