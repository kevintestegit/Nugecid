import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SystemAnnouncement, AnnouncementViewed } from "./entities";
import { AnnouncementsService } from "./services";
import { AnnouncementsController } from "./controllers";
import { User } from "../users/entities/user.entity";
import { AuthModule } from "../auth/auth.module";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemAnnouncement, AnnouncementViewed, User]),
    AuthModule,
    SecurityModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
