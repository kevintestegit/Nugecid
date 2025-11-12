// src/modules/registros/entities/registro.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("registros")
export class Registro {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  numero_processo: string;

  @Column({ type: "varchar", length: 255 })
  delegacia_origem: string;

  @Column({ type: "varchar", length: 255 })
  nome_vitima: string;

  @Column({ type: "date" })
  data_fato: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  investigador_responsavel?: string;

  @Column({ type: "integer", nullable: true })
  idade_vitima?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
