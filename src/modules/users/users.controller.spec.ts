jest.mock(
  "file-type",
  () => ({
    fileTypeFromBuffer: jest.fn(),
  }),
  { virtual: true },
);

import { ForbiddenException } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { User } from "./entities/user.entity";
import { UserMapper } from "./infrastructure/mappers/user.mapper";

describe("UsersController", () => {
  const createController = () => {
    const getUserByIdUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 2, nome: "Target User" }),
    };

    const changePasswordUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const auditoriaRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue({}),
    };

    const auditHashService = {
      prepareHash: jest.fn().mockImplementation(async (data) => ({
        ...data,
        previousHash: "genesis",
        hash: "mock-hash",
      })),
    };

    const controller = new UsersController(
      {} as never,
      {} as never,
      {} as never,
      getUserByIdUseCase as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      changePasswordUseCase as never,
      {} as never,
      {} as never,
      auditoriaRepo as never,
      {
        get: jest.fn((_: string, defaultValue: string) => defaultValue),
      } as never,
      {} as never,
      {} as never,
      auditHashService as never,
    );

    return {
      controller,
      getUserByIdUseCase,
      changePasswordUseCase,
      auditoriaRepo,
      auditHashService,
    };
  };

  const user = (id: number, roleName = "usuario"): User =>
    Object.assign(new User(), {
      id,
      nome: `User ${id}`,
      usuario: `user-${id}`,
      senha: "hashed-password",
      roleId: 1,
      role: { name: roleName },
    });

  it("bloqueia usuário comum de consultar detalhes de outro usuário", async () => {
    const { controller, getUserByIdUseCase } = createController();
    jest.spyOn(UserMapper, "toEntity").mockReturnValue(user(2));

    await expect(
      (controller as any).findOne(2, user(1), {
        headers: { accept: "application/json" },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(getUserByIdUseCase.execute).not.toHaveBeenCalled();
  });
});
