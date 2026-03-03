import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PastasService } from "./pastas.service";
import { PastasController } from "./pastas.controller";
import { Pasta } from "./entities/pasta.entity";
import { PastaArquivo } from "./entities/pasta-arquivo.entity";
import { NotificacoesModule } from "../notificacoes/notificacoes.module";
import { AuthModule } from "../auth/auth.module";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Pasta, PastaArquivo]),
    NotificacoesModule,
    AuthModule,
    SecurityModule,
  ],
  controllers: [PastasController],
  providers: [PastasService],
  exports: [PastasService],
})
export class PastasModule {}
