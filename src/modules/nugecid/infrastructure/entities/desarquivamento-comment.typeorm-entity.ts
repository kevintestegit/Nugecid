import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";

import { DesarquivamentoTypeOrmEntity } from "./desarquivamento.typeorm-entity";
import { User } from "../../../users/entities/user.entity";

@Entity("desarquivamento_comments")
@Index(["desarquivamentoId"])
@Index(["userId"])
export class DesarquivamentoCommentTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "desarquivamento_id", nullable: false })
  desarquivamentoId: number;

  @Column({ name: "user_id", nullable: true })
  userId?: number | null;

  @Column({ name: "author_name", length: 255, nullable: false })
  authorName: string;

  @Column({ type: "text", nullable: false })
  comment: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(
    () => DesarquivamentoTypeOrmEntity,
    (desarquivamento) => desarquivamento.comments,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "desarquivamento_id" })
  desarquivamento: DesarquivamentoTypeOrmEntity;

  @ManyToOne(() => User, { eager: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user?: User | null;
}
