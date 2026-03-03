import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { NugecidModule } from "../nugecid/nugecid.module";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { SeiCaptura } from "./entities/sei-captura.entity";
import { SeiCapturaMapperService } from "./sei-captura-mapper.service";
import { SeiCapturaService } from "./sei-captura.service";
import { SeiController } from "./sei.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([SeiCaptura, DesarquivamentoTypeOrmEntity]),
    AuthModule,
    NugecidModule,
  ],
  controllers: [SeiController],
  providers: [SeiCapturaMapperService, SeiCapturaService],
  exports: [SeiCapturaMapperService, SeiCapturaService],
})
export class SeiModule {}
