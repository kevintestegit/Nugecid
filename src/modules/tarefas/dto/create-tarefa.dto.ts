import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  IsArray,
  MaxLength,
  MinLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { PrioridadeTarefa } from "../entities/tarefa.entity";

export class CreateTarefaDto {
  @ApiProperty({
    description: "ID do projeto ao qual a tarefa pertence",
    example: 1,
  })
  @IsInt({ message: "O ID do projeto deve ser um número inteiro" })
  @Min(1, { message: "O ID do projeto deve ser maior que 0" })
  projetoId: number;

  @ApiProperty({
    description: "ID da coluna onde a tarefa será criada",
    example: 1,
  })
  @IsInt({ message: "O ID da coluna deve ser um número inteiro" })
  @Min(1, { message: "O ID da coluna deve ser maior que 0" })
  colunaId: number;

  @ApiProperty({
    description: "Título da tarefa",
    example: "Implementar autenticação de usuários",
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: "O título deve ser uma string" })
  @MinLength(3, { message: "O título deve ter pelo menos 3 caracteres" })
  @MaxLength(255, { message: "O título deve ter no máximo 255 caracteres" })
  titulo: string;

  @ApiPropertyOptional({
    description: "Descrição detalhada da tarefa",
    example: "Implementar sistema de login e registro com JWT",
  })
  @IsOptional()
  @IsString({ message: "A descrição deve ser uma string" })
  descricao?: string;

  @ApiPropertyOptional({
    description: "ID do usuário responsável pela tarefa",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt({ message: "O ID do responsável deve ser um número inteiro" })
  @Min(1, { message: "O ID do responsável deve ser maior que 0" })
  responsavelId?: number;

  @ApiPropertyOptional({
    description: "IDs dos usuários responsáveis pela tarefa",
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: "Os responsáveis devem ser uma lista de IDs" })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((item) => Number(item));
    }
    return value ? [Number(value)] : undefined;
  })
  @IsInt({ each: true, message: "Cada responsável deve ser um número inteiro" })
  @Min(1, { each: true, message: "Cada responsável deve ser maior que 0" })
  responsavelIds?: number[];

  @ApiPropertyOptional({
    description: "Data limite para conclusão da tarefa",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "O prazo deve ser uma data válida no formato YYYY-MM-DD" },
  )
  prazo?: string;

  @ApiPropertyOptional({
    description: "Prioridade da tarefa",
    enum: PrioridadeTarefa,
    example: PrioridadeTarefa.MEDIA,
    default: PrioridadeTarefa.MEDIA,
  })
  @IsOptional()
  @IsEnum(PrioridadeTarefa, {
    message: "A prioridade deve ser: baixa, media, alta ou critica",
  })
  prioridade?: PrioridadeTarefa = PrioridadeTarefa.MEDIA;

  @ApiPropertyOptional({
    description: "Ordem da tarefa na coluna",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt({ message: "A ordem deve ser um número inteiro" })
  @Min(1, { message: "A ordem deve ser maior que 0" })
  ordem?: number;

  @ApiPropertyOptional({
    description: "Tags associadas à tarefa",
    example: ["frontend", "urgente"],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: "As tags devem ser um array" })
  @IsString({ each: true, message: "Cada tag deve ser uma string" })
  tags?: string[];

  @ApiPropertyOptional({
    description: "ID da tarefa pai (para subtarefas)",
    example: 10,
  })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
