import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: "Nome deve ser uma string" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @MinLength(3, { message: "Nome deve ter pelo menos 3 caracteres" })
  @MaxLength(255, { message: "Nome deve ter no máximo 255 caracteres" })
  nome: string;

  @ApiProperty({
    description: "Nome de usuário para login",
    example: "joao.silva",
    minLength: 3,
    maxLength: 50,
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
    description: "Senha do usuário",
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
    description: "Role/perfil do usuário",
    example: "user",
  })
  @IsString({ message: "Role deve ser uma string" })
  @IsNotEmpty({ message: "Role é obrigatória" })
  role: string;

  @ApiPropertyOptional({
    description: "Matrícula do usuário (opcional)",
    example: "12345",
  })
  @IsOptional()
  @IsString({ message: "Matrícula deve ser uma string" })
  @MaxLength(50, { message: "Matrícula deve ter no máximo 50 caracteres" })
  matricula?: string | null;
}
