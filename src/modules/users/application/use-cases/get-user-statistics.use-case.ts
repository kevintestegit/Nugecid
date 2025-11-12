import { Injectable, Inject } from "@nestjs/common";
import {
  IUserRepository,
  UserStatistics,
} from "../../domain/repositories/user.repository.interface";

@Injectable()
export class GetUserStatisticsUseCase {
  constructor(
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<UserStatistics> {
    return this.userRepository.getStatistics();
  }
}
