import { IsString, IsNotEmpty, MinLength, MaxLength } from "class-validator";

export class ChangePasswordDto {
  @IsString({ message: "Senha atual deve ser uma string" })
  @IsNotEmpty({ message: "Senha atual é obrigatória" })
  senhaAtual: string;

  @IsString({ message: "Nova senha deve ser uma string" })
  @IsNotEmpty({ message: "Nova senha é obrigatória" })
  @MinLength(6, { message: "Nova senha deve ter pelo menos 6 caracteres" })
  @MaxLength(100, { message: "Nova senha deve ter no máximo 100 caracteres" })
  novaSenha: string;
}
