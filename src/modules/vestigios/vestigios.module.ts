import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VestigiosService } from "./vestigios.service";
import { VestigiosController } from "./vestigios.controller";
import { Vestigio } from "./entities/vestigio.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Vestigio]), AuthModule],
  controllers: [VestigiosController],
  providers: [VestigiosService],
  exports: [VestigiosService],
})
export class VestigiosModule {}
