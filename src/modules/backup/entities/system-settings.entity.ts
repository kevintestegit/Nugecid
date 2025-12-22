import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("system_settings")
export class SystemSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "auto_backup", type: "boolean", default: true })
  autoBackup: boolean;

  @Column({
    name: "backup_frequency",
    type: "varchar",
    length: 20,
    default: "daily",
  })
  backupFrequency: string;

  @Column({ name: "log_level", type: "varchar", length: 10, default: "info" })
  logLevel: string;

  @Column({ name: "maintenance_mode", type: "boolean", default: false })
  maintenanceMode: boolean;

  @Column({ name: "cache_enabled", type: "boolean", default: true })
  cacheEnabled: boolean;

  // Security settings
  @Column({ name: "session_timeout", type: "integer", default: 30 })
  sessionTimeout: number;

  @Column({ name: "password_expiry", type: "integer", default: 90 })
  passwordExpiry: number;

  @Column({ name: "max_login_attempts", type: "integer", default: 5 })
  maxLoginAttempts: number;

  @Column({ name: "two_factor_auth", type: "boolean", default: false })
  twoFactorAuth: boolean;

  @Column({ name: "require_strong_password", type: "boolean", default: true })
  requireStrongPassword: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
