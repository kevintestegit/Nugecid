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
  NUGECID_OPERATOR = "nugecid_operator",
  USUARIO = "usuario",
}

export enum PrioridadeTarefa {
  BAIXA = "baixa",
  MEDIA = "media",
  ALTA = "alta",
  CRITICA = "critica",
}

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
  vencidos?: boolean;
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

export interface ApiResponse<T = any> {
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
    accessToken: string;
    refreshToken: string;
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

// Tarefas Types
export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
  criador_id: number;
  data_criacao: string;
  data_atualizacao: string;
  ativo: boolean;
  criador?: User;
  colunas?: Coluna[];
  tarefas?: Tarefa[];
}

export interface Coluna {
  id: number;
  projeto_id: number;
  nome: string;
  cor: string;
  ordem: number;
  data_criacao: string;
  data_atualizacao: string;
  projeto?: Projeto;
  tarefas?: Tarefa[];
}

export interface Tarefa {
  id: number;
  projeto_id: number;
  projetoId?: number;
  coluna_id: number;
  colunaId?: number;
  titulo: string;
  descricao?: string;
  responsavel_id?: number;
  responsavelId?: number;
  responsavel_ids?: number[];
  responsavelIds?: number[];
  criador_id: number;
  criadorId?: number;
  prazo?: string;
  prioridade: PrioridadeTarefa;
  status?: StatusTarefa;
  statusTarefa?: StatusTarefa;
  observacoes?: string;
  ordem: number;
  tags: string[];
  data_criacao: string;
  data_atualizacao: string;
  createdAt?: string;
  updatedAt?: string;
  projeto?: Projeto;
  coluna?: Coluna;
  responsavel?: User;
  responsaveis?: User[];
  criador?: User;
  comentarios?: ComentarioTarefa[];
  historico?: HistoricoTarefa[];
}

export interface ComentarioTarefa {
  id: number;
  tarefa_id: number;
  autor_id: number;
  conteudo: string;
  data_criacao: string;
  data_atualizacao: string;
  tarefa?: Tarefa;
  autor?: User;
}

export interface HistoricoTarefa {
  id: number;
  tarefa_id: number;
  usuario_id: number;
  acao: string;
  campo_alterado?: string;
  valor_anterior?: string;
  valor_novo?: string;
  data_acao: string;
  tarefa?: Tarefa;
  usuario?: User;
}

// DTOs para Tarefas
export interface CreateTarefaDto extends Record<string, unknown> {
  projeto_id?: number;
  coluna_id?: number;
  titulo: string;
  descricao?: string;
  responsavel_id?: number;
  responsavel_ids?: number[];
  responsavelId?: number;
  responsavelIds?: number[];
  prazo?: string;
  prioridade?: PrioridadeTarefa;
  tags?: string[];
}

export interface UpdateTarefaDto
  extends Partial<CreateTarefaDto>,
    Record<string, unknown> {
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
  projeto_id?: number;
  projetoId?: number;
  coluna_id?: number;
  colunaId?: number;
  responsavel_id?: number;
  responsavelId?: number;
  criador_id?: number;
  criadorId?: number;
  prioridade?: PrioridadeTarefa | PrioridadeTarefa[];
  prazo_inicio?: string;
  prazo_fim?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  incluirExcluidas?: boolean;
}

export type TarefaComentario = ComentarioTarefa;

export interface TarefaChecklist {
  id: number;
  tarefaId: number;
  titulo: string;
  itens?: Array<{
    id: number;
    texto: string;
    concluido: boolean;
  }>;
}

export interface TarefaAnexo {
  id: number;
  tarefaId: number;
  nomeArquivo: string;
  caminhoArquivo?: string;
  tipo?: string;
  tamanho?: number;
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
  id: number;
  type:
    | "desarquivamento"
    | "usuario"
    | "tarefa"
    | "projeto"
    | "custodia"
    | "pasta";
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
  relevance?: number;
  matchedFields?: string[];
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
