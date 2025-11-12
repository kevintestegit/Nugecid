import { Injectable, Inject } from "@nestjs/common";
import { User } from "../../domain/entities/user";
import { Usuario } from "../../domain/value-objects/usuario";
import { Password } from "../../domain/value-objects/password";
import { RoleId } from "../../domain/value-objects/role-id";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { CreateUserDto } from "../dto/create-user.dto";

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
    @Inject("IRoleRepository") private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    const normalizedMatricula =
      dto.matricula && dto.matricula.trim().length > 0
        ? dto.matricula.trim()
        : null;

    // Validar se o usuario já existe (ativo)
    const usuario = new Usuario(dto.usuario);
    const existingUser = await this.userRepository.findByUsuario(usuario);
    if (existingUser && !existingUser.isDeleted) {
      throw new Error("Usuário já está em uso");
    }

    // Se existir mas estiver deletado, reativar em vez de criar novo
    if (existingUser && existingUser.isDeleted) {
      // Reativar o usuário antigo com dados novos
      const role = await this.roleRepository.findByName(dto.role);
      if (!role) {
        throw new Error("Role não encontrada");
      }

      existingUser.updateNome(dto.nome);
      existingUser.updateRole(role.id, role);
      existingUser.updateMatricula(normalizedMatricula);
      await existingUser.updatePassword(dto.senha);
      existingUser.restore();

      return await this.userRepository.update(existingUser);
    }

    // Validar se a role existe e obter o ID
    const role = await this.roleRepository.findByName(dto.role);
    if (!role) {
      throw new Error("Role não encontrada");
    }
    const roleId = role.id;

    // Criar senha hash
    const password = await Password.create(dto.senha);

    // Criar usuário
    const user = new User({
      nome: dto.nome,
      usuario,
      password,
      roleId,
      role,
      matricula: normalizedMatricula,
    });

    // Salvar usuário
    return await this.userRepository.save(user);
  }
}
