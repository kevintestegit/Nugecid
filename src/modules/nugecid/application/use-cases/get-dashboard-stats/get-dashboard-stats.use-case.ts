import { Injectable, Inject } from "@nestjs/common";
import { IDesarquivamentoRepository, DashboardStats } from "../../../domain";
import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../../../domain/nugecid.constants";

export interface GetDashboardStatsRequest {
  userId?: number;
  userRoles?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface GetDashboardStatsResponse {
  totalRegistros: number;
  pendentes: number; // SOLICITADO
  emAndamento: number; // DESARQUIVADO
  concluidos: number; // FINALIZADO
  naoLocalizados: number; // NAO_LOCALIZADO
  vencidos: number;
  urgentes: number;
  porTipo: {
    fisico: number;
    digital: number;
    naoLocalizado: number;
  };
  porMes: Record<string, number>;
  porInstituto: {
    IC: number;
    II: number;
    IML: number;
  };
  taxaConclusao: number;
  tempoMedioAtendimento: number;
  registrosVencendoEm7Dias: number;
  eficienciaPorResponsavel?: Record<
    string,
    {
      total: number;
      concluidos: number;
      tempoMedio: number;
    }
  >;
}

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(
    @Inject(DESARQUIVAMENTO_REPOSITORY_TOKEN)
    private readonly desarquivamentoRepository: IDesarquivamentoRepository,
  ) {}

  async execute(
    request: GetDashboardStatsRequest,
  ): Promise<GetDashboardStatsResponse> {
    // Validar entrada
    this.validateRequest(request);

    // Obter todas as estatísticas do repositório
    const stats = await this.desarquivamentoRepository.getDashboardStats(
      request.userId,
      request.userRoles,
      request.dateRange,
    );

    // Formatar a resposta
    return this.formatResponse(stats);
  }

  private validateRequest(request: GetDashboardStatsRequest): void {
    // Validar range de datas se fornecido
    if (request.dateRange) {
      const { startDate, endDate } = request.dateRange;

      if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new Error("Datas devem ser objetos Date válidos");
      }

      if (startDate >= endDate) {
        throw new Error("Data de início deve ser anterior à data de fim");
      }

      // Limitar range máximo a 2 anos
      const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 anos em ms
      if (endDate.getTime() - startDate.getTime() > maxRange) {
        throw new Error("Range de datas não pode exceder 2 anos");
      }
    }

    // Validar IDs de usuário
    if (request.userId !== undefined && request.userId <= 0) {
      throw new Error("ID do usuário deve ser positivo");
    }

    // Validar roles
    if (request.userRoles !== undefined && !Array.isArray(request.userRoles)) {
      throw new Error("Roles do usuário devem ser um array");
    }
  }

  private formatResponse(stats: DashboardStats): GetDashboardStatsResponse {
    return {
      totalRegistros: stats.totalRegistros,
      pendentes: stats.pendentes, // SOLICITADO
      emAndamento: stats.emAndamento, // DESARQUIVADO
      concluidos: stats.concluidos, // FINALIZADO
      naoLocalizados: stats.naoLocalizados || 0, // NAO_LOCALIZADO
      vencidos: stats.vencidos,
      urgentes: stats.urgentes,
      porTipo: {
        fisico: stats.porTipo["FISICO"] || 0,
        digital: stats.porTipo["DIGITAL"] || 0,
        naoLocalizado: stats.porTipo["NAO_LOCALIZADO"] || 0,
      },
      porMes: stats.porMes,
      porInstituto: {
        IC: stats.porInstituto?.["IC"] || 0,
        II: stats.porInstituto?.["II"] || 0,
        IML: stats.porInstituto?.["IML"] || 0,
      },
      taxaConclusao: stats.taxaConclusao,
      tempoMedioAtendimento: stats.tempoMedioAtendimento,
      registrosVencendoEm7Dias: stats.registrosVencendoEm7Dias,
      eficienciaPorResponsavel: stats.eficienciaPorResponsavel,
    };
  }
}
