import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsArray,
  IsIn,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { PrioridadeTarefa } from "../entities/tarefa.entity";

export enum StatusTarefa {
  PENDENTE = "pendente",
  EM_ANDAMENTO = "em_andamento",
  CONCLUIDA = "concluida",
  CANCELADA = "cancelada",
}

export class QueryTarefaDto {
  @ApiPropertyOptional({
    description: "ID do projeto para filtrar tarefas",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt({ message: "O ID do projeto deve ser um número inteiro" })
  @Min(1, { message: "O ID do projeto deve ser maior que 0" })
  projeto_id?: number;

  @ApiPropertyOptional({
    description: "ID da coluna para filtrar tarefas",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt({ message: "O ID da coluna deve ser um número inteiro" })
  @Min(1, { message: "O ID da coluna deve ser maior que 0" })
  colunaId?: number;

  @ApiPropertyOptional({
    description: "ID do responsável para filtrar tarefas",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt({ message: "O ID do responsável deve ser um número inteiro" })
  @Min(1, { message: "O ID do responsável deve ser maior que 0" })
  responsavelId?: number;

  @ApiPropertyOptional({
    description: "Status da tarefa para filtrar",
    enum: StatusTarefa,
    example: StatusTarefa.PENDENTE,
  })
  @IsOptional()
  @IsEnum(StatusTarefa, {
    message: "Status deve ser: pendente, em_andamento, concluida ou cancelada",
  })
  status?: StatusTarefa;

  @ApiPropertyOptional({
    description: "Prioridade da tarefa para filtrar",
    enum: PrioridadeTarefa,
    example: PrioridadeTarefa.ALTA,
  })
  @IsOptional()
  @IsEnum(PrioridadeTarefa, {
    message: "Prioridade deve ser: baixa, media, alta ou critica",
  })
  prioridade?: PrioridadeTarefa;

  @ApiPropertyOptional({
    description: "Termo de busca para título e descrição",
    example: "implementar",
  })
  @IsOptional()
  @IsString({ message: "O termo de busca deve ser uma string" })
  search?: string;

  @ApiPropertyOptional({
    description: "Tags para filtrar (array de strings)",
    example: ["frontend", "urgente"],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "As tags devem ser um array" })
  @IsString({ each: true, message: "Cada tag deve ser uma string" })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Data de início para filtrar por prazo",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        "A data de início deve ser uma data válida no formato YYYY-MM-DD",
    },
  )
  dataInicio?: string;

  @ApiPropertyOptional({
    description: "Data de fim para filtrar por prazo",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "A data de fim deve ser uma data válida no formato YYYY-MM-DD" },
  )
  dataFim?: string;

  @ApiPropertyOptional({
    description: "Filtrar apenas tarefas em atraso",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  atrasadas?: boolean;

  @ApiPropertyOptional({
    description: "Página para paginação",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  @IsInt({ message: "A página deve ser um número inteiro" })
  @Min(1, { message: "A página deve ser maior que 0" })
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Limite de itens por página",
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  @IsInt({ message: "O limite deve ser um número inteiro" })
  @Min(1, { message: "O limite deve ser maior que 0" })
  @Max(100, { message: "O limite deve ser menor ou igual a 100" })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Campo para ordenação",
    example: "createdAt",
    enum: [
      "id",
      "titulo",
      "descricao",
      "prioridade",
      "prazo",
      "updatedAt",
      "ordem",
      "coluna",
      "projeto",
      "responsavel",
      "createdAt",
      "criadoEm",
      "atualizadoEm",
    ],
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString({ message: "O campo de ordenação deve ser uma string" })
  @IsIn(
    [
      "id",
      "titulo",
      "descricao",
      "prioridade",
      "prazo",
      "updatedAt",
      "ordem",
      "coluna",
      "projeto",
      "responsavel",
      "createdAt",
      "criadoEm",
      "atualizadoEm",
    ],
    {
      message: "Campo de ordenação inválido",
    },
  )
  sortBy?: string = "criadoEm";

  @ApiPropertyOptional({
    description: "Direção da ordenação",
    example: "DESC",
    enum: ["ASC", "DESC"],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: "A direção deve ser uma string" })
  @IsIn(["ASC", "DESC"], {
    message: "A direção deve ser ASC ou DESC",
  })
  sortOrder?: "ASC" | "DESC" = "DESC";
}
