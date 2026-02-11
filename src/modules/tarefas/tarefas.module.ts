import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { NotificacoesModule } from "../notificacoes/notificacoes.module";
import {
  Projeto,
  MembroProjeto,
  Coluna,
  Tarefa,
  Comentario,
  HistoricoTarefa,
  Anexo,
  Checklist,
  ItemChecklist,
} from "./entities";
import { User } from "../users/entities/user.entity";
import {
  ProjetosService,
  ColunasService,
  TarefasService,
  ComentariosService,
  TarefasFiltrosService,
  ChecklistsService,
} from "./services";
import {
  ProjetosController,
  ColunasController,
  TarefasController,
  ComentariosController,
  ChecklistsController,
} from "./controllers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tarefa,
      Comentario,
      HistoricoTarefa,
      Anexo,
      Checklist,
      ItemChecklist,
      Projeto,
      MembroProjeto,
      Coluna,
      User,
    ]),
    UsersModule,
    AuthModule,
    NotificacoesModule,
  ],
  controllers: [
    ProjetosController,
    ColunasController,
    TarefasController,
    ComentariosController,
    ChecklistsController,
  ],
  providers: [
    ProjetosService,
    ColunasService,
    TarefasService,
    ComentariosService,
    TarefasFiltrosService,
    ChecklistsService,
  ],
  exports: [
    ProjetosService,
    ColunasService,
    TarefasService,
    ComentariosService,
    TarefasFiltrosService,
    ChecklistsService,
  ],
})
export class TarefasModule {}
