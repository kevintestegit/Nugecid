import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlanilhasController } from "./planilhas.controller";
import { PlanilhasService } from "./planilhas.service";
import { PlanilhaControle } from "./entities/planilha-controle.entity";
import { AuthModule } from "../auth/auth.module";
import { PastasModule } from "../pastas/pastas.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanilhaControle]),
    AuthModule,
    PastasModule,
  ],
  controllers: [PlanilhasController],
  providers: [PlanilhasService],
  exports: [PlanilhasService],
})
export class PlanilhasModule {}
