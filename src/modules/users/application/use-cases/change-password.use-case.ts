import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { UserId } from "../../domain/value-objects/user-id";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { ChangePasswordDto } from "../dto/change-password.dto";

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number, dto: ChangePasswordDto): Promise<void> {
    const id = new UserId(userId);
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new BadRequestException("Usuário não encontrado");
    }

    const isCurrentPasswordValid = await user.validatePassword(dto.senhaAtual);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException("Senha atual incorreta");
    }

    if (dto.senhaAtual === dto.novaSenha) {
      throw new BadRequestException(
        "Nova senha deve ser diferente da senha atual",
      );
    }

    await user.updatePassword(dto.novaSenha);
    await this.userRepository.update(user);
  }
}
