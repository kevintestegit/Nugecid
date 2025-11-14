import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoBuscaSeirn {
  PROCESSO = 'processo',
  OCORRENCIA = 'ocorrencia',
  DOCUMENTO = 'documento',
}

export class BuscarSeirnDto {
  @ApiProperty({ 
    description: 'Tipo de busca no SEIRN',
    enum: TipoBuscaSeirn,
    example: TipoBuscaSeirn.PROCESSO
  })
  @IsEnum(TipoBuscaSeirn)
  tipo_busca: TipoBuscaSeirn;

  @ApiProperty({ 
    description: 'Número do processo/ocorrência/documento',
    example: '12345/2024'
  })
  @IsString()
  numero: string;

  @ApiProperty({ 
    description: 'Parâmetros adicionais opcionais',
    required: false,
    example: { ano: '2024' }
  })
  @IsOptional()
  @IsObject()
  parametros_adicionais?: Record<string, any>;

  @ApiProperty({ 
    description: 'Usar cache Redis',
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  use_cache?: boolean = true;
}

export class SeirnProcessoDto {
  @ApiProperty()
  numero_processo: string;

  @ApiProperty({ required: false })
  ano?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  tipo?: string;

  @ApiProperty({ required: false })
  data_abertura?: string;

  @ApiProperty({ required: false })
  interessado?: string;

  @ApiProperty({ required: false })
  assunto?: string;

  @ApiProperty({ required: false })
  localizacao?: string;

  @ApiProperty({ required: false })
  observacoes?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}

export class SeirnOcorrenciaDto {
  @ApiProperty()
  numero_ocorrencia: string;

  @ApiProperty({ required: false })
  data_ocorrencia?: string;

  @ApiProperty({ required: false })
  tipo_ocorrencia?: string;

  @ApiProperty({ required: false })
  local?: string;

  @ApiProperty({ required: false })
  vitima?: string;

  @ApiProperty({ required: false })
  autor?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  descricao?: string;

  @ApiProperty({ required: false })
  delegacia?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}
