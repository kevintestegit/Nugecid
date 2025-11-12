import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Tarefa } from "./tarefa.entity";

@Entity("historico_tarefas")
export class HistoricoTarefa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tarefa_id", nullable: false })
  tarefaId: number;

  @ManyToOne(() => Tarefa, (tarefa) => tarefa.historico, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tarefa_id" })
  tarefa: Tarefa;

  @Column({ name: "usuario_id", nullable: false })
  usuarioId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "usuario_id" })
  usuario: User;

  @Column({
    type: "varchar",
    length: 50,
    nullable: false,
  })
  acao: string;

  @Column({
    name: "campo_alterado",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  campoAlterado: string;

  @Column({ name: "valor_anterior", type: "text", nullable: true })
  valorAnterior: string;

  @Column({ name: "valor_novo", type: "text", nullable: true })
  valorNovo: string;

  @CreateDateColumn({ name: "data_acao" })
  dataAcao: Date;

  // Métodos
  getAcaoLabel(): string {
    switch (this.acao) {
      case "criacao":
        return "criou a tarefa";
      case "edicao":
        return "editou a tarefa";
      case "movimentacao":
        return "moveu a tarefa";
      case "atribuicao":
        return "atribuiu a tarefa";
      case "prazo_alterado":
        return "alterou o prazo";
      case "prioridade_alterada":
        return "alterou a prioridade";
      case "comentario_adicionado":
        return "adicionou um comentário";
      case "anexo_adicionado":
        return "adicionou um anexo";
      case "checklist_adicionado":
        return "adicionou uma checklist";
      case "item_checklist_concluido":
        return "concluiu um item da checklist";
      case "tag_adicionada":
        return "adicionou uma tag";
      case "tag_removida":
        return "removeu uma tag";
      case "comentario":
        return "comentou na tarefa";
      case "exclusao":
        return "excluiu a tarefa";
      default:
        return "realizou uma ação";
    }
  }

  getTimeAgo(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.dataAcao.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return this.dataAcao.toLocaleDateString("pt-BR");
  }

  getFormattedDescription(): string {
    // Gerar descrição baseada nos dados
    if (this.campoAlterado && this.valorAnterior && this.valorNovo) {
      return `${this.campoAlterado}: de "${this.valorAnterior}" para "${this.valorNovo}"`;
    }
    if (this.campoAlterado && this.valorNovo) {
      return `${this.campoAlterado}: ${this.valorNovo}`;
    }
    return "";
  }

  static createHistorico(
    tarefaId: number,
    usuarioId: number,
    acao: string,
    campoAlterado?: string,
    valorAnterior?: string,
    valorNovo?: string,
  ): Partial<HistoricoTarefa> {
    return {
      tarefaId,
      usuarioId,
      acao,
      campoAlterado,
      valorAnterior,
      valorNovo,
    };
  }
}
