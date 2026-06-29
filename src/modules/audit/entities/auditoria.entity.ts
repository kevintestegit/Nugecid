import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";

import { User } from "../../users/entities/user.entity";

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  VIEW = "VIEW",
}

@Entity("auditorias")
@Index("idx_auditorias_user_id", ["userId"])
@Index("idx_auditorias_action", ["action"])
@Index("idx_auditorias_entity", ["entityName", "entityId"])
@Index("idx_auditorias_timestamp", ["timestamp"])
export class Auditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "previous_hash", length: 64, nullable: true })
  previousHash: string | null;

  @Column({ name: "hash", length: 64, nullable: true })
  hash: string | null;

  @Column({ name: "user_id", nullable: true })
  userId: number | null;

  @Column({ type: "varchar", enum: AuditAction, nullable: false })
  action: AuditAction;

  @Column({ name: "entity_name", length: 100, nullable: false })
  entityName: string;

  @Column({ name: "entity_id", nullable: true })
  entityId: number;

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  details: any;

  @Column({ name: "ip_address", length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string;

  @Column({ type: "boolean", default: true })
  success: boolean;

  @Column({ type: "text", nullable: true })
  error: string;

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  response: any;

  @CreateDateColumn({ name: "timestamp" })
  timestamp: Date;

  // Relacionamentos
  @ManyToOne(() => User, (user) => user.auditorias, { eager: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  // Métodos
  static createLoginAudit(
    userId: number | null,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    error?: string,
  ): Partial<Auditoria> {
    return {
      userId,
      action: AuditAction.LOGIN,
      entityName: "auth",
      ipAddress,
      userAgent,
      success,
      error,
      details: {
        loginAttempt: true,
      },
    };
  }

  static createLogoutAudit(
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Partial<Auditoria> {
    return {
      userId,
      action: AuditAction.LOGOUT,
      entityName: "auth",
      ipAddress,
      userAgent,
      success: true,
      details: {
        logoutAction: true,
      },
    };
  }

  static createResourceAudit(
    userId: number,
    action: AuditAction,
    entityName: string,
    entityId: number,
    details: any,
    ipAddress: string,
    userAgent: string,
  ): Partial<Auditoria> {
    return {
      userId,
      action,
      entityName,
      entityId,
      details,
      ipAddress,
      userAgent,
      success: true,
    };
  }

  /**
   * Builds a deterministic payload string for hash chain verification.
   * Do NOT include the generated id or mutable fields that would break append-only semantics.
   */
  buildHashPayload(): string {
    const payload = {
      previousHash: this.previousHash,
      userId: this.userId,
      action: this.action,
      entityName: this.entityName,
      entityId: this.entityId,
      details: this.details,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      success: this.success,
      error: this.error,
      timestamp: this.timestamp,
    };
    return JSON.stringify(payload, Object.keys(payload).sort());
  }

  getActionLabel(): string {
    const labels = {
      [AuditAction.CREATE]: "Criação",
      [AuditAction.UPDATE]: "Atualização",
      [AuditAction.DELETE]: "Exclusão",
      [AuditAction.LOGIN]: "Login",
      [AuditAction.LOGOUT]: "Logout",
      [AuditAction.EXPORT]: "Exportação",
      [AuditAction.IMPORT]: "Importação",
      [AuditAction.VIEW]: "Visualização",
    };
    return labels[this.action] || "Desconhecido";
  }

  getResourceLabel(): string {
    const labels = {
      auth: "Autenticação",
      users: "Usuários",
      nugecid: "Desarquivamentos",
      dashboard: "Dashboard",
      files: "Arquivos",
    };
    return labels[this.entityName] || this.entityName;
  }

  isSuccessful(): boolean {
    return this.success;
  }

  hasError(): boolean {
    return !this.success && !!this.error;
  }
}
