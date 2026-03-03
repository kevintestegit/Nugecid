import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SecurityService } from "./security.service";
import { SecurityController } from "./security.controller";
import { IpBlockerGuard } from "./guards/ip-blocker.guard";
import { AntivirusService } from "./antivirus.service";
import { BlockedIp } from "./entities/blocked-ip.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";
import { User } from "../users/entities/user.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockedIp, Auditoria, User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SecurityController],
  providers: [SecurityService, IpBlockerGuard, AntivirusService],
  exports: [SecurityService, IpBlockerGuard, AntivirusService],
})
export class SecurityModule {}
