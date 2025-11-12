import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Tarefa } from "../../tarefas/entities/tarefa.entity";

export enum TipoNotificacao {
  SOLICITACAO_PENDENTE = "solicitacao_pendente",
  NOVO_PROCESSO = "novo_processo",
  NOVO_DESARQUIVAMENTO = "novo_desarquivamento",
  MENCAO = "mencao",
  TAREFA_ATRIBUIDA = "tarefa_atribuida",
  TAREFA_ALTERADA = "tarefa_alterada",
  TAREFA_COMENTADA = "tarefa_comentada",
  PRAZO_PROXIMO = "prazo_proximo",
  TAREFA_ATRASADA = "tarefa_atrasada",
  PROJETO_ATUALIZADO = "projeto_atualizado",
  NOVO_REGISTRO = "novo_registro",
  PASTA_CRIADA = "pasta_criada",
  EVENTO_AUDITORIA = "evento_auditoria",
}

export enum PrioridadeNotificacao {
  BAIXA = "baixa",
  MEDIA = "media",
  ALTA = "alta",
  CRITICA = "critica",
}

@Entity("notificacoes")
@Index(["usuarioId", "lida"])
@Index(["tipo", "createdAt"])
export class Notificacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: TipoNotificacao,
    nullable: false,
  })
  tipo: TipoNotificacao;

  @Column({ length: 255, nullable: false })
  titulo: string;

  @Column({ type: "text", nullable: false })
  descricao: string;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Dados específicos como dias pendentes, número do processo, etc.",
  })
  detalhes: Record<string, any>;

  @Column({ type: "boolean", default: false })
  lida: boolean;

  @Column({
    type: "enum",
    enum: PrioridadeNotificacao,
    default: PrioridadeNotificacao.MEDIA,
  })
  prioridade: PrioridadeNotificacao;

  @Column({ name: "usuario_id", nullable: false })
  usuarioId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "usuario_id" })
  usuario: User;

  // Relacionamentos opcionais
  @Column({ name: "solicitacao_id", nullable: true })
  solicitacaoId: number;

  @ManyToOne(() => Tarefa, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "solicitacao_id" })
  solicitacao: Tarefa;

  @Column({ name: "processo_id", nullable: true })
  processoId: number;

  @Column({ name: "tarefa_id", nullable: true })
  tarefaId: number;

  @ManyToOne(() => Tarefa, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "tarefa_id" })
  tarefa: Tarefa;

  @Column({ name: "projeto_id", nullable: true })
  projetoId: number;

  @Column({ name: "remetente_id", nullable: true })
  remetenteId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "remetente_id" })
  remetente: User;

  @Column({ type: "text", nullable: true })
  link: string;

  // Campos de auditoria
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  // Métodos utilitários
  marcarComoLida(): void {
    this.lida = true;
  }

  marcarComoNaoLida(): void {
    this.lida = false;
  }

  isLida(): boolean {
    return this.lida;
  }

  isPendente(): boolean {
    return !this.lida;
  }

  getDiasDesdeCreacao(): number {
    const hoje = new Date();
    const criacao = new Date(this.createdAt);
    const diffTime = hoje.getTime() - criacao.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getPrioridadeCor(): string {
    switch (this.prioridade) {
      case PrioridadeNotificacao.CRITICA:
        return "#DC2626"; // red-600
      case PrioridadeNotificacao.ALTA:
        return "#EA580C"; // orange-600
      case PrioridadeNotificacao.MEDIA:
        return "#CA8A04"; // yellow-600
      case PrioridadeNotificacao.BAIXA:
        return "#16A34A"; // green-600
      default:
        return "#6B7280"; // gray-500
    }
  }

  getIconePorTipo(): string {
    switch (this.tipo) {
      case TipoNotificacao.SOLICITACAO_PENDENTE:
        return "⏰";
      case TipoNotificacao.NOVO_PROCESSO:
        return "📋";
      case TipoNotificacao.MENCAO:
        return "@";
      case TipoNotificacao.TAREFA_ATRIBUIDA:
        return "✅";
      case TipoNotificacao.TAREFA_ALTERADA:
        return "✏️";
      case TipoNotificacao.TAREFA_COMENTADA:
        return "💬";
      case TipoNotificacao.PRAZO_PROXIMO:
        return "⚠️";
      case TipoNotificacao.TAREFA_ATRASADA:
        return "🔴";
      case TipoNotificacao.PROJETO_ATUALIZADO:
        return "📁";
      default:
        return "🔔";
    }
  }
}
