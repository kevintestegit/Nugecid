import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { EstatisticasController } from "./estatisticas.controller";
import { EstatisticasService } from "./estatisticas.service";
// import { Atendimento } from '../nugecid/entities/atendimento.entity';
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([/* Atendimento, */ DesarquivamentoTypeOrmEntity]),
    AuthModule, // Necessário para JwtAuthGuard e RolesGuard
    CacheModule.register({
      ttl: 60000, // 60 segundos em millisegundos
      max: 100,
    }),
  ],
  controllers: [EstatisticasController],
  providers: [EstatisticasService],
})
export class EstatisticasModule {}
