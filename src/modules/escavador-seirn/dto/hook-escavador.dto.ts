import { IsOptional, IsString, IsNumber } from "class-validator";

export class HookEscavadorDto {
  @IsString()
  numero: string;

  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
