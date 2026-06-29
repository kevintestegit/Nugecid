import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateVestigioDto {
  @ApiProperty({ description: "Código SCV completo", example: "901.11(1)" })
  @IsString()
  @IsNotEmpty()
  codigoScv: string;

  @ApiProperty({ description: "Classe principal do SCV", example: "900" })
  @IsString()
  @IsNotEmpty()
  classePrincipal: string;

  @ApiPropertyOptional({ description: "Código do grupo", example: "901" })
  @IsString()
  @IsOptional()
  grupoCodigo?: string;

  @ApiPropertyOptional({
    description: "Código da subdivisão",
    example: "901.11",
  })
  @IsString()
  @IsOptional()
  subdivisaoCodigo?: string;

  @ApiPropertyOptional({
    description: "Facetas selecionadas",
    example: ["(1)", "(2)"],
  })
  @IsArray()
  @IsOptional()
  facetas?: string[];

  @ApiPropertyOptional({
    description: "Descrições das facetas que requerem detalhamento",
    example: { "[Descrição]": "Revólver calibre 38" },
  })
  @IsObject()
  @IsOptional()
  facetasDescricoes?: Record<string, string>;

  @ApiPropertyOptional({ description: "Número do vestígio", example: "4102" })
  @IsString()
  @IsOptional()
  numeroVestigio?: string;

  @ApiPropertyOptional({ description: "Número do caso", example: "4305" })
  @IsString()
  @IsOptional()
  numeroCaso?: string;

  @ApiPropertyOptional({ description: "Categoria", example: "BALIS" })
  @IsString()
  @IsOptional()
  categoria?: string;

  @ApiPropertyOptional({ description: "Delegacia", example: "3ª DP (NATAL)" })
  @IsString()
  @IsOptional()
  delegacia?: string;

  @ApiPropertyOptional({ description: "Mês de referência", example: "2025-01" })
  @IsString()
  @IsOptional()
  mesReferencia?: string;

  @ApiProperty({
    description: "Etiqueta completa formatada",
    example: "901.11(1)\nVG-4102-0125\nCA-4305-0125\nBALIS\n3ª DP (NATAL)",
  })
  @IsString()
  @IsNotEmpty()
  etiquetaCompleta: string;

  @ApiPropertyOptional({
    description: "Classe usada para montar a ficha de catalogação",
    example: "0",
  })
  @IsString()
  @IsOptional()
  classeCatalogacao?: string;

  @ApiPropertyOptional({
    description: "Subclasse usada para montar a ficha de catalogação",
    example: "Papiloscopia",
  })
  @IsString()
  @IsOptional()
  subclasseCatalogacao?: string;

  @ApiPropertyOptional({
    description: "Tipo específico da catalogação",
    example: "Iris",
  })
  @IsString()
  @IsOptional()
  tipoCatalogacao?: string;

  @ApiPropertyOptional({
    description: "Versão do schema de catalogação aplicado",
    example: "ccvc-2026-06",
  })
  @IsString()
  @IsOptional()
  schemaVersao?: string;

  @ApiPropertyOptional({
    description: "Metadados gerais preenchidos na catalogação",
    example: { codigoVestigio: "VG-4102-0125" },
  })
  @IsObject()
  @IsOptional()
  metadadosGerais?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Metadados específicos da categoria do vestígio",
    example: { tipoVestigio: "Iris" },
  })
  @IsObject()
  @IsOptional()
  metadadosEspecificos?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Status do vestígio", example: "ativo" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: "Observações adicionais" })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
