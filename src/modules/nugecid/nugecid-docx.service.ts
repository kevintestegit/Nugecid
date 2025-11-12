import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import HTMLToDOCX from "html-to-docx";
import { Repository } from "typeorm";

import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import {
  buildTermoTemplateHtml,
  loadTermoTemplateLogos,
} from "./templates/termo-desarquivamento-template";

export interface TermoDesarquivamentoDocxOptions {
  incluirObservacoes?: boolean;
  incluirLocalizacao?: boolean;
}

@Injectable()
export class NugecidDocxService {
  private readonly logger = new Logger(NugecidDocxService.name);

  constructor(
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
  ) {}

  async generateTermoDocx(
    desarquivamento: DesarquivamentoTypeOrmEntity,
    _options: TermoDesarquivamentoDocxOptions = {},
  ): Promise<Buffer> {
    const baseEntity = await this.resolveBaseEntity(desarquivamento);
    const itensElegiveis = await this.findEligibleProcessItems(baseEntity);
    const somenteDesarquivados = this.filterDesarquivados(itensElegiveis);

    if (!somenteDesarquivados.length) {
      throw new BadRequestException(
        "Nao ha itens com status DESARQUIVADO para este processo.",
      );
    }

    const html = buildTermoTemplateHtml({
      base: baseEntity,
      itens: somenteDesarquivados,
      logos: loadTermoTemplateLogos(this.logger),
    });

    try {
      const buffer = await HTMLToDOCX(html, undefined, undefined, {
        table: { row: { cantSplit: true } },
        footer: true,
        recursiveList: true,
      });

      this.logger.log(
        `Gerado termo DOCX para processo ${baseEntity.numeroProcesso} com ${itensElegiveis.length} item(s).`,
      );
      return buffer;
    } catch (error) {
      this.logger.error(
        "Erro ao gerar termo DOCX via template HTML.",
        error as Error,
      );
      throw new InternalServerErrorException(
        "Não foi possível gerar o termo de desarquivamento em DOCX. Tente novamente mais tarde.",
      );
    }
  }

  private async resolveBaseEntity(
    desarquivamento: DesarquivamentoTypeOrmEntity,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    if (desarquivamento?.id) {
      const entity = await this.desarquivamentoRepository.findOne({
        where: { id: desarquivamento.id },
      });
      if (entity) {
        return entity;
      }
    }
    return desarquivamento;
  }

  private async findEligibleProcessItems(
    base: DesarquivamentoTypeOrmEntity,
  ): Promise<DesarquivamentoTypeOrmEntity[]> {
    if (!base.numeroProcesso) {
      if (base.status?.toUpperCase().trim() === "DESARQUIVADO") {
        return [base];
      }
      return [];
    }

    const numeroProcessoNormalizado = (base.numeroProcesso || "").trim();

    const query = this.desarquivamentoRepository
      .createQueryBuilder("d")
      .where("TRIM(d.numeroProcesso) = :numeroProcesso", {
        numeroProcesso: numeroProcessoNormalizado,
      })
      .andWhere("TRIM(UPPER(d.status::text)) = :status", {
        status: "DESARQUIVADO",
      })
      .orderBy("d.numeroSolicitacao", "ASC")
      .addOrderBy("d.createdAt", "ASC")
      .addOrderBy("d.id", "ASC");

    const results = await query.getMany();
    const filtered = results.filter(
      (item) => item.status?.toUpperCase().trim() === "DESARQUIVADO",
    );

    const byId = new Map<number, DesarquivamentoTypeOrmEntity>();
    for (const item of filtered) {
      byId.set(item.id, item);
    }

    if (
      base.id &&
      base.status?.toUpperCase().trim() === "DESARQUIVADO" &&
      !byId.has(base.id)
    ) {
      byId.set(base.id, base);
    }

    return Array.from(byId.values()).sort((a, b) => {
      const ordemA = a.numeroSolicitacao ?? 0;
      const ordemB = b.numeroSolicitacao ?? 0;
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      const createdA =
        (a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : new Date(a.createdAt).getTime()) || 0;
      const createdB =
        (b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : new Date(b.createdAt).getTime()) || 0;
      if (createdA !== createdB) {
        return createdA - createdB;
      }
      return (a.id || 0) - (b.id || 0);
    });
  }

  private filterDesarquivados(
    itens: DesarquivamentoTypeOrmEntity[],
  ): DesarquivamentoTypeOrmEntity[] {
    return itens.filter(
      (item) => item.status?.toUpperCase().trim() === "DESARQUIVADO",
    );
  }
}
