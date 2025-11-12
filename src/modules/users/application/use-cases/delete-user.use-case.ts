import { Injectable, Inject } from "@nestjs/common";
import { UserId } from "../../domain/value-objects/user-id";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const userId = new UserId(id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Soft delete
    await this.userRepository.softDelete(userId);
  }
}
