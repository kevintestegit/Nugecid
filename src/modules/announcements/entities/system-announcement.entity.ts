import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { AnnouncementViewed } from "./announcement-viewed.entity";

export enum AnnouncementPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

@Entity("system_announcements")
export class SystemAnnouncement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl: string | null;

  @Column({
    type: "enum",
    enum: AnnouncementPriority,
    default: AnnouncementPriority.MEDIUM,
  })
  priority: AnnouncementPriority;

  @Column({ name: "start_date", type: "timestamp" })
  startDate: Date;

  @Column({ name: "end_date", type: "timestamp" })
  endDate: Date;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @Column({
    name: "target_roles",
    type: "jsonb",
    nullable: true,
    comment: "Array de roles que devem ver este aviso. Null = todos",
  })
  targetRoles: string[] | null;

  @Column({ name: "created_by_id" })
  createdById: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by_id" })
  createdBy: User;

  @OneToMany(() => AnnouncementViewed, (viewed) => viewed.announcement)
  viewedBy: AnnouncementViewed[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Métodos auxiliares
  isActive(): boolean {
    if (!this.active) return false;

    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  shouldShowToUser(userRole: string): boolean {
    if (!this.isActive()) return false;
    if (!this.targetRoles || this.targetRoles.length === 0) return true;
    return this.targetRoles.includes(userRole);
  }

  getPriorityColor(): string {
    switch (this.priority) {
      case AnnouncementPriority.CRITICAL:
        return "#DC2626"; // red-600
      case AnnouncementPriority.HIGH:
        return "#EA580C"; // orange-600
      case AnnouncementPriority.MEDIUM:
        return "#CA8A04"; // yellow-600
      case AnnouncementPriority.LOW:
        return "#16A34A"; // green-600
      default:
        return "#6B7280"; // gray-500
    }
  }
}
