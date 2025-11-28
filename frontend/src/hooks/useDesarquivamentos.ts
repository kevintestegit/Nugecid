import {
  useQuery,
  useMutation,
  keepPreviousData,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query'
import { apiService } from '@/services/api'
import {
  CreateDesarquivamentoDto,
  UpdateDesarquivamentoDto,
  Desarquivamento,
  PaginatedResponse,
} from '@/types'

const DESARQUIVAMENTOS_QUERY_KEY = 'desarquivamentos'
const DESARQUIVAMENTO_COMMENTS_QUERY_KEY = 'desarquivamento-comments'

/**
 * Hook para buscar uma lista paginada de desarquivamentos.
 */
export const useDesarquivamentos = (
  params: {
    page?: number
    limit?: number
    search?: string
    status?: string | string[]
    tipo?: string
    tipoDesarquivamento?: string | string[]
    dataInicio?: string
    dataFim?: string
  } = {}
): UseQueryResult<PaginatedResponse<Desarquivamento>> => {
  // A API suporta até 100 por página; usar 100 para listar tudo
  const { page = 1, limit = 100, ...filters } = params
  
  // Remove propriedades undefined para evitar cache desnecessário
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined)
  )
  
  // Monta o objeto de parâmetros conforme esperado pela API
  const queryParams = {
    page,
    limit,
    ...cleanFilters
  }
  
  return useQuery({
    queryKey: [DESARQUIVAMENTOS_QUERY_KEY, page, limit, cleanFilters],
    queryFn: () => apiService.getDesarquivamentos(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 0, // Desabilita cache para evitar dados obsoletos
    gcTime: 0, // Remove dados do cache imediatamente
  })
}

/**
 * Hook para buscar um único desarquivamento pelo ID.
 */
export const useDesarquivamento = (id: string | number | null | undefined) => {
  const numericId = Number(id);
  const isIdValid = !!id && !isNaN(numericId) && numericId > 0;

  return useQuery({
    queryKey: [DESARQUIVAMENTOS_QUERY_KEY, id],
    queryFn: () => apiService.getDesarquivamento(numericId),
    enabled: isIdValid,
  })
}

export const useDesarquivamentoComments = (id: number | null | undefined) => {
  const numericId = Number(id)
  const enabled = !!id && !isNaN(numericId) && numericId > 0

  return useQuery({
    queryKey: [DESARQUIVAMENTO_COMMENTS_QUERY_KEY, numericId],
    queryFn: () => apiService.getDesarquivamentoComments(numericId),
    enabled,
  })
}

export const useAddDesarquivamentoComment = (id: number | null | undefined) => {
  const queryClient = useQueryClient()
  const numericId = Number(id)

  return useMutation({
    mutationFn: (comment: string) => apiService.addDesarquivamentoComment(numericId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESARQUIVAMENTO_COMMENTS_QUERY_KEY, numericId] })
    },
  })
}

/**
 * Hook para criar um novo desarquivamento.
 */
export const useCreateDesarquivamento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDesarquivamentoDto) =>
      apiService.createDesarquivamento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESARQUIVAMENTOS_QUERY_KEY] })
    },
  })
}

/**
 * Hook para atualizar um desarquivamento existente.
 */
export const useUpdateDesarquivamento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDesarquivamentoDto }) =>
      apiService.updateDesarquivamento(Number(id), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [DESARQUIVAMENTOS_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [DESARQUIVAMENTOS_QUERY_KEY] })
    },
  })
}

/**
 * Hook para excluir um desarquivamento.
 */
