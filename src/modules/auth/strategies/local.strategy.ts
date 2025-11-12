import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";

import { AuthService } from "../auth.service";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "usuario",
      passwordField: "password",
    });
  }

  async validate(usuario: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(usuario, password);
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
    return user;
  }
}
