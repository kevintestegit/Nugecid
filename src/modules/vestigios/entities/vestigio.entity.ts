import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("vestigios")
export class Vestigio {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "codigo_scv", type: "varchar", length: 100 })
  codigoScv: string;

  @Column({ name: "classe_principal", type: "varchar", length: 50 })
  classePrincipal: string;

  @Column({ name: "grupo_codigo", type: "varchar", length: 50, nullable: true })
  grupoCodigo: string;

  @Column({
    name: "subdivisao_codigo",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  subdivisaoCodigo: string;

  @Column({ name: "facetas", type: "jsonb", nullable: true })
  facetas: string[];

  @Column({ name: "facetas_descricoes", type: "jsonb", nullable: true })
  facetasDescricoes: Record<string, string>;

  @Column({
    name: "numero_vestigio",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  numeroVestigio: string;

  @Column({ name: "numero_caso", type: "varchar", length: 50, nullable: true })
  numeroCaso: string;

  @Column({ name: "categoria", type: "varchar", length: 100, nullable: true })
  categoria: string;

  @Column({ name: "delegacia", type: "varchar", length: 200, nullable: true })
  delegacia: string;

  @Column({
    name: "mes_referencia",
    type: "varchar",
    length: 10,
    nullable: true,
  })
  mesReferencia: string;

  @Column({ name: "etiqueta_completa", type: "text" })
  etiquetaCompleta: string;

  @Column({
    name: "classe_catalogacao",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  classeCatalogacao: string;

  @Column({
    name: "subclasse_catalogacao",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  subclasseCatalogacao: string;

  @Column({
    name: "tipo_catalogacao",
    type: "varchar",
    length: 150,
    nullable: true,
  })
  tipoCatalogacao: string;

  @Column({
    name: "schema_versao",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  schemaVersao: string;

  @Column({ name: "metadados_gerais", type: "jsonb", nullable: true })
  metadadosGerais: Record<string, unknown>;

  @Column({ name: "metadados_especificos", type: "jsonb", nullable: true })
  metadadosEspecificos: Record<string, unknown>;

  @Column({
    name: "status",
    type: "varchar",
    length: 50,
    default: "'catalogacao_pendente'",
  })
  status: string;

  @Column({ name: "observacoes", type: "text", nullable: true })
  observacoes: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "criado_por_id" })
  criadoPor: User;

  @Column({ name: "criado_por_id", type: "integer", nullable: true })
  criadoPorId: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
