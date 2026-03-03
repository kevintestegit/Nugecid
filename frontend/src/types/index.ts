// Local import for types used within this file
import type { Tarefa, PrioridadeTarefa } from "./kanban.types";

// Enums

export enum StatusDesarquivamento {
  FINALIZADO = "FINALIZADO",
  DESARQUIVADO = "DESARQUIVADO",
  NAO_COLETADO = "NAO_COLETADO",
  SOLICITADO = "SOLICITADO",
  REARQUIVAMENTO_SOLICITADO = "REARQUIVAMENTO_SOLICITADO",
  RETIRADO_PELO_SETOR = "RETIRADO_PELO_SETOR",
  NAO_LOCALIZADO = "NAO_LOCALIZADO",
}

export enum TipoDesarquivamento {
  FISICO = "FISICO",
  DIGITAL = "DIGITAL",
  NAO_LOCALIZADO = "NAO_LOCALIZADO",
}

export enum TipoSolicitacao {
  DESARQUIVAMENTO = "DESARQUIVAMENTO",
  COPIA = "COPIA",
  VISTA = "VISTA",
  CERTIDAO = "CERTIDAO",
}

export enum UserRole {
  ADMIN = "admin",
  COORDENADOR = "coordenador",
  /**
   * Papel legado em transição.
   * O frontend deve tratá-lo como compatibilidade temporária, não como papel ativo.
   */
  NUGECID_OPERATOR = "nugecid_operator",
  USUARIO = "usuario",
}

// Re-export PrioridadeTarefa from canonical source (enum, usable as value)
export { PrioridadeTarefa } from "./kanban.types";

/**
 * @deprecated Backend has no `status` field on tarefas.
 * Task status is determined by the Kanban column the task belongs to.
 * This enum is kept for backward compatibility with components that
 * reference it, but the values are never persisted or returned by the API.
 */
export enum StatusTarefa {
  PENDENTE = "pendente",
  EM_ANDAMENTO = "em_andamento",
  CONCLUIDA = "concluida",
  CANCELADA = "cancelada",
}

export interface UserSettings {
  theme?: "light" | "dark";
  showEmail?: boolean;
  showPhone?: boolean;
  autoSave?: boolean;
  compactView?: boolean;
  itemsPerPage?: number;
}

// Interfaces
export interface User {
  id: number;
  nome: string;
  usuario: string;
  email?: string;
  matricula?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  settings?: UserSettings;
  role: {
    id: number;
    name: string;
    description: string;
    permissions: string[];
    settings?: {
      theme?: "light" | "dark";
      notifications?: {
        email?: boolean;
        push?: boolean;
        desktop?: boolean;
        sound?: boolean;
      };
    };
  };
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Desarquivamento {
  id: number;
  codigoBarras?: string;
  numeroSolicitacao: number;
  tipo?: TipoSolicitacao | string;
  tipoDesarquivamento: TipoDesarquivamento;
  desarquivamentoFisicoDigital?: TipoDesarquivamento;
  status: StatusDesarquivamento;
  nomeCompleto: string;
  numeroNicLaudoAuto: string;
  numeroProcesso: string;
  numeroOficio?: string;
  tipoDocumento: string;
  dataSolicitacao: string;
  dataDesarquivamentoSAG?: string;
  dataDevolucaoSetor?: string;
  setorDemandante: string;
  servidorResponsavel: string;
  finalidadeDesarquivamento?: string;
  solicitacaoProrrogacao: boolean;
  solicitacaoProrrogacaoTexto?: string;
  prazoDesarquivamento?: string;
  prazoAtendimento?: string;
  prazoVencimento?: string;
  justificativa?: string;
  dadosAdicionais?: string;
  urgente?: boolean;
  instituto?: string;
  requerente?: string;
  quantidadeItens?: number;
  criadoPorId: number;
  responsavelId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  usuario?: User;
  responsavel?: User;
  comentarios?: DesarquivamentoComment[];
}

export interface DesarquivamentoComment {
  id: number;
  comment: string;
  authorName: string;
  userId?: number | null;
  createdAt: string;
  user?: {
    id: number;
    nome: string;
    usuario: string;
  } | null;
}

// DTOs
export interface CreateDesarquivamentoDto {
  tipoDesarquivamento: string;
  desarquivamentoFisicoDigital?: TipoDesarquivamento;
  status?: StatusDesarquivamento;
  nomeCompleto: string;
  numeroNicLaudoAuto: string;
  numeroProcesso: string;
  numeroOficio?: string;
  tipoDocumento: string;
  dataSolicitacao: string;
  dataDesarquivamentoSAG?: string;
  dataDevolucaoSetor?: string;
  setorDemandante: string;
  servidorResponsavel: string;
  finalidadeDesarquivamento?: string;
  solicitacaoProrrogacao: boolean;
  solicitacaoProrrogacaoTexto?: string;
  dadosAdicionais?: string;
  urgente?: boolean;
  instituto?: string;
  requerente?: string;
}

export interface UpdateDesarquivamentoDto
  extends Partial<CreateDesarquivamentoDto> {
  status?: StatusDesarquivamento;
  dataDesarquivamentoSAG?: string;
  responsavelId?: number;
}

export interface QueryDesarquivamentoDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: StatusDesarquivamento | StatusDesarquivamento[];
  tipoDesarquivamento?: TipoDesarquivamento | TipoDesarquivamento[];
  usuarioId?: number;
  responsavelId?: number;
  dataInicio?: string;
  dataFim?: string;
  urgente?: boolean;
  instituto?: string;
  requerente?: string;
  vencidos?: boolean;
  atencaoNecessaria?: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  incluirExcluidos?: boolean;
  formato?: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth Types
export interface LoginDto {
  usuario: string;
  senha: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    expiresIn: string;
  };
  message: string;
}

