import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import {
  generateDesarquivamentoDocx,
  DesarquivamentoDocxData,
  DesarquivamentoDocxItem,
} from "./templates/termo-desarquivamento-docx.template";

export interface TermoDesarquivamentoDocxOptions {
  incluirObservacoes?: boolean;
  incluirLocalizacao?: boolean;
}

@Injectable()
export class NugecidDocxService {
  private readonly logger = new Logger(NugecidDocxService.name);
  private readonly printableStatuses = [
    "DESARQUIVADO",
    "REARQUIVAMENTO_SOLICITADO",
  ];

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
        "Nao ha itens com status DESARQUIVADO ou REARQUIVAMENTO_SOLICITADO para este processo.",
      );
    }

    // Preparar dados para o template DOCX
    const now = new Date();
    const dataAssinatura = now.toLocaleDateString("pt-BR");
    const horaAssinatura = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const docxData: DesarquivamentoDocxData = {
      numeroProcesso: baseEntity.numeroProcesso || "",
      itens: somenteDesarquivados.map(
        (item): DesarquivamentoDocxItem => ({
          numeroSolicitacao: item.numeroSolicitacao,
          tipoDocumento: item.tipoDocumento || "",
          nomeCompleto: item.nomeCompleto || "",
          numeroNicLaudoAuto: item.numeroNicLaudoAuto || "",
        }),
      ),
      dataRetirada: dataAssinatura,
      userName: "Servidor NUGECID",
      dataAssinatura,
      horaAssinatura,
    };

    try {
      const buffer = await generateDesarquivamentoDocx(docxData, this.logger);

      this.logger.log(
        `Gerado termo DOCX nativo para processo ${baseEntity.numeroProcesso} com ${somenteDesarquivados.length} item(s).`,
      );
      return buffer;
    } catch (error) {
      this.logger.error("Erro ao gerar termo DOCX nativo.", error as Error);
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
      if (this.isPrintableStatus(base.status)) {
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
      .andWhere("TRIM(UPPER(d.status::text)) IN (:...statuses)", {
        statuses: this.printableStatuses,
      })
      .orderBy("d.numeroSolicitacao", "ASC")
      .addOrderBy("d.createdAt", "ASC")
      .addOrderBy("d.id", "ASC");

    const results = await query.getMany();
    const filtered = results.filter((item) =>
      this.isPrintableStatus(item.status),
    );

    const byId = new Map<number, DesarquivamentoTypeOrmEntity>();
    for (const item of filtered) {
      byId.set(item.id, item);
    }

    if (base.id && this.isPrintableStatus(base.status) && !byId.has(base.id)) {
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
    return itens.filter((item) => this.isPrintableStatus(item.status));
  }

  private isPrintableStatus(status?: string | null): boolean {
    const normalized = String(status ?? "")
      .trim()
      .toUpperCase();
    return this.printableStatuses.includes(normalized);
  }
}
