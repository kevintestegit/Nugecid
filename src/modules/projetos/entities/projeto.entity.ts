import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Coluna } from "./coluna.entity";
import { Tarefa } from "../../tarefas/entities/tarefa.entity";
import { MembroProjeto } from "./membro-projeto.entity";

@Entity("projetos")
export class Projeto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  nome: string;

  @Column({ type: "text", nullable: true })
  descricao: string;

  @Column({ name: "criador_id", nullable: false })
  criadorId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "criador_id" })
  criador: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => Coluna, (coluna) => coluna.projeto, { cascade: true })
  colunas: Coluna[];

  @OneToMany(() => Tarefa, (tarefa) => tarefa.projeto)
  tarefas: Tarefa[];

  @OneToMany(() => MembroProjeto, (membro) => membro.projeto, { cascade: true })
  membros: MembroProjeto[];

  // Métodos
  isOwner(userId: number): boolean {
    return this.criadorId === userId;
  }

  hasMember(userId: number): boolean {
    return this.membros?.some((membro) => membro.usuarioId === userId) || false;
  }

  getMemberRole(userId: number): string | null {
    const membro = this.membros?.find((m) => m.usuarioId === userId);
    return membro?.papel || null;
  }

  canUserEdit(userId: number): boolean {
    if (this.isOwner(userId)) return true;
    const role = this.getMemberRole(userId);
    return role === "admin" || role === "editor";
  }

  canUserView(userId: number): boolean {
    return this.isOwner(userId) || this.hasMember(userId);
  }
}
