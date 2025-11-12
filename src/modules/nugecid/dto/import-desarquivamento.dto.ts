import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from "class-validator";

export class ImportDesarquivamentoDto {
  @IsString()
  @IsNotEmpty()
  numero_processo: string;

  @IsString()
  @IsNotEmpty()
  requerente: string;

  @IsDateString()
  @IsNotEmpty()
  data_requerimento: Date;

  @IsString()
  @IsNotEmpty()
  palavras_chave: string;

  @IsString()
  @IsOptional()
  oficio_origem?: string;

  @IsString()
  @IsOptional()
  numero_oficio?: string;

  @IsString()
  @IsOptional()
  assunto?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  autorId: number;
}
