import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User as DomainUser } from "../../domain/entities/user";
import { UserId } from "../../domain/value-objects/user-id";
import { Usuario } from "../../domain/value-objects/usuario";
import {
  IUserRepository,
  UserFilters,
  UserStatistics,
} from "../../domain/repositories/user.repository.interface";
import { User as UserEntity } from "../../entities/user.entity";
import { UserMapper } from "../mappers/user.mapper";

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async save(user: DomainUser): Promise<DomainUser> {
    const entity = UserMapper.toEntity(user);
    const savedEntity = await this.userRepository.save(entity);
    return UserMapper.toDomain(savedEntity);
  }

  async findById(id: UserId): Promise<DomainUser | null> {
    const entity = await this.userRepository.findOne({
      where: { id: id.value },
      relations: ["role"],
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByUsuario(usuario: Usuario): Promise<DomainUser | null> {
    const entity = await this.userRepository.findOne({
      where: { usuario: usuario.value },
      relations: ["role"],
      withDeleted: true,
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findAll(filters?: UserFilters): Promise<DomainUser[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role");

    // Se includeDeleted for true, incluir registros soft-deleted
    if (filters?.includeDeleted) {
      queryBuilder.withDeleted();
    }

    if (filters) {
      if (filters.nome) {
        queryBuilder.andWhere("user.nome ILIKE :nome", {
          nome: `%${filters.nome}%`,
        });
      }

      if (filters.usuario) {
        queryBuilder.andWhere("user.usuario ILIKE :usuario", {
          usuario: `%${filters.usuario}%`,
        });
      }

      if (filters.ativo !== undefined) {
        queryBuilder.andWhere("user.ativo = :ativo", { ativo: filters.ativo });
      }

      if (filters.roleId) {
        queryBuilder.andWhere("user.roleId = :roleId", {
          roleId: filters.roleId,
        });
      }
    }

    const entities = await queryBuilder.getMany();
    return UserMapper.toDomainArray(entities);
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters?: UserFilters,
  ): Promise<{
    users: DomainUser[];
    total: number;
    totalPages: number;
  }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role");

    // Se includeDeleted for true, incluir registros soft-deleted
    if (filters?.includeDeleted) {
      queryBuilder.withDeleted();
    }

    if (filters) {
      if (filters.nome) {
        queryBuilder.andWhere("user.nome ILIKE :nome", {
          nome: `%${filters.nome}%`,
        });
      }

      if (filters.usuario) {
        queryBuilder.andWhere("user.usuario ILIKE :usuario", {
          usuario: `%${filters.usuario}%`,
        });
      }

      if (filters.ativo !== undefined) {
        queryBuilder.andWhere("user.ativo = :ativo", { ativo: filters.ativo });
      }

      if (filters.roleId) {
        queryBuilder.andWhere("user.roleId = :roleId", {
          roleId: filters.roleId,
        });
      }
    }

    // Debug: Query gerada para paginação
    const total = await queryBuilder.getCount();
    const entities = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const users = UserMapper.toDomainArray(entities);
    const totalPages = Math.ceil(total / limit);

    return { users, total, totalPages };
  }

  async update(user: DomainUser): Promise<DomainUser> {
    const entity = UserMapper.toEntity(user);
    const updatedEntity = await this.userRepository.save(entity);
    return UserMapper.toDomain(updatedEntity);
  }

  async delete(id: UserId): Promise<void> {
    await this.userRepository.delete(id.value);
  }

  async softDelete(id: UserId): Promise<void> {
    await this.userRepository.softDelete(id.value);
  }

  async restore(id: UserId): Promise<void> {
    await this.userRepository.restore(id.value);
  }

  async exists(usuario: Usuario): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { usuario: usuario.value },
    });
    return count > 0;
  }

  async getStatistics(): Promise<UserStatistics> {
    const total = await this.userRepository.count();
    const ativos = await this.userRepository.count({ where: { ativo: true } });
    const inativos = await this.userRepository.count({
      where: { ativo: false },
    });
    const deletados = await this.userRepository
      .createQueryBuilder("user")
      .withDeleted()
      .where("user.deletedAt IS NOT NULL")
      .getCount();

    return { total, ativos, inativos, deletados };
  }
}
