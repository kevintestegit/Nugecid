import { useState, useEffect, useCallback } from 'react';
import { nugecidService } from '../services/nugecidService';

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
  restoreMultiple: (ids: number[]) => Promise<{ success: boolean; restoredCount: number }>;
}

export const useDesarquivamentosExcluidos = (
  params: UseDesarquivamentosExcluidosParams = {}
): UseDesarquivamentosExcluidosReturn => {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDesarquivamentosExcluidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir query parameters
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.tipoDesarquivamento) queryParams.append('tipoDesarquivamento', params.tipoDesarquivamento);
      if (params.dataExclusaoInicio) queryParams.append('dataExclusaoInicio', params.dataExclusaoInicio);
      if (params.dataExclusaoFim) queryParams.append('dataExclusaoFim', params.dataExclusaoFim);
      if (params.status) queryParams.append('status', params.status);
      
      // Adicionar parâmetro para buscar apenas registros excluídos
      queryParams.append('deleted', 'true');

      const response = await fetch(`/api/nugecid?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Erro ao buscar desarquivamentos excluídos:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const restoreDesarquivamento = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/nugecid/${id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Atualizar a lista removendo o item restaurado
      if (data) {
        setData(prev => prev ? {
          ...prev,
          items: prev.items.filter(item => item.id !== id),
          total: prev.total - 1
        } : null);
      }

      return result;
    } catch (err: any) {
      console.error('Erro ao restaurar desarquivamento:', err);
      throw err;
    }
  }, [data]);

  const restoreMultiple = useCallback(async (ids: number[]) => {
    try {
      // Restaurar cada item individualmente
      const promises = ids.map(id => 
        fetch(`/api/nugecid/${id}/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
      );

      const responses = await Promise.all(promises);
      
      // Verificar se todas as requisições foram bem-sucedidas
      const errors: string[] = [];
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          const errorData = await responses[i].json().catch(() => ({}));
          errors.push(`ID ${ids[i]}: ${errorData.message || responses[i].statusText}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(`Alguns itens não puderam ser restaurados:\n${errors.join('\n')}`);
      }

      // Atualizar a lista removendo os itens restaurados
      if (data) {
        setData(prev => prev ? {
          ...prev,
          items: prev.items.filter(item => !ids.includes(item.id)),
          total: prev.total - ids.length
        } : null);
      }

      return { success: true, restoredCount: ids.length };
    } catch (err: any) {
      console.error('Erro ao restaurar múltiplos desarquivamentos:', err);
      throw err;
    }
  }, [data]);

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
