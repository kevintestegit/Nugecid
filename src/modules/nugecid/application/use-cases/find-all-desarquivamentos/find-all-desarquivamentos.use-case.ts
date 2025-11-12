import { Injectable, Inject } from "@nestjs/common";
import {
  DesarquivamentoDomain,
  IDesarquivamentoRepository,
  FindAllOptions,
  FindAllResult,
} from "../../../domain";
import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../../../domain/nugecid.constants";

export interface FindAllDesarquivamentosRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  filters?: {
    status?: string | string[];
    statusList?: string[];
    tipoDesarquivamento?: string | string[];
    tipoDesarquivamentoList?: string[];
    nomeSolicitante?: string;
    numeroRegistro?: string;
    codigoBarras?: string;
    criadoPorId?: number;
    responsavelId?: number;
    urgente?: boolean;
    dataInicio?: Date;
    dataFim?: Date;
    incluirExcluidos?: boolean;
  };
  userId?: number;
  userRoles?: string[];
}

export interface FindAllDesarquivamentosResponse {
  data: {
    id: number;
    codigoBarras?: string;
    tipoDesarquivamento: string;
    status: string;
    nomeCompleto: string;
    numeroNicLaudoAuto: string;
    numeroProcesso: string;
    tipoDocumento?: string;
    dataSolicitacao: Date;
    dataDesarquivamentoSAG?: Date;
    dataDevolucaoSetor?: Date;
    setorDemandante: string;
    servidorResponsavel: string;
    finalidadeDesarquivamento: string;
    solicitacaoProrrogacao: boolean;
    urgente?: boolean;
    criadoPorId: number;
    responsavelId?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    isOverdue?: boolean;
    daysUntilDeadline?: number;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class FindAllDesarquivamentosUseCase {
  constructor(
    @Inject(DESARQUIVAMENTO_REPOSITORY_TOKEN)
    private readonly desarquivamentoRepository: IDesarquivamentoRepository,
  ) {}

  async execute(
    request: FindAllDesarquivamentosRequest,
  ): Promise<FindAllDesarquivamentosResponse> {
    // Validar parâmetros de entrada
    this.validateRequest(request);

    // Preparar opções de busca
    const options: FindAllOptions = {
      page: request.page || 1,
      limit: Math.min(request.limit || 10, 100), // Limitar a 100 registros por página
      sortBy: request.sortBy || "dataSolicitacao",
      sortOrder: request.sortOrder || "DESC",
      filters: {
        ...request.filters,
        incluirExcluidos: request.filters?.incluirExcluidos || false,
      },
    };

    // Aplicar filtros de segurança baseados no usuário
    if (request.userId && request.userRoles) {
      options.filters = this.applySecurityFilters(
        options.filters,
        request.userId,
        request.userRoles,
      );
    }

    // Buscar registros no repositório
    const result: FindAllResult =
      await this.desarquivamentoRepository.findAll(options);

    // Filtrar registros baseado em permissões de acesso
    const filteredData =
      request.userId && request.userRoles
        ? result.data.filter((desarquivamento) =>
            desarquivamento.canBeAccessedBy(
              request.userId!,
              request.userRoles!,
            ),
          )
        : result.data;

    // Mapear para resposta
    const mappedData = filteredData.map((desarquivamento) =>
      this.mapToResponse(desarquivamento),
    );

    return {
      data: mappedData,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private validateRequest(request: FindAllDesarquivamentosRequest): void {
    // Validar página
    if (request.page && (request.page < 1 || !Number.isInteger(request.page))) {
      throw new Error("Página deve ser um número inteiro positivo");
    }

    // Validar limite
    if (
      request.limit &&
      (request.limit < 1 ||
        request.limit > 100 ||
        !Number.isInteger(request.limit))
    ) {
      throw new Error("Limite deve ser um número inteiro entre 1 e 100");
    }

    // Validar ordem de classificação
    if (request.sortOrder && !["ASC", "DESC"].includes(request.sortOrder)) {
      throw new Error("Ordem de classificação deve ser ASC ou DESC");
    }

    // Validar campos de classificação permitidos
    const allowedSortFields = [
      "id",
      "codigoBarras",
      "tipoDesarquivamento",
      "status",
      "nomeCompleto",
      "numeroNicLaudoAuto",
      "numeroProcesso",
      "dataSolicitacao",
      "dataDesarquivamentoSAG",
      "dataDevolucaoSetor",
      "urgente",
      "criadoPorId",
      "responsavelId",
      "createdAt",
      "updatedAt",
    ];

    if (request.sortBy && !allowedSortFields.includes(request.sortBy)) {
      throw new Error(
        `Campo de classificação inválido. Campos permitidos: ${allowedSortFields.join(", ")}`,
      );
    }

    // Validar filtros de data
    if (request.filters?.dataInicio && request.filters?.dataFim) {
      if (request.filters.dataInicio > request.filters.dataFim) {
        throw new Error("Data de início deve ser anterior à data de fim");
      }
    }

    // Validar status (aceita string ou array)
    if (request.filters?.status) {
      const validStatuses = [
        "FINALIZADO",
        "DESARQUIVADO",
        "NAO_COLETADO",
        "SOLICITADO",
        "REARQUIVAMENTO_SOLICITADO",
        "RETIRADO_PELO_SETOR",
        "NAO_LOCALIZADO",
      ];
      const statuses = Array.isArray(request.filters.status)
        ? request.filters.status
        : [request.filters.status];
      const allValid = statuses.every((s) => validStatuses.includes(s));
      if (!allValid) {
        throw new Error(
          `Status inválido. Status válidos: ${validStatuses.join(", ")}`,
        );
      }
    }

    // Validar tipo de desarquivamento (aceita string ou array)
    if (request.filters?.tipoDesarquivamento) {
      const validTypes = ["FISICO", "DIGITAL", "NAO_LOCALIZADO"];
      const tipos = Array.isArray(request.filters.tipoDesarquivamento)
        ? request.filters.tipoDesarquivamento
        : [request.filters.tipoDesarquivamento];
      const allValidTipos = tipos.every((t) => validTypes.includes(t));
      if (!allValidTipos) {
        throw new Error(
          `Tipo de desarquivamento inválido. Tipos válidos: ${validTypes.join(", ")}`,
        );
      }
    }

    // Validar IDs de usuário
    if (request.filters?.criadoPorId && request.filters.criadoPorId <= 0) {
      throw new Error("ID do usuário criador deve ser positivo");
    }

    if (request.filters?.responsavelId && request.filters.responsavelId <= 0) {
      throw new Error("ID do responsável deve ser positivo");
    }
  }

  private applySecurityFilters(
    filters: FindAllOptions["filters"],
    userId: number,
    userRoles: string[],
  ): FindAllOptions["filters"] {
    // Normaliza roles para maiúsculas para evitar problemas de case-sensitive
    const upperCaseUserRoles = (userRoles || []).map(
      (r) => r?.toUpperCase?.() || "",
    );

    // Administradores podem ver tudo
    if (upperCaseUserRoles.includes("ADMIN")) {
      return filters;
    }

    // Usuários com role NUGECID_VIEWER/OPERATOR podem ver todos os registros
    if (
      upperCaseUserRoles.includes("NUGECID_VIEWER") ||
      upperCaseUserRoles.includes("NUGECID_OPERATOR")
    ) {
      return filters;
    }

    // Usuários comuns só podem ver seus próprios registros
    return {
      ...filters,
      criadoPorId: userId,
    };
  }

  private mapToResponse(
    desarquivamento: DesarquivamentoDomain,
  ): FindAllDesarquivamentosResponse["data"][0] {
    // Garantir que o ID seja válido
    if (!desarquivamento.id?.value || desarquivamento.id.value <= 0) {
      throw new Error(
        `Desarquivamento com ID inválido encontrado: ${desarquivamento.id?.value}`,
      );
    }

    return {
      id: desarquivamento.id.value,
      codigoBarras: desarquivamento.numeroNicLaudoAuto, // Using numeroNicLaudoAuto as unique identifier
      tipoDesarquivamento: desarquivamento.tipoDesarquivamento,
      status: desarquivamento.status.value,
      nomeCompleto: desarquivamento.nomeCompleto,
      numeroNicLaudoAuto: desarquivamento.numeroNicLaudoAuto,
      numeroProcesso: desarquivamento.numeroProcesso,
      tipoDocumento: desarquivamento.tipoDocumento,
      dataSolicitacao: desarquivamento.dataSolicitacao,
      dataDesarquivamentoSAG: desarquivamento.dataDesarquivamentoSAG,
      dataDevolucaoSetor: desarquivamento.dataDevolucaoSetor,
      setorDemandante: desarquivamento.setorDemandante,
      servidorResponsavel: desarquivamento.servidorResponsavel,
      finalidadeDesarquivamento: desarquivamento.finalidadeDesarquivamento,
      solicitacaoProrrogacao: desarquivamento.solicitacaoProrrogacao,
      urgente: desarquivamento.urgente,
      criadoPorId: desarquivamento.criadoPorId,
      responsavelId: desarquivamento.responsavelId,
      createdAt: desarquivamento.createdAt,
      updatedAt: desarquivamento.updatedAt,
      deletedAt: desarquivamento.deletedAt,
      isOverdue: desarquivamento.isOverdue
        ? desarquivamento.isOverdue()
        : false,
      daysUntilDeadline: desarquivamento.getDaysUntilDeadline
        ? desarquivamento.getDaysUntilDeadline()
        : undefined,
    };
  }
}
