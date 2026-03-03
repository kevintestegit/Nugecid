import { Global, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { QUEUE_NAMES } from "./queue.constants";
import { QueueService } from "./queue.service";
import { QueuesController } from "./queues.controller";

// Processors
import { ImportProcessor } from "./processors/import.processor";
import { DocumentGenerationProcessor } from "./processors/document-generation.processor";
import { NotificationProcessor } from "./processors/notification.processor";
import { BackupProcessor } from "./processors/backup.processor";

// Entities needed by processors
import { User } from "../users/entities/user.entity";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";

// Modules that export services used by processors
import { NugecidModule } from "../nugecid/nugecid.module";
import { NotificacoesModule } from "../notificacoes/notificacoes.module";
import { BackupModule } from "../backup/backup.module";
import { EstatisticasModule } from "../estatisticas/estatisticas.module";
import { AuthModule } from "../auth/auth.module";

@Global()
@Module({
  imports: [
    // ── BullMQ root connection ─────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");

        if (redisUrl) {
          // Parse REDIS_URL for BullMQ connection options
          const url = new URL(redisUrl);
          return {
            connection: {
              host: url.hostname,
              port: Number(url.port) || 6379,
              password: url.password || undefined,
              db: url.pathname ? Number(url.pathname.replace("/", "")) || 0 : 0,
            },
          };
        }

        return {
          connection: {
            host: configService.get<string>("REDIS_HOST", "localhost"),
            port: configService.get<number>("REDIS_PORT", 6379),
            password: configService.get<string>("REDIS_PASSWORD") || undefined,
            db: configService.get<number>("REDIS_DB", 0),
          },
        };
      },
    }),

    // ── Register all queues ────────────────────────────────────
    BullModule.registerQueue(
      { name: QUEUE_NAMES.IMPORT },
      { name: QUEUE_NAMES.DOCUMENT_GENERATION },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.BACKUP },
    ),

    // ── TypeORM entities used by processors ────────────────────
    TypeOrmModule.forFeature([User, DesarquivamentoTypeOrmEntity]),

    // ── Feature modules that export services for processors ────
    NugecidModule,
    NotificacoesModule,
    BackupModule,
    EstatisticasModule,
    AuthModule,
  ],
  controllers: [QueuesController],
  providers: [
    QueueService,
    ImportProcessor,
    DocumentGenerationProcessor,
    NotificationProcessor,
    BackupProcessor,
  ],
  exports: [QueueService],
})
export class QueuesModule {}
