import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SecurityService } from "./security.service";
import { SecurityController } from "./security.controller";
import { IpBlockerGuard } from "./guards/ip-blocker.guard";
import { BlockedIp } from "./entities/blocked-ip.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockedIp, Auditoria]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SecurityController],
  providers: [SecurityService, IpBlockerGuard],
  exports: [SecurityService, IpBlockerGuard],
})
export class SecurityModule {}
