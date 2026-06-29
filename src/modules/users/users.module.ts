import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Controller
import { UsersController } from "./users.controller";

// Modules
import { AuthModule } from "../auth/auth.module";

// Legacy Service (manter para compatibilidade)
// import { UsersService } from './users.service'; // Removido - arquivo contém UsersController

// Entities
import { User } from "./entities/user.entity";
import { Role } from "./entities/role.entity";
import { UserPreference } from "./entities/user-preference.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";
import { SecurityModule } from "../security/security.module";
import { AuditoriaModule } from "../audit/auditoria.module";

// Services
import { UserPreferencesService } from "./services/user-preferences.service";

// Use Cases
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  GetUserByIdUseCase,
  GetUsersUseCase,
  RestoreUserUseCase,
  GetUserStatisticsUseCase,
  GetRolesUseCase,
  ChangePasswordUseCase,
} from "./application/use-cases";

// Repository Implementations
import {
  TypeOrmUserRepository,
  TypeOrmRoleRepository,
} from "./infrastructure/repositories";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserPreference, Auditoria]),
    AuthModule,
    SecurityModule,
    AuditoriaModule,
  ],
  controllers: [UsersController],
  providers: [
    UserPreferencesService,
    // Legacy Service (manter para compatibilidade)
    // UsersService, // Removido - não existe essa classe

    // Repository Implementations
    {
      provide: "IUserRepository",
      useClass: TypeOrmUserRepository,
    },
    {
      provide: "IRoleRepository",
      useClass: TypeOrmRoleRepository,
    },

    // Use Cases
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserByIdUseCase,
    GetUsersUseCase,
    RestoreUserUseCase,
    GetUserStatisticsUseCase,
    GetRolesUseCase,
    ChangePasswordUseCase,
  ],
  exports: [
    // UsersService, // Removido - não existe essa classe
    TypeOrmModule,
    // Exportar casos de uso para outros módulos se necessário
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserByIdUseCase,
    GetUsersUseCase,
    RestoreUserUseCase,
    GetUserStatisticsUseCase,
    GetRolesUseCase,
  ],
})
export class UsersModule {}
