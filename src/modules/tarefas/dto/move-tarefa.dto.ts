import { IsInt, IsOptional, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class MoveTarefaDto {
  @ApiProperty({
    description: "ID da coluna de destino",
    example: 2,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: "O ID da coluna deve ser um número inteiro" })
  @Min(1, { message: "O ID da coluna deve ser maior que 0" })
  colunaId: number;

  @ApiPropertyOptional({
    description: "Nova posição da tarefa na coluna (ordem)",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt({ message: "A ordem deve ser um número inteiro" })
  @Min(1, { message: "A ordem deve ser maior que 0" })
  ordem?: number;
}
