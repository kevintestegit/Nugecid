import { Injectable, Inject } from "@nestjs/common";
import { User } from "../../domain/entities/user";
import {
  IUserRepository,
  UserFilters,
} from "../../domain/repositories/user.repository.interface";
import { QueryUsersDto } from "../dto/query-users.dto";

export interface PaginatedUsersResult {
  users: User[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Retorna array de usuários ou objeto paginado quando page/limit são informados.
   */
  async execute(query: QueryUsersDto): Promise<User[] | PaginatedUsersResult> {
    const filters: UserFilters = {
      nome: query.nome,
      usuario: query.usuario,
      ativo: query.ativo,
      roleId: query.roleId,
      includeDeleted: query.includeDeleted,
    };

    const page = query.page || 1;
    const limit = query.limit || 10;

    if (page && limit) {
      const result = await this.userRepository.findWithPagination(
        page,
        limit,
        filters,
      );
      return {
        users: result.users,
        total: result.total,
        totalPages: result.totalPages,
        page,
        limit,
      };
    }

    return this.userRepository.findAll(filters);
  }
}
