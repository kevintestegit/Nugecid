import { Injectable, Inject, Logger } from "@nestjs/common";
import {
  DesarquivamentoDomain,
  DesarquivamentoId,
  CodigoBarras,
  NumeroRegistro,
  TipoSolicitacao,
  TipoSolicitacaoEnum,
  StatusDesarquivamento,
  IDesarquivamentoRepository,
} from "../../../domain";
import { TipoDesarquivamentoEnum } from "../../../domain/enums/tipo-desarquivamento.enum";

import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../../../domain/nugecid.constants";

export interface CreateDesarquivamentoRequest {
  tipoDesarquivamento: string;
  nomeCompleto: string;
  numeroNicLaudoAuto: string;
  numeroProcesso?: string; // OPCIONAL
  tipoDocumento: string;
  dataSolicitacao: string;
  dataDesarquivamentoSAG?: string;
  dataDevolucaoSetor?: string;
  setorDemandante?: string; // OPCIONAL
  servidorResponsavel: string;
  finalidadeDesarquivamento: string;
  solicitacaoProrrogacao: boolean;
  urgente?: boolean;
  instituto?: string;
  requerente?: string;
  criadoPorId: number;
  responsavelId?: number;
  // Legacy properties for validation compatibility
  nomeSolicitante?: string;
  numeroRegistro?: string;
  tipoSolicitacao?: string;
  nomeVitima?: string;
  dataFato?: Date;
  prazoAtendimento?: Date;
  finalidade?: string;
  observacoes?: string;
  localizacaoFisica?: string;
}

