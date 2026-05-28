import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { clearAuth } from "@/utils/tokenStorage";
import {
  ApiResponse,
  PaginatedResponse,
  Desarquivamento,
  DesarquivamentoPrintCandidate,
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
  AnexoOcrAnalysis,
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
import { dispatchAuthRequired } from "@/lib/navigation/navigationEvents";

export interface WebPushConfig {
  enabled: boolean;
  publicKey?: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

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
  private static readonly SKIP_AUTH_REDIRECT_HEADER = "X-Skip-Auth-Redirect";
  private static readonly CSRF_COOKIE_NAME = "XSRF-TOKEN";
  private static readonly CSRF_HEADER_NAME = "X-CSRF-Token";

  constructor() {
    this.api = axios.create({
      baseURL: "/api",
      timeout: 30000,
      withCredentials: true,
      headers: {
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor — cookies handle auth; no Bearer header needed
    this.api.interceptors.request.use(
      (config) => {
        const method = config.method?.toUpperCase();
        if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          const csrfToken = this.getCookie(ApiService.CSRF_COOKIE_NAME);
          if (csrfToken) {
            config.headers = config.headers ?? {};
            config.headers[ApiService.CSRF_HEADER_NAME] = csrfToken;
          }
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const requestUrl =
          typeof originalRequest?.url === "string" ? originalRequest.url : "";
        const normalizedRequestUrl = requestUrl.split("?")[0];

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
        if (normalizedRequestUrl === "/auth/login") {
          return Promise.reject(error);
        }

        if (normalizedRequestUrl === "/auth/refresh") {
          apiLogWarn("Falha no refresh token");
          return Promise.reject(error);
        }

        // A checagem inicial de sessão usa /auth/profile e pode retornar 401
        // quando não há cookie JWT (usuário deslogado). Não devemos
        // redirecionar à força nesse caso para evitar loop de recarregamento.
        if (
          normalizedRequestUrl === "/auth/profile" &&
          originalRequest?.headers?.[ApiService.SKIP_AUTH_REDIRECT_HEADER] ===
            "true"
        ) {
          return Promise.reject(error);
        }

        // On 401, clear local state and redirect to login.
        // Token refresh is handled by AuthContext (which holds the
        // refresh token in memory), not here.
        if (error.response?.status === 401) {
          if (window.location.pathname === "/login") {
            return Promise.reject(error);
          }
          clearAuth();
          dispatchAuthRequired({ redirectTo: "/login" });
        }

        return Promise.reject(error);
      },
    );
  }

  private getCookie(name: string): string | undefined {
    if (typeof document === "undefined") {
      return undefined;
    }

    const cookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`));

    if (!cookie) {
      return undefined;
    }

    return decodeURIComponent(cookie.slice(name.length + 1));
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

  async getCurrentUser(options?: {
    skipAuthRedirect?: boolean;
  }): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(
      "/auth/profile",
      {
        headers: options?.skipAuthRedirect
          ? {
              [ApiService.SKIP_AUTH_REDIRECT_HEADER]: "true",
            }
          : undefined,
      },
    );
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ expiresIn: string }>> {
    const response: AxiosResponse<ApiResponse<{ expiresIn: string }>> =
      await this.api.post("/auth/refresh");
    return response.data;
  }

  async getOnlineUsers(): Promise<ApiResponse<User[]>> {
    const response: AxiosResponse<ApiResponse<User[]>> =
      await this.api.get("/auth/online-users");
    return response.data;
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
      const errorInfo = extractAxiosErrorInfo(error);
      apiLogError("getDesarquivamentos error", {
        status: errorInfo.status,
        data: errorInfo.data,
        message: errorInfo.message,
        params,
      });
      throw error;
    }
  }

  async getPrintCandidates(
    params?: Pick<QueryDesarquivamentoDto, "page" | "limit" | "sortBy" | "sortOrder">,
  ): Promise<PaginatedResponse<DesarquivamentoPrintCandidate>> {
    try {
      const response: AxiosResponse<
        PaginatedResponse<DesarquivamentoPrintCandidate>
      > = await this.api.get("/nugecid/impressao/candidatos", { params });
      return response.data;
    } catch (error: unknown) {
      const errorInfo = extractAxiosErrorInfo(error);
      apiLogError("getPrintCandidates error", {
        status: errorInfo.status,
        data: errorInfo.data,
        message: errorInfo.message,
        params,
      });
      throw error;
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

  async getTermoDeEntregaPreviewHtml(id: number): Promise<string> {
    const response: AxiosResponse<string> = await this.api.get(
      `/nugecid/${id}/termo-preview`,
      {
        responseType: "text",
        headers: {
          Accept: "text/html",
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
      apiLogError(" getUsers error:", extractErrorMessage(error));
      // Re-throw so the UI can display a proper error state instead of
      // silently showing an empty list.
      throw error;
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
    const response: AxiosResponse<DeleteResponse | undefined> =
      await this.api.delete(
        `/users/${id}`,
      );
    if (response.data && typeof response.data === "object") {
      return response.data;
    }

    return {
      success: true,
      message: "Usuário desativado com sucesso!",
    };
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

  async getDesarquivamentoAnexoOcrAnalysis(
    desarquivamentoId: number,
    anexoId: number,
  ): Promise<ApiResponse<AnexoOcrAnalysis>> {
    const response: AxiosResponse<ApiResponse<AnexoOcrAnalysis>> =
      await this.api.get(`/nugecid/${desarquivamentoId}/anexos/${anexoId}/ocr`);
    return response.data;
  }

  async getProcessoAnexoOcrAnalysis(
    numeroProcesso: string,
    anexoId: number,
  ): Promise<ApiResponse<AnexoOcrAnalysis>> {
    const response: AxiosResponse<ApiResponse<AnexoOcrAnalysis>> =
      await this.api.get(
        `/nugecid/processo/${encodeURIComponent(numeroProcesso)}/anexos/${anexoId}/ocr`,
      );
    return response.data;
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
      const response: AxiosResponse<
        ApiResponse<SearchResponse> | SearchResponse
      > = await this.api.get("/search", {
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
    desktopEnabled?: boolean;
    pushEnabled?: boolean;
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

  async getWebPushConfig(): Promise<ApiResponse<WebPushConfig>> {
    const response: AxiosResponse<ApiResponse<WebPushConfig>> =
      await this.api.get("/notificacoes/push/config");
    return response.data;
  }

  async savePushSubscription(
    subscription: PushSubscriptionPayload,
  ): Promise<ApiResponse<unknown>> {
    const response: AxiosResponse<ApiResponse<unknown>> = await this.api.post(
      "/notificacoes/push/subscriptions",
      subscription,
    );
    return response.data;
  }

  async deletePushSubscription(endpoint: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(
      "/notificacoes/push/subscriptions",
      {
        data: { endpoint },
      },
    );
    return response.data;
  }

  async sendTestNotification(): Promise<ApiResponse<unknown>> {
    const response: AxiosResponse<ApiResponse<unknown>> = await this.api.post(
      "/notificacoes/teste",
    );
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
