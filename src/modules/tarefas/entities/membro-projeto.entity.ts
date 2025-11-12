import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Projeto } from "./projeto.entity";

export enum PapelMembro {
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

@Entity("membros_projeto")
@Unique(["projetoId", "usuarioId"])
export class MembroProjeto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "projeto_id", nullable: false })
  projetoId: number;

  @ManyToOne(() => Projeto, (projeto) => projeto.membros, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projeto_id" })
  projeto: Projeto;

  @Column({ name: "usuario_id", nullable: false })
  usuarioId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "usuario_id" })
  usuario: User;

  @Column({
    type: "enum",
    enum: PapelMembro,
    default: PapelMembro.VIEWER,
  })
  papel: PapelMembro;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Métodos de permissão
  canEdit(): boolean {
    return (
      this.papel === PapelMembro.ADMIN || this.papel === PapelMembro.EDITOR
    );
  }

  canManageMembers(): boolean {
    return this.papel === PapelMembro.ADMIN;
  }

  canCreateTasks(): boolean {
    return (
      this.papel === PapelMembro.ADMIN || this.papel === PapelMembro.EDITOR
    );
  }

  canEditTasks(): boolean {
    return (
      this.papel === PapelMembro.ADMIN || this.papel === PapelMembro.EDITOR
    );
  }

  canDeleteTasks(): boolean {
    return this.papel === PapelMembro.ADMIN;
  }

  canComment(): boolean {
    return true; // Todos os membros podem comentar
  }

  canViewProject(): boolean {
    return true; // Se é membro, pode visualizar
  }

  getPapelLabel(): string {
    switch (this.papel) {
      case PapelMembro.ADMIN:
        return "Administrador";
      case PapelMembro.EDITOR:
        return "Editor";
      case PapelMembro.VIEWER:
        return "Visualizador";
      default:
        return "Desconhecido";
    }
  }

  getPapelColor(): string {
    switch (this.papel) {
      case PapelMembro.ADMIN:
        return "#DC2626"; // red-600
      case PapelMembro.EDITOR:
        return "#2563EB"; // blue-600
      case PapelMembro.VIEWER:
        return "#16A34A"; // green-600
      default:
        return "#6B7280"; // gray-500
    }
  }
}
