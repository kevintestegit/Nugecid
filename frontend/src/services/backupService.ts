import axios from "axios";
import { api } from "./api";

const BACKUP_OPERATION_TIMEOUT_MS = 10 * 60 * 1000;
const BACKUP_RESTORE_TIMEOUT_MS = 15 * 60 * 1000;

function getBackupErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: string;
  timestamp?: string;
  error?: string;
  duration?: number;
}

export interface SystemSettings {
  autoBackup?: boolean;
  backupFrequency?: string;
  logLevel?: string;
  maintenanceMode?: boolean;
  cacheEnabled?: boolean;
  sessionTimeout?: number;
  twoFactorAuth?: boolean;
  passwordExpiry?: number;
  maxLoginAttempts?: number;
  requireStrongPassword?: boolean;
  [key: string]: unknown;
}

export interface BackupListItem {
  filename: string;
  size: string;
  sizeBytes: number;
  created: string;
  modified: string;
  type: "full" | "desarquivamentos";
  includesFiles: boolean;
}

export interface BackupListResponse {
  total: number;
  backups: BackupListItem[];
}

class BackupService {
  /**
   * Cria um backup completo do banco de dados
   */
  async createFullBackup(): Promise<BackupResult> {
    try {
      const response = await api.post<BackupResult>("/backup/full", undefined, {
        timeout: BACKUP_OPERATION_TIMEOUT_MS,
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        getBackupErrorMessage(error, "Erro ao criar backup completo"),
      );
    }
  }

  /**
   * Cria um backup específico da tabela de desarquivamentos
   */
  async createDesarquivamentoBackup(): Promise<BackupResult> {
    try {
      const response = await api.post<BackupResult>(
        "/backup/desarquivamentos",
        undefined,
        {
          timeout: BACKUP_OPERATION_TIMEOUT_MS,
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        getBackupErrorMessage(
          error,
          "Erro ao criar backup de desarquivamentos",
        ),
      );
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(): Promise<BackupListResponse> {
    try {
      const response = await api.get<BackupListResponse>("/backup/list");
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Erro ao listar backups",
      );
    }
  }

  /**
   * Restaura um backup específico
   */
  async restoreBackup(filename: string): Promise<BackupResult> {
    try {
      const response = await api.post<BackupResult>(
        `/backup/restore/${filename}`,
        undefined,
        {
          timeout: BACKUP_RESTORE_TIMEOUT_MS,
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(getBackupErrorMessage(error, "Erro ao restaurar backup"));
    }
  }

  /**
   * Remove backups antigos (>30 dias)
   */
  async cleanOldBackups(): Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        deletedCount: number;
        message: string;
      }>("/backup/clean", undefined, {
        timeout: BACKUP_OPERATION_TIMEOUT_MS,
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        getBackupErrorMessage(error, "Erro ao limpar backups antigos"),
      );
    }
  }

  /**
   * Busca configurações do sistema
   */
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await api.get<SystemSettings>("/system-settings");
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Erro ao buscar configurações do sistema",
      );
    }
  }

  /**
   * Atualiza configurações do sistema
   */
  async updateSystemSettings(
    settings: Partial<SystemSettings>,
  ): Promise<SystemSettings> {
    try {
      const response = await api.put<SystemSettings>(
        "/system-settings",
        settings,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Erro ao atualizar configurações do sistema",
      );
    }
  }

  /**
   * Reseta configurações para valores padrão
   */
  async resetSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await api.post<SystemSettings>("/system-settings/reset");
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : "Erro ao resetar configurações do sistema",
      );
    }
  }
}

export default new BackupService();
