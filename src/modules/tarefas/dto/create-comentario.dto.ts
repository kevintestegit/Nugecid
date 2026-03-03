import { IsString, IsInt, MinLength, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class CreateComentarioDto {
  @ApiProperty({
    description: "ID da tarefa onde o comentário será adicionado",
    example: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: "O ID da tarefa deve ser um número inteiro" })
  @Min(1, { message: "O ID da tarefa deve ser maior que 0" })
  tarefaId: number;

  @ApiProperty({
    description: "Conteúdo do comentário",
    example: "Esta tarefa precisa ser revisada antes da implementação.",
    minLength: 1,
  })
  @IsString({ message: "O conteúdo deve ser uma string" })
  @MinLength(1, { message: "O comentário deve ter pelo menos 1 caractere" })
  conteudo: string;
}
