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
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Projeto } from "./projeto.entity";
import { Coluna } from "./coluna.entity";
import { Comentario } from "./comentario.entity";
import { Anexo } from "./anexo.entity";
import { Checklist } from "./checklist.entity";
import { HistoricoTarefa } from "./historico-tarefa.entity";

export enum PrioridadeTarefa {
  BAIXA = "baixa",
  MEDIA = "media",
  ALTA = "alta",
  CRITICA = "critica",
}

@Entity("tarefas")
export class Tarefa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "projeto_id", nullable: false })
  projetoId: number;

  @ManyToOne(() => Projeto, (projeto) => projeto.tarefas, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projeto_id" })
  projeto: Projeto;

  @Column({ name: "coluna_id", nullable: false })
  colunaId: number;

  @ManyToOne(() => Coluna, (coluna) => coluna.tarefas)
  @JoinColumn({ name: "coluna_id" })
  coluna: Coluna;

  @Column({ length: 255, nullable: false })
  titulo: string;

  @Column({ type: "text", nullable: true })
  descricao: string;

  @Column({ name: "criador_id", nullable: false })
  criadorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "criador_id" })
  criador: User;

  @Column({ name: "responsavel_id", nullable: true })
  responsavelId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "responsavel_id" })
  responsavel: User;

  @Column({ type: "date", nullable: true })
  prazo: Date;

  @Column({
    type: "enum",
    enum: PrioridadeTarefa,
    default: PrioridadeTarefa.MEDIA,
  })
  prioridade: PrioridadeTarefa;

  @Column({ type: "integer", nullable: false })
  ordem: number;

  @Column({
    type: "jsonb",
    default: () => "'[]'::jsonb",
  })
  tags: string[];

  @CreateDateColumn({ name: "data_criacao" })
  createdAt: Date;

  @UpdateDateColumn({ name: "data_atualizacao" })
  updatedAt: Date;

  /**
   * Campo lógico: não há coluna deleted_at em tarefas.
   */
  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  // Relacionamentos (lado inverso)
  @OneToMany(() => Comentario, (comentario) => comentario.tarefa)
  comentarios: Comentario[];

  @OneToMany(() => Anexo, (anexo) => anexo.tarefa)
  anexos: Anexo[];

  @OneToMany(() => Checklist, (checklist) => checklist.tarefa)
  checklists: Checklist[];

  @OneToMany(() => HistoricoTarefa, (historico) => historico.tarefa)
  historico: HistoricoTarefa[];

  // Métodos utilitários
  isOverdue(): boolean {
    if (!this.prazo) return false;
    return new Date(this.prazo) < new Date();
  }

  getDaysUntilDue(): number | null {
    if (!this.prazo) return null;
    const today = new Date();
    const dueDate = new Date(this.prazo);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  hasTag(tag: string): boolean {
    return this.tags?.includes(tag) || false;
  }

  addTag(tag: string): void {
    if (!this.tags) this.tags = [];
    if (!this.hasTag(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    if (!this.tags) return;
    this.tags = this.tags.filter((t) => t !== tag);
  }

  getPrioridadeColor(): string {
    switch (this.prioridade) {
      case PrioridadeTarefa.CRITICA:
        return "#DC2626"; // red-600
      case PrioridadeTarefa.ALTA:
        return "#EA580C"; // orange-600
      case PrioridadeTarefa.MEDIA:
        return "#CA8A04"; // yellow-600
      case PrioridadeTarefa.BAIXA:
        return "#16A34A"; // green-600
      default:
        return "#6B7280"; // gray-500
    }
  }
}
