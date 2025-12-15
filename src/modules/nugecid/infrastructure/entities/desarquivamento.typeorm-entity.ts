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
  Index,
} from "typeorm";
import { User } from "../../../users/entities/user.entity";
import { StatusDesarquivamentoEnum } from "../../domain/enums/status-desarquivamento.enum";
import { DesarquivamentoCommentTypeOrmEntity } from "./desarquivamento-comment.typeorm-entity";
import { DesarquivamentoAnexoTypeOrmEntity } from "./desarquivamento-anexo.typeorm-entity";

@Entity("desarquivamentos")
@Index(["numeroNicLaudoAuto"])
@Index(["numeroProcesso"])
@Index(["status"])
@Index(["desarquivamentoFisicoDigital"])
@Index(["dataSolicitacao"])
@Index(["criadoPorId"])
@Index(["responsavelId"])
export class DesarquivamentoTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "numero_solicitacao",
    type: "integer",
    nullable: false,
    default: 1,
  })
  numeroSolicitacao: number;

  @Column({
    name: "desarquivamento_fisico_digital",
    type: "varchar",
    nullable: false,
  })
  desarquivamentoFisicoDigital: string;

  @Column({ name: "tipo_desarquivamento", type: "varchar", nullable: true })
  tipoDesarquivamento: string;

  @Column({
    name: "status",
    type: "varchar",
    length: 50,
    default: "SOLICITADO",
  })
  status: string;

  @Column({ name: "nome_completo", length: 255, nullable: false })
  nomeCompleto: string;

  @Column({
    name: "numero_nic_laudo_auto",
    length: 100,
    nullable: false,
  })
  numeroNicLaudoAuto: string;

  @Column({ name: "numero_processo", length: 255, nullable: false })
  numeroProcesso: string;

  @Column({ name: "tipo_documento", length: 100, nullable: false })
  tipoDocumento: string;

  @Column({ name: "data_solicitacao", type: "timestamp", nullable: false })
  dataSolicitacao: Date;

  @Column({
    name: "data_desarquivamento_sag",
    type: "timestamp",
    nullable: true,
  })
  dataDesarquivamentoSAG?: Date;

  @Column({ name: "data_devolucao_setor", type: "timestamp", nullable: true })
  dataDevolucaoSetor?: Date;

  @Column({ name: "setor_demandante", length: 255, nullable: false })
  setorDemandante: string;

  @Column({ name: "servidor_responsavel", length: 255, nullable: false })
  servidorResponsavel: string;

  @Column({ name: "finalidade_desarquivamento", type: "text", nullable: false })
  finalidadeDesarquivamento: string;

  @Column({ name: "solicitacao_prorrogacao", type: "boolean", default: false })
  solicitacaoProrrogacao: boolean;

  @Column({
    name: "solicitacao_prorrogacao_texto",
    type: "text",
    nullable: true,
  })
  solicitacaoProrrogacaoTexto?: string;

  @Column({ name: "dados_adicionais", type: "text", nullable: true })
  dadosAdicionais?: string;

  @Column({ name: "urgente", type: "boolean", nullable: true, default: false })
  urgente?: boolean;

  @Column({ name: "instituto", length: 255, nullable: true })
  instituto?: string;

  @Column({ name: "requerente", length: 255, nullable: true })
  requerente?: string;

  @Column({ name: "created_by", nullable: false })
  criadoPorId: number;

  // Alias para compatibilidade com testes
  get createdBy(): number {
    return this.criadoPorId;
  }

  set createdBy(value: number) {
    this.criadoPorId = value;
  }

  @Column({ name: "responsavel_id", nullable: true })
  responsavelId?: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  // Relacionamentos (lazy loading para performance)
  @ManyToOne(() => User, { lazy: true })
  @JoinColumn({ name: "created_by" })
  criadoPor: Promise<User>;

  @ManyToOne(() => User, { lazy: true })
  @JoinColumn({ name: "responsavel_id" })
  responsavel?: Promise<User>;

  @OneToMany(
    () => DesarquivamentoCommentTypeOrmEntity,
    (comment) => comment.desarquivamento,
    {
      cascade: false,
    },
  )
  comments: DesarquivamentoCommentTypeOrmEntity[];

  @OneToMany(
    () => DesarquivamentoAnexoTypeOrmEntity,
    (anexo) => anexo.desarquivamento,
    {
      cascade: false,
    },
  )
  anexos: DesarquivamentoAnexoTypeOrmEntity[];

  // Métodos auxiliares para conversão
  static fromDomain(domain: any): DesarquivamentoTypeOrmEntity {
    const entity = new DesarquivamentoTypeOrmEntity();

    if (domain.id) {
      entity.id = domain.id.value || domain.id;
    }

    // Mapear tipoDesarquivamento para desarquivamentoFisicoDigital (campo obrigatório no banco)
    entity.desarquivamentoFisicoDigital =
      domain.tipoDesarquivamento ||
      domain.desarquivamentoFisicoDigital ||
      "FISICO";
    entity.tipoDesarquivamento = domain.tipoDesarquivamento;
    entity.status = domain.status.value || domain.status;
    entity.nomeCompleto = domain.nomeCompleto;
    entity.numeroNicLaudoAuto = domain.numeroNicLaudoAuto;
    entity.numeroProcesso = domain.numeroProcesso;
    entity.tipoDocumento = domain.tipoDocumento;
    entity.dataSolicitacao = domain.dataSolicitacao;
    entity.dataDesarquivamentoSAG = domain.dataDesarquivamentoSAG;
    entity.dataDevolucaoSetor = domain.dataDevolucaoSetor;
    entity.setorDemandante = domain.setorDemandante;
    entity.servidorResponsavel = domain.servidorResponsavel;
    entity.finalidadeDesarquivamento = domain.finalidadeDesarquivamento;
    entity.solicitacaoProrrogacao = domain.solicitacaoProrrogacao;
    entity.solicitacaoProrrogacaoTexto = domain.solicitacaoProrrogacaoTexto;
    entity.dadosAdicionais = domain.dadosAdicionais;
    entity.urgente = domain.urgente;
    entity.instituto = domain.instituto;
    entity.requerente = domain.requerente;
    entity.criadoPorId = domain.criadoPorId;
    entity.responsavelId = domain.responsavelId;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.deletedAt = domain.deletedAt;

    return entity;
  }

  toDomain(): any {
    return {
      id: this.id,
      desarquivamentoFisicoDigital: this.desarquivamentoFisicoDigital,
      tipoDesarquivamento:
        this.tipoDesarquivamento || this.desarquivamentoFisicoDigital,
      status: this.status,
      nomeCompleto: this.nomeCompleto,
      numeroNicLaudoAuto: this.numeroNicLaudoAuto,
      numeroProcesso: this.numeroProcesso,
      tipoDocumento: this.tipoDocumento,
      dataSolicitacao: this.dataSolicitacao,
      dataDesarquivamentoSAG: this.dataDesarquivamentoSAG,
      dataDevolucaoSetor: this.dataDevolucaoSetor,
      setorDemandante: this.setorDemandante,
      servidorResponsavel: this.servidorResponsavel,
      finalidadeDesarquivamento: this.finalidadeDesarquivamento,
      solicitacaoProrrogacao: this.solicitacaoProrrogacao,
      solicitacaoProrrogacaoTexto: this.solicitacaoProrrogacaoTexto,
      dadosAdicionais: this.dadosAdicionais,
      urgente: this.urgente,
      instituto: this.instituto,
      requerente: this.requerente,
      criadoPorId: this.criadoPorId,
      responsavelId: this.responsavelId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
