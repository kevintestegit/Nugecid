import { User } from "../../src/modules/users/entities/user.entity";
import { RoleFactory } from "./role.factory";
import { DeepPartial } from "typeorm";

export class UserFactory {
  static build(data: DeepPartial<User> = {}): DeepPartial<User> {
    const role = data.role || RoleFactory.build();

    return {
      id: 1,
      nome: "Test User",
      usuario: "testuser",
      senha: "password123",
      role: role,
      ativo: true,
      ...data,
    };
  }
}
