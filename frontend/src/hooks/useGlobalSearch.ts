import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { SearchParams, SearchResponse, SearchResult } from "@/types";

/**
 * Hook para busca global no sistema
 * @param query - Termo de busca
 * @param options - Opções adicionais de busca
 * @returns Resultados da busca com estados de loading e erro
 */
export const useGlobalSearch = (
  query: string,
  options?: Partial<SearchParams>,
) => {
  return useQuery<SearchResponse, Error>({
    queryKey: ["global-search", query, options],
    queryFn: async () => {
      const params: SearchParams = {
        query: query.trim(),
        types: options?.types,
        limit: options?.limit || 10,
        offset: options?.offset || 0,
      };

      return await apiService.search(params);
    },
    enabled: query.trim().length >= 2, // Só busca com 2+ caracteres
    staleTime: 30000, // Cache de 30 segundos
    gcTime: 5 * 60 * 1000, // Garbage collection após 5 minutos
    retry: 1, // Apenas 1 retry em caso de erro
    retryDelay: 1000, // 1 segundo entre retries
  });
};

/**
 * Hook para busca de desarquivamentos especificamente
 */
export const useSearchDesarquivamentos = (query: string) => {
  return useGlobalSearch(query, {
    types: ["desarquivamento"],
    limit: 20,
  });
};

/**
 * Hook para busca de usuários especificamente
 */
export const useSearchUsuarios = (query: string) => {
  return useGlobalSearch(query, {
    types: ["usuario"],
    limit: 10,
  });
};

/**
 * Hook para busca de tarefas especificamente
 */
export const useSearchTarefas = (query: string) => {
  return useGlobalSearch(query, {
    types: ["tarefa"],
    limit: 15,
  });
};

/**
 * Hook para busca de projetos especificamente
 */
export const useSearchProjetos = (query: string) => {
  return useGlobalSearch(query, {
    types: ["projeto"],
    limit: 10,
  });
};

/**
 * Hook auxiliar para formatar resultados de busca
 */
export const useFormattedSearchResults = (
  results: SearchResult[] | undefined,
) => {
  if (!results) return [];

  return results.map((result) => ({
    ...result,
    // Adicionar formatações específicas por tipo
    formattedTitle: result.title,
    formattedSubtitle: result.subtitle || "",
    icon: getIconByType(result.type),
    color: getColorByType(result.type),
  }));
};

// Helper functions
const getIconByType = (type: SearchResult["type"]) => {
  const icons = {
    desarquivamento: "FileText",
    usuario: "User",
    tarefa: "CheckSquare",
    projeto: "Kanban",
    custodia: "Shield",
    pasta: "FolderOpen",
  };
  return icons[type] || "Search";
};

const getColorByType = (type: SearchResult["type"]) => {
  const colors = {
    desarquivamento: "blue",
    usuario: "green",
    tarefa: "purple",
    projeto: "orange",
    custodia: "red",
    pasta: "cyan",
  };
  return colors[type] || "gray";
};
