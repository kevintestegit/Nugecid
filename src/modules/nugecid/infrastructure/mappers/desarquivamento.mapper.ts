import { Injectable } from "@nestjs/common";
import { DesarquivamentoDomain } from "../../domain/entities/desarquivamento.entity";
import { DesarquivamentoTypeOrmEntity } from "../entities/desarquivamento.typeorm-entity";
import {
  DesarquivamentoId,
  StatusDesarquivamento,
} from "../../domain/value-objects";
import { StatusDesarquivamentoEnum } from "../../domain/value-objects/status-desarquivamento.vo";
import { TipoDesarquivamentoEnum } from "../../domain/enums/tipo-desarquivamento.enum";

@Injectable()
export class DesarquivamentoMapper {
  /**
   * Converte string do banco para StatusDesarquivamentoEnum
   */
  private mapStatusStringToEnum(
    statusString: string,
  ): StatusDesarquivamentoEnum {
    switch (statusString?.toUpperCase()) {
      case StatusDesarquivamentoEnum.FINALIZADO.toUpperCase():
        return StatusDesarquivamentoEnum.FINALIZADO;
      case StatusDesarquivamentoEnum.DESARQUIVADO.toUpperCase():
        return StatusDesarquivamentoEnum.DESARQUIVADO;
      case StatusDesarquivamentoEnum.NAO_COLETADO.toUpperCase():
        return StatusDesarquivamentoEnum.NAO_COLETADO;
      case StatusDesarquivamentoEnum.SOLICITADO.toUpperCase():
        return StatusDesarquivamentoEnum.SOLICITADO;
      case StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO.toUpperCase():
        return StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO;
      case StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR.toUpperCase():
        return StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR;
      case StatusDesarquivamentoEnum.NAO_LOCALIZADO.toUpperCase():
        return StatusDesarquivamentoEnum.NAO_LOCALIZADO;
      default:
        // Valor padrão para casos desconhecidos
        console.warn(
          `Status desconhecido do banco: ${statusString}, usando SOLICITADO como padrão`,
        );
        return StatusDesarquivamentoEnum.SOLICITADO;
    }
  }

  /**
   * Converte uma entidade de domínio para uma entidade TypeORM
   */
  toTypeOrm(domain: DesarquivamentoDomain): DesarquivamentoTypeOrmEntity {
    const entity = new DesarquivamentoTypeOrmEntity();

    // ID (apenas se existir)
    if (domain.id) {
      entity.id = domain.id.value;
    }

    // Propriedades simplificadas
    entity.numeroSolicitacao = domain.numeroSolicitacao;
    const tipoValor = domain.tipoDesarquivamento
      ? domain.tipoDesarquivamento
          .toString()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
      : TipoDesarquivamentoEnum.FISICO;
    const tipoNormalizado = Object.values(TipoDesarquivamentoEnum).includes(
      tipoValor as TipoDesarquivamentoEnum,
    )
      ? (tipoValor as TipoDesarquivamentoEnum)
      : TipoDesarquivamentoEnum.FISICO;
    entity.tipoDesarquivamento = tipoNormalizado;
    entity.desarquivamentoFisicoDigital = tipoNormalizado; // Mapear para o campo obrigatório do banco
    entity.status = domain.status.value;
    entity.nomeCompleto = domain.nomeCompleto;
    entity.numeroNicLaudoAuto = domain.numeroNicLaudoAuto;
    entity.numeroProcesso = domain.numeroProcesso;
    entity.tipoDocumento = domain.tipoDocumento;
    entity.dataSolicitacao = domain.dataSolicitacao;
    entity.dataDesarquivamentoSAG = domain.dataDesarquivamentoSAG;
    // Converter undefined para null para forçar atualização no banco de dados
    const dataDevolucao =
      domain.dataDevolucaoSetor === undefined
        ? null
        : domain.dataDevolucaoSetor;
    console.log("[Mapper] toTypeOrm - Convertendo dataDevolucaoSetor:", {
      domain: domain.dataDevolucaoSetor,
      entity: dataDevolucao,
    });
    entity.dataDevolucaoSetor = dataDevolucao;
    entity.setorDemandante = domain.setorDemandante;
    entity.servidorResponsavel = domain.servidorResponsavel;
    entity.finalidadeDesarquivamento = domain.finalidadeDesarquivamento;
    entity.solicitacaoProrrogacao = domain.solicitacaoProrrogacao;
    entity.urgente = domain.urgente;
    entity.instituto = domain.instituto;
    entity.requerente = domain.requerente;
    entity.criadoPorId = domain.criadoPorId;
    entity.responsavelId = domain.responsavelId;

    // Timestamps
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.deletedAt = domain.deletedAt;

    return entity;
  }

