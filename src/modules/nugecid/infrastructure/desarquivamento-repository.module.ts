import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DesarquivamentoTypeOrmEntity } from "./entities/desarquivamento.typeorm-entity";
import { DesarquivamentoTypeOrmRepository } from "./repositories/desarquivamento.typeorm-repository";
import { DesarquivamentoMapper } from "./mappers/desarquivamento.mapper";
import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../domain/nugecid.constants";

@Module({
  imports: [TypeOrmModule.forFeature([DesarquivamentoTypeOrmEntity])],
  providers: [
    DesarquivamentoMapper,
    {
      provide: DESARQUIVAMENTO_REPOSITORY_TOKEN,
      useClass: DesarquivamentoTypeOrmRepository,
    },
  ],
  exports: [DESARQUIVAMENTO_REPOSITORY_TOKEN, DesarquivamentoMapper],
})
export class DesarquivamentoRepositoryModule {}
