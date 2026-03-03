import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

import { User } from "../../users/entities/user.entity";

interface WebPushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface WebPushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: WebPushSubscriptionKeys;
}

@Entity("notification_push_subscriptions")
@Index(["userId"])
@Index(["endpoint"], { unique: true })
export class NotificationPushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", nullable: false })
  userId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "text", nullable: false })
  endpoint: string;

  @Column({
    type: "jsonb",
    nullable: false,
  })
  subscription: WebPushSubscriptionPayload;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  toWebPushSubscription(): WebPushSubscriptionPayload {
    return this.subscription;
  }
}
