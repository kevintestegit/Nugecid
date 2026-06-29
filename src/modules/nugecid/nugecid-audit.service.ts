import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Auditoria } from "../audit/entities/auditoria.entity";
import { AuditHashService } from "../audit/audit-hash.service";
import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";

@Injectable()
export class NugecidAuditService {
  private readonly logger = new Logger(NugecidAuditService.name);

  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
    private readonly auditHashService: AuditHashService,
  ) {}

  async saveAudit(
    userId: number,
    action: string,
    resource: string,
    details: string,
    data?: any,
    resourceId?: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const enrichedData = {
        details,
        originalData: data,
        action,
        resource,
        userId,
        resourceId: resourceId || data?.desarquivamentoId || 0,
        metadata: {
          environment: process.env.NODE_ENV || "development",
          version: process.env.npm_package_version || "1.0.0",
          service: "nugecid-service",
        },
      };

      const auditData = Auditoria.createResourceAudit(
        userId,
        action as any,
        resource as any,
        resourceId || data?.desarquivamentoId || 0,
        enrichedData,
        ipAddress || "system",
        userAgent || "nugecid-service",
      );

      const auditWithHash = await this.auditHashService.prepareHash(auditData);
      const audit = this.auditoriaRepository.create(auditWithHash);
      await this.auditoriaRepository.save(audit);
    } catch (error) {
      this.logger.error(
        `Erro ao salvar auditoria: ${error.message}`,
        error.stack,
      );
    }
  }

  async saveDesarquivamentoAudit(
    userId: number,
    action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "VIEW",
    desarquivamento: Partial<DesarquivamentoTypeOrmEntity>,
    changes?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const details = this.buildAuditDetails(action, desarquivamento, changes);

    const auditData = {
      desarquivamentoId: desarquivamento.id,
      numeroNicLaudoAuto: desarquivamento.numeroNicLaudoAuto,
      numeroProcesso: desarquivamento.numeroProcesso,
      nomeCompleto: desarquivamento.nomeCompleto,
      tipoDesarquivamento: desarquivamento.tipoDesarquivamento,
      status: desarquivamento.status,
      changes,
      previousValues: changes ? this.extractPreviousValues(changes) : null,
    };

    if (action === "VIEW" && desarquivamento.id) {
      await this.saveViewAudit(
        userId,
        desarquivamento.id,
        details,
        auditData,
        ipAddress,
        userAgent,
      );
      return;
    }

    await this.saveAudit(
      userId,
      action,
      "DESARQUIVAMENTO",
      details,
      auditData,
      desarquivamento.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Append-only view audit: every view creates a new tamper-evident record.
   * To keep analytics efficient, a separate summary table can be added later.
   */
  private async saveViewAudit(
    userId: number,
    desarquivamentoId: number,
    details: string,
    auditData: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.saveAudit(
      userId,
      "VIEW",
      "DESARQUIVAMENTO",
      details,
      {
        ...auditData,
        metadata: {
          viewTimestamp: new Date().toISOString(),
        },
      },
      desarquivamentoId,
      ipAddress,
      userAgent,
    );
  }

  private buildAuditDetails(
    action: string,
    desarquivamento: Partial<DesarquivamentoTypeOrmEntity>,
    changes?: any,
  ): string {
    const baseInfo = `${desarquivamento.numeroNicLaudoAuto || "N/A"} - ${desarquivamento.nomeCompleto || "N/A"}`;

    switch (action) {
      case "CREATE":
        return `Novo desarquivamento criado: ${baseInfo} (Tipo: ${desarquivamento.tipoDesarquivamento}, Status: ${desarquivamento.status})`;
      case "UPDATE":
        const changedFields = changes ? Object.keys(changes).join(", ") : "N/A";
        return `Desarquivamento atualizado: ${baseInfo} (Campos alterados: ${changedFields})`;
      case "DELETE":
        return `Desarquivamento removido: ${baseInfo}`;
      case "RESTORE":
        return `Desarquivamento restaurado: ${baseInfo}`;
      case "VIEW":
        return `Desarquivamento visualizado: ${baseInfo}`;
      default:
        return `Ação ${action} executada em desarquivamento: ${baseInfo}`;
    }
  }

  private extractPreviousValues(changes: any): any {
    if (!changes || typeof changes !== "object") {
      return null;
    }

    const previousValues: any = {};

    // Extrai os valores "from" de cada mudança
    for (const [key, value] of Object.entries(changes)) {
      if (value && typeof value === "object" && "from" in value) {
        previousValues[key] = value.from;
      }
    }

    return Object.keys(previousValues).length > 0 ? previousValues : null;
  }

  /**
   * Busca auditorias por entidade e ID
   */
  async findByEntity(
    entityName: string,
    entityId: number,
  ): Promise<Auditoria[]> {
    try {
      const auditorias = await this.auditoriaRepository.find({
        where: {
          entityName,
          entityId,
        },
        relations: ["user"],
        order: {
          timestamp: "DESC",
        },
      });

      this.logger.debug(
        `Encontradas ${auditorias.length} auditorias para ${entityName} #${entityId}`,
      );

      return auditorias;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar auditorias: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