  /**
   * Converte uma entidade TypeORM para uma entidade de domínio
   */
  toDomain(entity: DesarquivamentoTypeOrmEntity): DesarquivamentoDomain {
    // Criar value objects - garantir que o ID seja válido
    if (!entity.id || entity.id <= 0) {
      throw new Error(
        `Entidade TypeORM com ID inválido encontrada: ${entity.id}`,
      );
    }
    const id = DesarquivamentoId.create(entity.id);

    // Garantir que deletedAt seja undefined se for null do banco
    const deletedAt = entity.deletedAt || undefined;

    // Converter string do banco para StatusDesarquivamentoEnum
    const statusEnum = this.mapStatusStringToEnum(entity.status);
    const status = StatusDesarquivamento.create(statusEnum);

    // Reconstruir domínio com o status value object correto
    const safeNumeroProcesso =
      entity.numeroProcesso &&
      entity.numeroProcesso.toString().trim().length > 0
        ? entity.numeroProcesso
        : "N/A";

    const domainData = {
      id,
      numeroSolicitacao: entity.numeroSolicitacao,
      tipoDesarquivamento:
        entity.desarquivamentoFisicoDigital || entity.tipoDesarquivamento,
      status,
      nomeCompleto: entity.nomeCompleto,
      numeroNicLaudoAuto: entity.numeroNicLaudoAuto,
      numeroProcesso: safeNumeroProcesso,
      tipoDocumento: entity.tipoDocumento,
      dataSolicitacao: entity.dataSolicitacao,
      dataDesarquivamentoSAG: entity.dataDesarquivamentoSAG,
      dataDevolucaoSetor: entity.dataDevolucaoSetor,
      setorDemandante: entity.setorDemandante,
      servidorResponsavel: entity.servidorResponsavel,
      finalidadeDesarquivamento: entity.finalidadeDesarquivamento,
      solicitacaoProrrogacao: entity.solicitacaoProrrogacao,
      urgente: entity.urgente,
      instituto: entity.instituto,
      requerente: entity.requerente,
      criadoPorId: entity.criadoPorId,
      responsavelId: entity.responsavelId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: deletedAt, // Agora será undefined se vier null do banco
    };

    return DesarquivamentoDomain.reconstruct(domainData);
  }

