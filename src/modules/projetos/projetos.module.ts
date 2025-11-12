import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { TarefasModule } from "../tarefas/tarefas.module";
import { AuthModule } from "../auth/auth.module";
import { Projeto, MembroProjeto, Coluna, Tarefa } from "../tarefas/entities";
import { ProjetosService } from "./services/projetos.service";
import { ProjetosController } from "./controllers/projetos.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Projeto, MembroProjeto, Coluna, Tarefa]),
    UsersModule,
    forwardRef(() => TarefasModule),
    AuthModule,
  ],
  controllers: [ProjetosController],
  providers: [ProjetosService],
  exports: [ProjetosService],
})
export class ProjetosModule {}