// Dashboard Types
export interface DashboardStats {
  totalDesarquivamentos: number;
  pendentes: number;
  emAndamento: number;
  concluidos: number;
  urgentes: number;
  vencidos: number;
  porTipoDesarquivamento: Record<TipoDesarquivamento, number>;
  porStatus: Record<StatusDesarquivamento, number>;
  recentes: Desarquivamento[];
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

// User Management Types
export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  active?: boolean;
  includeDeleted?: boolean;
}

export interface CreateUserDto {
  nome: string;
  usuario: string;
  senha: string;
  role: UserRole;
  matricula?: string | null;
}

export interface UpdateUserDto {
  nome?: string;
  usuario?: string;
  senha?: string;
  role?: UserRole;
  matricula?: string | null;
  ativo?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  meta: PaginationMeta;
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Tarefas/Kanban Types ────────────────────────────────────
// Single source of truth: @/types/kanban.types.ts
// Re-exported here for backward compatibility.
export type {
  Tarefa,
  Coluna,
  Projeto,
  Comentario,
  Anexo,
  Checklist,
  ItemChecklist,
  HistoricoTarefa,
  Usuario,
  MembroProjeto,
  PapelMembro,
  FiltrosKanban,
  EstatisticasKanban,
  WipStatus,
  PrazoStatus,
  PrazoInfo,
} from "./kanban.types";

// Backward-compatible aliases
export type { Comentario as ComentarioTarefa } from "./kanban.types";
export type { Comentario as TarefaComentario } from "./kanban.types";
export type { Anexo as TarefaAnexo } from "./kanban.types";
export type { Checklist as TarefaChecklist } from "./kanban.types";

// ── DTOs para Tarefas ───────────────────────────────────────
export interface CreateTarefaDto {
  projetoId?: number;
  colunaId?: number;
  titulo: string;
  descricao?: string;
  responsavelId?: number;
  responsavelIds?: number[];
  prazo?: string;
  prioridade?: PrioridadeTarefa;
  tags?: string[];
  // Legacy snake_case aliases (some callers may still use these)
  /** @deprecated Use projetoId */
  projeto_id?: number;
  /** @deprecated Use colunaId */
  coluna_id?: number;
  /** @deprecated Use responsavelId */
  responsavel_id?: number;
  /** @deprecated Use responsavelIds */
  responsavel_ids?: number[];
  [key: string]: unknown;
}

export interface UpdateTarefaDto extends Partial<CreateTarefaDto> {
  ordem?: number;
}

export interface MoveTarefaDto {
  colunaId: number;
  ordem?: number;
}

export interface QueryTarefaDto {
  page?: number;
  limit?: number;
  search?: string;
  // Backend QueryTarefaDto uses projeto_id (snake) but colunaId (camel)
  projeto_id?: number;
  projetoId?: number;
  colunaId?: number;
  responsavelId?: number;
  criadorId?: number;
  prioridade?: PrioridadeTarefa | PrioridadeTarefa[];
  prazo_inicio?: string;
  prazo_fim?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  incluirExcluidas?: boolean;
  // Legacy aliases
  /** @deprecated Use colunaId */
  coluna_id?: number;
  /** @deprecated Use responsavelId */
  responsavel_id?: number;
  /** @deprecated Use criadorId */
  criador_id?: number;
}

export interface ImportResultDto {
  fileName: string;
  totalRecords: number;
  totalLines?: number;
  successCount: number;
  errorCount: number;
  processingTime?: string;
  errors?: Array<{
    row?: number;
    line?: number;
    error?: string;
    message?: string;
    data?: unknown;
    details?: unknown;
  }>;
}

export interface CreateProjetoDto {
  nome: string;
  descricao?: string;
  cor?: string;
}

export interface UpdateProjetoDto extends Partial<CreateProjetoDto> {
  ativo?: boolean;
}

// Dashboard de Tarefas
export interface TarefasDashboardStats {
  totalTarefas: number;
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  porPrioridade: Record<PrioridadeTarefa, number>;
  porProjeto: Array<{ projeto: string; total: number }>;
  recentes: Tarefa[];
}

// Global Search Types
export interface SearchResult {
  id: number | string;
  type:
    | "desarquivamento"
    | "usuario"
    | "tarefa"
    | "projeto"
    | "pasta"
    | "vestigio"
    | "notificacao"
    | "planilha";
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface SearchParams {
  query: string;
  types?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  typesCounts?: Record<string, number>;
  data?: SearchResult[];
}

// Role Settings Types
export interface RoleSettings {
  theme?: "light" | "dark";
  notifications?: {
    email?: boolean;
    push?: boolean;
    desktop?: boolean;
    sound?: boolean;
  };
}

// Anexos Types
export interface DesarquivamentoAnexo {
  id: number;
  desarquivamentoId?: number | null;
  numeroProcesso?: string | null;
  usuarioId?: number;
  nomeOriginal: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  tipoMime: string;
  tamanho?: number;
  tamanhoBytes?: number;
  descricao?: string;
  tipoAnexo?: "desarquivamento" | "rearquivamento";
  tipoVinculo?: "processo" | "solicitacao" | "ambos";
  url?: string;
  previewUrl?: string;
  createdAt: string;
  updatedAt?: string;
  usuario?: { id: number; nome: string; usuario: string };
  ocr?: {
    status?: string | null;
    processedAt?: string | null;
    searchablePdfAvailable?: boolean;
    textAvailable?: boolean;
    signedPdfSkipped?: boolean;
    error?: string | null;
    analysisUrl?: string | null;
  };
}

export interface AnexoOcrAnalysis {
  anexoId: number;
  nomeOriginal: string;
  tipoMime: string;
  ocrStatus: string | null;
  processedAt: string | null;
  error: string | null;
  searchablePdfAvailable: boolean;
  textAvailable: boolean;
  rawText: string | null;
  possibleNames: string[];
  signatures: Array<{
    label: string;
    signerName: string | null;
    matchedLine: string;
    context: string[];
    confidence: "high" | "medium" | "low";
  }>;
}

// Security Types
export interface IpUserInfo {
  id: number;
  usuario: string;
  nome: string;
  successfulLogins: number;
  failedLogins: number;
  lastAttempt: string;
}

export interface IpAccessStat {
  ipAddress: string;
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  lastAttempt: string;
  firstAttempt: string;
  userAgents: string[];
  users: IpUserInfo[];
  isBlocked: boolean;
  blockedReason?: string;
  /** @deprecated Use totalAttempts instead */
  accessCount?: number;
  /** @deprecated Use lastAttempt instead */
  lastAccess?: string;
  /** @deprecated Use firstAttempt instead */
  firstAccess?: string;
  /** @deprecated Use userAgents instead */
  userAgent?: string;
}

export interface IpAccessDetail {
  id: number;
  ipAddress: string;
  userId?: number;
  userAgent?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  createdAt: string;
}

export interface BlockedIp {
  id: number;
  ipAddress: string;
  reason: string | null;
  blockedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  attemptsCount: number;
  lastAttemptAt: string | null;
  /** @deprecated Use isActive instead */
  active?: boolean;
}

export interface BlockedUser {
  id: number;
  usuario: string;
  nome: string;
  bloqueadoAte: string;
  tentativasLogin: number;
}

export interface UnblockedUser {
  id: number;
  usuario: string;
  nome: string;
}

// Notification Preferences Types
export interface NotificationPreferences {
  id: number;
  userId: number;
  inAppEnabled: boolean;
  desktopEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  enabledTypes: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

// Announcement Types
export interface Announcement {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  priority: "low" | "medium" | "high" | "critical";
  startDate: string;
  endDate: string;
  active: boolean;
  targetRoles?: string[] | null;
  createdBy?: number | { id: number; nome: string };
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  imageUrl?: string;
  priority: "low" | "medium" | "high" | "critical";
  startDate: string;
  endDate: string;
  active?: boolean;
  targetRoles?: string[];
}

export interface AnnouncementStats {
  totalViews: number;
  uniqueViews: number;
  viewsByDate: Record<string, number>;
}

export interface AnnouncementImageUpload {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
}
