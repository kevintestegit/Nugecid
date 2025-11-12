import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { ProjetosModule } from "../projetos/projetos.module";
import { AuthModule } from "../auth/auth.module";
import { NotificacoesModule } from "../notificacoes/notificacoes.module";
import {
  Tarefa,
  Comentario,
  HistoricoTarefa,
  Anexo,
  Checklist,
  ItemChecklist,
} from "./entities";
import { Projeto, MembroProjeto, Coluna } from "../projetos/entities";
import { User } from "../users/entities/user.entity";
import {
  ProjetosService,
  ColunasService,
  TarefasService,
  ComentariosService,
  TarefasFiltrosService,
} from "./services";
import {
  ProjetosController,
  ColunasController,
  TarefasController,
  ComentariosController,
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
    forwardRef(() => ProjetosModule),
    AuthModule,
    NotificacoesModule,
  ],
  controllers: [
    ProjetosController,
    ColunasController,
    TarefasController,
    ComentariosController,
  ],
  providers: [
    ProjetosService,
    ColunasService,
    TarefasService,
    ComentariosService,
    TarefasFiltrosService,
  ],
  exports: [
    ProjetosService,
    ColunasService,
    TarefasService,
    ComentariosService,
    TarefasFiltrosService,
  ],
})
export class TarefasModule {}
