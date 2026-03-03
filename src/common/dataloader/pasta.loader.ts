import { Injectable, Scope } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import * as DataLoader from "dataloader";
import { Pasta } from "../../modules/pastas/entities/pasta.entity";

@Injectable({ scope: Scope.REQUEST })
export class PastaLoader {
  constructor(
    @InjectRepository(Pasta)
    private readonly pastaRepository: Repository<Pasta>,
  ) {}

  private readonly loader = new DataLoader<string, Pasta | null>(
    async (ids: readonly string[]) => {
      const pastas = await this.pastaRepository.find({
        where: { id: In(ids as string[]) },
        select: ["id", "nome", "descricao", "dataCriacao"],
      });

      const map = new Map(pastas.map((p) => [p.id, p]));
      return ids.map((id) => map.get(id) ?? null);
    },
    { cache: true },
  );

  async load(id: string): Promise<Pasta | null> {
    return this.loader.load(id);
  }

  async loadMany(ids: string[]): Promise<(Pasta | null)[]> {
    const results = await this.loader.loadMany(ids);
    return results.map((r) => (r instanceof Error ? null : r));
  }
}
