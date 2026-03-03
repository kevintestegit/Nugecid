import { NextFunction, Request, Response } from "express";
import { randomBytes } from "crypto";

export const CSRF_COOKIE_NAME = "XSRF-TOKEN";
export const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function hasAuthenticatedCookieContext(req: Request): boolean {
  return Boolean(
    req.cookies?.access_token ||
      req.cookies?.refresh_token ||
      req.cookies?.["connect.sid"] ||
      req.session?.user,
  );
}

export function isSafeHttpMethod(method: string): boolean {
  return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export function csrfCookieOptions(req: Request): {
  httpOnly: false;
  secure: boolean;
  sameSite: "lax";
  path: string;
} {
  const forwardedProtoHeader = req.headers["x-forwarded-proto"];
  const forwardedProto = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader[0]
    : forwardedProtoHeader;
  const proto = (forwardedProto ?? "").split(",")[0]?.trim().toLowerCase();

  return {
    httpOnly: false,
    secure: req.secure || proto === "https",
    sameSite: "lax",
    path: "/",
  };
}

export function ensureCsrfCookie(req: Request, res: Response): string {
  const existingToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (typeof existingToken === "string" && existingToken.length > 0) {
    return existingToken;
  }

  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions(req));
  req.cookies = req.cookies ?? {};
  req.cookies[CSRF_COOKIE_NAME] = token;
  return token;
}

export function csrfProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const hasAuthContext = hasAuthenticatedCookieContext(req);
  if (!hasAuthContext) {
    next();
    return;
  }

  if (isSafeHttpMethod(req.method)) {
    ensureCsrfCookie(req, res);
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];
  const normalizedHeaderToken = Array.isArray(headerToken)
    ? headerToken[0]
    : headerToken;

  if (
    typeof cookieToken !== "string" ||
    cookieToken.length === 0 ||
    typeof normalizedHeaderToken !== "string" ||
    normalizedHeaderToken.length === 0 ||
    normalizedHeaderToken !== cookieToken
  ) {
    res.status(403).json({
      success: false,
      statusCode: 403,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
      message: "Token CSRF ausente ou inválido",
    });
    return;
  }

  next();
}
