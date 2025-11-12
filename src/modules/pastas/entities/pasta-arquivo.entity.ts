import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Pasta } from "./pasta.entity";

export enum PastaArquivoTipo {
  IMAGEM = "IMAGEM",
  PLANILHA = "PLANILHA",
}

@Entity("pasta_arquivos")
export class PastaArquivo {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "pasta_id" })
  pastaId: string;

  @ManyToOne(() => Pasta, (pasta) => pasta.arquivos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pasta_id" })
  pasta: Pasta;

  @Column({ type: "enum", enum: PastaArquivoTipo })
  tipo: PastaArquivoTipo;

  @Column({ name: "nome_original" })
  nomeOriginal: string;

  @Column()
  caminho: string;

  @Column({ name: "tamanho_bytes", type: "bigint" })
  tamanhoBytes: string;

  @CreateDateColumn({ name: "data_upload" })
  dataUpload: Date;
}
