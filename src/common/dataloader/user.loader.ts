import { Injectable, Scope } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import * as DataLoader from "dataloader";
import { User } from "../../modules/users/entities/user.entity";

@Injectable({ scope: Scope.REQUEST })
export class UserLoader {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private readonly loader = new DataLoader<number, User | null>(
    async (userIds: readonly number[]) => {
      const users = await this.userRepository.find({
        where: { id: In(userIds as number[]) },
        select: ["id", "nome", "usuario", "matricula", "roleId"],
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => userMap.get(id) ?? null);
    },
    { cache: true },
  );

  async load(userId: number): Promise<User | null> {
    return this.loader.load(userId);
  }

  async loadMany(userIds: number[]): Promise<(User | null)[]> {
    const results = await this.loader.loadMany(userIds);
    return results.map((r) => (r instanceof Error ? null : r));
  }
}
