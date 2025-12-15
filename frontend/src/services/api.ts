import axios, { AxiosInstance, AxiosResponse } from 'axios'
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
  SearchResponse
} from '@/types'


export class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Verificar se é erro de conectividade (backend indisponível)
        if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_ABORTED') || error.message?.includes('fetch')) {
          console.warn('Backend indisponível - não fazendo logout automático')
          return Promise.reject(error)
        }

        // Não fazer logout em caso de falha no login
        if (originalRequest.url === '/auth/login') {
          return Promise.reject(error)
        }

        // IMPORTANTE: Não tentar renovar token se a requisição original já é de refresh
        // Isso evita loop infinito quando o refresh token está inválido/expirado
        if (originalRequest.url === '/auth/refresh') {
          console.warn('Falha no refresh token - redirecionando para login')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await this.api.post('/auth/refresh', { refreshToken })
              const { accessToken } = response.data // Direct access since backend returns { accessToken, expiresIn }

              localStorage.setItem('accessToken', accessToken)

              // Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              return this.api(originalRequest)
            }
          } catch (refreshError: any) {
            // Só fazer logout se não for erro de conectividade
            if (refreshError.code !== 'ERR_NETWORK' && !refreshError.message?.includes('ERR_ABORTED')) {
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          }
        }

        // Só fazer logout para 401 se não for erro de conectividade
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }

        return Promise.reject(error)
      }
    )
  }

  // Métodos genéricos
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config)
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config)
  }

  // Auth endpoints
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials)
    return response.data
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout')
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/profile')
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; expiresIn: string }>> {
    const response: AxiosResponse<{ accessToken: string; expiresIn: string }> = await this.api.post('/auth/refresh', { refreshToken })
    return {
      success: true,
      data: response.data
    }
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await this.api.get('/nugecid/dashboard')
    return response.data
  }

  // NUGECID endpoints
  async getDesarquivamentos(params?: QueryDesarquivamentoDto): Promise<PaginatedResponse<Desarquivamento>> {
    try {
      const response: AxiosResponse<PaginatedResponse<Desarquivamento>> = await this.api.get('/nugecid', { params })
      return response.data
    } catch (error: any) {
      // Log for debugging and return a safe fallback so UI can render gracefully
      // without showing the generic error screen when transient caching/network
      // issues occur (304/Not Modified handled by proxy/browser can surface
      // as errors in some setups).
      // eslint-disable-next-line no-console
      console.error(' getDesarquivamentos error:', error?.message || error)

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
      } as PaginatedResponse<Desarquivamento>
    }
  }

  async getDesarquivamento(id: number): Promise<ApiResponse<Desarquivamento>> {
    const response: AxiosResponse<ApiResponse<Desarquivamento>> = await this.api.get(`/nugecid/${id}`)
    return response.data
  }

  async getDesarquivamentoComments(id: number): Promise<ApiResponse<DesarquivamentoComment[]>> {
    const response: AxiosResponse<ApiResponse<DesarquivamentoComment[]>> = await this.api.get(`/nugecid/${id}/comments`)
    return response.data
  }

  async exportDesarquivamentos(params?: Record<string, any>): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get('/nugecid/export', {
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
    return response.data
  }

  // Term reports - PDF com cabeçalho/rodapé fixos
  async getTermoDeEntregaPdfFixo(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/nugecid/${id}/termo-pdf`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    })
    return response.data
  }

  // Term reports - PDF padrão (antigo)
  async getTermoDeEntregaPdf(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/nugecid/${id}/termo`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
    return response.data
  }

  async getTermoDeEntregaDocx(id: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(`/nugecid/${id}/termo-docx`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    })
    return response.data
  }

  async addDesarquivamentoComment(id: number, comment: string): Promise<ApiResponse<DesarquivamentoComment>> {
    const response: AxiosResponse<ApiResponse<DesarquivamentoComment>> = await this.api.post(`/nugecid/${id}/comments`, { comment })
    return response.data
  }

  async createDesarquivamento(data: CreateDesarquivamentoDto): Promise<ApiResponse<Desarquivamento>> {
    // Importar normalização dinamicamente para evitar circular dependency
    const { normalizeDesarquivamentoData } = await import('@/utils/normalization')
    const normalizedData = normalizeDesarquivamentoData(data)
    const response: AxiosResponse<ApiResponse<Desarquivamento>> = await this.api.post('/nugecid', normalizedData)
    return response.data
  }

  async updateDesarquivamento(id: number, data: UpdateDesarquivamentoDto): Promise<ApiResponse<Desarquivamento>> {
    // Importar normalização dinamicamente
    const { normalizeDesarquivamentoData } = await import('@/utils/normalization')
    const normalizedData = normalizeDesarquivamentoData(data)
    
    const response: AxiosResponse<ApiResponse<Desarquivamento>> = await this.api.patch(`/nugecid/${id}`, normalizedData)
    return response.data
  }

  async deleteDesarquivamento(id: string | number): Promise<ApiResponse<void>> {
    try {
      // Validar se o ID é válido
      if (id === null || id === undefined || id === '') {
        throw new Error('ID é obrigatório');
      }
      
      const idStr = String(id).trim();
      
      // Converter para número se for string numérica
      let numericId: number;
      if (typeof id === 'string') {
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
          `ID deve ser um número inteiro positivo maior que zero. Recebido: ${numericId}`
        );
      }
      
      // Enviar apenas o ID numérico validado
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/nugecid/${numericId}`);
      
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError && axios.isAxiosError(error)) {
        // Re-throw com informações mais detalhadas
        throw new Error(
          error.response?.data?.message || 
          error.message || 
          'Erro ao excluir desarquivamento'
        );
      }
      
      throw error;
    }
  }

  async getDesarquivamentoByBarcode(barcode: string): Promise<ApiResponse<Desarquivamento>> {
    const response: AxiosResponse<ApiResponse<Desarquivamento>> = await this.api.get(`/nugecid/barcode/${barcode}`)
    return response.data
  }

  async importDesarquivamentos(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/nugecid/import-desarquivamentos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Users endpoints
  async getUsers(params?: UsersQueryParams): Promise<UsersResponse> {
    try {
      const response: AxiosResponse<UsersResponse> = await this.api.get('/users/api', { params })
      return response.data
    } catch (error: any) {
      // Log for debugging and return a safe fallback so UI can render gracefully
      // without showing the generic error screen when transient caching/network
      // issues occur (304/Not Modified handled by proxy/browser can surface
      // as errors in some setups).
      // eslint-disable-next-line no-console
      console.error(' getUsers error:', error?.message || error)

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
      } as UsersResponse
    }
  }

  async getUser(id: number): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.get(`/users/${id}`)
    return response.data
  }

  async createUser(data: CreateUserDto): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.post('/users', data)
    return response.data
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.patch(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: number): Promise<DeleteResponse> {
    const response: AxiosResponse<DeleteResponse> = await this.api.delete(`/users/${id}`)
    return response.data
  }

  async reactivateUser(id: number): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.api.patch(`/users/${id}/reativar`)
    return response.data
  }

  // Role settings endpoints (admin)
  async getRoleSettings(roleId: number): Promise<ApiResponse<{ theme?: 'light' | 'dark'; notifications?: { email?: boolean; push?: boolean; desktop?: boolean; sound?: boolean } }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/users/roles/${roleId}/settings`)
    return response.data
  }

  async updateRoleSettings(roleId: number, settings: { theme?: 'light' | 'dark'; notifications?: { email?: boolean; push?: boolean; desktop?: boolean; sound?: boolean } }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.patch(`/users/roles/${roleId}/settings`, settings)
    return response.data
  }

  async getMySettings(): Promise<ApiResponse<UserSettings>> {
    const response: AxiosResponse<ApiResponse<UserSettings>> = await this.api.get('/users/me/settings')
    return response.data
  }

  async updateMySettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    const response: AxiosResponse<ApiResponse<UserSettings>> = await this.api.patch('/users/me/settings', settings)
    return response.data
  }

  async uploadMyAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse<ApiResponse<{ avatarUrl: string }>> = await this.api.post(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data
  }

  async deleteMyAvatar(): Promise<ApiResponse<{ avatarUrl?: string | null }>> {
    const response: AxiosResponse<ApiResponse<{ avatarUrl?: string | null }>> = await this.api.delete(
      '/users/me/avatar',
    )
    return response.data
  }

  // Lixeira endpoints
  async getDesarquivamentosLixeira(params?: QueryDesarquivamentoDto): Promise<PaginatedResponse<Desarquivamento>> {
    try {
      const response: AxiosResponse<PaginatedResponse<Desarquivamento>> = await this.api.get('/nugecid/lixeira', { params })
      return response.data
    } catch (error: any) {
      console.error(' getDesarquivamentosLixeira error:', error?.message || error)

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
      } as PaginatedResponse<Desarquivamento>
    }
  }

  async restoreDesarquivamento(id: string | number): Promise<ApiResponse<Desarquivamento>> {
    try {
      const response: AxiosResponse<ApiResponse<Desarquivamento>> = await this.api.patch(`/nugecid/lixeira/${id}/restaurar`)
      console.log(' restoreDesarquivamento response:', response.status, response.data)
      return response.data
    } catch (error: any) {
      console.error(' restoreDesarquivamento error:', error?.response?.status, error?.response?.data || error?.message)
      throw error
    }
  }

  async deleteDesarquivamentoPermanente(id: string | number): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/nugecid/lixeira/${id}/permanente`);
      return response.data;
    } catch (error: any) {
      console.error(' deleteDesarquivamentoPermanente error:', error?.response?.status, error?.response?.data || error?.message)
      throw error;
    }
  }

  // Anexos de Desarquivamentos
  async getDesarquivamentosAnexos(desarquivamentoId: number, tipoAnexo?: 'desarquivamento' | 'rearquivamento'): Promise<ApiResponse<any[]>> {
    try {
      const params = tipoAnexo ? { tipo: tipoAnexo } : {};
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/nugecid/${desarquivamentoId}/anexos`, { params });
      return response.data;
    } catch (error: any) {
      console.error(' getDesarquivamentosAnexos error:', error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  }

  async uploadDesarquivamentoAnexo(
    desarquivamentoId: number, 
    file: File, 
    descricao?: string, 
    tipoAnexo?: 'desarquivamento' | 'rearquivamento',
    anexarAoProcesso?: boolean
  ): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (descricao) {
        formData.append('descricao', descricao);
      }
      if (tipoAnexo) {
        formData.append('tipoAnexo', tipoAnexo);
      }
      if (anexarAoProcesso !== undefined) {
        formData.append('anexarAoProcesso', String(anexarAoProcesso));
      }

      const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
        `/nugecid/${desarquivamentoId}/anexos/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(' uploadDesarquivamentoAnexo error:', error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  }

  async updateDesarquivamentoAnexo(desarquivamentoId: number, anexoId: number, descricao: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.patch(
        `/nugecid/${desarquivamentoId}/anexos/${anexoId}`,
        { descricao }
      );
      return response.data;
    } catch (error: any) {
      console.error(' updateDesarquivamentoAnexo error:', error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  }

  async downloadDesarquivamentoAnexo(desarquivamentoId: number, anexoId: number): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await this.api.get(
        `/nugecid/${desarquivamentoId}/anexos/${anexoId}/download`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(' downloadDesarquivamentoAnexo error:', error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  }

  async viewDesarquivamentoAnexo(desarquivamentoId: number, anexoId: number): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await this.api.get(
        `/nugecid/${desarquivamentoId}/anexos/${anexoId}/view`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(' viewDesarquivamentoAnexo error:', error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  }

  async deleteDesarquivamentoAnexo(desarquivamentoId: number, anexoId: number): Promise<void> {
    try {
      await this.api.delete(`/nugecid/${desarquivamentoId}/anexos/${anexoId}`);
    } catch (error: any) {
      console.error(' deleteDesarquivamentoAnexo error:', error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  }

  // Global Search endpoints
  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      const response: AxiosResponse<SearchResponse> = await this.api.get('/search', { params })
      return response.data
    } catch (error: any) {
      console.error(' search error:', error?.message || error)
      return {
        results: [],
        total: 0,
        query: params.query,
        typesCounts: {}
      }
    }
  }

  // Security endpoints
  async getIpAccessStats(days: number = 7, limit: number = 100): Promise<ApiResponse<any[]>> {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/security/ip-access-stats', {
        params: { days, limit }
      })
      return response.data
    } catch (error: any) {
      console.error(' getIpAccessStats error:', error?.message || error)
      throw error
    }
  }

  async getIpAccessDetails(ipAddress: string, days: number = 30): Promise<ApiResponse<any[]>> {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/security/ip-access-details/${ipAddress}`, {
        params: { days }
      })
      return response.data
    } catch (error: any) {
      console.error(' getIpAccessDetails error:', error?.message || error)
      throw error
    }
  }

  async listBlockedIps(includeInactive: boolean = false): Promise<ApiResponse<any[]>> {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/security/blocked-ips', {
        params: { includeInactive }
      })
      return response.data
    } catch (error: any) {
      console.error(' listBlockedIps error:', error?.message || error)
      throw error
    }
  }

  async blockIp(ipAddress: string, reason?: string, expiresAt?: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/security/blocked-ips', {
        ipAddress,
        reason,
        expiresAt
      })
      return response.data
    } catch (error: any) {
      console.error(' blockIp error:', error?.message || error)
      throw error
    }
  }

  async unblockIp(ipAddress: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/security/blocked-ips/${ipAddress}`)
      return response.data
    } catch (error: any) {
      console.error(' unblockIp error:', error?.message || error)
      throw error
    }
  }

  async autoBlockSuspiciousIps(config?: {
    failedAttemptsThreshold?: number
    timeWindowMinutes?: number
    blockDurationHours?: number
  }): Promise<ApiResponse<any[]>> {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await this.api.post('/security/auto-block', config || {})
      return response.data
    } catch (error: any) {
      console.error(' autoBlockSuspiciousIps error:', error?.message || error)
      throw error
    }
  }

  async deletePastaArquivo(pastaId: string, arquivoId: string): Promise<void> {
    try {
      await this.api.delete(`/pastas/${pastaId}/arquivos/${arquivoId}`)
    } catch (error: any) {
      console.error(' deletePastaArquivo error:', error?.response?.status, error?.response?.data || error?.message)
      throw error
    }
  }

  // Notification preferences endpoints
  async getNotificationPreferences(): Promise<ApiResponse<{
    id: number
    userId: number
    inAppEnabled: boolean
    pushEnabled: boolean
    soundEnabled: boolean
    enabledTypes: Record<string, boolean>
    pushSubscription: any | null
    createdAt: string
    updatedAt: string
  }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/notificacoes/preferences')
    return response.data
  }

  async updateNotificationPreferences(preferences: {
    inAppEnabled?: boolean
    pushEnabled?: boolean
    soundEnabled?: boolean
    enabledTypes?: Record<string, boolean>
    pushSubscription?: any | null
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.patch('/notificacoes/preferences', preferences)
    return response.data
  }

  async resetNotificationPreferences(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/notificacoes/preferences/reset')
    return response.data
  }

  async updatePushSubscription(subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/notificacoes/preferences/push-subscription', subscription)
    return response.data
  }

  async removePushSubscription(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete('/notificacoes/preferences/push-subscription')
    return response.data
  }

  // System Announcements endpoints
  async getAnnouncements(includeInactive = false): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(`/announcements?includeInactive=${includeInactive}`)
    return response.data
  }

  async getActiveAnnouncements(): Promise<ApiResponse<any[]>> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get('/announcements/active')
    return response.data
  }

  async getAnnouncement(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/announcements/${id}`)
    return response.data
  }

  async createAnnouncement(data: {
    title: string
    content: string
    imageUrl?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    startDate: string
    endDate: string
    active?: boolean
    targetRoles?: string[]
  }): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/announcements', data)
    return response.data
  }

  async updateAnnouncement(id: number, data: Partial<{
    title: string
    content: string
    imageUrl?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    startDate: string
    endDate: string
    active?: boolean
    targetRoles?: string[]
  }>): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.patch(`/announcements/${id}`, data)
    return response.data
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await this.api.delete(`/announcements/${id}`)
  }

  async markAnnouncementAsViewed(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/announcements/${id}/mark-viewed`)
    return response.data
  }

  async getAnnouncementStats(id: number): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/announcements/${id}/stats`)
    return response.data
  }

  async uploadAnnouncementImage(formData: FormData): Promise<ApiResponse<{
    filename: string
    originalName: string
    size: number
    mimetype: string
    url: string
  }>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/announcements/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

const apiService = new ApiService();
const api = (apiService as any).api as AxiosInstance;

export { api, apiService };
