import { Role } from "../../src/modules/users/entities/role.entity";
import { DeepPartial } from "typeorm";

export class RoleFactory {
  static build(data: DeepPartial<Role> = {}): DeepPartial<Role> {
    return {
      id: 1,
      name: "user",
      description: "Regular user",
      permissions: [],
      ativo: true,
      ...data,
    };
  }
}
