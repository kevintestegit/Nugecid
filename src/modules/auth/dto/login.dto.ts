import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: "Nome de usuário ou email",
    example: "admin@itep.rn.gov.br",
  })
  @IsString({ message: "Usuário deve ser uma string" })
  @IsNotEmpty({ message: "Usuário é obrigatório" })
  usuario: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "senha123",
    minLength: 6,
  })
  @IsString({ message: "Senha deve ser uma string" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  senha: string;
}
