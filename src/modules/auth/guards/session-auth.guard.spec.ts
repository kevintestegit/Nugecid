import { UnauthorizedException, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { SessionAuthGuard } from "./session-auth.guard";

describe("SessionAuthGuard", () => {
  let guard: SessionAuthGuard;

  beforeEach(() => {
    guard = new SessionAuthGuard({} as Reflector);
  });

  it("deve responder 401 em requisição JSON sem sessão válida", () => {
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
      new UnauthorizedException("Sessão inválida ou expirada"),
    );
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it("deve redirecionar para login em requisição HTML sem sessão válida", () => {
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
