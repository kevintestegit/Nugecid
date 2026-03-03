import { IsOptional, IsDateString, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class FiltrosEstatisticasDto {
  @ApiPropertyOptional({
    description: "Data inicial do período (ISO 8601)",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({
    description: "Data final do período (ISO 8601)",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

export class PaginacaoDto {
  @ApiPropertyOptional({
    description: "Número da página (começa em 1)",
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pagina?: number;

  @ApiPropertyOptional({
    description: "Itens por página",
    example: 50,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limite?: number;
}

export class FiltrosRelatorioMensalDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: "Ano do relatório",
    example: 2024,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  ano?: number;

  @ApiPropertyOptional({
    description: "Mês do relatório (1-12)",
    example: 11,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  mes?: number;
}