export interface CreateDesarquivamentoResponse {
  id: number;
  codigoBarras: string;
  tipoSolicitacao: string;
  status: string;
  nomeSolicitante: string;
  nomeVitima?: string;
  numeroRegistro: string;
  numeroProcesso: string;
  tipoDocumento?: string;
  dataFato?: Date;
  prazoAtendimento?: Date;
  dataAtendimento?: Date;
  resultadoAtendimento?: string;
  finalidade?: string;
  observacoes?: string;
  urgente: boolean;
  localizacaoFisica?: string;
  criadoPorId: number;
  responsavelId?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateDesarquivamentoUseCase {
  private readonly logger = new Logger(CreateDesarquivamentoUseCase.name);

  constructor(
    @Inject(DESARQUIVAMENTO_REPOSITORY_TOKEN)
    private readonly desarquivamentoRepository: IDesarquivamentoRepository,
  ) {}

  async execute(
    request: CreateDesarquivamentoRequest,
  ): Promise<CreateDesarquivamentoResponse> {
    const normalizedTipo = this.normalizeTipoDesarquivamento(
      request.tipoDesarquivamento ??
        (request as any).desarquivamentoFisicoDigital,
    );
    const sanitizedRequest: CreateDesarquivamentoRequest = {
      ...request,
      tipoDesarquivamento: normalizedTipo,
    };

    this.logger.log(
      `[NUGECID] Tipo normalizado recebido: ${sanitizedRequest.tipoDesarquivamento}`,
    );

    this.logger.log(
      `[NUGECID] Iniciando criação de desarquivamento para usuário ${sanitizedRequest.criadoPorId}`,
    );
    this.logger.debug(
      `[NUGECID] Dados recebidos: ${JSON.stringify({
        tipoDesarquivamento: sanitizedRequest.tipoDesarquivamento,
        nomeCompleto: sanitizedRequest.nomeCompleto,
        numeroProcesso: sanitizedRequest.numeroProcesso,
        urgente: sanitizedRequest.urgente,
      })}`,
    );

    try {
      // Validações de entrada
      await this.validateRequest(sanitizedRequest);
      this.logger.log(
        `[NUGECID] Validações concluídas com sucesso para processo ${sanitizedRequest.numeroProcesso}`,
      );

      // Criar entidade de domínio usando as propriedades corretas
      const statusVO = StatusDesarquivamento.createSolicitado();

      // Criar entidade de domínio
      const desarquivamento = DesarquivamentoDomain.create({
        tipoDesarquivamento:
          sanitizedRequest.tipoDesarquivamento as TipoDesarquivamentoEnum,
        status: statusVO,
        nomeCompleto: sanitizedRequest.nomeCompleto,
        numeroNicLaudoAuto: sanitizedRequest.numeroNicLaudoAuto,
        numeroProcesso: sanitizedRequest.numeroProcesso,
        tipoDocumento: sanitizedRequest.tipoDocumento,
        dataSolicitacao: new Date(sanitizedRequest.dataSolicitacao),
        dataDesarquivamentoSAG: sanitizedRequest.dataDesarquivamentoSAG
          ? new Date(sanitizedRequest.dataDesarquivamentoSAG)
          : undefined,
        dataDevolucaoSetor: sanitizedRequest.dataDevolucaoSetor
          ? new Date(sanitizedRequest.dataDevolucaoSetor)
          : undefined,
        setorDemandante: sanitizedRequest.setorDemandante,
        servidorResponsavel: sanitizedRequest.servidorResponsavel,
        finalidadeDesarquivamento: sanitizedRequest.finalidadeDesarquivamento,
        solicitacaoProrrogacao: sanitizedRequest.solicitacaoProrrogacao,
        urgente: sanitizedRequest.urgente,
        instituto: sanitizedRequest.instituto,
        requerente: sanitizedRequest.requerente,
        criadoPorId: sanitizedRequest.criadoPorId,
        responsavelId: sanitizedRequest.responsavelId,
      });

      desarquivamento.tipoDesarquivamento =
        sanitizedRequest.tipoDesarquivamento;

      this.logger.log(
        `[NUGECID] Tipo registrado no domínio: ${desarquivamento.tipoDesarquivamento}`,
      );

      // Persistir no repositório
      this.logger.log(
        `[NUGECID] Salvando desarquivamento no banco de dados - Processo: ${sanitizedRequest.numeroProcesso}`,
      );
      const savedDesarquivamento =
        await this.desarquivamentoRepository.create(desarquivamento);

      this.logger.log(
        `[NUGECID] Desarquivamento criado com sucesso - ID: ${savedDesarquivamento.id.value}, NIC/Laudo: ${savedDesarquivamento.numeroNicLaudoAuto}`,
      );

      // Retornar resposta
      const response = this.mapToResponse(savedDesarquivamento);
      this.logger.debug(
        `[NUGECID] Resposta gerada: ${JSON.stringify({ id: response.id, codigoBarras: response.codigoBarras, status: response.status })}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `[NUGECID] Erro ao criar desarquivamento para processo ${request.numeroProcesso}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private normalizeTipoDesarquivamento(
    value?: string,
  ): TipoDesarquivamentoEnum {
    if (!value) {
      return TipoDesarquivamentoEnum.FISICO;
    }

    const normalized = value
      .toString()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    if (
      Object.values(TipoDesarquivamentoEnum).includes(
        normalized as TipoDesarquivamentoEnum,
      )
    ) {
      return normalized as TipoDesarquivamentoEnum;
    }

    this.logger.warn(
      `Tipo de desarquivamento inválido "${value}" recebido; aplicando FISICO como padrão.`,
    );
    return TipoDesarquivamentoEnum.FISICO;
  }

  private async validateRequest(
    request: CreateDesarquivamentoRequest,
  ): Promise<void> {
    // Validar campos obrigatórios
    if (!request.nomeCompleto || request.nomeCompleto.trim().length === 0) {
      throw new Error("Nome completo é obrigatório");
    }

    if (
      !request.numeroNicLaudoAuto ||
      request.numeroNicLaudoAuto.trim().length === 0
    ) {
      throw new Error("Número NIC/Laudo/Auto é obrigatório");
    }

    // Número do processo pode ser vazio em ambiente de testes/importação

    if (!request.criadoPorId || request.criadoPorId <= 0) {
      throw new Error("ID do usuário criador é obrigatório e deve ser válido");
    }

    // Número de processo pode se repetir; será tratado na lógica de impressão

    // Validar tipo de desarquivamento
    const tiposValidos = Object.values(TipoDesarquivamentoEnum);
    if (
      !tiposValidos.includes(
        request.tipoDesarquivamento as TipoDesarquivamentoEnum,
      )
    ) {
      throw new Error(
        `Tipo de desarquivamento inválido. Valores aceitos: ${tiposValidos.join(", ")}`,
      );
    }

    // Validar se o responsável existe (se fornecido)
    if (request.responsavelId && request.responsavelId <= 0) {
      throw new Error("ID do responsável deve ser válido");
    }

    // Validar tamanhos máximos
    if (request.nomeCompleto.length > 255) {
      throw new Error("Nome completo deve ter no máximo 255 caracteres");
    }

    if (request.numeroProcesso && request.numeroProcesso.length > 50) {
      throw new Error("Número do processo deve ter no máximo 50 caracteres");
    }

    if (request.setorDemandante && request.setorDemandante.length > 255) {
      throw new Error("Setor demandante deve ter no máximo 255 caracteres");
    }

    if (request.tipoDocumento && request.tipoDocumento.length > 100) {
      throw new Error("Tipo do documento deve ter no máximo 100 caracteres");
    }

    if (
      request.servidorResponsavel &&
      request.servidorResponsavel.length > 255
    ) {
      throw new Error("Servidor responsável deve ter no máximo 255 caracteres");
    }

    if (
      request.finalidadeDesarquivamento &&
      request.finalidadeDesarquivamento.length > 500
    ) {
      throw new Error("Finalidade deve ter no máximo 500 caracteres");
    }

    // Validar datas
    if (request.dataSolicitacao) {
      const dataSolicitacao = new Date(request.dataSolicitacao);
      if (dataSolicitacao > new Date()) {
        throw new Error("Data de solicitação não pode ser futura");
      }
    }
  }

  private async generateUniqueCodigoBarras(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const codigoBarras = CodigoBarras.generateNew();
      const exists = await this.desarquivamentoRepository.existsByCodigoBarras(
        codigoBarras.value,
      );

      if (!exists) {
        return codigoBarras.value;
      }

      attempts++;
    }

    throw new Error(
      "Não foi possível gerar um código de barras único após várias tentativas",
    );
  }

  private mapToResponse(
    desarquivamento: DesarquivamentoDomain,
  ): CreateDesarquivamentoResponse {
    return {
      id: desarquivamento.id?.value || 0,
      codigoBarras: desarquivamento.numeroNicLaudoAuto, // Using numeroNicLaudoAuto as unique identifier
      tipoSolicitacao: desarquivamento.tipoDesarquivamento,
      status: desarquivamento.status.value,
      nomeSolicitante: desarquivamento.nomeCompleto,
      nomeVitima: undefined, // Not applicable in new structure
      numeroRegistro: desarquivamento.numeroProcesso,
      numeroProcesso: desarquivamento.numeroProcesso,
      tipoDocumento: desarquivamento.tipoDocumento,
      dataFato: undefined, // Not applicable in new structure
      prazoAtendimento: undefined, // Not applicable in new structure
      dataAtendimento: desarquivamento.dataDesarquivamentoSAG,
      resultadoAtendimento: undefined, // Not applicable in new structure
      finalidade: desarquivamento.finalidadeDesarquivamento,
      observacoes: undefined, // Not applicable in new structure
      urgente: desarquivamento.urgente || false,
      localizacaoFisica: undefined, // Not applicable in new structure
      criadoPorId: desarquivamento.criadoPorId,
      responsavelId: desarquivamento.responsavelId,
      createdAt: desarquivamento.createdAt,
      updatedAt: desarquivamento.updatedAt,
    };
  }
}
