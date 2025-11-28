import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude } from "class-transformer";

import { User } from "../../users/entities/user.entity";
import { RoleType } from "../../users/enums/role-type.enum";

// Enums imports
import { StatusDesarquivamentoEnum } from "../domain/enums/status-desarquivamento.enum";
import { TipoDesarquivamentoEnum } from "../domain/enums/tipo-desarquivamento.enum";

@Entity("desarquivamentos")
@Index(["numeroNicLaudoAuto"])
@Index(["numeroExtraido"])
@Index(["numeroProcesso"])
@Index(["status"])
@Index(["desarquivamentoFisicoDigital"])
@Index(["dataSolicitacao"])
@Index(["createdBy"])
export class Desarquivamento {
  @ApiProperty({
    description: "ID único do desarquivamento",
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: "Número sequencial da solicitação",
    example: 1,
  })
  @Column({
    name: "numero_solicitacao",
    type: "integer",
    nullable: false,
    unique: true,
  })
  numeroSolicitacao: number;

  @ApiProperty({
    description: "Desarquivamento Físico/Digital ou não localizado",
    example: "FISICO",
    enum: TipoDesarquivamentoEnum,
  })
  @Column({
    name: "desarquivamento_fisico_digital",
    type: "enum",
    enum: TipoDesarquivamentoEnum,
    nullable: false,
  })
  desarquivamentoFisicoDigital: TipoDesarquivamentoEnum;

  @ApiProperty({
    description: "Status atual da solicitação",
    enum: StatusDesarquivamentoEnum,
    example: StatusDesarquivamentoEnum.SOLICITADO,
  })
  @Column({
    type: "enum",
    enum: StatusDesarquivamentoEnum,
    default: StatusDesarquivamentoEnum.SOLICITADO,
  })
  status: StatusDesarquivamentoEnum;

  @ApiProperty({
    description: "Nome completo do solicitante",
    example: "João Silva Santos",
  })
  @Column({ name: "nome_completo", length: 255, nullable: false })
  nomeCompleto: string;

  @ApiProperty({
    description: "Número do NIC/LAUDO/AUTO/INFORMAÇÃO TÉCNICA",
    example: "BIC Nº 146.040 - João Silva",
  })
  @Column({
    name: "numero_nic_laudo_auto",
    length: 500,
    nullable: false,
  })
  numeroNicLaudoAuto: string;

  @ApiProperty({
    description:
      "Número extraído automaticamente do NIC/LAUDO/AUTO (4+ dígitos)",
    example: "146040",
  })
  @Column({
    name: "numero_extraido",
    length: 50,
    nullable: true,
  })
  numeroExtraido?: string;

  @ApiPropertyOptional({
    description: "Número do processo",
    example: "2024.001.123456",
  })
  @Column({ name: "numero_processo", length: 255, nullable: true })
  numeroProcesso?: string;

  @ApiProperty({
    description: "Tipo do documento",
    example: "Laudo Pericial",
  })
  @Column({ name: "tipo_documento", length: 100, nullable: false })
  tipoDocumento: string;

  @ApiProperty({
    description: "Data de solicitação",
    example: "2024-01-15T08:30:00Z",
  })
  @Column({ name: "data_solicitacao", type: "timestamp", nullable: false })
  dataSolicitacao: Date;

  @ApiPropertyOptional({
    description: "Data do desarquivamento - SAG",
    example: "2024-02-10T14:30:00Z",
    type: "string",
    format: "date-time",
  })
  @Column({
    name: "data_desarquivamento_sag",
    type: "timestamp",
    nullable: true,
  })
  dataDesarquivamentoSAG?: Date;

  @ApiPropertyOptional({
    description: "Data da devolução pelo setor",
    example: "2024-02-15T10:00:00Z",
    type: "string",
    format: "date-time",
  })
  @Column({ name: "data_devolucao_setor", type: "timestamp", nullable: true })
  dataDevolucaoSetor?: Date;

