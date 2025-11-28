import { User as DomainUser } from "../../domain/entities/user";
import { Role as DomainRole } from "../../domain/entities/role";
import { UserId } from "../../domain/value-objects/user-id";
import { Usuario } from "../../domain/value-objects/usuario";
import { Password } from "../../domain/value-objects/password";
import { RoleId } from "../../domain/value-objects/role-id";
import { User as UserEntity } from "../../entities/user.entity";
import { Role as RoleEntity } from "../../entities/role.entity";

export class UserMapper {
  static toDomain(entity: UserEntity): DomainUser {
    const userId = entity.id ? new UserId(entity.id) : undefined;
    const usuario = new Usuario(entity.usuario);
    const password = Password.fromHash(entity.senha);
    const roleId = new RoleId(entity.roleId);

    let role: DomainRole | undefined;
    if (entity.role) {
      const permissions =
        entity.role.permissions && Array.isArray(entity.role.permissions)
          ? entity.role.permissions
          : [];

      role = new DomainRole({
        id: new RoleId(entity.role.id),
        nome: entity.role.name,
        descricao: entity.role.description,
        permissoes: permissions,
        createdAt: entity.role.createdAt,
        updatedAt: entity.role.updatedAt,
      });
    }

    return new DomainUser({
      id: userId,
      nome: entity.nome,
      usuario,
      password,
      roleId,
      role,
      matricula: entity.matricula,
      settings: entity.settings,
      avatarUrl: entity.avatarUrl,
      ativo: entity.ativo,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  static toEntity(domain: DomainUser): UserEntity {
    const entity = new UserEntity();

    if (domain.id) {
      entity.id = domain.id.value;
    }

    entity.nome = domain.nome;
    entity.usuario = domain.usuario.value;
    entity.senha = domain.password.hashedValue;
    entity.roleId = domain.roleId.value;
    entity.matricula = domain.matricula ?? null;
    entity.ativo = domain.ativo;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.deletedAt = domain.deletedAt;
    entity.settings = domain.settings;
    entity.avatarUrl = domain.avatarUrl ?? null;

    if (domain.role) {
      const roleEntity = new RoleEntity();
      roleEntity.id = domain.role.id.value;
      roleEntity.name = domain.role.nome;
      roleEntity.description = domain.role.descricao;
      roleEntity.permissions = domain.role.permissoes;
      roleEntity.createdAt = domain.role.createdAt;
      roleEntity.updatedAt = domain.role.updatedAt;
      entity.role = roleEntity;
    }

    return entity;
  }

  static toDomainArray(entities: UserEntity[]): DomainUser[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  static toEntityArray(domains: DomainUser[]): UserEntity[] {
    return domains.map((domain) => this.toEntity(domain));
  }
}
