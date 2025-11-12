import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { PastaArquivo } from "./pasta-arquivo.entity";

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

  @OneToMany(() => PastaArquivo, (arquivo) => arquivo.pasta)
  arquivos: PastaArquivo[];
}
