import { UnauthorizedException, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const authService = {
    updateUserActivity: jest.fn().mockResolvedValue(undefined),
  };

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(reflector, authService as any);
  });

  it("deve negar acesso quando não há usuário autenticado", () => {
    expect(() =>
      guard.handleRequest(null, null, { message: "No auth token" }, {} as any),
    ).toThrow(new UnauthorizedException("Autenticação inválida ou expirada"));
  });

  it("deve aceitar usuário autenticado e atualizar atividade", () => {
    const user = { id: 123, usuario: "admin" };

    const result = guard.handleRequest(
      null,
      user,
      null,
      {} as ExecutionContext,
    );

    expect(result).toEqual(user);
    expect(authService.updateUserActivity).toHaveBeenCalledWith(123);
  });
});
