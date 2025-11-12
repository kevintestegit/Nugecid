import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { User } from "../../users/entities/user.entity";
import { IS_PUBLIC_KEY } from "../../../common/decorators/is-public.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      classRef,
    ]);

    if (isPublic) {
      return true;
    }

    // Obter roles necessárias
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      handler,
      classRef,
    ]);


    if (!requiredRoles) {
      return true;
    }

    const user = request.user;
      id: user?.id,
      nome: user?.nome,
      role: user?.role,
      roleId: user?.roleId,
    });

    if (!user) {
      throw new ForbiddenException("Usuário não autenticado");
    }

    if (!user.role) {
      throw new ForbiddenException("Usuário sem role definida");
    }

      id: user.role.id,
      name: user.role.name,
      nameType: typeof user.role.name,
      nameLength: user.role.name?.length,
    });

    // Verificar se o usuário tem uma das roles necessárias
    const userRoleName = user.role.name?.toLowerCase()?.trim();

    const hasRole = requiredRoles.some((role) => {
      const normalizedRequiredRole = role?.toLowerCase()?.trim();
        `🔍 [RolesGuard] Comparing '${userRoleName}' === '${normalizedRequiredRole}'`,
      );
      return userRoleName === normalizedRequiredRole;
    });


    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Role atual: '${user.role.name}'. Roles necessárias: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
