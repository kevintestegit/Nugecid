import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("planilhas_controle")
export class PlanilhaControle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "nome_original" })
  nomeOriginal: string;

  @Column()
  caminho: string;

  @Column({ name: "tamanho_bytes", type: "bigint" })
  tamanhoBytes: string;

  @CreateDateColumn({ name: "data_upload" })
  dataUpload: Date;
}
