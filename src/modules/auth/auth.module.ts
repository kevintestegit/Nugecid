import { Logger, Module, OnModuleInit, OnModuleDestroy } from "@nestjs/common";

import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";

import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Auditoria]),
    PassportModule.register({
      defaultStrategy: "jwt",
      session: false,
      property: "user",
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("auth.jwt.secret");
        if (!secret) {
          throw new Error(
            "JWT_SECRET is not configured. Set the JWT_SECRET environment variable.",
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn:
              configService.get<string>("auth.jwt.expiresIn") ||
              configService.get<string>("JWT_EXPIRES_IN", "50m"),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
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
