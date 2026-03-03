import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { HealthController } from "./health.controller";
import { DatabaseHealthService } from "./database-health.service";
import { DatabaseConnectionListener } from "./database-connection.listener";

@Module({
  imports: [TypeOrmModule.forFeature([]), AuthModule], // Vazio pois só precisamos do DataSource
  controllers: [HealthController],
  providers: [DatabaseHealthService, DatabaseConnectionListener],
  exports: [DatabaseHealthService, DatabaseConnectionListener],
})
export class HealthModule {}
