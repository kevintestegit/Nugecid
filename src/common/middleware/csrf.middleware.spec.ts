import { Request, Response } from "express";

import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  csrfProtectionMiddleware,
} from "./csrf.middleware";

describe("csrfProtectionMiddleware", () => {
  const next = jest.fn();

  const createResponse = () =>
    ({
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }) as unknown as Response;

  beforeEach(() => {
    next.mockReset();
  });

  it("emite cookie CSRF em requisição segura autenticada", () => {
    const req = {
      method: "GET",
      cookies: {
        access_token: "access-token",
      },
      headers: {},
      secure: false,
    } as unknown as Request;
    const res = createResponse();

    csrfProtectionMiddleware(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      CSRF_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("bloqueia mutação autenticada sem header CSRF", () => {
    const req = {
      method: "POST",
      url: "/api/nugecid",
      cookies: {
        access_token: "access-token",
        [CSRF_COOKIE_NAME]: "cookie-token",
      },
      headers: {},
      secure: false,
    } as unknown as Request;
    const res = createResponse();

    csrfProtectionMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Token CSRF ausente ou inválido",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("permite mutação autenticada com header CSRF compatível", () => {
    const req = {
      method: "PATCH",
      cookies: {
        refresh_token: "refresh-token",
        [CSRF_COOKIE_NAME]: "cookie-token",
      },
      headers: {
        [CSRF_HEADER_NAME]: "cookie-token",
      },
      secure: false,
    } as unknown as Request;
    const res = createResponse();

    csrfProtectionMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejeita POST sem token CSRF quando há cookie de autenticação", () => {
    const req = {
      method: "POST",
      url: "/api/vestigios",
      cookies: {
        access_token: "jwt-token",
        [CSRF_COOKIE_NAME]: "csrf-cookie",
      },
      headers: {},
      secure: false,
    } as unknown as Request;
    const res = createResponse();

    csrfProtectionMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("permite GET sem token CSRF mesmo com cookie de autenticação", () => {
    const req = {
      method: "GET",
      url: "/api/vestigios",
      cookies: {
        access_token: "jwt-token",
      },
      headers: {},
      secure: false,
    } as unknown as Request;
    const res = createResponse();

    csrfProtectionMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("não exige CSRF em requisição sem contexto autenticado", () => {
    const req = {
      method: "POST",
      cookies: {},
      headers: {},
      secure: false,
    } as unknown as Request;
    const res = createResponse();

    csrfProtectionMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
