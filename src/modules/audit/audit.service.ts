import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";

import { Auditoria } from "./entities/auditoria.entity";
import { QueryAuditDto } from "./dto/query-audit.dto";

type AuditListItem = {
  id: number;
  action: string;
  actionLabel: string;
  entityName: string;
  entityId: number | null;
  resourceLabel: string;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  error: string | null;
  timestamp: Date;
  user: {
    id: number;
    nome: string;
    usuario: string;
  } | null;
};

type AuditListResult = {
  items: AuditListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async findAll(query: QueryAuditDto): Promise<AuditListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.auditoriaRepository
      .createQueryBuilder("audit")
      .leftJoin("audit.user", "user")
      .addSelect(["user.id", "user.nome", "user.usuario"])
      .orderBy("audit.timestamp", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (query.action) {
      qb.andWhere("audit.action = :action", { action: query.action });
    }

    if (query.entityName?.trim()) {
      qb.andWhere("LOWER(audit.entityName) = :entityName", {
        entityName: query.entityName.trim().toLowerCase(),
      });
    }

    if (typeof query.userId === "number") {
      qb.andWhere("audit.userId = :userId", { userId: query.userId });
    }

    if (query.success === "true" || query.success === "false") {
      qb.andWhere("audit.success = :success", {
        success: query.success === "true",
      });
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((searchQb) => {
          searchQb
            .where("LOWER(COALESCE(user.nome, '')) LIKE :term", { term })
            .orWhere("LOWER(COALESCE(user.usuario, '')) LIKE :term", { term })
            .orWhere("LOWER(COALESCE(audit.entityName, '')) LIKE :term", {
              term,
            })
            .orWhere("LOWER(COALESCE(audit.ipAddress, '')) LIKE :term", {
              term,
            })
            .orWhere("LOWER(COALESCE(audit.error, '')) LIKE :term", { term });
        }),
      );
    }

    const [items, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return {
      items: items.map((audit) => ({
        id: audit.id,
        action: audit.action,
        actionLabel: audit.getActionLabel(),
        entityName: audit.entityName,
        entityId: audit.entityId ?? null,
        resourceLabel: audit.getResourceLabel(),
        details: audit.details ?? null,
        ipAddress: audit.ipAddress ?? null,
        userAgent: audit.userAgent ?? null,
        success: audit.success,
        error: audit.error ?? null,
        timestamp: audit.timestamp,
        user: audit.user
          ? {
              id: audit.user.id,
              nome: audit.user.nome,
              usuario: audit.user.usuario,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
