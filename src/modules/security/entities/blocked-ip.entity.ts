import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";

@Entity("blocked_ips")
export class BlockedIp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "ip_address", length: 45, unique: true })
  ipAddress: string;

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({ name: "blocked_by", nullable: true })
  blockedBy: number;

  @Column({ name: "blocked_at" })
  blockedAt: Date;

  @Column({ name: "expires_at", nullable: true })
  expiresAt: Date | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "attempts_count", type: "int", default: 0 })
  attemptsCount: number;

  @Column({ name: "last_attempt_at", nullable: true })
  lastAttemptAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: "blocked_by" })
  blockedByUser: User;

  // Métodos helper
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  shouldBlock(): boolean {
    return this.isActive && !this.isExpired();
  }
}
