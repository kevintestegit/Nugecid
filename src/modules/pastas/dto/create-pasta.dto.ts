import {
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePastaDto {
  @ApiProperty({
    description: "Nome da pasta/prateleira",
    example: "Documentos 2024",
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: "O nome deve ser uma string" })
  @IsNotEmpty({ message: "O nome é obrigatório" })
  @MinLength(3, { message: "O nome deve ter pelo menos 3 caracteres" })
  @MaxLength(255, { message: "O nome deve ter no máximo 255 caracteres" })
  nome: string;

  @ApiProperty({
    description: "Descrição da pasta/prateleira",
    example: "Documentos administrativos do ano de 2024",
  })
  @IsString({ message: "A descrição deve ser uma string" })
  @IsNotEmpty({ message: "A descrição é obrigatória" })
  @MaxLength(1000, {
    message: "A descrição deve ter no máximo 1000 caracteres",
  })
  descricao: string;

  @ApiPropertyOptional({
    description: "Tags para categorização",
    example: ["admin", "2024", "importante"],
    type: [String],
  })
  @IsArray({ message: "As tags devem ser um array" })
  @IsString({ each: true, message: "Cada tag deve ser uma string" })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return value
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean);
      }
    }
    return [];
  })
  tags?: string[];
}
