import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SearchService } from "./search.service";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { DesarquivamentoAnexoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento-anexo.typeorm-entity";
import { Pasta } from "../pastas/entities/pasta.entity";
import { PlanilhaControle } from "../planilhas/entities/planilha-controle.entity";

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      DesarquivamentoTypeOrmEntity,
      DesarquivamentoAnexoTypeOrmEntity,
      Pasta,
      PlanilhaControle,
    ]),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
