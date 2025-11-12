import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import * as bcrypt from "bcryptjs";

import { Role } from "./role.entity";
import { Auditoria } from "../../audit/entities/auditoria.entity";

@Entity("usuarios")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  nome: string;

  @Column({ length: 255, unique: true, nullable: false })
  usuario: string;

  @Column({ name: "matricula", length: 50, nullable: true })
  matricula?: string | null;

  @Column({ length: 255, nullable: false })
  senha: string;

  @Column({ name: "role_id", nullable: true })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @Column({ name: "ultimo_login", type: "timestamp", nullable: true })
  ultimoLogin: Date;

  @Column({ name: "ativo", type: "boolean", default: true })
  ativo: boolean;

  @Column({ name: "tentativas_login", type: "integer", default: 0 })
  tentativasLogin: number;

  @Column({ name: "bloqueado_ate", type: "timestamp", nullable: true })
  bloqueadoAte: Date;

  @Column({ name: "token_reset", length: 255, nullable: true })
  tokenReset: string;

  @Column({ name: "token_reset_expira", type: "timestamp", nullable: true })
  tokenResetExpira: Date;

  @Column({
    name: "settings",
    type: "jsonb",
    nullable: true,
    default: () => "'{}'::jsonb",
  })
  settings?: {
    theme?: "light" | "dark";
    showEmail?: boolean;
    showPhone?: boolean;
    autoSave?: boolean;
    compactView?: boolean;
    itemsPerPage?: number;
    [key: string]: unknown;
  };

  @Column({ name: "avatar_url", length: 512, nullable: true })
  avatarUrl?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  // Legacy relationship removed - use proper infrastructure entities
  // @OneToMany(() => DesarquivamentoTypeOrmEntity, desarquivamento => desarquivamento.criadoPor)
  // desarquivamentos: DesarquivamentoTypeOrmEntity[];

  @OneToMany(() => Auditoria, (auditoria) => auditoria.user)
  auditorias: Auditoria[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (
      this.senha &&
      !this.senha.startsWith("$2a$") &&
      !this.senha.startsWith("$2b$") &&
      !this.senha.startsWith("$2y$")
    ) {
      this.senha = await bcrypt.hash(this.senha, 12);
    }
  }

  // Métodos
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.senha);
  }

  isAdmin(): boolean {
    return this.role?.name.toLowerCase() === "admin";
  }

  isCoordenador(): boolean {
    return this.role?.name.toLowerCase() === "coordenador";
  }

  isEditor(): boolean {
    return this.role?.name.toLowerCase() === "editor";
  }

  canManageUser(targetUserId: number): boolean {
    return this.isAdmin() || this.id === targetUserId;
  }

  canViewAllRecords(): boolean {
    return this.isAdmin();
  }

  isBlocked(): boolean {
    return this.bloqueadoAte && this.bloqueadoAte > new Date();
  }

  // Serialização (remove campos sensíveis)
  toJSON() {
    const { senha, tokenReset, tokenResetExpira, ...result } = this;
    return result;
  }

  serialize() {
    const { senha, tokenReset, tokenResetExpira, ...result } = this;
    return result;
  }
}
