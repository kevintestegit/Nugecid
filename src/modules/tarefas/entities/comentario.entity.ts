import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Tarefa } from "./tarefa.entity";

@Entity("comentarios")
export class Comentario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tarefa_id", nullable: false })
  tarefaId: number;

  @ManyToOne(() => Tarefa, (tarefa) => tarefa.comentarios, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tarefa_id" })
  tarefa: Tarefa;

  @Column({ name: "autor_id", nullable: false })
  autorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "autor_id" })
  autor: User;

  @Column({ type: "text", nullable: false })
  conteudo: string;

  @Column({ type: "boolean", default: false })
  editado: boolean;

  @CreateDateColumn({ name: "data_criacao" })
  createdAt: Date;

  @UpdateDateColumn({ name: "data_atualizacao" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  // Métodos
  isAuthor(userId: number): boolean {
    return this.autorId === userId;
  }

  canEdit(userId: number): boolean {
    return this.isAuthor(userId);
  }

  canDelete(userId: number): boolean {
    return this.isAuthor(userId);
  }

  isEdited(): boolean {
    return this.updatedAt.getTime() !== this.createdAt.getTime();
  }

  getTimeAgo(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return this.createdAt.toLocaleDateString("pt-BR");
  }
}
