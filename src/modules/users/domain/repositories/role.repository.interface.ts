import { Role } from "../entities/role";
import { RoleId } from "../value-objects/role-id";

export interface RoleFilters {
  nome?: string;
  permissao?: string;
}

export interface IRoleRepository {
  save(role: Role): Promise<Role>;
  findById(id: RoleId): Promise<Role | null>;
  findByName(nome: string): Promise<Role | null>;
  findAll(filters?: RoleFilters): Promise<Role[]>;
  update(role: Role): Promise<Role>;
  delete(id: RoleId): Promise<void>;
  exists(nome: string): Promise<boolean>;
  findByPermission(permission: string): Promise<Role[]>;
}
