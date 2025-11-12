import { Injectable, Inject } from "@nestjs/common";
import { User } from "../../domain/entities/user";
import { UserId } from "../../domain/value-objects/user-id";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<User | null> {
    const userId = new UserId(id);
    return this.userRepository.findById(userId);
  }
}
