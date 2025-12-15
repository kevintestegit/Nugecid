import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PastaArquivo } from "./pasta-arquivo.entity";
import { User } from "../../users/entities/user.entity";

@Entity("pastas")
export class Pasta {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  nome: string;

  @Column()
  descricao: string;

  @Column({ default: 0 })
  imagens: number;

  @Column({ default: 0 })
  planilhas: number;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao: Date;

  @Column("simple-array")
  tags: string[];

  @Column({ name: "criado_por_id", nullable: true })
  criadoPorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "criado_por_id" })
  criadoPor: User;

  @OneToMany(() => PastaArquivo, (arquivo) => arquivo.pasta)
  arquivos: PastaArquivo[];
}
