import { Logger, Module, OnModuleInit, OnModuleDestroy, forwardRef } from "@nestjs/common";

import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { StringValue } from "ms";

import { AuthController, AuthV2Controller } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";
import { SecurityModule } from "../security/security.module";

import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SessionStrategy } from "./strategies/session.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { WebAuthGuard } from "./guards/web-auth.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Auditoria]),
    forwardRef(() => SecurityModule),
    PassportModule.register({
      defaultStrategy: "jwt",
      session: false,
      property: "user",
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("auth.jwt.secret");
        const expiresIn = (configService.get<string>("auth.jwt.expiresIn") ??
          configService.get<string>("JWT_EXPIRES_IN", "50m")) as StringValue;

        if (!secret) {
          throw new Error(
            "JWT_SECRET is not configured. Set the JWT_SECRET environment variable.",
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AuthV2Controller],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    SessionStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    SessionAuthGuard,
    WebAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, WebAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthModule.name);
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly authService: AuthService) {}

  async onModuleInit() {
    // Inicializa limpeza periódica de usuários inativos
    this.cleanupInterval = setInterval(() => {
      this.authService.cleanupInactiveUsers().catch((error) => {
        this.logger.error(
          "Erro na limpeza periódica de usuários inativos",
          error?.stack,
        );
      });
    }, 60000); // Executa a cada 1 minuto

    this.logger.log(
      "✅ [AUTH MODULE] Sistema de rastreamento de usuários online inicializado",
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
