import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Projeto } from './projeto.entity';
import { Tarefa } from '../../tarefas/entities/tarefa.entity';

@Entity()
export class Coluna {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ default: 0 })
  ordem: number;

  @ManyToOne(() => Projeto, projeto => projeto.colunas)
  projeto: Projeto;

  @OneToMany(() => Tarefa, tarefa => tarefa.coluna)
  tarefas: Tarefa[];
}
