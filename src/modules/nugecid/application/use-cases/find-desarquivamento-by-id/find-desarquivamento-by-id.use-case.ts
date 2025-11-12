import { Injectable, Inject } from "@nestjs/common";
import {
  DesarquivamentoDomain,
  DesarquivamentoId,
  IDesarquivamentoRepository,
} from "../../../domain";
import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../../../domain/nugecid.constants";

export interface FindDesarquivamentoByIdRequest {
  id: number;
  userId?: number;
  userRoles?: string[];
}

export interface FindDesarquivamentoByIdResponse {
  id: number;
  numeroSolicitacao: number;
  codigoBarras: string;
  tipoDesarquivamento: string;
  tipoSolicitacao: string; // For compatibility
  status: string;
  nomeCompleto: string;
  nomeSolicitante: string; // For compatibility
  numeroNicLaudoAuto: string;
  nomeVitima?: string; // Legacy field
  numeroProcesso: string;
  numeroRegistro: string; // For compatibility
  tipoDocumento: string;
  dataSolicitacao: Date;
  dataDesarquivamentoSAG?: Date;
  dataDevolucaoSetor?: Date;
  setorDemandante: string;
  servidorResponsavel: string;
  finalidadeDesarquivamento: string;
  solicitacaoProrrogacao: boolean;
  dataFato?: Date; // Legacy field
  prazoAtendimento?: Date; // Legacy field
  dataAtendimento?: Date; // For compatibility
  resultadoAtendimento?: string; // Legacy field
  finalidade?: string; // For compatibility
  observacoes?: string; // Legacy field
  urgente?: boolean;
  localizacaoFisica?: string; // Legacy field
  criadoPorId: number;
  responsavelId?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isOverdue?: boolean;
  daysUntilDeadline?: number;
  canBeEdited?: boolean;
  canBeCancelled?: boolean;
  canBeCompleted?: boolean;
}

@Injectable()
export class FindDesarquivamentoByIdUseCase {
  constructor(
    @Inject(DESARQUIVAMENTO_REPOSITORY_TOKEN)
    private readonly desarquivamentoRepository: IDesarquivamentoRepository,
  ) {}

  async execute(
    request: FindDesarquivamentoByIdRequest,
  ): Promise<FindDesarquivamentoByIdResponse> {
    // Validar entrada
    this.validateRequest(request);

    // Criar value object para o ID
    const desarquivamentoId = DesarquivamentoId.create(request.id);

    // Buscar no repositório
    const desarquivamento =
      await this.desarquivamentoRepository.findById(desarquivamentoId);

    if (!desarquivamento) {
      throw new Error(`Desarquivamento com ID ${request.id} não encontrado`);
    }

    // Verificar permissões de acesso
    if (request.userId && request.userRoles) {
      if (!desarquivamento.canBeAccessedBy(request.userId, request.userRoles)) {
        throw new Error(
          "Acesso negado: você não tem permissão para visualizar este desarquivamento",
        );
      }
    }

    // Mapear para resposta
    return this.mapToResponse(
      desarquivamento,
      request.userId,
      request.userRoles,
    );
  }

  private validateRequest(request: FindDesarquivamentoByIdRequest): void {
    // Validar ID
    if (!request.id || request.id <= 0 || !Number.isInteger(request.id)) {
      throw new Error("ID deve ser um número inteiro positivo");
    }

    // Validar IDs de usuário se fornecidos
    if (request.userId !== undefined && request.userId <= 0) {
      throw new Error("ID do usuário deve ser positivo");
    }

    // Validar roles se fornecidas
    if (request.userRoles !== undefined && !Array.isArray(request.userRoles)) {
      throw new Error("Roles do usuário devem ser um array");
    }
  }

  private mapToResponse(
    desarquivamento: DesarquivamentoDomain,
    userId?: number,
    userRoles?: string[],
  ): FindDesarquivamentoByIdResponse {
    // Calcular permissões se informações do usuário estiverem disponíveis
    let canBeEdited = false;
    let canBeCancelled = false;
    let canBeCompleted = false;

    if (userId && userRoles) {
      canBeEdited = desarquivamento.canBeEditedBy
        ? desarquivamento.canBeEditedBy(userId, userRoles)
        : false;
      canBeCancelled = desarquivamento.canBeCancelled
        ? desarquivamento.canBeCancelled() && canBeEdited
        : false;
      canBeCompleted = desarquivamento.canBeCompleted
        ? desarquivamento.canBeCompleted() && canBeEdited
        : false;
    }

    return {
      id: desarquivamento.id?.value || 0,
      numeroSolicitacao: desarquivamento.numeroSolicitacao || 0,
      codigoBarras: desarquivamento.numeroNicLaudoAuto, // Using numeroNicLaudoAuto as unique identifier
      tipoDesarquivamento: desarquivamento.tipoDesarquivamento,
      tipoSolicitacao: desarquivamento.tipoDesarquivamento, // For compatibility
      status: desarquivamento.status.value,
      nomeCompleto: desarquivamento.nomeCompleto,
      nomeSolicitante: desarquivamento.nomeCompleto, // For compatibility
      numeroNicLaudoAuto: desarquivamento.numeroNicLaudoAuto,
      numeroProcesso: desarquivamento.numeroProcesso,
      numeroRegistro: desarquivamento.numeroProcesso, // For compatibility
      tipoDocumento: desarquivamento.tipoDocumento,
      dataSolicitacao: desarquivamento.dataSolicitacao,
      dataDesarquivamentoSAG: desarquivamento.dataDesarquivamentoSAG,
      dataDevolucaoSetor: desarquivamento.dataDevolucaoSetor,
      setorDemandante: desarquivamento.setorDemandante,
      servidorResponsavel: desarquivamento.servidorResponsavel,
      finalidadeDesarquivamento: desarquivamento.finalidadeDesarquivamento,
      solicitacaoProrrogacao: desarquivamento.solicitacaoProrrogacao,
      prazoAtendimento: undefined, // Legacy field, not applicable
      dataAtendimento: desarquivamento.dataDesarquivamentoSAG, // For compatibility
      resultadoAtendimento: undefined, // Legacy field, not applicable
      finalidade: desarquivamento.finalidadeDesarquivamento, // For compatibility
      observacoes: undefined, // Legacy field, not applicable
      urgente: desarquivamento.urgente,
      localizacaoFisica: undefined, // Legacy field, not applicable
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
      canBeEdited,
      canBeCancelled,
      canBeCompleted,
    };
  }
}
