import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  clearAuth,
} from "@/utils/tokenStorage";
import {
  ApiResponse,
  PaginatedResponse,
  Desarquivamento,
  CreateDesarquivamentoDto,
  UpdateDesarquivamentoDto,
  QueryDesarquivamentoDto,
  LoginDto,
  LoginResponse,
  User,
  UserSettings,
  DashboardStats,
  UsersQueryParams,
  UsersResponse,
  UserResponse,
  CreateUserDto,
  UpdateUserDto,
  DeleteResponse,
  DesarquivamentoComment,
  SearchParams,
  SearchResponse,
  RoleSettings,
  DesarquivamentoAnexo,
  IpAccessStat,
  IpAccessDetail,
  BlockedIp,
  BlockedUser,
  UnblockedUser,
  NotificationPreferences,
  Announcement,
  CreateAnnouncementDto,
  AnnouncementStats,
  AnnouncementImageUpload,
  ImportResultDto,
} from "@/types";
import { createLogger } from "@/utils/logger";

const apiLogger = createLogger("ApiService");
const apiLogWarn = (...args: unknown[]) => {
  const [message, ...rest] = args;
  apiLogger.warn(String(message ?? "warning"), rest.length ? rest : undefined);
};
const apiLogError = (...args: unknown[]) => {
  const [message, ...rest] = args;
  apiLogger.error(String(message ?? "error"), rest.length ? rest : undefined);
};

/** Safely extract a human-readable message from an unknown caught value. */
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/** Safely extract Axios response metadata from an unknown caught value. */
function extractAxiosErrorInfo(error: unknown): {
  status?: number;
  data?: unknown;
  message: string;
} {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    };
  }
  return { message: extractErrorMessage(error) };
}

function createEmptySearchResponse(query: string): SearchResponse {
  return {
    results: [],
    total: 0,
    query,
    typesCounts: {},
  };
}

function isSearchResponse(value: unknown): value is SearchResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SearchResponse>;
  return (
    Array.isArray(candidate.results) &&
    typeof candidate.total === "number" &&
    typeof candidate.query === "string"
  );
}

