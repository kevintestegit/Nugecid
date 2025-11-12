import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateDesarquivamentoCommentDto {
  @IsString()
  @IsNotEmpty({ message: "O comentário não pode ser vazio." })
  @MaxLength(2000, {
    message: "O comentário pode ter no máximo 2000 caracteres.",
  })
  comment: string;
}