  @ApiPropertyOptional({
    description: "Setor demandante",
    example: "Perícia Criminal",
  })
  @Column({ name: "setor_demandante", length: 255, nullable: true })
  setorDemandante?: string;

  @ApiProperty({
    description: "Servidor do ITEP responsável (matrícula)",
    example: "12345",
  })
  @Column({ name: "servidor_responsavel", length: 255, nullable: false })
  servidorResponsavel: string;

  @ApiProperty({
    description: "Finalidade do desarquivamento",
    example: "Processo judicial em andamento",
  })
  @Column({ name: "finalidade_desarquivamento", type: "text", nullable: false })
  finalidadeDesarquivamento: string;

  @ApiProperty({
    description: "Solicitação de prorrogação de prazo",
    example: false,
  })
  @Column({ name: "solicitacao_prorrogacao", type: "boolean", default: false })
  solicitacaoProrrogacao: boolean;

  @ApiPropertyOptional({
    description: "Indica se a solicitação é urgente",
    example: false,
  })
  @Column({ name: "urgente", type: "boolean", nullable: true, default: false })
  urgente?: boolean;

  @ApiPropertyOptional({
    description: "ID do usuário responsável pelo atendimento",
    example: 2,
  })
  @Column({ name: "responsavel_id", nullable: true })
  responsavelId?: number;

  @ApiProperty({
    description: "ID do usuário que criou o registro",
    example: 1,
  })
  @Column({ name: "created_by", nullable: false })
  createdBy: number;

  // Alias para compatibilidade
  get criadoPorId(): number {
    return this.createdBy;
  }

  set criadoPorId(value: number) {
    this.createdBy = value;
  }

