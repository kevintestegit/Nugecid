import { IsNotEmpty, IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "João Silva",
  })
  @IsString({ message: "Nome deve ser uma string" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  nome: string;

  @ApiProperty({
    description: "Nome de usuário",
    example: "usuario123",
  })
  @IsString({ message: "Usuário deve ser uma string" })
  @IsNotEmpty({ message: "Usuário é obrigatório" })
  usuario: string;

  @ApiProperty({
    description: "Matrícula do usuário",
    example: "1234567",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Matrícula deve ser uma string" })
  matricula?: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "senha123",
    minLength: 6,
  })
  @IsString({ message: "Senha deve ser uma string" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  senha: string;

  @ApiProperty({
    description: "Role do usuário",
    example: "admin",
    enum: ["admin", "coordenador", "usuario"],
  })
  @IsString({ message: "Role deve ser uma string" })
  @IsNotEmpty({ message: "Role é obrigatória" })
  role: string;

  @ApiProperty({
    description: "Se o usuário está ativo",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Ativo deve ser um valor booleano" })
  ativo?: boolean = true;
}
