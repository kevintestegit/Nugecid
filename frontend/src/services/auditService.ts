import { api } from "./api";

export type AuditUser = {
  id: number;
  nome: string;
  usuario: string;
} | null;

export interface AuditEntry {
  id: number;
  action: string;
  actionLabel: string;
  entityName: string;
  entityId: number | null;
  resourceLabel: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  error: string | null;
  timestamp: string;
  user: AuditUser;
}

export interface AuditListResponse {
  data: AuditEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type AuditEnvelope = {
  success: boolean;
  data: AuditEntry[];
  meta: AuditListResponse["meta"];
};

export interface AuditQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  entityName?: string;
  success?: "true" | "false" | "all";
  search?: string;
}

class AuditService {
  async list(params: AuditQueryParams = {}): Promise<AuditListResponse> {
    const normalizedParams = {
      ...params,
      success: params.success === "all" ? undefined : params.success,
    };
    const response = await api.get<AuditEnvelope>("/audit", {
      params: normalizedParams,
    });

    return {
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      meta: response.data?.meta ?? {
        total: 0,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        totalPages: 1,
      },
    };
  }
}

export const auditService = new AuditService();
