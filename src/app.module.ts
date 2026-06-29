import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ServeStaticModule } from "@nestjs/serve-static";
import { MulterModule } from "@nestjs/platform-express";
import { SentryModule } from "@sentry/nestjs/setup";
import { config as dotenvConfig } from "dotenv";
import * as redisStore from "cache-manager-redis-store";

// Configuration
import {
  DatabaseConfig,
  databaseConfigFactory,
} from "./config/database.config";
import authConfig from "./config/auth.config";
import appConfig from "./config/app.config";
import { createStaticFileServeOptions } from "./config/static-files.config";
import { validateEnvironment } from "./config/validation";

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { NugecidModule } from "./modules/nugecid/nugecid.module";
import { AuditoriaModule } from "./modules/audit/auditoria.module";
import { RegistrosModule } from "./modules/registros/registros.module";
import { EstatisticasModule } from "./modules/estatisticas/estatisticas.module";
import { HealthModule } from "./modules/health/health.module";
import { TarefasModule } from "./modules/tarefas/tarefas.module";
import { NotificacoesModule } from "./modules/notificacoes/notificacoes.module";
import { PastasModule } from "./modules/pastas/pastas.module";
import { PlanilhasModule } from "./modules/planilhas/planilhas.module";
import { BackupModule } from "./modules/backup/backup.module";
import { SecurityModule } from "./modules/security/security.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { VestigiosModule } from "./modules/vestigios/vestigios.module";
import { EscavadorSeirnModule } from "./modules/escavador-seirn/escavador-seirn.module";
import { RedisModule } from "./modules/redis/redis.module";
import { QueuesModule } from "./modules/queues/queues.module";
import { SyncModule } from "./modules/sync/sync.module";
import { ObservabilityModule } from "./modules/observability/observability.module";
import { StorageModule } from "./modules/storage/storage.module";
import { SeedingModule } from "./modules/seeding/seeding.module";
import { SearchModule } from "./modules/search/search.module";
import { SeiModule } from "./modules/sei/sei.module";
import { MailModule } from "./modules/mail/mail.module";

// Controllers and Services
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// Global guards (defense-in-depth: every route requires auth unless @IsPublic())
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "./modules/auth/guards/roles.guard";

// Entities
import { User } from "./modules/users/entities/user.entity";
import { DesarquivamentoTypeOrmEntity } from "./modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { Tarefa } from "./modules/tarefas/entities/tarefa.entity";
import { Projeto } from "./modules/tarefas/entities/projeto.entity";
import { Pasta } from "./modules/pastas/entities/pasta.entity";
import { Vestigio } from "./modules/vestigios/entities/vestigio.entity";
import { Notificacao } from "./modules/notificacoes/entities/notificacao.entity";
import { PlanilhaControle } from "./modules/planilhas/entities/planilha-controle.entity";

dotenvConfig({ path: ".env", override: false });
dotenvConfig({ path: ".env.local", override: true });
validateEnvironment();
const queueFeatureEnabled = process.env.FEATURE_QUEUE_ENABLED === "true";

@Module({
  imports: [
    // Sentry must be first
    SentryModule.forRoot(),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfigFactory, authConfig, appConfig],
      envFilePath: [".env.local", ".env"],
      cache: true,
    }),

    StorageModule,

    // TypeOrm para entidades usadas em AppService
    TypeOrmModule.forFeature([
      User,
      DesarquivamentoTypeOrmEntity,
      Tarefa,
      Projeto,
      Pasta,
      Vestigio,
      Notificacao,
      PlanilhaControle,
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [ConfigService],
    }),

    SearchModule,

    // Cache (Redis - opcional)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");
        if (redisUrl) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 30, // 30 seconds - atualização rápida
            max: 100,
          };
        }
        // Fallback para cache em memória
        return {
          ttl: 30, // 30 seconds - atualização rápida
          max: 100,
        };
      },
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
      useFactory: createStaticFileServeOptions,
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
    ObservabilityModule,
    SeedingModule,
    SyncModule,
    RedisModule,
    MailModule,
    AuthModule,
    UsersModule,
    NugecidModule,
    AuditoriaModule,
    RegistrosModule,
    EstatisticasModule,
    HealthModule,
    TarefasModule,
    NotificacoesModule,
    PastasModule,
    PlanilhasModule,
    SeiModule,
    BackupModule,
    SecurityModule,
    AnnouncementsModule,
    VestigiosModule,
    EscavadorSeirnModule,
    ...(queueFeatureEnabled ? [QueuesModule] : []),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Defense-in-depth: JwtAuthGuard applied globally; controllers opt out via @IsPublic().
    // RolesGuard applied globally; methods opt out via @IsPublic() or qualify via @Roles(...).
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
