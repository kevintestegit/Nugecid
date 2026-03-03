import { useState, useEffect, useCallback } from "react";
import {
  QueryDesarquivamentoDto,
  StatusDesarquivamento,
  TipoDesarquivamento,
} from "@/types";
import { apiService } from "@/services/api";

interface DesarquivamentoExcluido {
  id: number;
  codigo: string;
  nomeSolicitante: string;
  nomeVitima: string;
  tipoDesarquivamento: string;
  status: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  items: DesarquivamentoExcluido[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseDesarquivamentosExcluidosParams {
  page?: number;
  limit?: number;
  search?: string;
  tipoDesarquivamento?: string;
  dataExclusaoInicio?: string;
  dataExclusaoFim?: string;
  status?: string;
}

interface UseDesarquivamentosExcluidosReturn {
  data: PaginatedResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  restoreDesarquivamento: (id: number) => Promise<void>;
  restoreMultiple: (
    ids: number[],
  ) => Promise<{ success: boolean; restoredCount: number }>;
}

export const useDesarquivamentosExcluidos = (
  params: UseDesarquivamentosExcluidosParams = {},
): UseDesarquivamentosExcluidosReturn => {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDesarquivamentosExcluidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query: QueryDesarquivamentoDto = {
        page: params.page,
        limit: params.limit,
        search: params.search,
        tipoDesarquivamento: params.tipoDesarquivamento as
          | TipoDesarquivamento
          | undefined,
        dataInicio: params.dataExclusaoInicio,
        dataFim: params.dataExclusaoFim,
        status: params.status as StatusDesarquivamento | undefined,
      };

      const result = await apiService.getDesarquivamentosLixeira(query);

      setData({
        items: result.data.map((item) => ({
          id: item.id,
          codigo: item.codigoBarras ?? String(item.numeroSolicitacao ?? ""),
          nomeSolicitante: item.requerente ?? "",
          nomeVitima: item.nomeCompleto,
          tipoDesarquivamento: String(item.tipoDesarquivamento),
          status: item.status,
          deletedAt: item.deletedAt ?? "",
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        total: result.meta.total,
        page: result.meta.page,
        limit: result.meta.limit,
        totalPages: result.meta.totalPages,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar dados";
      console.error("Erro ao buscar desarquivamentos excluídos:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const restoreDesarquivamento = useCallback(
    async (id: number) => {
      try {
        await apiService.restoreDesarquivamento(id);

        // Atualizar a lista removendo o item restaurado
        if (data) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.filter((item) => item.id !== id),
                  total: prev.total - 1,
                }
              : null,
          );
        }

        return;
      } catch (err: unknown) {
        console.error("Erro ao restaurar desarquivamento:", err);
        throw err;
      }
    },
    [data],
  );

  const restoreMultiple = useCallback(
    async (ids: number[]) => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) => apiService.restoreDesarquivamento(id)),
        );

        const errors: string[] = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === "rejected") {
            const reason = result.reason;
            const message =
              reason instanceof Error ? reason.message : "Erro inesperado";
            errors.push(`ID ${ids[i]}: ${message}`);
          }
        }

        if (errors.length > 0) {
          throw new Error(
            `Alguns itens não puderam ser restaurados:\n${errors.join("\n")}`,
          );
        }

        // Atualizar a lista removendo os itens restaurados
        if (data) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.filter((item) => !ids.includes(item.id)),
                  total: prev.total - ids.length,
                }
              : null,
          );
        }

        return { success: true, restoredCount: ids.length };
      } catch (err: unknown) {
        console.error("Erro ao restaurar múltiplos desarquivamentos:", err);
        throw err;
      }
    },
    [data],
  );

  const refetch = useCallback(async () => {
    await fetchDesarquivamentosExcluidos();
  }, [fetchDesarquivamentosExcluidos]);

  // Buscar dados quando os parâmetros mudarem
  useEffect(() => {
    fetchDesarquivamentosExcluidos();
  }, [fetchDesarquivamentosExcluidos]);

  return {
    data,
    loading,
    error,
    refetch,
    restoreDesarquivamento,
    restoreMultiple,
  };
};
