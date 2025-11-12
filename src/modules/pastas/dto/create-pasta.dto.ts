import { IsString, IsArray, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class CreatePastaDto {
  @IsString()
  nome: string;

  @IsString()
  descricao: string;

  @IsArray()
  @IsString({ each: true })
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
