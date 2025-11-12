import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificacoesController } from "./controllers";
import { NotificacoesService, NotificacoesSchedulerService } from "./services";
import { Notificacao } from "./entities";
import { User } from "../users/entities/user.entity";
import { Tarefa } from "../tarefas/entities/tarefa.entity";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notificacao,
      User,
      Tarefa,
      DesarquivamentoTypeOrmEntity,
    ]),
    AuthModule,
  ],
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificacoesSchedulerService],
  exports: [NotificacoesService, NotificacoesSchedulerService],
})
export class NotificacoesModule {}
