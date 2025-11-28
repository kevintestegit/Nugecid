import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { SystemAnnouncement } from "./system-announcement.entity";

@Entity("announcement_viewed")
@Index(["announcementId", "userId"], { unique: true })
export class AnnouncementViewed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "announcement_id" })
  announcementId: number;

  @ManyToOne(
    () => SystemAnnouncement,
    (announcement) => announcement.viewedBy,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "announcement_id" })
  announcement: SystemAnnouncement;

  @Column({ name: "user_id" })
  userId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn({ name: "viewed_at" })
  viewedAt: Date;
}
