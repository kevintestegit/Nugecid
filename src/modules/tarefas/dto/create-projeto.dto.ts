import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProjetoDto {
  @ApiProperty({
    description: "Nome do projeto",
    example: "Sistema de Gestão de Tarefas",
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: "O nome deve ser uma string" })
  @MinLength(3, { message: "O nome deve ter pelo menos 3 caracteres" })
  @MaxLength(255, { message: "O nome deve ter no máximo 255 caracteres" })
  nome: string;

  @ApiPropertyOptional({
    description: "Descrição detalhada do projeto",
    example: "Sistema para gerenciar tarefas e projetos da equipe",
  })
  @IsOptional()
  @IsString({ message: "A descrição deve ser uma string" })
  descricao?: string;
}
