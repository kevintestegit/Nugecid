import { Injectable, Inject } from "@nestjs/common";
import { Role } from "../../domain/entities/role";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";

@Injectable()
export class GetRolesUseCase {
  constructor(
    @Inject("IRoleRepository") private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}
