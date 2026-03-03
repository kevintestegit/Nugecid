import { Transform } from "class-transformer";
import { IsOptional, IsString, IsNumber, IsUrl } from "class-validator";

export class HookEscavadorDto {
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  numero: string;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  titulo: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsUrl(
    { require_protocol: true, protocols: ["http", "https"] },
    { message: "link deve ser uma URL HTTP(S) válida" },
  )
  link?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  token?: string;

  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
