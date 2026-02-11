import { IsOptional, IsString, MaxLength, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateItemChecklistDto {
  @ApiProperty({ example: "Verificar responsividade mobile", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  texto?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  concluido?: boolean;
}
