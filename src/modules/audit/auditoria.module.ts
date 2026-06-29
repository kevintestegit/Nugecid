import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { AuditHashService } from "./audit-hash.service";
import { Auditoria } from "./entities/auditoria.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Auditoria]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditHashService],
  exports: [TypeOrmModule, AuditService, AuditHashService],
})
export class AuditoriaModule {}
