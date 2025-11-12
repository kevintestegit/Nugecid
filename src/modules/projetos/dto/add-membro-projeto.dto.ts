import { IsInt, IsEnum, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { PapelMembro } from "../entities/membro-projeto.entity";

export class AddMembroProjetoDto {
  @ApiProperty({
    description: "ID do usuário a ser adicionado ao projeto",
    example: 2,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: "O ID do usuário deve ser um número inteiro" })
  @Min(1, { message: "O ID do usuário deve ser maior que 0" })
  usuarioId: number;

  @ApiProperty({
    description: "Papel do membro no projeto",
    enum: PapelMembro,
    example: PapelMembro.EDITOR,
  })
  @IsEnum(PapelMembro, { message: "O papel deve ser: admin, editor ou viewer" })
  papel: PapelMembro;
}
