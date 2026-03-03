import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SeiCapturaStatus } from "../sei-captura.types";

@Entity("sei_capturas")
@Index(["numeroProcessoSei"])
@Index(["numeroPci"])
@Index(["status"])
@Index(["createdAt"])
export class SeiCaptura {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "numero_processo_sei", length: 255, nullable: true })
  numeroProcessoSei: string | null;

  @Column({ name: "numero_pci", length: 100, nullable: true })
  numeroPci: string | null;

  @Column({ name: "data_entrada_sei", type: "timestamp", nullable: true })
  dataEntradaSei: Date | null;

  @Column({ name: "unidade_origem", length: 255, nullable: true })
  unidadeOrigem: string | null;

  @Column({ name: "unidade_atual", length: 255, nullable: true })
  unidadeAtual: string | null;

  @Column({ name: "interessado", length: 255, nullable: true })
  interessado: string | null;

  @Column({ name: "assunto", type: "text", nullable: true })
  assunto: string | null;

  @Column({ name: "tipo_processo", length: 255, nullable: true })
  tipoProcesso: string | null;

  @Column({ name: "texto_resumo", type: "text", nullable: true })
  textoResumo: string | null;

  @Column({ name: "link_sei", type: "text", nullable: true })
  linkSei: string | null;

  @Column({
    name: "status",
    type: "varchar",
    length: 50,
    default: SeiCapturaStatus.NOVO,
  })
  status: SeiCapturaStatus;

  @Column({ name: "motivo_status", type: "text", nullable: true })
  motivoStatus: string | null;

  @Column({ name: "campos_ausentes", type: "simple-array", nullable: true })
  camposAusentes: string[] | null;

  @Column({ name: "duplicidade_forte", type: "boolean", default: false })
  duplicidadeForte: boolean;

  @Column({ name: "duplicidade_provavel", type: "boolean", default: false })
  duplicidadeProvavel: boolean;

  @Column({ name: "desarquivamento_id", type: "integer", nullable: true })
  desarquivamentoId: number | null;

  @Column({ name: "arquivo_origem", length: 255, nullable: true })
  arquivoOrigem: string | null;

  @Column({ name: "linha_origem", type: "integer", nullable: true })
  linhaOrigem: number | null;

  @Column({ name: "dados_originais", type: "jsonb", nullable: false })
  dadosOriginais: Record<string, string>;

  @Column({ name: "criado_por_id", type: "integer", nullable: true })
  criadoPorId: number | null;

  @Column({ name: "aprovado_por_id", type: "integer", nullable: true })
  aprovadoPorId: number | null;

  @Column({ name: "importado_em", type: "timestamp", nullable: true })
  importadoEm: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
