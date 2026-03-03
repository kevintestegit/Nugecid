import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Checklist } from "./checklist.entity";

@Entity("itens_checklist")
export class ItemChecklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "checklist_id", nullable: false })
  checklistId: number;

  @ManyToOne(() => Checklist, (checklist) => checklist.itens, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "checklist_id" })
  checklist: Checklist;

  @Column({ length: 500, nullable: false })
  texto: string;

  @Column({ type: "boolean", default: false })
  concluido: boolean;

  @Column({ type: "integer", nullable: false })
  ordem: number;

  @Column({ name: "concluido_por_id", nullable: true })
  concluidoPorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "concluido_por_id" })
  concluidoPor: User;

  @Column({ name: "concluido_em", type: "timestamp", nullable: true })
  concluidoEm: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Métodos
  toggle(userId?: number): void {
    this.concluido = !this.concluido;
    this.updatedAt = new Date();

    if (this.concluido) {
      this.concluidoEm = new Date();
      if (userId) {
        this.concluidoPorId = userId;
      }
    } else {
      this.concluidoEm = null;
      this.concluidoPorId = null;
    }
  }

  markAsCompleted(userId: number): void {
    this.concluido = true;
    this.concluidoEm = new Date();
    this.concluidoPorId = userId;
    this.updatedAt = new Date();
  }

  markAsIncomplete(): void {
    this.concluido = false;
    this.concluidoEm = null;
    this.concluidoPorId = null;
    this.updatedAt = new Date();
  }

  getCompletedTimeAgo(): string | null {
    if (!this.concluidoEm) return null;

    const now = new Date();
    const diffMs = now.getTime() - this.concluidoEm.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return this.concluidoEm.toLocaleDateString("pt-BR");
  }
}