  @ApiProperty({
    description: "Data de criação do registro",
    example: "2024-01-15T08:30:00Z",
  })
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ApiProperty({
    description: "Data da última atualização",
    example: "2024-01-15T10:45:00Z",
  })
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: "Data de exclusão (soft delete)",
    example: null,
  })
  @DeleteDateColumn({ name: "deleted_at" })
  @Exclude()
  deletedAt?: Date;

  // Relacionamentos
  @ApiProperty({
    description: "Usuário solicitante",
    type: () => User,
  })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "created_by" })
  criadoPor: User;

  @ApiPropertyOptional({
    description: "Usuário responsável pelo atendimento",
    type: () => User,
  })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "responsavel_id" })
  responsavel?: User;

  // Hooks
  @BeforeInsert()
  setDefaultValues() {
    // Extrai número automaticamente do campo numeroNicLaudoAuto
    this.numeroExtraido = this.extractMainNumber(this.numeroNicLaudoAuto);
  }

  @BeforeUpdate()
  updateTimestamp() {
    // Extrai número automaticamente se o campo foi alterado
    this.numeroExtraido = this.extractMainNumber(this.numeroNicLaudoAuto);
  }

  /**
   * Extrai o número principal (4+ dígitos consecutivos) do campo numeroNicLaudoAuto
   * Exemplo: "BIC Nº 146.040" -> "146040"
   * Exemplo: "NIC-2024-12345" -> "12345"
   */
  private extractMainNumber(value: string): string | null {
    if (!value) return null;

    // Remove pontos, vírgulas, traços e espaços para facilitar busca
    const cleaned = value.replace(/[.,\-\s]/g, "");

    // Busca por sequências de 4 ou mais dígitos
    const match = cleaned.match(/\d{4,}/);

    return match ? match[0] : null;
  }

  /**
   * Verifica se a solicitação está finalizada
   */
  isFinalized(): boolean {
    return this.status === StatusDesarquivamentoEnum.FINALIZADO;
  }

  /**
   * Verifica se o usuário pode acessar esta solicitação
   */
  canBeAccessedBy(user: User): boolean {
    // Administradores podem acessar tudo
    if (user.role?.name === RoleType.ADMIN) {
      return true;
    }

    // Usuários podem acessar suas próprias solicitações
    if (this.criadoPor.id === user.id) return true;

    // Responsáveis podem acessar solicitações atribuídas a eles
    if (this.responsavelId === user.id) return true;

    return false;
  }

  /**
   * Verifica se o usuário pode editar esta solicitação
   */
  canBeEditedBy(user: User): boolean {
    // Administradores podem editar tudo
    if (user.role?.name === RoleType.ADMIN) {
      return true;
    }

    // Solicitações finalizadas não podem ser editadas
    if (this.status === StatusDesarquivamentoEnum.FINALIZADO) {
      return false;
    }

    // Criador pode editar se ainda estiver solicitado
    if (
      this.criadoPor.id === user.id &&
      this.status === StatusDesarquivamentoEnum.SOLICITADO
    ) {
      return true;
    }

    // Responsável pode editar se estiver desarquivado
    if (
      this.responsavelId === user.id &&
      this.status === StatusDesarquivamentoEnum.DESARQUIVADO
    ) {
      return true;
    }

    return false;
  }

  canBeDeletedBy(user: User): boolean {
    return user.isAdmin() || user.id === this.criadoPor.id;
  }

  /**
   * Retorna a descrição amigável do status
   */
  getStatusDisplay(): string {
    const statusMap = {
      [StatusDesarquivamentoEnum.FINALIZADO]: "Finalizado",
      [StatusDesarquivamentoEnum.DESARQUIVADO]: "Desarquivado",
      [StatusDesarquivamentoEnum.NAO_COLETADO]: "Não Coletado",
      [StatusDesarquivamentoEnum.SOLICITADO]: "Solicitado",
      [StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO]:
        "Rearquivamento Solicitado",
      [StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR]: "Retirado pelo Setor",
      [StatusDesarquivamentoEnum.NAO_LOCALIZADO]: "Não Localizado",
    };

    return statusMap[this.status] || this.status;
  }

  getStatusColor(): string {
    const colors = {
      [StatusDesarquivamentoEnum.FINALIZADO]: "success",
      [StatusDesarquivamentoEnum.DESARQUIVADO]: "info",
      [StatusDesarquivamentoEnum.NAO_COLETADO]: "warning",
      [StatusDesarquivamentoEnum.SOLICITADO]: "primary",
      [StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO]: "secondary",
      [StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR]: "info",
      [StatusDesarquivamentoEnum.NAO_LOCALIZADO]: "danger",
    };
    return colors[this.status] || "secondary";
  }

  getStatusLabel(): string {
    return this.getStatusDisplay();
  }

  /**
   * Verifica se é possível transicionar para um novo status
   */
  canTransitionTo(newStatus: StatusDesarquivamentoEnum): boolean {
    const transitions = {
      [StatusDesarquivamentoEnum.SOLICITADO]: [
        StatusDesarquivamentoEnum.DESARQUIVADO,
        StatusDesarquivamentoEnum.NAO_LOCALIZADO,
      ],
      [StatusDesarquivamentoEnum.DESARQUIVADO]: [
        StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR,
        StatusDesarquivamentoEnum.NAO_COLETADO,
        StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
      ],
      [StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR]: [
        StatusDesarquivamentoEnum.FINALIZADO,
      ],
      [StatusDesarquivamentoEnum.NAO_COLETADO]: [
        StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
      ],
      [StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO]: [
        StatusDesarquivamentoEnum.FINALIZADO,
      ],
      [StatusDesarquivamentoEnum.NAO_LOCALIZADO]: [],
      [StatusDesarquivamentoEnum.FINALIZADO]: [],
    };

    return transitions[this.status]?.includes(newStatus) || false;
  }

  /**
   * Retorna a prioridade baseada na urgência
   */
  getPriority(): "ALTA" | "MEDIA" | "BAIXA" {
    if (this.urgente) return "ALTA";
    return "MEDIA";
  }
}
