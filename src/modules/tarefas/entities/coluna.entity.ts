import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";

import { Projeto } from "./projeto.entity";
import { Tarefa } from "./tarefa.entity";

@Entity("colunas")
export class Coluna {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "projeto_id", nullable: false })
  projetoId: number;

  @ManyToOne(() => Projeto, (projeto) => projeto.colunas, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projeto_id" })
  projeto: Projeto;

  @Column({ length: 100, nullable: false })
  nome: string;

  @Column({ length: 7, default: "#3B82F6" })
  cor: string;

  @Column({ type: "integer", nullable: false })
  ordem: number;

  @Column({ type: "boolean", default: true })
  ativa: boolean;

  @Column({ name: "wip_limit", type: "integer", nullable: true })
  wipLimit: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relacionamentos
  @OneToMany(() => Tarefa, (tarefa) => tarefa.coluna)
  tarefas: Tarefa[];

  // Métodos
  getTarefasCount(): number {
    return this.tarefas?.length || 0;
  }

  getTarefasAtivas(): Tarefa[] {
    return this.tarefas?.filter((tarefa) => !tarefa.deletedAt) || [];
  }

  getNextOrdem(): number {
    if (!this.tarefas || this.tarefas.length === 0) return 1;
    const maxOrdem = Math.max(...this.tarefas.map((t) => t.ordem));
    return maxOrdem + 1;
  }

  isWipLimitExceeded(): boolean {
    if (!this.wipLimit) return false;
    return this.getTarefasAtivas().length > this.wipLimit;
  }

  getWipStatus(): { count: number; limit: number | null; exceeded: boolean } {
    const count = this.getTarefasAtivas().length;
    return {
      count,
      limit: this.wipLimit,
      exceeded: this.wipLimit ? count > this.wipLimit : false,
    };
  }
}
