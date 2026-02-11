import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsArray,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { PrioridadeTarefa } from "../entities/tarefa.entity";

export enum FiltroPrazo {
  ATRASADAS = "atrasadas",
  HOJE = "hoje",
  SEMANA = "semana",
  MES = "mes",
  SEM_PRAZO = "sem_prazo",
}

export enum AgruparPor {
  RESPONSAVEL = "responsavel",
  PRIORIDADE = "prioridade",
  PRAZO = "prazo",
  TAGS = "tags",
}

export class FiltrosTarefasDto {
  @ApiPropertyOptional({
    description: "ID do projeto",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  projetoId?: number;

  @ApiPropertyOptional({
    description: "ID do responsável",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  responsavelId?: number;

  @ApiPropertyOptional({
    description: "Prioridade da tarefa",
    enum: PrioridadeTarefa,
    example: PrioridadeTarefa.ALTA,
  })
  @IsOptional()
  @IsEnum(PrioridadeTarefa)
  prioridade?: PrioridadeTarefa;

  @ApiPropertyOptional({
    description: "Tags da tarefa",
    type: [String],
    example: ["bug", "urgent"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((t) => t.trim());
    }
    return value;
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Filtro de prazo",
    enum: FiltroPrazo,
    example: FiltroPrazo.SEMANA,
  })
  @IsOptional()
  @IsEnum(FiltroPrazo)
  prazo?: FiltroPrazo;

  @ApiPropertyOptional({
    description: "Termo de busca (titulo ou descricao)",
    example: "implementar",
  })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional({
    description: "Agrupar tarefas por",
    enum: AgruparPor,
    example: AgruparPor.PRIORIDADE,
  })
  @IsOptional()
  @IsEnum(AgruparPor)
  agruparPor?: AgruparPor;

  @ApiPropertyOptional({
    description: "Apenas tarefas com comentários",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  comComentarios?: boolean;

  @ApiPropertyOptional({
    description: "Apenas tarefas com anexos",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  comAnexos?: boolean;
}
