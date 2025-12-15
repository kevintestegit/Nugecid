import { Injectable, Inject, Logger } from "@nestjs/common";
import {
  DesarquivamentoDomain,
  DesarquivamentoId,
  StatusDesarquivamento,
  IDesarquivamentoRepository,
} from "../../../domain";
import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../../../domain/nugecid.constants";

export interface UpdateDesarquivamentoRequest {
  id: number;
  nomeVitima?: string;
  tipoDocumento?: string;
  dataFato?: Date;
  dataSolicitacao?: Date | string;
  prazoAtendimento?: Date;
  finalidade?: string;
  observacoes?: string;
  localizacaoFisica?: string;
  responsavelId?: number;
  status?: string;
  resultadoAtendimento?: string;
  dataDesarquivamentoSAG?: Date | string;
  dataDevolucaoSetor?: Date | string;
  nomeCompleto?: string;
  numeroNicLaudoAuto?: string;
  numeroProcesso?: string;
  setorDemandante?: string;
  servidorResponsavel?: string;
  finalidadeDesarquivamento?: string;
  solicitacaoProrrogacao?: boolean;
  urgente?: boolean;
  instituto?: string;
  requerente?: string;
  userId: number;
  userRoles: string[];
}

export interface UpdateDesarquivamentoResponse {
  id: number;
  codigoBarras?: string;
  tipoDesarquivamento: string;
  tipoSolicitacao?: string;
  status: string;
  nomeSolicitante?: string;
  nomeCompleto: string;
  numeroNicLaudoAuto: string;
  nomeVitima?: string;
  numeroRegistro?: string;
  numeroProcesso: string;
  tipoDocumento?: string;
  dataFato?: Date;
  dataSolicitacao: Date;
  dataDesarquivamentoSAG?: Date;
  dataDevolucaoSetor?: Date;
  setorDemandante: string;
  servidorResponsavel: string;
  finalidadeDesarquivamento: string;
  solicitacaoProrrogacao: boolean;
  prazoAtendimento?: Date;
  dataAtendimento?: Date;
  resultadoAtendimento?: string;
  finalidade?: string;
  observacoes?: string;
  urgente?: boolean;
  instituto?: string;
  requerente?: string;
  localizacaoFisica?: string;
  criadoPorId: number;
  responsavelId?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UpdateDesarquivamentoUseCase {
  private readonly logger = new Logger(UpdateDesarquivamentoUseCase.name);

  constructor(
    @Inject(DESARQUIVAMENTO_REPOSITORY_TOKEN)
    private readonly desarquivamentoRepository: IDesarquivamentoRepository,
  ) {}

  async execute(
    request: UpdateDesarquivamentoRequest,
  ): Promise<UpdateDesarquivamentoResponse> {
    this.logger.log(
      `[NUGECID] Iniciando atualização de desarquivamento ID: ${request.id} por usuário ${request.userId}`,
    );
    this.logger.log(
      `[NUGECID] Campos instituto/requerente: instituto=${request.instituto}, requerente=${request.requerente}`,
    );
    this.logger.debug(
      `[NUGECID] Campos a serem atualizados: ${JSON.stringify({
        status: request.status,
        responsavelId: request.responsavelId,
        dataDesarquivamentoSAG: request.dataDesarquivamentoSAG,
        dataDevolucaoSetor: request.dataDevolucaoSetor,
        instituto: request.instituto,
        requerente: request.requerente,
      })}`,
    );

    try {
      // Validar entrada
      this.validateRequest(request);
      this.logger.log(
        `[NUGECID] Validações concluídas para desarquivamento ID: ${request.id}`,
      );

      // Buscar desarquivamento existente
      const desarquivamentoId = DesarquivamentoId.create(request.id);
      const desarquivamento =
        await this.desarquivamentoRepository.findById(desarquivamentoId);

      if (!desarquivamento) {
        throw new Error(`Desarquivamento com ID ${request.id} não encontrado`);
      }

      // Verificar permissões de edição
      if (!desarquivamento.canBeEditedBy(request.userId, request.userRoles)) {
        throw new Error(
          "Acesso negado: você não tem permissão para editar este desarquivamento",
        );
      }

      // Aplicar atualizações
      const updatedDesarquivamento = await this.applyUpdates(
        desarquivamento,
        request,
      );

      // Salvar no repositório
      this.logger.log(
        `[NUGECID] Salvando atualizações no banco de dados - ID: ${request.id}`,
      );
      const savedDesarquivamento = await this.desarquivamentoRepository.update(
        updatedDesarquivamento,
      );

      this.logger.log(
        `[NUGECID] Desarquivamento atualizado com sucesso - ID: ${savedDesarquivamento.id.value}, Status: ${savedDesarquivamento.status.value}`,
      );

      // Retornar resposta
      const response = this.mapToResponse(savedDesarquivamento);
      this.logger.debug(
        `[NUGECID] Resposta de atualização gerada: ${JSON.stringify({ id: response.id, status: response.status })}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `[NUGECID] Erro ao atualizar desarquivamento ID ${request.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private validateRequest(request: UpdateDesarquivamentoRequest): void {
    // Validar ID
    if (!request.id || request.id <= 0 || !Number.isInteger(request.id)) {
      throw new Error("ID deve ser um número inteiro positivo");
    }

    // Validar usuário
    if (!request.userId || request.userId <= 0) {
      throw new Error("ID do usuário é obrigatório");
    }

    if (!request.userRoles || !Array.isArray(request.userRoles)) {
      throw new Error("Roles do usuário são obrigatórias");
    }

    // Validar campos opcionais
    if (request.nomeVitima !== undefined && request.nomeVitima.length > 255) {
      throw new Error("Nome da vítima deve ter no máximo 255 caracteres");
    }

    if (
      request.tipoDocumento !== undefined &&
      request.tipoDocumento.length > 100
    ) {
      throw new Error("Tipo do documento deve ter no máximo 100 caracteres");
    }

    if (request.responsavelId !== undefined && request.responsavelId <= 0) {
      throw new Error("ID do responsável deve ser positivo");
    }

    // Validar status
    if (request.status !== undefined) {
      const validStatuses = [
        "FINALIZADO",
        "DESARQUIVADO",
        "NAO_COLETADO",
        "SOLICITADO",
        "REARQUIVAMENTO_SOLICITADO",
        "RETIRADO_PELO_SETOR",
        "NAO_LOCALIZADO",
      ];
      if (!validStatuses.includes(request.status)) {
        throw new Error(
          `Status inválido. Status válidos: ${validStatuses.join(", ")}`,
        );
      }
    }
  }

  private async applyUpdates(
    desarquivamento: DesarquivamentoDomain,
    request: UpdateDesarquivamentoRequest,
  ): Promise<DesarquivamentoDomain> {
    // Para a estrutura simplificada, usar métodos do domínio para atualizações

    // Atualizar campos básicos (acesso direto aos campos privados via reflection)
    if (request.nomeCompleto !== undefined) {
      (desarquivamento as any)._nomeCompleto = request.nomeCompleto;
    }

    if (request.numeroNicLaudoAuto !== undefined) {
      (desarquivamento as any)._numeroNicLaudoAuto = request.numeroNicLaudoAuto;
    }

    if (request.numeroProcesso !== undefined) {
      (desarquivamento as any)._numeroProcesso = request.numeroProcesso;
    }

    if (request.tipoDocumento !== undefined) {
      (desarquivamento as any)._tipoDocumento = request.tipoDocumento;
    }

    if (request.setorDemandante !== undefined) {
      (desarquivamento as any)._setorDemandante = request.setorDemandante;
    }

    if (request.servidorResponsavel !== undefined) {
      (desarquivamento as any)._servidorResponsavel =
        request.servidorResponsavel;
    }

    if (request.finalidadeDesarquivamento !== undefined) {
      (desarquivamento as any)._finalidadeDesarquivamento =
        request.finalidadeDesarquivamento;
    }

    if (request.solicitacaoProrrogacao !== undefined) {
      (desarquivamento as any)._solicitacaoProrrogacao =
        request.solicitacaoProrrogacao;
    }

    if (request.urgente !== undefined) {
      (desarquivamento as any)._urgente = request.urgente;
    }

    if (request.instituto !== undefined) {
      (desarquivamento as any)._instituto = request.instituto;
    }

    if (request.requerente !== undefined) {
      (desarquivamento as any)._requerente = request.requerente;
    }

    // Atribuir responsável
    if (request.responsavelId !== undefined) {
      desarquivamento.assignResponsible(request.responsavelId);
    }

    // Definir datas
    if (request.dataSolicitacao !== undefined) {
      desarquivamento.setDataSolicitacao(new Date(request.dataSolicitacao));
    }

    if (request.dataDesarquivamentoSAG !== undefined) {
      desarquivamento.setDataDesarquivamentoSAG(
        new Date(request.dataDesarquivamentoSAG),
      );
    }

    // Tratar dataDevolucaoSetor: pode ser removida (null/undefined) ou atualizada
    // Verifica explicitamente se o campo está presente no request
    if ("dataDevolucaoSetor" in request) {
      if (
        request.dataDevolucaoSetor === null ||
        request.dataDevolucaoSetor === undefined
      ) {
        // Se vier null ou undefined, remove a data
        desarquivamento.clearDataDevolucaoSetor();
      } else {
        // Se vier com valor, atualiza a data
        desarquivamento.setDataDevolucaoSetor(
          new Date(request.dataDevolucaoSetor),
        );
      }
    }

    // Atualizar status
    if (request.status !== undefined) {
      const upperRoles = (request.userRoles || []).map((r) =>
        (r || "").toUpperCase(),
      );
      const isPrivileged =
        upperRoles.includes("ADMIN") ||
        upperRoles.includes("COORDENADOR") ||
        upperRoles.includes("NUGECID_OPERATOR") ||
        upperRoles.includes("OPERADOR");

      await this.updateStatus(desarquivamento, request.status, isPrivileged);
    }

    return desarquivamento;
  }

  private async updateStatus(
    desarquivamento: DesarquivamentoDomain,
    newStatus: string,
    isPrivileged: boolean = false,
  ): Promise<void> {
    switch (newStatus) {
      case "SOLICITADO":
        isPrivileged
          ? desarquivamento.changeStatusForce(
              StatusDesarquivamento.createSolicitado(),
            )
          : desarquivamento.changeStatus(
              StatusDesarquivamento.createSolicitado(),
            );
        break;
      case "DESARQUIVADO":
        isPrivileged
          ? desarquivamento.changeStatusForce(
              StatusDesarquivamento.createDesarquivado(),
            )
          : desarquivamento.changeStatus(
              StatusDesarquivamento.createDesarquivado(),
            );
        break;
      case "FINALIZADO":
        isPrivileged
          ? desarquivamento.changeStatusForce(
              StatusDesarquivamento.createFinalizado(),
            )
          : desarquivamento.changeStatus(
              StatusDesarquivamento.createFinalizado(),
            );
        break;
      case "NAO_LOCALIZADO":
        isPrivileged
          ? desarquivamento.changeStatusForce(
              StatusDesarquivamento.createNaoLocalizado(),
            )
          : desarquivamento.changeStatus(
              StatusDesarquivamento.createNaoLocalizado(),
            );
        break;
      case "NAO_COLETADO":
        isPrivileged
          ? desarquivamento.changeStatusForce(
              StatusDesarquivamento.createNaoColetado(),
            )
          : desarquivamento.changeStatus(
              StatusDesarquivamento.createNaoColetado(),
            );
        break;
      case "RETIRADO_PELO_SETOR":
        isPrivileged
          ? desarquivamento.changeStatusForce(
              StatusDesarquivamento.createRetiradoPeloSetor(),
            )
          : desarquivamento.changeStatus(
              StatusDesarquivamento.createRetiradoPeloSetor(),
            );
        break;
      case "REARQUIVAMENTO_SOLICITADO":
        isPrivileged
          ? desarquivamento.changeStatusForce(
              StatusDesarquivamento.createRearquivamentoSolicitado(),
            )
          : desarquivamento.changeStatus(
              StatusDesarquivamento.createRearquivamentoSolicitado(),
            );
        break;
      default:
        throw new Error(`Status inválido: ${newStatus}`);
    }
  }

  private requiresReconstruction(
    request: UpdateDesarquivamentoRequest,
  ): boolean {
    // For simplified structure, we don't need reconstruction
    // All updates can be done through domain methods
    return false;
  }

  private mapToResponse(
    desarquivamento: DesarquivamentoDomain,
  ): UpdateDesarquivamentoResponse {
    return {
      id: desarquivamento.id?.value || 0,
      codigoBarras: desarquivamento.numeroNicLaudoAuto, // Using numeroNicLaudoAuto as unique identifier
      tipoDesarquivamento: desarquivamento.tipoDesarquivamento,
      tipoSolicitacao: desarquivamento.tipoDesarquivamento, // Mapping for compatibility
      status: desarquivamento.status.value,
      nomeSolicitante: desarquivamento.nomeCompleto, // Mapping for compatibility
      nomeCompleto: desarquivamento.nomeCompleto,
      numeroNicLaudoAuto: desarquivamento.numeroNicLaudoAuto,
      nomeVitima: undefined, // Not applicable in new structure
      numeroRegistro: desarquivamento.numeroProcesso, // Mapping for compatibility
      numeroProcesso: desarquivamento.numeroProcesso,
      tipoDocumento: desarquivamento.tipoDocumento,
      dataFato: undefined, // Not applicable in new structure
      dataSolicitacao: desarquivamento.dataSolicitacao,
      dataDesarquivamentoSAG: desarquivamento.dataDesarquivamentoSAG,
      dataDevolucaoSetor: desarquivamento.dataDevolucaoSetor,
      setorDemandante: desarquivamento.setorDemandante,
      servidorResponsavel: desarquivamento.servidorResponsavel,
      finalidadeDesarquivamento: desarquivamento.finalidadeDesarquivamento,
      solicitacaoProrrogacao: desarquivamento.solicitacaoProrrogacao,
      prazoAtendimento: undefined, // Not applicable in new structure
      dataAtendimento: desarquivamento.dataDesarquivamentoSAG, // Mapping for compatibility
      resultadoAtendimento: undefined, // Not applicable in new structure
      finalidade: desarquivamento.finalidadeDesarquivamento, // Mapping for compatibility
      observacoes: undefined, // Not applicable in new structure
      urgente: desarquivamento.urgente,
      instituto: desarquivamento.instituto,
      requerente: desarquivamento.requerente,
      localizacaoFisica: undefined, // Not applicable in new structure
      criadoPorId: desarquivamento.criadoPorId,
      responsavelId: desarquivamento.responsavelId,
      createdAt: desarquivamento.createdAt,
      updatedAt: desarquivamento.updatedAt,
    };
  }
}