export const useDeleteDesarquivamento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      // Verificação específica para UUID
      const idStr = String(id).trim()
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isUUID = uuidPattern.test(idStr)
      
      if (isUUID) {
        throw new Error(
          `ERRO CRÍTICO: UUID detectado no hook useDeleteDesarquivamento! ` +
          `ID recebido: '${id}' (UUID). ` +
          `Este sistema espera IDs numéricos (ex: 1, 2, 3...). ` +
          `Verifique o componente que está chamando este hook e certifique-se de usar o ID numérico correto do desarquivamento.`
        )
      }
      
      // Verificar se o ID é válido antes de enviar
      if (id === null || id === undefined || id === '') {
        throw new Error('ID não pode ser nulo ou vazio')
      }
      
      // Verificar se contém apenas números
      if (!/^\d+$/.test(idStr)) {
        throw new Error(
          `ID inválido: '${id}'. Deve conter apenas números. ` +
          `Formato esperado: número inteiro positivo (ex: 1, 2, 3...).`
        )
      }
      
      const result = await apiService.deleteDesarquivamento(Number(id))
      
      return result
    },
    onSuccess: (result, deletedId) => {
      // Invalida todas as queries relacionadas a desarquivamentos
      queryClient.invalidateQueries({ 
        queryKey: [DESARQUIVAMENTOS_QUERY_KEY],
        exact: false // Invalida todas as queries que começam com a chave
      })
      
      // Remove o item específico do cache se existir
      queryClient.removeQueries({ 
        queryKey: [DESARQUIVAMENTOS_QUERY_KEY, String(deletedId)]
      })
      
      // Força refetch imediato das queries ativas
      queryClient.refetchQueries({ 
        queryKey: [DESARQUIVAMENTOS_QUERY_KEY],
        type: 'active'
      })
    },
    onError: (error: any, deletedId) => {
      // Erro silencioso - apenas para tratamento
    }
  })
}

/**
 * Hook para buscar itens excluídos (lixeira).
 */
export const useDesarquivamentosLixeira = (
  params: {
    page?: number
    limit?: number
    search?: string
  } = {}
): UseQueryResult<PaginatedResponse<Desarquivamento>> => {
  const { page = 1, limit = 10, ...filters } = params
  
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined)
  )
  
  const queryParams = {
    page,
    limit,
    ...cleanFilters
  }
  
  return useQuery({
    queryKey: ['desarquivamentos-lixeira', page, limit, cleanFilters],
    queryFn: () => apiService.getDesarquivamentosLixeira(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

/**
 * Hook para restaurar um desarquivamento da lixeira.
 */
export const useRestoreDesarquivamento = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      const result = await apiService.restoreDesarquivamento(String(id))
      return result
    },
    onSuccess: (result, restoredId) => {
      // Invalida queries da lixeira e da lista principal
      queryClient.invalidateQueries({ 
        queryKey: ['desarquivamentos-lixeira'],
        exact: false
      })
      
      queryClient.invalidateQueries({ 
        queryKey: [DESARQUIVAMENTOS_QUERY_KEY],
        exact: false
      })
      
      // Força refetch das queries ativas
      queryClient.refetchQueries({ 
        queryKey: ['desarquivamentos-lixeira'],
        type: 'active'
      })
      
      queryClient.refetchQueries({ 
        queryKey: [DESARQUIVAMENTOS_QUERY_KEY],
        type: 'active'
      })
    },
    onError: (error: any, restoredId) => {
      // Erro silencioso - apenas para tratamento
    }
  })
}

/**
 * Hook para buscar estatísticas do dashboard (total, pendentes, por status, etc.).
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => apiService.getDashboardStats(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

/**
 * Hook para fazer download do termo de entrega em PDF.
 */
export const useDownloadTermoPdf = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const blob = await apiService.getTermoDeEntregaPdf(id);

        // Cria URL para download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `termo_de_entrega_${id}.pdf`;

        // Dispara o download
        document.body.appendChild(link);
        link.click();

        // Limpa o URL e remove o link
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return blob;
      } catch (error: any) {
        throw new Error(await extractTermoErrorMessage(error));
      }
    },
  })
}

/**
 * Hook para fazer download do termo de entrega em Word (DOCX).
 */
export const useDownloadTermoDocx = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const blob = await apiService.getTermoDeEntregaDocx(id);

        // Cria URL para download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `termo_de_entrega_${id}.docx`;

        // Dispara o download
        document.body.appendChild(link);
        link.click();

        // Limpa o URL e remove o link
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return blob;
      } catch (error: any) {
        throw new Error(await extractTermoErrorMessage(error));
      }
    },
  })
}

const extractTermoErrorMessage = async (error: any): Promise<string> => {
  const fallback = 'Não foi possível gerar o termo.';

  if (error?.response?.data) {
    const data = error.response.data;

    if (data instanceof Blob) {
      try {
        const text = await data.text();
        try {
          const json = JSON.parse(text);
          return json?.message || fallback;
        } catch {
          return text || fallback;
        }
      } catch {
        return fallback;
      }
    }

    if (typeof data === 'object' && data.message) {
      return data.message;
    }
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return fallback;
};

