import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ServeStaticModule } from "@nestjs/serve-static";
import { MulterModule } from "@nestjs/platform-express";
import { join } from "path";
import * as redisStore from "cache-manager-redis-store";

// Configuration
import {
  DatabaseConfig,
  databaseConfigFactory,
} from "./config/database.config";
import authConfig from "./config/auth.config";
import appConfig from "./config/app.config";

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { NugecidModule } from "./modules/nugecid/nugecid.module";
import { AuditoriaModule } from "./modules/audit/auditoria.module";
import { SeedingModule } from "./modules/seeding/seeding.module";
import { RegistrosModule } from "./modules/registros/registros.module";
import { EstatisticasModule } from "./modules/estatisticas/estatisticas.module";
import { HealthModule } from "./modules/health/health.module";
import { TarefasModule } from "./modules/tarefas/tarefas.module";
import { NotificacoesModule } from "./modules/notificacoes/notificacoes.module";
import { PastasModule } from "./modules/pastas/pastas.module";
import { PlanilhasModule } from "./modules/planilhas/planilhas.module";
import { BackupModule } from "./modules/backup/backup.module";
import { SecurityModule } from "./modules/security/security.module";
// import { WebscrapingModule } from "./modules/webscraping/webscraping.module";  // TEMPORARIAMENTE DESABILITADO
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { VestigiosModule } from "./modules/vestigios/vestigios.module";
import { EscavadorSeirnModule } from "./modules/escavador-seirn/escavador-seirn.module";

// Controllers and Services
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// Entities
import { User } from "./modules/users/entities/user.entity";
import { DesarquivamentoTypeOrmEntity } from "./modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { Tarefa } from "./modules/tarefas/entities/tarefa.entity";
import { Projeto } from "./modules/tarefas/entities/projeto.entity";
import { Pasta } from "./modules/pastas/entities/pasta.entity";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfigFactory, authConfig, appConfig],
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),

    // TypeOrm para entidades usadas em AppService
    TypeOrmModule.forFeature([
      User,
      DesarquivamentoTypeOrmEntity,
      Tarefa,
      Projeto,
      Pasta,
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [ConfigService],
    }),

    // Cache (Redis - opcional)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");
        if (redisUrl) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 30, // 30 seconds - atualização rápida
            max: 100,
            isGlobal: true,
          };
        }
        // Fallback para cache em memória
        return {
          ttl: 30, // 30 seconds - atualização rápida
          max: 100,
          isGlobal: true,
        };
      },
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>("THROTTLE_TTL", 60),
          limit: configService.get<number>("THROTTLE_LIMIT", 10),
        },
      ],
      inject: [ConfigService],
    }),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Event System
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Static Files
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: join(__dirname, "..", "public"),
          serveRoot: "/public",
        },
        {
          rootPath: configService.get<string>("UPLOAD_PATH", "./uploads"),
          serveRoot: "/uploads",
        },
      ],
      inject: [ConfigService],
    }),

    // File Upload
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dest: configService.get<string>("UPLOAD_PATH", "./uploads"),
        limits: {
          fileSize: configService.get<number>(
            "MAX_FILE_SIZE",
            10 * 1024 * 1024,
          ), // 10MB
          files: 5,
        },
      }),
      inject: [ConfigService],
    }),

    // Application Modules
    AuthModule,
    UsersModule,
    NugecidModule,
    AuditoriaModule,
    SeedingModule,
    RegistrosModule,
    EstatisticasModule,
    HealthModule,
    TarefasModule,
    NotificacoesModule,
    PastasModule,
    PlanilhasModule,
    BackupModule,
    SecurityModule,
    // WebscrapingModule,  // TEMPORARIAMENTE DESABILITADO
    AnnouncementsModule,
    VestigiosModule,
    EscavadorSeirnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
