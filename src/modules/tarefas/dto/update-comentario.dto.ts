import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateComentarioDto {
  @ApiProperty({
    description: "Novo conteúdo do comentário",
    example: "Comentário atualizado com novas informações.",
    minLength: 1,
  })
  @IsString({ message: "O conteúdo deve ser uma string" })
  @MinLength(1, { message: "O comentário deve ter pelo menos 1 caractere" })
  conteudo: string;
}
