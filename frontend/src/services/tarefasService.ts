import { api } from './api'
import type {
  Tarefa,
  CreateTarefaDto,
  UpdateTarefaDto,
  QueryTarefaDto,
  MoveTarefaDto,
  PaginatedResponse,
  ApiResponse,
  HistoricoTarefa,
  TarefaComentario,
  TarefaChecklist,
  TarefaAnexo
} from '@/types'

class TarefasService {
  private baseUrl = '/tarefas'

  // CRUD básico
  async getTarefas(params?: QueryTarefaDto): Promise<PaginatedResponse<Tarefa>> {
    const queryParams = new URLSearchParams()
    
    if (params?.projetoId) queryParams.append('projetoId', params.projetoId.toString())
    if (params?.colunaId) queryParams.append('colunaId', params.colunaId.toString())
    if (params?.responsavelId) queryParams.append('responsavelId', params.responsavelId.toString())
    if (params?.criadorId) queryParams.append('criadorId', params.criadorId.toString())
    if (params?.prioridade) queryParams.append('prioridade', params.prioridade)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params?.incluirExcluidas) queryParams.append('incluirExcluidas', params.incluirExcluidas.toString())

    const response = await api.get<PaginatedResponse<Tarefa>>(
      `${this.baseUrl}?${queryParams.toString()}`
    )
    return response.data
  }

  async getTarefa(id: number): Promise<Tarefa> {
    const response = await api.get<ApiResponse<Tarefa>>(`${this.baseUrl}/${id}`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao buscar tarefa')
    }
    return response.data.data
  }

  async createTarefa(data: CreateTarefaDto): Promise<Tarefa> {
    const response = await api.post<ApiResponse<Tarefa>>(this.baseUrl, data)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao criar tarefa')
    }
    return response.data.data
  }

  async updateTarefa(id: number, data: UpdateTarefaDto): Promise<Tarefa> {
    const response = await api.patch<ApiResponse<Tarefa>>(`${this.baseUrl}/${id}`, data)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao atualizar tarefa')
    }
    return response.data.data
  }

  async deleteTarefa(id: number): Promise<void> {
    const response = await api.delete<ApiResponse>(`${this.baseUrl}/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao excluir tarefa')
    }
  }

  // Operações específicas
  async moveTarefa(id: number, data: MoveTarefaDto): Promise<Tarefa> {
    const response = await api.patch<ApiResponse<Tarefa>>(`${this.baseUrl}/${id}/mover`, data)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao mover tarefa')
    }
    return response.data.data
  }
  async getTarefasAtrasadas(projetoId: number): Promise<Tarefa[]> {
    const response = await api.get<ApiResponse<Tarefa[]>>(
      `${this.baseUrl}/atrasadas?projetoId=${projetoId}`
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao buscar tarefas atrasadas')
    }
    return response.data.data
  }

  async getHistoricoTarefa(id: number): Promise<HistoricoTarefa[]> {
    const response = await api.get<ApiResponse<HistoricoTarefa[]>>(`${this.baseUrl}/${id}/historico`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao buscar histórico da tarefa')
    }
    return response.data.data
  }

  // Comentários
  async getComentarios(tarefaId: number): Promise<TarefaComentario[]> {
    const response = await api.get<ApiResponse<TarefaComentario[]>>(`${this.baseUrl}/${tarefaId}/comentarios`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao buscar comentários')
    }
    return response.data.data
  }

  async createComentario(tarefaId: number, conteudo: string): Promise<TarefaComentario> {
    const response = await api.post<ApiResponse<TarefaComentario>>(
      `${this.baseUrl}/${tarefaId}/comentarios`,
      { conteudo }
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao criar comentário')
    }
    return response.data.data
  }

  async updateComentario(tarefaId: number, comentarioId: number, conteudo: string): Promise<TarefaComentario> {
    const response = await api.patch<ApiResponse<TarefaComentario>>(
      `${this.baseUrl}/${tarefaId}/comentarios/${comentarioId}`,
      { conteudo }
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao atualizar comentário')
    }
    return response.data.data
  }

  async deleteComentario(tarefaId: number, comentarioId: number): Promise<void> {
    const response = await api.delete<ApiResponse>(
      `${this.baseUrl}/${tarefaId}/comentarios/${comentarioId}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao excluir comentário')
    }
  }

  // Checklists
  async getChecklists(tarefaId: number): Promise<TarefaChecklist[]> {
    const response = await api.get<ApiResponse<TarefaChecklist[]>>(`${this.baseUrl}/${tarefaId}/checklists`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao buscar checklists')
    }
    return response.data.data
  }

  async createChecklist(tarefaId: number, titulo: string): Promise<TarefaChecklist> {
    const response = await api.post<ApiResponse<TarefaChecklist>>(
      `${this.baseUrl}/${tarefaId}/checklists`,
      { titulo }
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao criar checklist')
    }
    return response.data.data
  }

  async updateChecklist(tarefaId: number, checklistId: number, titulo: string): Promise<TarefaChecklist> {
    const response = await api.patch<ApiResponse<TarefaChecklist>>(
      `${this.baseUrl}/${tarefaId}/checklists/${checklistId}`,
      { titulo }
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao atualizar checklist')
    }
    return response.data.data
  }

  async deleteChecklist(tarefaId: number, checklistId: number): Promise<void> {
    const response = await api.delete<ApiResponse>(
      `${this.baseUrl}/${tarefaId}/checklists/${checklistId}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao excluir checklist')
    }
  }

  // Anexos
  async getAnexos(tarefaId: number): Promise<TarefaAnexo[]> {
    const response = await api.get<ApiResponse<TarefaAnexo[]>>(`${this.baseUrl}/${tarefaId}/anexos`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao buscar anexos')
    }
    return response.data.data
  }

  async uploadAnexo(tarefaId: number, file: File): Promise<TarefaAnexo> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<ApiResponse<TarefaAnexo>>(
      `${this.baseUrl}/${tarefaId}/anexos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao fazer upload do anexo')
    }
    return response.data.data
  }

  async downloadAnexo(tarefaId: number, anexoId: number): Promise<Blob> {
    const response = await api.get(
      `${this.baseUrl}/${tarefaId}/anexos/${anexoId}/download`,
      { responseType: 'blob' }
    )
    return response.data
  }

  async deleteAnexo(tarefaId: number, anexoId: number): Promise<void> {
    const response = await api.delete<ApiResponse>(
      `${this.baseUrl}/${tarefaId}/anexos/${anexoId}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao excluir anexo')
    }
  }

  // Utilitários
  async duplicarTarefa(id: number): Promise<Tarefa> {
    const response = await api.post<ApiResponse<Tarefa>>(`${this.baseUrl}/${id}/duplicate`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao duplicar tarefa')
    }
    return response.data.data
  }

  async arquivarTarefa(id: number): Promise<Tarefa> {
    const response = await api.patch<ApiResponse<Tarefa>>(`${this.baseUrl}/${id}/archive`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao arquivar tarefa')
    }
    return response.data.data
  }

  async desarquivarTarefa(id: number): Promise<Tarefa> {
    const response = await api.patch<ApiResponse<Tarefa>>(`${this.baseUrl}/${id}/unarchive`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao desarquivar tarefa')
    }
    return response.data.data
  }
}

export const tarefasService = new TarefasService()
export default tarefasService



