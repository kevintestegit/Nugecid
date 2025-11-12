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

@Entity("anexos")
export class Anexo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tarefa_id", nullable: false })
  tarefaId: number;

  @ManyToOne(() => Tarefa, (tarefa) => tarefa.anexos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tarefa_id" })
  tarefa: Tarefa;

  @Column({ name: "usuario_id", nullable: false })
  usuarioId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "usuario_id" })
  usuario: User;

  @Column({ name: "nome_original", length: 255, nullable: false })
  nomeOriginal: string;

  @Column({ name: "nome_arquivo", length: 255, nullable: false })
  nomeArquivo: string;

  @Column({ name: "caminho_arquivo", length: 500, nullable: false })
  caminhoArquivo: string;

  @Column({ name: "tipo_mime", length: 100, nullable: false })
  tipoMime: string;

  @Column({ name: "tamanho_bytes", type: "bigint", nullable: false })
  tamanhoBytes: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Métodos
  isImage(): boolean {
    return this.tipoMime.startsWith("image/");
  }

  isDocument(): boolean {
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];
    return documentTypes.includes(this.tipoMime);
  }

  isVideo(): boolean {
    return this.tipoMime.startsWith("video/");
  }

  isAudio(): boolean {
    return this.tipoMime.startsWith("audio/");
  }

  getFileExtension(): string {
    const parts = this.nomeOriginal.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }

  getFormattedSize(): string {
    const bytes = Number(this.tamanhoBytes);
    const sizes = ["Bytes", "KB", "MB", "GB"];

    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);

    return `${Math.round(size * 100) / 100} ${sizes[i]}`;
  }

  getFileIcon(): string {
    if (this.isImage()) return "🖼️";
    if (this.isDocument()) return "📄";
    if (this.isVideo()) return "🎥";
    if (this.isAudio()) return "🎵";

    const ext = this.getFileExtension();
    switch (ext) {
      case "zip":
      case "rar":
      case "7z":
        return "📦";
      case "exe":
      case "msi":
        return "⚙️";
      default:
        return "📎";
    }
  }

  canPreview(): boolean {
    return this.isImage() || this.tipoMime === "application/pdf";
  }

  isOwner(userId: number): boolean {
    return this.usuarioId === userId;
  }
}
