import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";

@Entity("notification_preferences")
export class NotificationPreferences {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  // Canais de notificação
  @Column({ name: "in_app_enabled", type: "boolean", default: true })
  inAppEnabled: boolean;

  @Column({ name: "sound_enabled", type: "boolean", default: true })
  soundEnabled: boolean;

  // Tipos de notificação habilitados (usando JSONB para flexibilidade)
  @Column({
    name: "enabled_types",
    type: "jsonb",
    default: {
      solicitacao_pendente: true,
      novo_processo: true,
      novo_desarquivamento: true,
      mencao: true,
      tarefa_atribuida: true,
      tarefa_alterada: true,
      tarefa_comentada: true,
      prazo_proximo: true,
      tarefa_atrasada: true,
      projeto_atualizado: true,
      novo_registro: true,
      pasta_criada: true,
      evento_auditoria: false,
    },
  })
  enabledTypes: Record<string, boolean>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Métodos utilitários
  isTypeEnabled(type: string): boolean {
    return this.enabledTypes[type] ?? false;
  }

  enableType(type: string): void {
    this.enabledTypes[type] = true;
  }

  disableType(type: string): void {
    this.enabledTypes[type] = false;
  }

  canReceiveNotification(type: string, channel: "in_app"): boolean {
    const typeEnabled = this.isTypeEnabled(type);

    if (channel === "in_app") {
      return this.inAppEnabled && typeEnabled;
    }

    return false;
  }
}
