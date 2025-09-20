import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Projeto } from './projeto.entity';
import { Coluna } from './coluna.entity';

@Entity()
export class Tarefa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ default: 0 })
  ordem: number;

  @Column({ type: 'timestamp', nullable: true })
  prazo: Date;

  @ManyToOne(() => Projeto, projeto => projeto.tarefas)
  projeto: Projeto;

  @ManyToOne(() => Coluna, coluna => coluna.tarefas)
  coluna: Coluna;
}
