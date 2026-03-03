import { api } from "./api";
import {
  Projeto,
  Coluna,
  Tarefa,
  Checklist,
  ItemChecklist,
  HistoricoTarefa,
} from "../types/kanban.types";

type ApiEnvelope<T> = { data: T; success?: boolean };

const unwrapData = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

const unwrapArrayData = <T>(payload: unknown): T[] => {
  const data = unwrapData<unknown>(payload);
  return Array.isArray(data) ? (data as T[]) : [];
};

// Interfaces para DTOs
interface CreateProjetoDto {
  nome: string;
  descricao?: string;
  cor?: string;
}

interface UpdateProjetoDto {
  nome?: string;
  descricao?: string;
  cor?: string;
  ativo?: boolean;
}

interface CreateColunaDto {
  nome: string;
  cor?: string;
  wipLimit?: number;
  projetoId: number;
  ordem: number;
}

interface UpdateColunaDto {
  nome?: string;
  cor?: string;
  wipLimit?: number;
  ordem?: number;
}

interface CreateTarefaDto {
  titulo: string;
  descricao?: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  prazo?: string;
  tags?: string[];
  responsavelId?: number;
  responsavelIds?: number[];
  projetoId: number;
  colunaId: number;
  ordem: number;
  parentId?: number;
}

interface UpdateTarefaDto {
  titulo?: string;
  descricao?: string;
  prioridade?: "baixa" | "media" | "alta" | "critica";
  prazo?: string;
  tags?: string[];
  responsavelId?: number;
  responsavelIds?: number[];
  colunaId?: number;
  ordem?: number;
  estado?: string;
}

type PapelMembro = "admin" | "editor" | "viewer";

interface ProjetoMembro {
  id: number;
  projetoId?: number;
  usuarioId: number;
  papel: PapelMembro;
  usuario?: {
    id: number;
    nome?: string;
    usuario?: string;
    avatarUrl?: string | null;
  };
}

interface Comentario {
  id: number;
  conteudo: string;
  tarefa_id: number;
  usuario_id: number;
  data_criacao: string;
  data_atualizacao: string;
  usuario: {
    id: number;
    nome: string;
    avatar?: string;
    avatarUrl?: string | null;
  };
}

interface CreateComentarioDto {
  conteudo: string;
  tarefaId: number;
}

interface UpdateComentarioDto {
  conteudo: string;
}

interface AddMembroDto {
  usuarioId: number;
  papel: PapelMembro;
}

interface UpdateMembroDto {
  papel: PapelMembro;
}

interface ProjetoStats {
  totalTarefas: number;
  porColuna: Record<string, number>;
  porPrioridade: Record<string, number>;
  atrasadas: number;
  concluidas: number;
  [key: string]: unknown;
}

interface ColunaStats {
  totalTarefas: number;
  porPrioridade: Record<string, number>;
  atrasadas: number;
  [key: string]: unknown;
}

interface ComentarioEstatisticas {
  total: number;
  porPeriodo?: Record<string, number>;
  porUsuario?: Record<string, number>;
  [key: string]: unknown;
}

interface ComentariosPorPeriodo {
  comentarios: Comentario[];
  total: number;
  [key: string]: unknown;
}

class KanbanService {
  // Projetos
  async getProjetos(): Promise<Projeto[]> {
    const response = await api.get("/projetos");
    return unwrapArrayData<Projeto>(response.data);
  }

  async getProjeto(id: number): Promise<Projeto> {
    const response = await api.get(`/projetos/${id}`);
    return unwrapData<Projeto>(response.data);
  }

  async createProjeto(data: CreateProjetoDto): Promise<Projeto> {
    const response = await api.post("/projetos", data);
    return unwrapData<Projeto>(response.data);
  }

  async updateProjeto(id: number, data: UpdateProjetoDto): Promise<Projeto> {
    const response = await api.patch(`/projetos/${id}`, data);
    return unwrapData<Projeto>(response.data);
  }

  async deleteProjeto(id: number): Promise<void> {
    await api.delete(`/projetos/${id}`);
  }

  async getProjetoStats(id: number): Promise<ProjetoStats> {
    const response = await api.get(`/projetos/${id}/stats`);
    return unwrapData<ProjetoStats>(response.data);
  }

