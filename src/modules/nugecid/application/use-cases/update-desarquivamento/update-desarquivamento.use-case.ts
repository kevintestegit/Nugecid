import { Injectable, Inject, Logger } from "@nestjs/common";
import {
  DesarquivamentoDomain,
  DesarquivamentoId,
  IDesarquivamentoRepository,
} from "../../../domain";
import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../../../domain/nugecid.constants";
import { DesarquivamentoEffectsPublisher } from "../../services/desarquivamento-effects.publisher";

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
  solicitacaoProrrogacaoTexto?: string;
  dadosAdicionais?: string;
  urgente?: boolean;
  numeroOficio?: string;
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
  solicitacaoProrrogacaoTexto?: string;
  dadosAdicionais?: string;
  prazoAtendimento?: Date;
  dataAtendimento?: Date;
  resultadoAtendimento?: string;
  finalidade?: string;
  observacoes?: string;
  urgente?: boolean;
  numeroOficio?: string;
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
    private readonly desarquivamentoEffectsPublisher: DesarquivamentoEffectsPublisher,
  ) {}

  async execute(
    request: UpdateDesarquivamentoRequest,
  ): Promise<UpdateDesarquivamentoResponse> {
    this.logger.log(
      `[NUGECID] Iniciando atualização de desarquivamento ID: ${request.id} por usuário ${request.userId}`,
    );
    // LGPD: dadosAdicionais nao e registrado em logs.
    this.logger.debug(
      `[NUGECID] Atualizacao recebida - temDadosAdicionais=${Boolean(request.dadosAdicionais)}`,
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
        numeroOficio: request.numeroOficio,
        dadosAdicionais: request.dadosAdicionais,
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
      this.desarquivamentoEffectsPublisher.publishEntityChange({
        action: "updated",
        entityId: savedDesarquivamento.id.value,
        status: savedDesarquivamento.status.value,
      });

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
    desarquivamento.updateMutableFields({
      nomeCompleto: request.nomeCompleto,
      numeroNicLaudoAuto: request.numeroNicLaudoAuto,
      numeroProcesso: request.numeroProcesso,
      tipoDocumento: request.tipoDocumento,
      setorDemandante: request.setorDemandante,
      servidorResponsavel: request.servidorResponsavel,
      finalidadeDesarquivamento: request.finalidadeDesarquivamento,
      solicitacaoProrrogacao: request.solicitacaoProrrogacao,
      solicitacaoProrrogacaoTexto: request.solicitacaoProrrogacaoTexto,
      dadosAdicionais: request.dadosAdicionais,
      urgente: request.urgente,
      instituto: request.instituto,
      requerente: request.requerente,
      numeroOficio: request.numeroOficio,
    });

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

      desarquivamento.transitionToStatus(request.status, {
        force: isPrivileged,
      });
    }

    return desarquivamento;
  }

  private requiresReconstruction(
    _request: UpdateDesarquivamentoRequest,
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
      solicitacaoProrrogacaoTexto: desarquivamento.solicitacaoProrrogacaoTexto,
      dadosAdicionais: desarquivamento.dadosAdicionais,
      prazoAtendimento: undefined, // Not applicable in new structure
      dataAtendimento: desarquivamento.dataDesarquivamentoSAG, // Mapping for compatibility
      resultadoAtendimento: undefined, // Not applicable in new structure
      finalidade: desarquivamento.finalidadeDesarquivamento, // Mapping for compatibility
      observacoes: undefined, // Not applicable in new structure
      urgente: desarquivamento.urgente,
      numeroOficio: desarquivamento.numeroOficio,
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