  /**
   * Converte uma lista de entidades TypeORM para entidades de domínio
   */
  toDomainList(
    entities: DesarquivamentoTypeOrmEntity[],
  ): DesarquivamentoDomain[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Converte uma lista de entidades de domínio para entidades TypeORM
   */
  toTypeOrmList(
    domains: DesarquivamentoDomain[],
  ): DesarquivamentoTypeOrmEntity[] {
    return domains.map((domain) => this.toTypeOrm(domain));
  }

  /**
   * Converte uma entidade de domínio para um objeto plano (para DTOs)
   */
  toPlainObject(domain: DesarquivamentoDomain): any {
    // Garantir que o ID seja válido
    if (!domain.id?.value || domain.id.value <= 0) {
      throw new Error(
        `Tentativa de converter desarquivamento com ID inválido: ${domain.id?.value}`,
      );
    }

    const tipoValor = domain.tipoDesarquivamento
      ? domain.tipoDesarquivamento
          .toString()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
      : TipoDesarquivamentoEnum.FISICO;
    const tipoNormalizado = Object.values(TipoDesarquivamentoEnum).includes(
      tipoValor as TipoDesarquivamentoEnum,
    )
      ? (tipoValor as TipoDesarquivamentoEnum)
      : TipoDesarquivamentoEnum.FISICO;

    return {
      id: domain.id.value,
      numeroSolicitacao: domain.numeroSolicitacao,
      tipoDesarquivamento: tipoNormalizado,
      desarquivamentoFisicoDigital: tipoNormalizado,
      status: domain.status.value,
      nomeCompleto: domain.nomeCompleto,
      numeroNicLaudoAuto: domain.numeroNicLaudoAuto,
      numeroProcesso: domain.numeroProcesso,
      tipoDocumento: domain.tipoDocumento,
      dataSolicitacao: domain.dataSolicitacao,
      dataDesarquivamentoSAG: domain.dataDesarquivamentoSAG,
      dataDevolucaoSetor: domain.dataDevolucaoSetor,
      setorDemandante: domain.setorDemandante,
      servidorResponsavel: domain.servidorResponsavel,
      finalidadeDesarquivamento: domain.finalidadeDesarquivamento,
      solicitacaoProrrogacao: domain.solicitacaoProrrogacao,
      urgente: domain.urgente,
      instituto: domain.instituto,
      requerente: domain.requerente,
      criadoPorId: domain.criadoPorId,
      responsavelId: domain.responsavelId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
      // Propriedades calculadas
      isOverdue: domain.isOverdue(),
      daysUntilDeadline: domain.getDaysUntilDeadline(),
    };
  }

  /**
   * Converte uma lista de entidades de domínio para objetos planos
   */
  toPlainObjectList(domains: DesarquivamentoDomain[]): any[] {
    return domains.map((domain) => this.toPlainObject(domain));
  }

  /**
   * Converte dados de entrada (DTO) para uma entidade de domínio
   */
  fromCreateDto(dto: any): DesarquivamentoDomain {
    const status = StatusDesarquivamento.create(
      StatusDesarquivamentoEnum.SOLICITADO,
    );

    return DesarquivamentoDomain.create({
      tipoDesarquivamento: dto.tipoDesarquivamento,
      status,
      nomeCompleto: dto.nomeCompleto,
      numeroNicLaudoAuto: dto.numeroNicLaudoAuto,
      numeroProcesso: dto.numeroProcesso,
      tipoDocumento: dto.tipoDocumento,
      dataSolicitacao: dto.dataSolicitacao
        ? new Date(dto.dataSolicitacao)
        : new Date(),
      setorDemandante: dto.setorDemandante,
      servidorResponsavel: dto.servidorResponsavel,
      finalidadeDesarquivamento: dto.finalidadeDesarquivamento,
      solicitacaoProrrogacao: dto.solicitacaoProrrogacao || false,
      urgente: dto.urgente || false,
      criadoPorId: dto.criadoPorId,
    });
  }

  /**
   * Aplica atualizações de um DTO para uma entidade de domínio existente
   */
  applyUpdateDto(
    domain: DesarquivamentoDomain,
    dto: any,
  ): DesarquivamentoDomain {
    // For the simplified structure, updates are handled through domain methods
    // This method can be used for simple field updates that don't require
    // complex business logic

    const currentData = domain.toPlainObject();
    const updatedData = {
      ...currentData,
      ...(dto.tipoDesarquivamento !== undefined && {
        tipoDesarquivamento: dto.tipoDesarquivamento,
      }),
      ...(dto.nomeCompleto !== undefined && {
        nomeCompleto: dto.nomeCompleto,
      }),
      ...(dto.numeroProcesso !== undefined && {
        numeroProcesso: dto.numeroProcesso,
      }),
      ...(dto.tipoDocumento !== undefined && {
        tipoDocumento: dto.tipoDocumento,
      }),
      ...(dto.setorDemandante !== undefined && {
        setorDemandante: dto.setorDemandante,
      }),
      ...(dto.servidorResponsavel !== undefined && {
        servidorResponsavel: dto.servidorResponsavel,
      }),
      ...(dto.finalidadeDesarquivamento !== undefined && {
        finalidadeDesarquivamento: dto.finalidadeDesarquivamento,
      }),
      ...(dto.solicitacaoProrrogacao !== undefined && {
        solicitacaoProrrogacao: dto.solicitacaoProrrogacao,
      }),
      ...(dto.urgente !== undefined && {
        urgente: dto.urgente,
      }),
      updatedAt: new Date(),
    };

    return DesarquivamentoDomain.reconstruct(updatedData);
  }
}
