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

import { Tarefa } from "./tarefa.entity";
import { ItemChecklist } from "./item-checklist.entity";

@Entity("checklists")
export class Checklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tarefa_id", nullable: false })
  tarefaId: number;

  @ManyToOne(() => Tarefa, (tarefa) => tarefa.checklists, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tarefa_id" })
  tarefa: Tarefa;

  @Column({ length: 255, nullable: false })
  titulo: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => ItemChecklist, (item) => item.checklist, { cascade: true })
  itens: ItemChecklist[];

  // Métodos
  getProgress(): { completed: number; total: number; percentage: number } {
    if (!this.itens || this.itens.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const total = this.itens.length;
    const completed = this.itens.filter((item) => item.concluido).length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }

  isCompleted(): boolean {
    if (!this.itens || this.itens.length === 0) return false;
    return this.itens.every((item) => item.concluido);
  }

  getCompletedItems(): ItemChecklist[] {
    return this.itens?.filter((item) => item.concluido) || [];
  }

  getPendingItems(): ItemChecklist[] {
    return this.itens?.filter((item) => !item.concluido) || [];
  }

  getNextOrdem(): number {
    if (!this.itens || this.itens.length === 0) return 1;
    const maxOrdem = Math.max(...this.itens.map((item) => item.ordem));
    return maxOrdem + 1;
  }

  toggleAllItems(concluido: boolean): void {
    if (this.itens) {
      this.itens.forEach((item) => {
        item.concluido = concluido;
        item.updatedAt = new Date();
      });
    }
  }
}
