import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";
import { Request } from "express";

import { AuthService } from "../auth.service";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, "session") {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<User> {
    if (!req.session || !req.session.user) {
      throw new UnauthorizedException("Sessão inválida ou expirada");
    }

    try {
      // Verifica se o usuário ainda existe e está ativo
      const user = await this.authService.findUserById(req.session.user.id);

      if (!user.ativo) {
        throw new UnauthorizedException("Usuário inativo");
      }

      if (user.isBlocked()) {
        throw new UnauthorizedException("Usuário bloqueado");
      }

      return user;
    } catch (error) {
      // Remove sessão inválida
      req.session.destroy(() => {});
      throw new UnauthorizedException("Sessão inválida");
    }
  }
}