  // Membros do projeto
  async getProjetoMembros(projetoId: number): Promise<ProjetoMembro[]> {
    const response = await api.get(`/projetos/${projetoId}/membros`);
    return unwrapArrayData<ProjetoMembro>(response.data);
  }

  async searchUsuariosParaProjeto(projetoId: number, search?: string) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(
      `/projetos/${projetoId}/membros/lookup${qs}`,
    );
    return unwrapArrayData<{
      id: number;
      nome?: string;
      usuario?: string;
      avatarUrl?: string | null;
    }>(response.data);
  }

  async addProjetoMembro(
    projetoId: number,
    data: AddMembroDto,
  ): Promise<ProjetoMembro> {
    const response = await api.post(`/projetos/${projetoId}/membros`, data);
    return unwrapData<ProjetoMembro>(response.data);
  }

  async updateProjetoMembro(
    projetoId: number,
    membroId: number,
    data: UpdateMembroDto,
  ): Promise<ProjetoMembro> {
    const response = await api.patch(
      `/projetos/${projetoId}/membros/${membroId}`,
      data,
    );
    return unwrapData<ProjetoMembro>(response.data);
  }

  async removeProjetoMembro(
    projetoId: number,
    membroId: number,
  ): Promise<void> {
    await api.delete(`/projetos/${projetoId}/membros/${membroId}`);
  }

  // Colunas
  async getColunas(projetoId: number): Promise<Coluna[]> {
    // Backend expõe GET /colunas?projetoId=...
    const response = await api.get(`/colunas`, {
      params: { projetoId },
    });
    return unwrapArrayData<Coluna>(response.data);
  }

  async getColuna(id: number): Promise<Coluna> {
    const response = await api.get(`/colunas/${id}`);
    return unwrapData<Coluna>(response.data);
  }

  async createColuna(data: CreateColunaDto): Promise<Coluna> {
    const response = await api.post("/colunas", data);
    return unwrapData<Coluna>(response.data);
  }

  async updateColuna(id: number, data: UpdateColunaDto): Promise<Coluna> {
    const response = await api.patch(`/colunas/${id}`, data);
    return unwrapData<Coluna>(response.data);
  }

  async deleteColuna(id: number): Promise<void> {
    await api.delete(`/colunas/${id}`);
  }

  async moveColuna(id: number, ordem: number): Promise<void> {
    await api.patch(`/colunas/${id}/move`, { newOrder: ordem });
  }

  async getColunaStats(id: number): Promise<ColunaStats> {
    const response = await api.get(`/colunas/${id}/stats`);
    return unwrapData<ColunaStats>(response.data);
  }

  // Tarefas
  async getTarefas(projetoId?: number, colunaId?: number): Promise<Tarefa[]> {
    let url = "/tarefas";
    const params = new URLSearchParams();

    if (projetoId) params.append("projeto_id", projetoId.toString());
    if (colunaId) params.append("colunaId", colunaId.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await api.get(url);
    return unwrapArrayData<Tarefa>(response.data);
  }

  async getTarefa(id: number): Promise<Tarefa> {
    const response = await api.get(`/tarefas/${id}`);
    return unwrapData<Tarefa>(response.data);
  }

  async createTarefa(data: CreateTarefaDto): Promise<Tarefa> {
    const response = await api.post("/tarefas", data);
    return unwrapData<Tarefa>(response.data);
  }

  async updateTarefa(id: number, data: UpdateTarefaDto): Promise<Tarefa> {
    const response = await api.patch(`/tarefas/${id}`, data);
    return unwrapData<Tarefa>(response.data);
  }

  async deleteTarefa(id: number): Promise<void> {
    await api.delete(`/tarefas/${id}`);
  }

  async moveTarefa(id: number, colunaId: number, ordem: number): Promise<void> {
    await api.patch(`/tarefas/${id}/mover`, { colunaId, ordem });
  }

  async reorderTarefas(colunaId: number, tarefaIds: number[]): Promise<void> {
    // NOTA: Backend não possui endpoint /colunas/:id/reorder-tasks.
    // Reordenação é feita movendo tarefas individualmente via /tarefas/:id/mover.
    for (let i = 0; i < tarefaIds.length; i++) {
      await api.patch(`/tarefas/${tarefaIds[i]}/mover`, {
        colunaId,
        ordem: i,
      });
    }
  }

  async getTarefasAtrasadas(projetoId: number): Promise<Tarefa[]> {
    const url = `/tarefas/atrasadas/${projetoId}`;
    const response = await api.get(url);
    return unwrapArrayData<Tarefa>(response.data);
  }

  async getTarefaHistorico(id: number): Promise<HistoricoTarefa[]> {
    const response = await api.get(`/tarefas/${id}/historico`);
    return unwrapArrayData<HistoricoTarefa>(response.data);
  }

  // Checklists
  async getChecklists(tarefaId: number): Promise<Checklist[]> {
    const response = await api.get(`/tarefas/${tarefaId}/checklists`);
    return unwrapArrayData<Checklist>(response.data);
  }

  async createChecklist(tarefaId: number, titulo: string): Promise<Checklist> {
    const response = await api.post(`/tarefas/${tarefaId}/checklists`, {
      titulo,
    });
    return unwrapData<Checklist>(response.data);
  }

  async deleteChecklist(id: number): Promise<void> {
    await api.delete(`/checklists/${id}`);
  }

  async addChecklistItem(
    checklistId: number,
    texto: string,
  ): Promise<ItemChecklist> {
    const response = await api.post(`/checklists/${checklistId}/itens`, {
      texto,
    });
    return unwrapData<ItemChecklist>(response.data);
  }

  async updateChecklistItem(
    itemId: number,
    data: { texto?: string; concluido?: boolean },
  ): Promise<ItemChecklist> {
    const response = await api.patch(`/checklists/itens/${itemId}`, data);
    return unwrapData<ItemChecklist>(response.data);
  }

  async deleteChecklistItem(itemId: number): Promise<void> {
    await api.delete(`/checklists/itens/${itemId}`);
  }

  // Comentários
  async getComentarios(tarefaId: number): Promise<Comentario[]> {
    const response = await api.get(`/comentarios`, { params: { tarefaId } });
    return unwrapArrayData<Comentario>(response.data);
  }

  async getComentario(id: number): Promise<Comentario> {
    const response = await api.get(`/comentarios/${id}`);
    return unwrapData<Comentario>(response.data);
  }

  async createComentario(data: CreateComentarioDto): Promise<Comentario> {
    const response = await api.post("/comentarios", data);
    return unwrapData<Comentario>(response.data);
  }

  async updateComentario(
    id: number,
    data: UpdateComentarioDto,
  ): Promise<Comentario> {
    const response = await api.patch(`/comentarios/${id}`, data);
    return unwrapData<Comentario>(response.data);
  }

  async deleteComentario(id: number): Promise<void> {
    await api.delete(`/comentarios/${id}`);
  }

  async getComentariosEstatisticas(
    tarefaId: number,
  ): Promise<ComentarioEstatisticas> {
    const url = `/comentarios/tarefa/${tarefaId}/estatisticas`;
    const response = await api.get(url);
    return unwrapData<ComentarioEstatisticas>(response.data);
  }

  async getComentariosPorPeriodo(
    inicio: string,
    fim: string,
    tarefaId?: number,
  ): Promise<ComentariosPorPeriodo> {
    let url = "/comentarios/periodo";
    const params = new URLSearchParams();

    params.append("dataInicio", inicio);
    params.append("dataFim", fim);
    if (tarefaId) params.append("tarefaId", tarefaId.toString());

    url += `?${params.toString()}`;

    const response = await api.get(url);
    return unwrapData<ComentariosPorPeriodo>(response.data);
  }
}

export const kanbanService = new KanbanService();
export type {
  CreateProjetoDto,
  UpdateProjetoDto,
  CreateColunaDto,
  UpdateColunaDto,
  CreateTarefaDto,
  UpdateTarefaDto,
  ProjetoMembro,
  AddMembroDto,
  UpdateMembroDto,
  Comentario,
  CreateComentarioDto,
  UpdateComentarioDto,
  PapelMembro,
  ProjetoStats,
  ColunaStats,
  ComentarioEstatisticas,
  ComentariosPorPeriodo,
};
