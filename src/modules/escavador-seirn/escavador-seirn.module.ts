import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EscavadorSeirnController } from "./escavador-seirn.controller";
import { EscavadorSeirnService } from "./escavador-seirn.service";
import { NotificacoesModule } from "../notificacoes/notificacoes.module";
import { AuthModule } from "../auth/auth.module";
import { SeiModule } from "../sei/sei.module";

@Module({
  imports: [ConfigModule, NotificacoesModule, AuthModule, SeiModule],
  controllers: [EscavadorSeirnController],
  providers: [EscavadorSeirnService],
  exports: [EscavadorSeirnService],
})
export class EscavadorSeirnModule {}
