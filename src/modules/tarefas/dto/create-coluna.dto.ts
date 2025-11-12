import {
  IsString,
  IsOptional,
  IsInt,
  IsHexColor,
  MaxLength,
  MinLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateColunaDto {
  @ApiProperty({
    description: "ID do projeto ao qual a coluna pertence",
    example: 1,
  })
  @IsInt({ message: "O ID do projeto deve ser um número inteiro" })
  @Min(1, { message: "O ID do projeto deve ser maior que 0" })
  projetoId: number;

  @ApiProperty({
    description: "Nome da coluna",
    example: "A Fazer",
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: "O nome deve ser uma string" })
  @MinLength(1, { message: "O nome deve ter pelo menos 1 caractere" })
  @MaxLength(100, { message: "O nome deve ter no máximo 100 caracteres" })
  nome: string;

  @ApiPropertyOptional({
    description: "Cor da coluna em formato hexadecimal",
    example: "#3B82F6",
    default: "#3B82F6",
  })
  @IsOptional()
  @IsString({ message: "A cor deve ser uma string" })
  @IsHexColor({ message: "A cor deve estar em formato hexadecimal válido" })
  cor?: string = "#3B82F6";

  @ApiPropertyOptional({
    description: "Ordem da coluna no projeto",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: "A ordem deve ser um número inteiro" })
  @Min(1, { message: "A ordem deve ser maior que 0" })
  ordem?: number;

  @ApiPropertyOptional({
    description: "Limite WIP (Work In Progress) para a coluna",
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: "O limite WIP deve ser um número inteiro" })
  @Min(1, { message: "O limite WIP deve ser maior que 0" })
  wipLimit?: number;
}
