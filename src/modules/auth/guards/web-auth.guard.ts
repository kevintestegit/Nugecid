import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

import { IS_PUBLIC_KEY } from "../../../common/decorators/is-public.decorator";

@Injectable()
export class WebAuthGuard extends AuthGuard(["jwt", "session"]) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();

      if (!request.headers.accept?.includes("application/json")) {
        const response = context.switchToHttp().getResponse();
        return response.redirect("/auth/login?error=Sessão expirada");
      }

      throw (
        err || new UnauthorizedException("Autenticação inválida ou expirada")
      );
    }

    return user;
  }
}
