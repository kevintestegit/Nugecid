import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PapelMembro } from "../entities/membro-projeto.entity";

export class UpdateMembroProjetoDto {
  @ApiProperty({
    description: "Novo papel do membro no projeto",
    enum: PapelMembro,
    example: PapelMembro.ADMIN,
  })
  @IsEnum(PapelMembro, { message: "O papel deve ser: admin, editor ou viewer" })
  papel: PapelMembro;
}
