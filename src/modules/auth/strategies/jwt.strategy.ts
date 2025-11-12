import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

import { AuthService, JwtPayload } from "../auth.service";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          let token = null;
          this.logger.debug(`[JwtStrategy] Tentando extrair token JWT`);

          if (request && request.cookies) {
            token = request.cookies["access_token"];
            if (token) {
              this.logger.debug(
                `[JwtStrategy] Token encontrado no cookie 'access_token'`,
              );
            } else {
              this.logger.debug(
                `[JwtStrategy] Nenhum token encontrado no cookie 'access_token'`,
              );
            }
          } else {
            this.logger.debug(`[JwtStrategy] Request não possui cookies`);
          }

          if (!token) {
            token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
            if (token) {
              this.logger.debug(
                `[JwtStrategy] Token encontrado no header Authorization`,
              );
            } else {
              this.logger.debug(
                `[JwtStrategy] Nenhum token encontrado no header Authorization`,
              );
            }
          }

          if (!token) {
            this.logger.warn(
              `[JwtStrategy] Nenhum token JWT encontrado na requisição`,
            );
          }

          return token;
        },
      ]),
      ignoreExpiration: false,
      // Usar a mesma chave do módulo de configuração (auth.jwt.secret)
      secretOrKey:
        configService.get<string>("auth.jwt.secret") ||
        configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    this.logger.debug(`Validando payload: ${JSON.stringify(payload)}`);
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      this.logger.warn(
        `Validação de JWT falhou para payload: ${JSON.stringify(payload)}`,
      );
      throw new UnauthorizedException(
        "Usuário não encontrado ou token inválido",
      );
    }
    return user;
  }
}
