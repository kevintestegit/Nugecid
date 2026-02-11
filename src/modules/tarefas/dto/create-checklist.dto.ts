import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateChecklistDto {
  @ApiProperty({ example: "Critérios de Aceite" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  titulo: string;
}
