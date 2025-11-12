import { User } from "../entities/user";
import { UserId } from "../value-objects/user-id";
import { Usuario } from "../value-objects/usuario";

export interface UserFilters {
  nome?: string;
  usuario?: string;
  ativo?: boolean;
  roleId?: number;
  includeDeleted?: boolean;
}

export interface UserStatistics {
  total: number;
  ativos: number;
  inativos: number;
  deletados: number;
}

export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: UserId): Promise<User | null>;
  findByUsuario(usuario: Usuario): Promise<User | null>;
  findAll(filters?: UserFilters): Promise<User[]>;
  findWithPagination(
    page: number,
    limit: number,
    filters?: UserFilters,
  ): Promise<{
    users: User[];
    total: number;
    totalPages: number;
  }>;
  update(user: User): Promise<User>;
  delete(id: UserId): Promise<void>;
  softDelete(id: UserId): Promise<void>;
  restore(id: UserId): Promise<void>;
  exists(usuario: Usuario): Promise<boolean>;
  getStatistics(): Promise<UserStatistics>;
}
