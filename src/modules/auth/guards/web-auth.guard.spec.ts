import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { WebAuthGuard } from "./web-auth.guard";

describe("WebAuthGuard", () => {
  let guard: WebAuthGuard;

  beforeEach(() => {
    guard = new WebAuthGuard({} as Reflector);
  });

  it("responde 401 em requisição JSON sem autenticação válida", () => {
    const response = {
      redirect: jest.fn(),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            accept: "application/json",
          },
        }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.handleRequest(null, null, null, context)).toThrow(
      new UnauthorizedException("Autenticação inválida ou expirada"),
    );
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it("redireciona para login em requisição HTML sem autenticação válida", () => {
    const response = {
      redirect: jest.fn(),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            accept: "text/html",
          },
        }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    const result = guard.handleRequest(null, null, null, context);

    expect(response.redirect).toHaveBeenCalledWith(
      "/auth/login?error=Sessão expirada",
    );
    expect(result).toBeUndefined();
  });
});
