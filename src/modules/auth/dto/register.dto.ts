import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
  })
  @IsString({ message: "Nome deve ser uma string" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  nome: string;

  @ApiProperty({
    description: "Nome de usuário",
    example: "joao.silva",
  })
  @IsString({ message: "Usuário deve ser uma string" })
  @IsNotEmpty({ message: "Usuário é obrigatório" })
  @MinLength(3, { message: "Usuário deve ter pelo menos 3 caracteres" })
  @MaxLength(50, { message: "Usuário deve ter no máximo 50 caracteres" })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      "Usuário deve conter apenas letras, números, pontos, hífens e underscores",
  })
  usuario: string;

  @ApiProperty({
    description: "Senha do usuário (mínimo 6 caracteres)",
    example: "Senha@123",
    minLength: 6,
    maxLength: 100,
  })
  @IsString({ message: "Senha deve ser uma string" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  @MaxLength(100, { message: "Senha deve ter no máximo 100 caracteres" })
  senha: string;

  @ApiProperty({
    description: "ID da role do usuário",
    example: 2,
  })
  @IsNumber({}, { message: "Role ID deve ser um número" })
  @IsNotEmpty({ message: "Role ID é obrigatório" })
  roleId: number;
}
