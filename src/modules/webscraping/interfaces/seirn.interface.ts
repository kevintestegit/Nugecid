export interface SeirnResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp?: Date;
  execution_time_ms?: number;
}

export interface SeirnProcesso {
  numero_processo: string;
  ano?: string;
  status?: string;
  tipo?: string;
  data_abertura?: string;
  interessado?: string;
  assunto?: string;
  localizacao?: string;
  observacoes?: string;
  metadata?: Record<string, any>;
}

export interface SeirnOcorrencia {
  numero_ocorrencia: string;
  data_ocorrencia?: string;
  tipo_ocorrencia?: string;
  local?: string;
  vitima?: string;
  autor?: string;
  status?: string;
  descricao?: string;
  delegacia?: string;
  metadata?: Record<string, any>;
}

export interface WebscrapingServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface CacheStatus {
  enabled: boolean;
  healthy: boolean;
  host: string;
  port: number;
}
