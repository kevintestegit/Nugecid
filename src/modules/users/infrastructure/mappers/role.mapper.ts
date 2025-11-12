import { Role as DomainRole } from "../../domain/entities/role";
import { RoleId } from "../../domain/value-objects/role-id";
import { Role as RoleEntity } from "../../entities/role.entity";

export class RoleMapper {
  static toDomain(entity: RoleEntity): DomainRole {
    const roleId = entity.id ? new RoleId(entity.id) : undefined;

    return new DomainRole({
      id: roleId,
      nome: entity.name,
      descricao: entity.description,
      permissoes: Array.isArray(entity.permissions) ? entity.permissions : [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toEntity(domain: DomainRole): RoleEntity {
    const entity = new RoleEntity();

    if (domain.id) {
      entity.id = domain.id.value;
    }

    entity.name = domain.nome;
    entity.description = domain.descricao;
    entity.permissions = domain.permissoes;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }

  static toDomainArray(entities: RoleEntity[]): DomainRole[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  static toEntityArray(domains: DomainRole[]): RoleEntity[] {
    return domains.map((domain) => this.toEntity(domain));
  }
}
