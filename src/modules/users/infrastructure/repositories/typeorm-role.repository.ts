import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role as DomainRole } from "../../domain/entities/role";
import { RoleId } from "../../domain/value-objects/role-id";
import {
  IRoleRepository,
  RoleFilters,
} from "../../domain/repositories/role.repository.interface";
import { Role as RoleEntity } from "../../entities/role.entity";
import { RoleMapper } from "../mappers/role.mapper";

@Injectable()
export class TypeOrmRoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async save(role: DomainRole): Promise<DomainRole> {
    const entity = RoleMapper.toEntity(role);
    const savedEntity = await this.roleRepository.save(entity);
    return RoleMapper.toDomain(savedEntity);
  }

  async findById(id: RoleId): Promise<DomainRole | null> {
    const entity = await this.roleRepository.findOne({
      where: { id: id.value },
    });

    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findByName(nome: string): Promise<DomainRole | null> {
    const entity = await this.roleRepository.findOne({
      where: { name: nome },
    });

    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findAll(filters?: RoleFilters): Promise<DomainRole[]> {
    const queryBuilder = this.roleRepository.createQueryBuilder("role");

    if (filters) {
      if (filters.nome) {
        queryBuilder.andWhere("role.name ILIKE :nome", {
          nome: `%${filters.nome}%`,
        });
      }

      if (filters.permissao) {
        queryBuilder.andWhere(":permissao = ANY(role.permissions)", {
          permissao: filters.permissao,
        });
      }
    }

    const entities = await queryBuilder.getMany();
    return RoleMapper.toDomainArray(entities);
  }

  async update(role: DomainRole): Promise<DomainRole> {
    const entity = RoleMapper.toEntity(role);
    const updatedEntity = await this.roleRepository.save(entity);
    return RoleMapper.toDomain(updatedEntity);
  }

  async delete(id: RoleId): Promise<void> {
    await this.roleRepository.delete(id.value);
  }

  async exists(nome: string): Promise<boolean> {
    const count = await this.roleRepository.count({
      where: { name: nome },
    });
    return count > 0;
  }

  async findByPermission(permission: string): Promise<DomainRole[]> {
    const entities = await this.roleRepository
      .createQueryBuilder("role")
      .where(":permission = ANY(role.permissions)", { permission })
      .getMany();

    return RoleMapper.toDomainArray(entities);
  }
}
