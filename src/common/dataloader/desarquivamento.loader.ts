import { Injectable, Scope } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import * as DataLoader from "dataloader";
import { DesarquivamentoTypeOrmEntity } from "../../modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";

@Injectable({ scope: Scope.REQUEST })
export class DesarquivamentoLoader {
  constructor(
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
  ) {}

  private readonly loader = new DataLoader<
    number,
    DesarquivamentoTypeOrmEntity | null
  >(
    async (ids: readonly number[]) => {
      const desarquivamentos = await this.desarquivamentoRepository.find({
        where: { id: In(ids as number[]) },
        select: [
          "id",
          "numeroProcesso",
          "requerente",
          "status",
          "createdAt",
          "updatedAt",
        ],
      });

      const map = new Map(desarquivamentos.map((d) => [d.id, d]));
      return ids.map((id) => map.get(id) ?? null);
    },
    { cache: true },
  );

  async load(id: number): Promise<DesarquivamentoTypeOrmEntity | null> {
    return this.loader.load(id);
  }

  async loadMany(
    ids: number[],
  ): Promise<(DesarquivamentoTypeOrmEntity | null)[]> {
    const results = await this.loader.loadMany(ids);
    return results.map((r) => (r instanceof Error ? null : r));
  }
}
