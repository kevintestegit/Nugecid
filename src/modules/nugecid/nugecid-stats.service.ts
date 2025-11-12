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
    const total = await this.desarquivamentoRepository.count();

    const pendentes = await this.desarquivamentoRepository.count({
      where: { status: StatusDesarquivamentoEnum.SOLICITADO },
    });

    const emAndamento = await this.desarquivamentoRepository.count({
      where: { status: StatusDesarquivamentoEnum.DESARQUIVADO },
    });

    const concluidos = await this.desarquivamentoRepository.count({
      where: { status: StatusDesarquivamentoEnum.FINALIZADO },
    });

    const urgentes = await this.desarquivamentoRepository.count({
      where: { urgente: true },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const vencidos = await this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .where("desarquivamento.dataSolicitacao < :thirtyDaysAgo", {
        thirtyDaysAgo,
      })
      .andWhere("desarquivamento.status != :finalizado", {
        finalizado: "FINALIZADO",
      })
      .getCount();

    // Buscar dados do mês anterior para comparação
    const mesAtual = new Date();
    const inicioMesAtual = new Date(
      mesAtual.getFullYear(),
      mesAtual.getMonth(),
      1,
    );
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

    const totalMesAnterior = await this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .where("desarquivamento.createdAt >= :inicio", {
        inicio: inicioMesAnterior,
      })
      .andWhere("desarquivamento.createdAt <= :fim", { fim: fimMesAnterior })
      .getCount();

    const pendentesMesAnterior = await this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .where("desarquivamento.createdAt >= :inicio", {
        inicio: inicioMesAnterior,
      })
      .andWhere("desarquivamento.createdAt <= :fim", { fim: fimMesAnterior })
      .andWhere("desarquivamento.status = :status", {
        status: StatusDesarquivamentoEnum.SOLICITADO,
      })
      .getCount();

    // Agrupar por status
    const porStatusArray = await this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .select("desarquivamento.status", "status")
      .addSelect("COUNT(desarquivamento.id)", "count")
      .groupBy("desarquivamento.status")
      .getRawMany();

    const porStatus: Record<string, number> = {};
    porStatusArray.forEach((item) => {
      porStatus[item.status] = parseInt(item.count);
    });

    // Agrupar por tipo
    const porTipoArray = await this.desarquivamentoRepository
      .createQueryBuilder("desarquivamento")
      .select("desarquivamento.tipoDesarquivamento", "tipo")
      .addSelect("COUNT(desarquivamento.id)", "count")
      .groupBy("desarquivamento.tipoDesarquivamento")
      .getRawMany();

    const porTipo: Record<string, number> = {};
    porTipoArray.forEach((item) => {
      porTipo[item.tipo] = parseInt(item.count);
    });

    const recentes = await this.desarquivamentoRepository.find({
      relations: ["criadoPor"],
      order: { createdAt: "DESC" },
      take: 10,
    });

    return {
      total,
      pendentes,
      emAndamento,
      concluidos,
      vencidos,
      urgentes,
      porStatus,
      porTipo,
      recentes,
      totalMesAnterior,
      pendentesMesAnterior,
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
