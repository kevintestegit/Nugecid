import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SeirnResponse,
  SeirnProcesso,
  SeirnOcorrencia,
  WebscrapingServiceConfig,
  CacheStatus,
} from '../interfaces/seirn.interface';
import { BuscarSeirnDto } from '../dto/seirn.dto';

@Injectable()
export class WebscrapingService {
  private readonly logger = new Logger(WebscrapingService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: WebscrapingServiceConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      baseUrl: this.configService.get<string>(
        'WEBSCRAPING_SERVICE_URL',
        'http://localhost:8001',
      ),
      timeout: this.configService.get<number>('WEBSCRAPING_TIMEOUT', 30000),
      retries: this.configService.get<number>('WEBSCRAPING_RETRIES', 3),
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as any;
        
        // Retry logic
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < this.config.retries) {
          config.retry += 1;
          this.logger.warn(
            `Retrying request (${config.retry}/${this.config.retries}): ${config.url}`,
          );
          return this.httpClient(config);
        }

        this.logger.error('Response error:', error.message);
        return Promise.reject(error);
      },
    );
  }

  async buscarProcesso(
    numeroProcesso: string,
    useCache: boolean = true,
  ): Promise<SeirnResponse<SeirnProcesso>> {
    try {
      this.logger.log(`Buscando processo: ${numeroProcesso}`);

      const response = await this.httpClient.get<SeirnResponse<SeirnProcesso>>(
        `/api/v1/processo/${encodeURIComponent(numeroProcesso)}`,
        {
          params: { use_cache: useCache },
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'buscar processo');
    }
  }

  async buscarOcorrencia(
    numeroOcorrencia: string,
    useCache: boolean = true,
  ): Promise<SeirnResponse<SeirnOcorrencia>> {
    try {
      this.logger.log(`Buscando ocorrência: ${numeroOcorrencia}`);

      const response = await this.httpClient.get<SeirnResponse<SeirnOcorrencia>>(
        `/api/v1/ocorrencia/${encodeURIComponent(numeroOcorrencia)}`,
        {
          params: { use_cache: useCache },
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'buscar ocorrência');
    }
  }

  async buscarGenerico(dto: BuscarSeirnDto): Promise<SeirnResponse<any>> {
    try {
      this.logger.log(`Busca genérica: ${dto.tipo_busca} - ${dto.numero}`);

      const response = await this.httpClient.post<SeirnResponse<any>>(
        '/api/v1/search',
        dto,
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'busca genérica');
    }
  }

  async limparCache(tipo?: string): Promise<{ success: boolean; deleted: number }> {
    try {
      this.logger.log(`Limpando cache${tipo ? ` do tipo: ${tipo}` : ''}`);

      const response = await this.httpClient.delete('/api/v1/cache', {
        params: tipo ? { tipo } : {},
      });

      return response.data;
    } catch (error) {
      this.handleError(error, 'limpar cache');
    }
  }

  async verificarCacheStatus(): Promise<CacheStatus> {
    try {
      const response = await this.httpClient.get<CacheStatus>('/api/v1/cache/status');
      return response.data;
    } catch (error) {
      this.handleError(error, 'verificar status do cache');
    }
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await this.httpClient.get('/health');
      return response.data;
    } catch (error) {
      this.logger.error('Webscraping service health check failed:', error);
      throw new HttpException(
        'Serviço de webscraping indisponível',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private handleError(error: any, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = (axiosError.response.data as any)?.detail || axiosError.message;
        
        this.logger.error(`Erro ao ${context}: ${status} - ${message}`);
        
        throw new HttpException(
          {
            statusCode: status,
            message: `Erro ao ${context}: ${message}`,
            error: 'WebscrapingServiceError',
          },
          status,
        );
      } else if (axiosError.request) {
        this.logger.error(`Sem resposta ao ${context}:`, axiosError.message);
        throw new HttpException(
          'Serviço de webscraping não respondeu',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    this.logger.error(`Erro desconhecido ao ${context}:`, error);
    throw new HttpException(
      `Erro interno ao ${context}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
