import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { Auditoria } from "./entities/auditoria.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Auditoria]), AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [TypeOrmModule, AuditService],
})
export class AuditoriaModule {}
