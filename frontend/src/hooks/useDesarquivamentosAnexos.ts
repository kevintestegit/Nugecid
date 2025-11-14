import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query'
import { apiService } from '@/services/api'

const DESARQUIVAMENTOS_ANEXOS_QUERY_KEY = 'desarquivamentos-anexos'

export interface DesarquivamentoAnexo {
  id: number
  desarquivamentoId: number | null
  numeroProcesso?: string | null
  usuarioId: number
  nomeOriginal: string
  nomeArquivo: string
  caminhoArquivo: string
  tipoMime: string
  tamanhoBytes: number
  descricao?: string
  tipoAnexo: 'desarquivamento' | 'rearquivamento'
  tipoVinculo?: 'processo' | 'solicitacao' | 'ambos'
  createdAt: string
  usuario?: {
    id: number
    nome: string
    usuario: string
  }
  url?: string
  previewUrl?: string
}

/**
 * Hook para buscar anexos de um desarquivamento
 */
export const useDesarquivamentosAnexos = (
  desarquivamentoId: number | null | undefined,
  tipoAnexo?: 'desarquivamento' | 'rearquivamento',
): UseQueryResult<DesarquivamentoAnexo[]> => {
  const numericId = Number(desarquivamentoId)
  const isIdValid = !!desarquivamentoId && !isNaN(numericId) && numericId > 0

  return useQuery({
    queryKey: [DESARQUIVAMENTOS_ANEXOS_QUERY_KEY, numericId, tipoAnexo],
    queryFn: async () => {
      const response = await apiService.getDesarquivamentosAnexos(numericId, tipoAnexo)
      return response.data ?? []
    },
    enabled: isIdValid,
  })
}

/**
 * Hook para fazer upload de anexo
 */
export const useUploadDesarquivamentoAnexo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ desarquivamentoId, file, descricao, tipoAnexo, anexarAoProcesso }: { 
      desarquivamentoId: number
      file: File
      descricao?: string
      tipoAnexo?: 'desarquivamento' | 'rearquivamento'
      anexarAoProcesso?: boolean
    }) =>
      apiService.uploadDesarquivamentoAnexo(desarquivamentoId, file, descricao, tipoAnexo, anexarAoProcesso),
    onSuccess: (result, variables) => {
      // Invalida apenas a query específica do tipo de anexo que foi enviado
      queryClient.invalidateQueries({
        queryKey: [DESARQUIVAMENTOS_ANEXOS_QUERY_KEY, variables.desarquivamentoId, variables.tipoAnexo || 'desarquivamento']
      })
    },
  })
}

/**
 * Hook para atualizar descrição de anexo
 */
export const useUpdateDesarquivamentoAnexo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ desarquivamentoId, anexoId, descricao }: { desarquivamentoId: number; anexoId: number; descricao: string }) =>
      apiService.updateDesarquivamentoAnexo(desarquivamentoId, anexoId, descricao),
    onSuccess: (result, variables) => {
      // Invalida todas as queries de anexos deste desarquivamento (ambos os tipos)
      queryClient.invalidateQueries({
        queryKey: [DESARQUIVAMENTOS_ANEXOS_QUERY_KEY, variables.desarquivamentoId]
      })
    },
  })
}

/**
 * Hook para fazer download de anexo
 */
export const useDownloadDesarquivamentoAnexo = () => {
  return useMutation({
    mutationFn: ({ desarquivamentoId, anexoId }: { desarquivamentoId: number; anexoId: number }) =>
      apiService.downloadDesarquivamentoAnexo(desarquivamentoId, anexoId),
  })
}

/**
 * Hook para deletar anexo
 */
export const useDeleteDesarquivamentoAnexo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ desarquivamentoId, anexoId }: { desarquivamentoId: number; anexoId: number }) =>
      apiService.deleteDesarquivamentoAnexo(desarquivamentoId, anexoId),
    onSuccess: (result, variables) => {
      // Invalida todas as queries de anexos deste desarquivamento (ambos os tipos)
      queryClient.invalidateQueries({
        queryKey: [DESARQUIVAMENTOS_ANEXOS_QUERY_KEY, variables.desarquivamentoId]
      })
    },
  })
}

/**
 * Hook para visualizar anexo
 */
export const useViewDesarquivamentoAnexo = () => {
  return useMutation({
    mutationFn: ({ desarquivamentoId, anexoId }: { desarquivamentoId: number; anexoId: number }) =>
      apiService.viewDesarquivamentoAnexo(desarquivamentoId, anexoId),
  })
}
