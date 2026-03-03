import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificacoesController } from "./controllers";
import {
  NotificacoesService,
  NotificacoesSchedulerService,
  NotificationPreferencesService,
  PushNotificationsService,
} from "./services";
import {
  Notificacao,
  NotificationPreferences,
  NotificationPushSubscription,
} from "./entities";
import { User } from "../users/entities/user.entity";
import { Tarefa } from "../tarefas/entities/tarefa.entity";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { AuthModule } from "../auth/auth.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notificacao,
      NotificationPreferences,
      NotificationPushSubscription,
      User,
      Tarefa,
      DesarquivamentoTypeOrmEntity,
    ]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [NotificacoesController],
  providers: [
    NotificacoesService,
    NotificacoesSchedulerService,
    NotificationPreferencesService,
    PushNotificationsService,
  ],
  exports: [
    NotificacoesService,
    NotificacoesSchedulerService,
    NotificationPreferencesService,
    PushNotificationsService,
  ],
})
export class NotificacoesModule {}
