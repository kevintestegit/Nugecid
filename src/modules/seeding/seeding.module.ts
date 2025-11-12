import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeedingService } from "./seeding.service";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeedingModule {}
