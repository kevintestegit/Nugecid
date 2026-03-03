import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware para proteger acesso a arquivos estáticos (uploads).
 * Verifica se o request contém um JWT válido antes de servir o arquivo.
 * Permite acesso público a avatares (pasta /uploads/avatars/).
 */
@Injectable()
export class StaticAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(StaticAuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Permitir acesso público a avatares (fotos de perfil)
    if (
      req.path.startsWith("/uploads/avatars/") ||
      req.path.startsWith("/avatars/")
    ) {
      return next();
    }

    // Verificar token JWT
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.access_token as string | undefined;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : tokenFromCookie;

    if (!token) {
      this.logger.warn(
        `Acesso negado a arquivo estático sem autenticação: ${req.path}`,
      );
      res.status(401).json({
        statusCode: 401,
        message: "Autenticação necessária para acessar este recurso",
      });
      return;
    }

    try {
      const secret =
        this.configService.get<string>("auth.jwt.secret") ||
        this.configService.get<string>("JWT_SECRET");

      this.jwtService.verify(token, { secret });
      next();
    } catch {
      this.logger.warn(
        `Token inválido ao acessar arquivo estático: ${req.path}`,
      );
      res.status(401).json({
        statusCode: 401,
        message: "Token inválido ou expirado",
      });
    }
  }
}
