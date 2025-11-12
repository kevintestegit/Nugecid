// src/modules/registros/dto/import-registro.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
} from "class-validator";

export class ImportRegistroDto {
  @IsString()
  @IsNotEmpty()
  numero_processo: string;

  @IsString()
  @IsNotEmpty()
  delegacia_origem: string;

  @IsString()
  @IsNotEmpty()
  nome_vitima: string;

  @IsDateString()
  @IsNotEmpty()
  data_fato: Date;

  @IsString()
  @IsOptional()
  investigador_responsavel?: string;

  @IsNumber()
  @IsOptional()
  idade_vitima?: number;
}
