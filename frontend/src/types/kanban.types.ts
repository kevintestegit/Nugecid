// ============================================================
// Single source of truth for all Tarefas/Kanban types.
// Other files (types/index.ts, KanbanColumn.tsx, KanbanBoard.tsx)
// re-export from here — do NOT duplicate these interfaces.
// ============================================================

// ── Prioridade ──────────────────────────────────────────────
export enum PrioridadeTarefa {
  BAIXA = "baixa",
  MEDIA = "media",
  ALTA = "alta",
  CRITICA = "critica",
}

// ── Usuario (lightweight, for relations inside Kanban) ──────
export interface Usuario {
  id: number;
  nome?: string;
  usuario?: string;
  email?: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  matricula?: string | null;
}

// ── Tarefa ──────────────────────────────────────────────────
export interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string;
  observacoes?: string;
  prazo?: string;
  prioridade: PrioridadeTarefa;
  ordem: number;
  tags?: string[];
  parentId?: number | null;

  // Canonical (camelCase — matches backend response)
  projetoId: number;
  colunaId: number;
  criadorId: number;
  responsavelId?: number;
  responsavelIds?: number[];
  createdAt: string;
  updatedAt: string;

  // Phantom status fields — backend has NO status column; status is determined
  // by the Kanban column name. Kept for backward compat with components that
  // reference them (e.g., TarefaCard, DetalheTarefaPage).
  /** @deprecated Status is determined by column name, not this field */
  status?: string;
  /** @deprecated Status is determined by column name, not this field */
  statusTarefa?: string;

  // Legacy snake_case aliases (backward compat — backend never sends these,
  // but existing code may reference them via ?? coalescing)
  /** @deprecated Use projetoId */
  projeto_id?: number;
  /** @deprecated Use colunaId */
  coluna_id?: number;
  /** @deprecated Use criadorId */
  criador_id?: number;
  /** @deprecated Use responsavelId */
  responsavel_id?: number;
  /** @deprecated Use responsavelIds */
  responsavel_ids?: number[];
  /** @deprecated Use createdAt */
  data_criacao?: string;
  /** @deprecated Use updatedAt */
  data_atualizacao?: string;

  // Relações
  responsavel?: Usuario;
  responsaveis?: Usuario[];
  coluna?: Coluna;
  projeto?: Projeto;
  criador?: Usuario;
  comentarios?: Comentario[];
  anexos?: Anexo[];
  checklists?: Checklist[];
  subtarefas?: Tarefa[];
  historico?: HistoricoTarefa[];
}

// ── Coluna ──────────────────────────────────────────────────
export interface Coluna {
  id: number;
  nome: string;
  cor?: string;
  ordem: number;
  ativa?: boolean;

  // Canonical
  projetoId: number;
  wipLimit?: number;
  createdAt?: string;
  updatedAt?: string;

  // Legacy aliases
  /** @deprecated Use projetoId */
  projeto_id?: number;
  /** @deprecated Use wipLimit */
  limite_wip?: number;
  /** @deprecated Use createdAt */
  data_criacao?: string;
  /** @deprecated Use updatedAt */
  data_atualizacao?: string;

  // Relações
  projeto?: Projeto;
  tarefas?: Tarefa[];
}

// ── Projeto ─────────────────────────────────────────────────
export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  ativo?: boolean;
  status?: string;
  progresso?: number;
  dataInicio?: string;
  dataFim?: string;
  createdAt?: string;
  updatedAt?: string;

  // Legacy aliases
  /** @deprecated Use createdAt */
  data_criacao?: string;
  /** @deprecated Use updatedAt */
  data_atualizacao?: string;
  /** @deprecated Not used — criador relation preferred */
  criador_id?: number;
  /** @deprecated Use createdAt */
  created_at?: string;
  /** @deprecated Use updatedAt */
  updated_at?: string;

  // Relações
  criador?: Usuario;
  membros?: MembroProjeto[];
  colunas?: Coluna[];
  tarefas?: Tarefa[];
}

// ── Comentario ──────────────────────────────────────────────
export interface Comentario {
  id: number;
  tarefaId: number;
  usuarioId: number;
  conteudo: string;
  createdAt: string;
  updatedAt: string;
  usuario?: Usuario;

  // Legacy aliases
  /** @deprecated Use tarefaId */
  tarefa_id?: number;
  /** @deprecated Use usuarioId — old schema called it autor_id */
  autor_id?: number;
  /** @deprecated Use createdAt */
  data_criacao?: string;
  /** @deprecated Use updatedAt */
  data_atualizacao?: string;

  // Legacy relation aliases
  tarefa?: Tarefa;
  /** @deprecated Use usuario */
  autor?: Usuario;
}

// ── Anexo ───────────────────────────────────────────────────
export interface Anexo {
  id: number;
  tarefaId: number;
  nomeArquivo: string;
  caminhoArquivo?: string;
  tamanho?: number;
  tipo?: string;
  createdAt: string;
}

// ── Checklist ───────────────────────────────────────────────
export interface Checklist {
  id: number;
  tarefaId: number;
  titulo: string;
  itens: ItemChecklist[];
}

export interface ItemChecklist {
  id: number;
  checklistId: number;
  texto: string;
  concluido: boolean;
  ordem: number;
  concluidoPorId?: number;
  concluidoEm?: string;
  concluidoPor?: Usuario;
}

// ── Histórico ───────────────────────────────────────────────
export interface HistoricoTarefa {
  id: number;
  tarefaId: number;
  usuarioId: number;
  acao: string;
  createdAt: string;
  usuario?: Usuario;

  // Canonical
  campoAlterado?: string;
  valorAnterior?: string;
  valorNovo?: string;

  // Legacy aliases
  /** @deprecated Use tarefaId */
  tarefa_id?: number;
  /** @deprecated Use usuarioId */
  usuario_id?: number;
  /** @deprecated Use campoAlterado */
  campo_alterado?: string;
  /** @deprecated Use valorAnterior */
  valor_anterior?: string;
  /** @deprecated Use valorNovo */
  valor_novo?: string;
  /** @deprecated Use createdAt */
  data_acao?: string;

  tarefa?: Tarefa;
}

// ── Filtros Kanban ──────────────────────────────────────────
export interface FiltrosKanban {
  projetoId?: number;
  responsavelId?: number;
  prioridade?: PrioridadeTarefa;
  tags?: string[];
  prazo?: "atrasadas" | "hoje" | "semana" | "mes" | "sem_prazo";
  busca?: string;
  agruparPor?: "responsavel" | "prioridade" | "prazo" | "tags";
  comComentarios?: boolean;
  comAnexos?: boolean;
}

// ── Estatísticas Kanban ─────────────────────────────────────
export interface EstatisticasKanban {
  total: number;
  porPrioridade: Record<string, number>;
  porStatus: Record<string, number>;
  atrasadas: number;
  semPrazo: number;
}

// ── WIP ─────────────────────────────────────────────────────
export interface WipStatus {
  count: number;
  limit: number | null;
  exceeded: boolean;
}

// ── Membros ─────────────────────────────────────────────────
export type PapelMembro = "admin" | "editor" | "viewer";

export interface MembroProjeto {
  id?: number;
  projetoId?: number;
  usuarioId?: number;
  papel?: PapelMembro;
  usuario?: Usuario;
}

// ── Prazo helpers ───────────────────────────────────────────
export enum PrazoStatus {
  OK = "ok",
  PROXIMO = "proximo",
  ATRASADO = "atrasado",
  SEM_PRAZO = "sem_prazo",
}

export interface PrazoInfo {
  status: PrazoStatus;
  dias: number | null;
  cor: string;
  label: string;
}
