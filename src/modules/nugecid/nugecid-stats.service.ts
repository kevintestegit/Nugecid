import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "./domain/enums/status-desarquivamento.enum";

export interface DashboardStats {
  total: number;
  pendentes: number;
  emAndamento: number;
  concluidos: number;
  vencidos: number;
  urgentes: number;
  porStatus: Record<string, number>;
  porTipo: Record<string, number>;
  recentes: DesarquivamentoTypeOrmEntity[];
  // Dados do mês anterior para comparação de tendência
  totalMesAnterior?: number;
  pendentesMesAnterior?: number;
}

@Injectable()
export class NugecidStatsService {
  private readonly logger = new Logger(NugecidStatsService.name);

  constructor(
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mesAtual = new Date();
    const inicioMesAnterior = new Date(
      mesAtual.getFullYear(),
      mesAtual.getMonth() - 1,
      1,
    );
    const fimMesAnterior = new Date(
      mesAtual.getFullYear(),
      mesAtual.getMonth(),
      0,
      23,
      59,
      59,
    );

    // Executar todas as queries em paralelo
    const [
      statsResult,
      mesAnteriorResult,
      porStatusArray,
      porTipoArray,
      recentes,
    ] = await Promise.all([
      // Query única para contagens principais
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .select("COUNT(*)", "total")
        .addSelect(
          `SUM(CASE WHEN d.status = '${StatusDesarquivamentoEnum.SOLICITADO}' THEN 1 ELSE 0 END)`,
          "pendentes",
        )
        .addSelect(
          `SUM(CASE WHEN d.status = '${StatusDesarquivamentoEnum.DESARQUIVADO}' THEN 1 ELSE 0 END)`,
          "emAndamento",
        )
        .addSelect(
          `SUM(CASE WHEN d.status = '${StatusDesarquivamentoEnum.FINALIZADO}' THEN 1 ELSE 0 END)`,
          "concluidos",
        )
        .addSelect(
          `SUM(CASE WHEN d.urgente = true THEN 1 ELSE 0 END)`,
          "urgentes",
        )
        .addSelect(
          `SUM(CASE WHEN d.dataSolicitacao < :thirtyDaysAgo AND d.status != 'FINALIZADO' THEN 1 ELSE 0 END)`,
          "vencidos",
        )
        .setParameter("thirtyDaysAgo", thirtyDaysAgo)
        .getRawOne(),

      // Query para dados do mês anterior
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .select("COUNT(*)", "total")
        .addSelect(
          `SUM(CASE WHEN d.status = '${StatusDesarquivamentoEnum.SOLICITADO}' THEN 1 ELSE 0 END)`,
          "pendentes",
        )
        .where("d.createdAt >= :inicio", { inicio: inicioMesAnterior })
        .andWhere("d.createdAt <= :fim", { fim: fimMesAnterior })
        .getRawOne(),

      // Agrupar por status
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .select("d.status", "status")
        .addSelect("COUNT(d.id)", "count")
        .groupBy("d.status")
        .getRawMany(),

      // Agrupar por tipo
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .select("d.tipoDesarquivamento", "tipo")
        .addSelect("COUNT(d.id)", "count")
        .groupBy("d.tipoDesarquivamento")
        .getRawMany(),

      // Recentes
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .leftJoinAndSelect("d.criadoPor", "criadoPor")
        .select([
          "d.id",
          "d.nomeCompleto",
          "d.numeroNicLaudoAuto",
          "d.numeroProcesso",
          "d.status",
          "d.tipoDesarquivamento",
          "d.dataSolicitacao",
          "d.createdAt",
          "d.urgente",
          "criadoPor.id",
          "criadoPor.nome",
        ])
        .orderBy("d.createdAt", "DESC")
        .take(10)
        .getMany(),
    ]);

    const porStatus: Record<string, number> = {};
    porStatusArray.forEach((item) => {
      porStatus[item.status] = parseInt(item.count, 10);
    });

    const porTipo: Record<string, number> = {};
    porTipoArray.forEach((item) => {
      if (item.tipo) {
        porTipo[item.tipo] = parseInt(item.count, 10);
      }
    });

    return {
      total: parseInt(statsResult.total, 10) || 0,
      pendentes: parseInt(statsResult.pendentes, 10) || 0,
      emAndamento: parseInt(statsResult.emAndamento, 10) || 0,
      concluidos: parseInt(statsResult.concluidos, 10) || 0,
      vencidos: parseInt(statsResult.vencidos, 10) || 0,
      urgentes: parseInt(statsResult.urgentes, 10) || 0,
      porStatus,
      porTipo,
      recentes,
      totalMesAnterior: parseInt(mesAnteriorResult.total, 10) || 0,
      pendentesMesAnterior: parseInt(mesAnteriorResult.pendentes, 10) || 0,
    };
  }

  private getStatusColor(status: string): string {
    const colors = {
      FINALIZADO: "#10b981",
      DESARQUIVADO: "#3b82f6",
      NAO_COLETADO: "#f59e0b",
      SOLICITADO: "#8b5cf6",
      REARQUIVAMENTO_SOLICITADO: "#6b7280",
      RETIRADO_PELO_SETOR: "#06b6d4",
      NAO_LOCALIZADO: "#ef4444",
    };
    return colors[status] || "#6b7280";
  }
}
