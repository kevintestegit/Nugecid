import { Injectable, Inject } from "@nestjs/common";
import { User } from "../../domain/entities/user";
import { UserId } from "../../domain/value-objects/user-id";
import { Usuario } from "../../domain/value-objects/usuario";
import { Password } from "../../domain/value-objects/password";
import { RoleId } from "../../domain/value-objects/role-id";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { UpdateUserDto } from "../dto/update-user.dto";

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
    @Inject("IRoleRepository") private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(id: number, dto: UpdateUserDto): Promise<User> {
    const userId = new UserId(id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Atualizar nome se fornecido
    if (dto.nome !== undefined) {
      user.updateNome(dto.nome);
    }

    // Atualizar usuario se fornecido
    if (dto.usuario !== undefined) {
      const newUsuario = new Usuario(dto.usuario);

      // Verificar se o novo usuario já está em uso por outro usuário
      if (!user.usuario.equals(newUsuario)) {
        const usuarioExists = await this.userRepository.exists(newUsuario);
        if (usuarioExists) {
          throw new Error("Usuário já está em uso");
        }
        user.updateUsuario(newUsuario);
      }
    }

    // Atualizar senha se fornecida (não vazia)
    if (
      dto.senha !== undefined &&
      dto.senha !== null &&
      dto.senha.trim() !== ""
    ) {
      await user.updatePassword(dto.senha);
    }

    // Atualizar role se fornecida
    if (dto.role !== undefined) {
      const role = await this.roleRepository.findByName(dto.role);
      if (!role) {
        throw new Error("Role não encontrada");
      }
      const roleId = role.id;
      user.updateRole(roleId, role);
    }

    // Atualizar status ativo se fornecido
    if (dto.ativo !== undefined) {
      if (dto.ativo) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    if (dto.avatarUrl !== undefined) {
      user.updateAvatarUrl(dto.avatarUrl);
    }

    if (dto.matricula !== undefined) {
      const normalizedMatricula =
        dto.matricula && dto.matricula.trim().length > 0
          ? dto.matricula.trim()
          : null;
      user.updateMatricula(normalizedMatricula);
    }

    return this.userRepository.update(user);
  }
}
