import { DesarquivamentoTypeOrmEntity } from "../../src/modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { TipoDesarquivamentoEnum } from "../../src/modules/nugecid/domain/value-objects/tipo-desarquivamento.vo";
import { StatusDesarquivamentoEnum } from "../../src/modules/nugecid/domain/enums/status-desarquivamento.enum";

export class DesarquivamentoFactory {
  static build(
    data: Partial<DesarquivamentoTypeOrmEntity> = {},
  ): Partial<DesarquivamentoTypeOrmEntity> {
    const now = new Date();

    return {
      tipoDesarquivamento:
        data.tipoDesarquivamento || TipoDesarquivamentoEnum.FISICO,
      status:
        (data.status as StatusDesarquivamentoEnum) ||
        StatusDesarquivamentoEnum.SOLICITADO,
      nomeCompleto: data.nomeCompleto || "Solicitante Teste",
      numeroNicLaudoAuto: data.numeroNicLaudoAuto || `NIC-${Date.now()}`,
      numeroProcesso: data.numeroProcesso || "123456",
      tipoDocumento: data.tipoDocumento || "Laudo Pericial",
      dataSolicitacao: data.dataSolicitacao || now,
      setorDemandante: data.setorDemandante || "Setor Teste",
      servidorResponsavel: data.servidorResponsavel || "Servidor Teste",
      finalidadeDesarquivamento:
        data.finalidadeDesarquivamento || "Teste de Factory",
      solicitacaoProrrogacao: data.solicitacaoProrrogacao || false,
      urgente: data.urgente !== undefined ? data.urgente : false,
      criadoPorId: data.criadoPorId || 1,
      responsavelId: data.responsavelId,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      ...data,
    };
  }
}