export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: "/api",
      timeout: 10000,
      withCredentials: true,
      headers: {
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Verificar se é erro de conectividade (backend indisponível)
        if (
          error.code === "ERR_NETWORK" ||
          error.message?.includes("ERR_ABORTED") ||
          error.message?.includes("fetch")
        ) {
          apiLogWarn("Backend indisponível - não fazendo logout automático");
          return Promise.reject(error);
        }

        // Não fazer logout em caso de falha no login
        if (originalRequest.url === "/auth/login") {
          return Promise.reject(error);
        }

        // IMPORTANTE: Não tentar renovar token se a requisição original já é de refresh
        // Isso evita loop infinito quando o refresh token está inválido/expirado
        if (originalRequest.url === "/auth/refresh") {
          apiLogWarn("Falha no refresh token - redirecionando para login");
          clearAuth();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              const response = await this.api.post("/auth/refresh", {
                refreshToken,
              });
              const { accessToken } = response.data; // Direct access since backend returns { accessToken, expiresIn }

              setAccessToken(accessToken);

              // Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError: unknown) {
            // Só fazer logout se não for erro de conectividade
            if (
              axios.isAxiosError(refreshError) &&
              refreshError.code !== "ERR_NETWORK" &&
              !refreshError.message?.includes("ERR_ABORTED")
            ) {
              clearAuth();
              window.location.href = "/login";
            } else if (!axios.isAxiosError(refreshError)) {
              // Unknown non-Axios error — still logout to be safe
              clearAuth();
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          }
        }

        // Só fazer logout para 401 se não for erro de conectividade
        if (error.response?.status === 401) {
          clearAuth();
          window.location.href = "/login";
        }

        return Promise.reject(error);
      },
    );
  }

  // Métodos genéricos
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  /** Expose the underlying AxiosInstance for advanced use cases (e.g. raw interceptors). */
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  // Auth endpoints
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post(
      "/auth/login",
      credentials,
    );
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post("/auth/logout");
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> =
      await this.api.get("/auth/profile");
    return response.data;
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string; expiresIn: string }>> {
    const response: AxiosResponse<{ accessToken: string; expiresIn: string }> =
      await this.api.post("/auth/refresh", { refreshToken });
    return {
      success: true,
      data: response.data,
    };
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> =
      await this.api.get("/nugecid/dashboard");
    return response.data;
  }

  // NUGECID endpoints
  async getDesarquivamentos(
    params?: QueryDesarquivamentoDto,
  ): Promise<PaginatedResponse<Desarquivamento>> {
    try {
      const response: AxiosResponse<PaginatedResponse<Desarquivamento>> =
        await this.api.get("/nugecid", { params });
      return response.data;
    } catch (error: unknown) {
      // Log for debugging and return a safe fallback so UI can render gracefully
      // without showing the generic error screen when transient caching/network
      // issues occur (304/Not Modified handled by proxy/browser can surface
      // as errors in some setups).
      // eslint-disable-next-line no-console
      apiLogError(" getDesarquivamentos error:", extractErrorMessage(error));

      return {
        success: false,
        data: [],
        meta: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as PaginatedResponse<Desarquivamento>;
    }
  }

  async getDesarquivamento(id: number): Promise<ApiResponse<Desarquivamento>> {
    const response: AxiosResponse<ApiResponse<Desarquivamento>> =
      await this.api.get(`/nugecid/${id}`);
    return response.data;
  }

  async getDesarquivamentoComments(
    id: number,
  ): Promise<ApiResponse<DesarquivamentoComment[]>> {
    const response: AxiosResponse<ApiResponse<DesarquivamentoComment[]>> =
      await this.api.get(`/nugecid/${id}/comments`);
    return response.data;
  }

  async exportDesarquivamentos(
    params?: Record<string, unknown>,
  ): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(
      "/nugecid/export",
      {
        params,
        responseType: "blob",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      },
    );
    return response.data;
  }

  // Term reports - PDF com cabeçalho/rodapé fixos
  async getTermoDeEntregaPdfFixo(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(
      `/nugecid/${id}/termo-pdf`,
      {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      },
    );
    return response.data;
  }

  // Term reports - PDF padrão (antigo)
  async getTermoDeEntregaPdf(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(
      `/nugecid/${id}/termo`,
      {
        responseType: "blob",
        headers: { Accept: "application/pdf" },
      },
    );
    return response.data;
  }

  async getTermoDeEntregaDocx(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(
      `/nugecid/${id}/termo-docx`,
      {
        responseType: "blob",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      },
    );
    return response.data;
  }

  async addDesarquivamentoComment(
    id: number,
    comment: string,
  ): Promise<ApiResponse<DesarquivamentoComment>> {
    const response: AxiosResponse<ApiResponse<DesarquivamentoComment>> =
      await this.api.post(`/nugecid/${id}/comments`, { comment });
    return response.data;
  }

  async createDesarquivamento(
    data: CreateDesarquivamentoDto,
  ): Promise<ApiResponse<Desarquivamento>> {
    // Importar normalização dinamicamente para evitar circular dependency
    const { normalizeDesarquivamentoData } = await import(
      "@/utils/normalization"
    );
    const normalizedData = normalizeDesarquivamentoData(
      data as unknown as Record<string, unknown>,
    );
    const response: AxiosResponse<ApiResponse<Desarquivamento>> =
      await this.api.post("/nugecid", normalizedData);
    return response.data;
  }

  async updateDesarquivamento(
    id: number,
    data: UpdateDesarquivamentoDto,
  ): Promise<ApiResponse<Desarquivamento>> {
    // Importar normalização dinamicamente
    const { normalizeDesarquivamentoData } = await import(
      "@/utils/normalization"
    );
    const normalizedData = normalizeDesarquivamentoData(
      data as unknown as Record<string, unknown>,
    );

    const response: AxiosResponse<ApiResponse<Desarquivamento>> =
      await this.api.patch(`/nugecid/${id}`, normalizedData);
    return response.data;
  }

  async deleteDesarquivamento(id: string | number): Promise<ApiResponse<void>> {
    try {
      // Validar se o ID é válido
      if (id === null || id === undefined || id === "") {
        throw new Error("ID é obrigatório");
      }

      const idStr = String(id).trim();

      // Converter para número se for string numérica
      let numericId: number;
      if (typeof id === "string") {
        numericId = parseInt(idStr, 10);
        if (isNaN(numericId)) {
          throw new Error(`ID deve ser um número válido. Recebido: '${id}'`);
        }
      } else {
        numericId = id;
      }

      // Validar se é um número positivo
      if (numericId <= 0 || !Number.isInteger(numericId)) {
        throw new Error(
          `ID deve ser um número inteiro positivo maior que zero. Recebido: ${numericId}`,
        );
      }

      // Enviar apenas o ID numérico validado
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(
        `/nugecid/${numericId}`,
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Re-throw com informações mais detalhadas
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            "Erro ao excluir desarquivamento",
        );
      }

      throw error;
    }
  }

  async getDesarquivamentoByBarcode(
    barcode: string,
  ): Promise<ApiResponse<Desarquivamento>> {
    const response: AxiosResponse<ApiResponse<Desarquivamento>> =
      await this.api.get(`/nugecid/barcode/${barcode}`);
    return response.data;
  }

  async importDesarquivamentos(
    file: File,
  ): Promise<ApiResponse<ImportResultDto>> {
    const formData = new FormData();
    formData.append("file", file);

    const response: AxiosResponse<ApiResponse<ImportResultDto>> =
      await this.api.post("/nugecid/import-desarquivamentos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    return response.data;
  }

  // Users endpoints
  async getUsers(params?: UsersQueryParams): Promise<UsersResponse> {
    try {
      const response: AxiosResponse<UsersResponse> = await this.api.get(
        "/users/api",
        { params },
      );
      return response.data;
    } catch (error: unknown) {
      // Log for debugging and return a safe fallback so UI can render gracefully
      // without showing the generic error screen when transient caching/network
      // issues occur (304/Not Modified handled by proxy/browser can surface
      // as errors in some setups).
      // eslint-disable-next-line no-console
      apiLogError(" getUsers error:", extractErrorMessage(error));

      return {
        success: false,
        data: [],
        meta: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as UsersResponse;
    }
  }

  async getUser(id: number): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.get(
      `/users/${id}`,
    );
    return response.data;
  }

  async createUser(data: CreateUserDto): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.post(
      "/users",
      data,
    );
    return response.data;
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.patch(
      `/users/${id}`,
      data,
    );
    return response.data;
  }

  async deleteUser(id: number): Promise<DeleteResponse> {
    const response: AxiosResponse<DeleteResponse> = await this.api.delete(
      `/users/${id}`,
    );
    return response.data;
  }

  async reactivateUser(id: number): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.patch(
      `/users/${id}/reativar`,
    );
    return response.data;
  }

  // Role settings endpoints (admin)
  async getRoleSettings(roleId: number): Promise<ApiResponse<RoleSettings>> {
    const response: AxiosResponse<ApiResponse<RoleSettings>> =
      await this.api.get(`/users/roles/${roleId}/settings`);
    return response.data;
  }

  async updateRoleSettings(
    roleId: number,
    settings: RoleSettings,
  ): Promise<ApiResponse<RoleSettings>> {
    const response: AxiosResponse<ApiResponse<RoleSettings>> =
      await this.api.patch(`/users/roles/${roleId}/settings`, settings);
    return response.data;
  }

  async getMySettings(): Promise<ApiResponse<UserSettings>> {
    const response: AxiosResponse<ApiResponse<UserSettings>> =
      await this.api.get("/users/me/settings");
    return response.data;
  }

  async updateMySettings(
    settings: Partial<UserSettings>,
  ): Promise<ApiResponse<UserSettings>> {
    const response: AxiosResponse<ApiResponse<UserSettings>> =
      await this.api.patch("/users/me/settings", settings);
    return response.data;
  }

  async uploadMyAvatar(
    file: File,
  ): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append("file", file);

    const response: AxiosResponse<ApiResponse<{ avatarUrl: string }>> =
      await this.api.post("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

    return response.data;
  }

  async deleteMyAvatar(): Promise<ApiResponse<{ avatarUrl?: string | null }>> {
    const response: AxiosResponse<ApiResponse<{ avatarUrl?: string | null }>> =
      await this.api.delete("/users/me/avatar");
    return response.data;
  }

  // Lixeira endpoints
  async getDesarquivamentosLixeira(
    params?: QueryDesarquivamentoDto,
  ): Promise<PaginatedResponse<Desarquivamento>> {
    try {
      const response: AxiosResponse<PaginatedResponse<Desarquivamento>> =
        await this.api.get("/nugecid/lixeira", { params });
      return response.data;
    } catch (error: unknown) {
      apiLogError(
        " getDesarquivamentosLixeira error:",
        extractErrorMessage(error),
      );

      return {
        success: false,
        data: [],
        meta: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      } as PaginatedResponse<Desarquivamento>;
    }
  }

  async restoreDesarquivamento(
    id: string | number,
  ): Promise<ApiResponse<Desarquivamento>> {
    try {
      const response: AxiosResponse<ApiResponse<Desarquivamento>> =
        await this.api.patch(`/nugecid/lixeira/${id}/restaurar`);
      return response.data;
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " restoreDesarquivamento error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  async deleteDesarquivamentoPermanente(
    id: string | number,
  ): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(
        `/nugecid/lixeira/${id}/permanente`,
      );
      return response.data;
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " deleteDesarquivamentoPermanente error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  // Anexos de Desarquivamentos
  async getDesarquivamentosAnexos(
    desarquivamentoId: number,
    tipoAnexo?: "desarquivamento" | "rearquivamento",
  ): Promise<ApiResponse<DesarquivamentoAnexo[]>> {
    try {
      const params = tipoAnexo ? { tipo: tipoAnexo } : {};
      const response: AxiosResponse<ApiResponse<DesarquivamentoAnexo[]>> =
        await this.api.get(`/nugecid/${desarquivamentoId}/anexos`, { params });
      return response.data;
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " getDesarquivamentosAnexos error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  async uploadDesarquivamentoAnexo(
    desarquivamentoId: number,
    file: File,
    descricao?: string,
    tipoAnexo?: "desarquivamento" | "rearquivamento",
    anexarAoProcesso?: boolean,
  ): Promise<ApiResponse<DesarquivamentoAnexo>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (descricao) {
        formData.append("descricao", descricao);
      }
      if (tipoAnexo) {
        formData.append("tipoAnexo", tipoAnexo);
      }
      if (anexarAoProcesso !== undefined) {
        formData.append("anexarAoProcesso", String(anexarAoProcesso));
      }

      const response: AxiosResponse<ApiResponse<DesarquivamentoAnexo>> =
        await this.api.post(
          `/nugecid/${desarquivamentoId}/anexos/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      return response.data;
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " uploadDesarquivamentoAnexo error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  async updateDesarquivamentoAnexo(
    desarquivamentoId: number,
    anexoId: number,
    descricao: string,
  ): Promise<ApiResponse<DesarquivamentoAnexo>> {
    try {
      const response: AxiosResponse<ApiResponse<DesarquivamentoAnexo>> =
        await this.api.patch(
          `/nugecid/${desarquivamentoId}/anexos/${anexoId}`,
          { descricao },
        );
      return response.data;
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " updateDesarquivamentoAnexo error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  async downloadDesarquivamentoAnexo(
    desarquivamentoId: number,
    anexoId: number,
  ): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await this.api.get(
        `/nugecid/${desarquivamentoId}/anexos/${anexoId}/download`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " downloadDesarquivamentoAnexo error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  async viewDesarquivamentoAnexo(
    desarquivamentoId: number,
    anexoId: number,
  ): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await this.api.get(
        `/nugecid/${desarquivamentoId}/anexos/${anexoId}/view`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " viewDesarquivamentoAnexo error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  async deleteDesarquivamentoAnexo(
    desarquivamentoId: number,
    anexoId: number,
  ): Promise<void> {
    try {
      await this.api.delete(`/nugecid/${desarquivamentoId}/anexos/${anexoId}`);
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " deleteDesarquivamentoAnexo error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  // Global Search endpoints
  async search(
    params: SearchParams,
    signal?: AbortSignal,
  ): Promise<SearchResponse> {
    try {
      const response: AxiosResponse<ApiResponse<SearchResponse> | SearchResponse> =
        await this.api.get("/search", {
          params,
          signal,
        });
      const payload = response.data;

      if (isSearchResponse(payload)) {
        return payload;
      }

      if (payload && typeof payload === "object" && "data" in payload) {
        const nestedPayload = payload.data;
        if (isSearchResponse(nestedPayload)) {
          return nestedPayload;
        }
      }

      apiLogWarn(" search response with unexpected format:", payload);
      return createEmptySearchResponse(params.query);
    } catch (error: unknown) {
      if (axios.isCancel(error)) {
        // Request cancelado pelo AbortController — não é erro real
        return createEmptySearchResponse(params.query);
      }
      apiLogError(" search error:", extractErrorMessage(error));
      // Propagar o erro para que o chamador possa distinguir "sem resultados" de "falha"
      throw error;
    }
  }

  // Security endpoints
  async getIpAccessStats(
    days: number = 7,
    limit: number = 100,
  ): Promise<ApiResponse<IpAccessStat[]>> {
    try {
      const response: AxiosResponse<ApiResponse<IpAccessStat[]>> =
        await this.api.get("/security/ip-access-stats", {
          params: { days, limit },
        });
      return response.data;
    } catch (error: unknown) {
      apiLogError(" getIpAccessStats error:", extractErrorMessage(error));
      throw error;
    }
  }

  async getIpAccessDetails(
    ipAddress: string,
    days: number = 30,
  ): Promise<ApiResponse<IpAccessDetail[]>> {
    try {
      const response: AxiosResponse<ApiResponse<IpAccessDetail[]>> =
        await this.api.get(`/security/ip-access-details/${ipAddress}`, {
          params: { days },
        });
      return response.data;
    } catch (error: unknown) {
      apiLogError(" getIpAccessDetails error:", extractErrorMessage(error));
      throw error;
    }
  }

  async listBlockedIps(
    includeInactive: boolean = false,
  ): Promise<ApiResponse<BlockedIp[]>> {
    try {
      const response: AxiosResponse<ApiResponse<BlockedIp[]>> =
        await this.api.get("/security/blocked-ips", {
          params: { includeInactive },
        });
      return response.data;
    } catch (error: unknown) {
      apiLogError(" listBlockedIps error:", extractErrorMessage(error));
      throw error;
    }
  }

  async blockIp(
    ipAddress: string,
    reason?: string,
    expiresAt?: string,
  ): Promise<ApiResponse<BlockedIp>> {
    try {
      const response: AxiosResponse<ApiResponse<BlockedIp>> =
        await this.api.post("/security/blocked-ips", {
          ipAddress,
          reason,
          expiresAt,
        });
      return response.data;
    } catch (error: unknown) {
      apiLogError(" blockIp error:", extractErrorMessage(error));
      throw error;
    }
  }

  async unblockIp(ipAddress: string): Promise<ApiResponse<BlockedIp>> {
    try {
      const response: AxiosResponse<ApiResponse<BlockedIp>> =
        await this.api.delete(`/security/blocked-ips/${ipAddress}`);
      return response.data;
    } catch (error: unknown) {
      apiLogError(" unblockIp error:", extractErrorMessage(error));
      throw error;
    }
  }

  async autoBlockSuspiciousIps(config?: {
    failedAttemptsThreshold?: number;
    timeWindowMinutes?: number;
    blockDurationHours?: number;
  }): Promise<ApiResponse<BlockedIp[]>> {
    try {
      const response: AxiosResponse<ApiResponse<BlockedIp[]>> =
        await this.api.post("/security/auto-block", config || {});
      return response.data;
    } catch (error: unknown) {
      apiLogError(" autoBlockSuspiciousIps error:", extractErrorMessage(error));
      throw error;
    }
  }

  // Blocked users endpoints
  async listBlockedUsers(): Promise<ApiResponse<BlockedUser[]>> {
    try {
      const response: AxiosResponse<ApiResponse<BlockedUser[]>> =
        await this.api.get("/security/blocked-users");
      return response.data;
    } catch (error: unknown) {
      apiLogError(" listBlockedUsers error:", extractErrorMessage(error));
      throw error;
    }
  }

  async unblockUser(userId: number): Promise<ApiResponse<UnblockedUser>> {
    try {
      const response: AxiosResponse<ApiResponse<UnblockedUser>> =
        await this.api.delete(`/security/blocked-users/${userId}`);
      return response.data;
    } catch (error: unknown) {
      apiLogError(" unblockUser error:", extractErrorMessage(error));
      throw error;
    }
  }

  async deletePastaArquivo(pastaId: string, arquivoId: string): Promise<void> {
    try {
      await this.api.delete(`/pastas/${pastaId}/arquivos/${arquivoId}`);
    } catch (error: unknown) {
      const errInfo = extractAxiosErrorInfo(error);
      apiLogError(
        " deletePastaArquivo error:",
        errInfo.status,
        errInfo.data || errInfo.message,
      );
      throw error;
    }
  }

  // Notification preferences endpoints
  async getNotificationPreferences(): Promise<
    ApiResponse<NotificationPreferences>
  > {
    const response: AxiosResponse<ApiResponse<NotificationPreferences>> =
      await this.api.get("/notificacoes/preferences");
    return response.data;
  }

  async updateNotificationPreferences(preferences: {
    inAppEnabled?: boolean;
    soundEnabled?: boolean;
    enabledTypes?: Record<string, boolean>;
  }): Promise<ApiResponse<NotificationPreferences>> {
    const response: AxiosResponse<ApiResponse<NotificationPreferences>> =
      await this.api.patch("/notificacoes/preferences", preferences);
    return response.data;
  }

  async resetNotificationPreferences(): Promise<
    ApiResponse<NotificationPreferences>
  > {
    const response: AxiosResponse<ApiResponse<NotificationPreferences>> =
      await this.api.post("/notificacoes/preferences/reset");
    return response.data;
  }

  // System Announcements endpoints
  async getAnnouncements(
    includeInactive = false,
  ): Promise<ApiResponse<Announcement[]>> {
    const response: AxiosResponse<ApiResponse<Announcement[]>> =
      await this.api.get(`/announcements?includeInactive=${includeInactive}`);
    return response.data;
  }

  async getActiveAnnouncements(): Promise<ApiResponse<Announcement[]>> {
    const response: AxiosResponse<ApiResponse<Announcement[]>> =
      await this.api.get("/announcements/active");
    return response.data;
  }

  async getAnnouncement(id: number): Promise<ApiResponse<Announcement>> {
    const response: AxiosResponse<ApiResponse<Announcement>> =
      await this.api.get(`/announcements/${id}`);
    return response.data;
  }

  async createAnnouncement(
    data: CreateAnnouncementDto,
  ): Promise<ApiResponse<Announcement>> {
    const response: AxiosResponse<ApiResponse<Announcement>> =
      await this.api.post("/announcements", data);
    return response.data;
  }

  async updateAnnouncement(
    id: number,
    data: Partial<CreateAnnouncementDto>,
  ): Promise<ApiResponse<Announcement>> {
    const response: AxiosResponse<ApiResponse<Announcement>> =
      await this.api.patch(`/announcements/${id}`, data);
    return response.data;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await this.api.delete(`/announcements/${id}`);
  }

  async markAnnouncementAsViewed(
    id: number,
  ): Promise<ApiResponse<Announcement>> {
    const response: AxiosResponse<ApiResponse<Announcement>> =
      await this.api.post(`/announcements/${id}/mark-viewed`);
    return response.data;
  }

  async getAnnouncementStats(
    id: number,
  ): Promise<ApiResponse<AnnouncementStats>> {
    const response: AxiosResponse<ApiResponse<AnnouncementStats>> =
      await this.api.get(`/announcements/${id}/stats`);
    return response.data;
  }

  async uploadAnnouncementImage(
    formData: FormData,
  ): Promise<ApiResponse<AnnouncementImageUpload>> {
    const response: AxiosResponse<ApiResponse<AnnouncementImageUpload>> =
      await this.api.post("/announcements/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    return response.data;
  }
}

const apiService = new ApiService();
const api = apiService.getAxiosInstance();

export { api, apiService };
