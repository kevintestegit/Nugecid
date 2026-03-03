import { Request } from "express";

/**
 * Express Request extended with the authenticated user payload.
 * Use this instead of `any` for `@Request()` parameters in NestJS controllers
 * to get type-safe access to `req.user`.
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    usuario: string;
    nome: string;
    role?: {
      id: number;
      name: string;
    };
  };
}
