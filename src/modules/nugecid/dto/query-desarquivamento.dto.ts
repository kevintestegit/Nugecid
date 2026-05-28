import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsIn,
  IsDateString,
  IsArray,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

// Status values from reference document
const VALID_STATUS = [
  "FINALIZADO",
  "DESARQUIVADO",
  "NAO_COLETADO",
  "SOLICITADO",
  "REARQUIVAMENTO_SOLICITADO",
  "RETIRADO_PELO_SETOR",
  "NAO_LOCALIZADO",
] as const;

// Tipo desarquivamento values from reference document
const VALID_TIPO_DESARQUIVAMENTO = [
  "FISICO",
  "DIGITAL",
  "NAO_LOCALIZADO",
] as const;

export class QueryDesarquivamentoDto {
  @ApiPropertyOptional({
    description: "Número da página",
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Página deve ser um número" })
  @Min(1, { message: "Página deve ser maior que 0" })
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Quantidade de itens por página",
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Limite deve ser um número" })
  @Min(1, { message: "Limite deve ser maior que 0" })
  @Max(100, { message: "Limite deve ser no máximo 100" })
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      "Termo de busca (nome completo, número NIC/Laudo/Auto, número processo)",
    example: "João Silva",
  })
  @IsOptional()
  @IsString({ message: "Termo de busca deve ser uma string" })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: "Filtro por status (múltiplos valores permitidos)",
    enum: VALID_STATUS,
    isArray: true,
    example: ["SOLICITADO", "DESARQUIVADO"],
  })
  @IsOptional()
  @IsArray({ message: "Status deve ser um array" })
  @IsIn(VALID_STATUS, {
    each: true,
    message:
      "Cada status deve ser um valor válido: FINALIZADO, DESARQUIVADO, NAO_COLETADO, SOLICITADO, REARQUIVAMENTO_SOLICITADO, RETIRADO_PELO_SETOR, NAO_LOCALIZADO",
  })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  status?: string[];

  @ApiPropertyOptional({
    description:
      "Filtro por tipo de desarquivamento (múltiplos valores permitidos)",
    enum: VALID_TIPO_DESARQUIVAMENTO,
    isArray: true,
    example: ["FISICO", "DIGITAL"],
  })
  @IsOptional()
  @IsArray({ message: "Tipo deve ser um array" })
  @IsIn(VALID_TIPO_DESARQUIVAMENTO, {
    each: true,
    message:
      "Cada tipo deve ser um valor válido: FISICO, DIGITAL, NAO_LOCALIZADO",
  })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  tipoDesarquivamento?: string[];

  @ApiPropertyOptional({
    description: "Filtro por usuário solicitante",
    example: 1,
    type: "integer",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "ID do usuário deve ser um número" })
  @Min(1, { message: "ID do usuário deve ser maior que 0" })
  usuarioId?: number;

  @ApiPropertyOptional({
    description: "Filtro por usuário responsável",
    example: 2,
    type: "integer",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "ID do responsável deve ser um número" })
  @Min(1, { message: "ID do responsável deve ser maior que 0" })
  responsavelId?: number;

  @ApiPropertyOptional({
    description:
      "Data inicial para filtro por data de criação (formato: YYYY-MM-DD)",
    example: "2024-01-01",
    type: "string",
    format: "date",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Data inicial deve estar no formato válido (YYYY-MM-DD)" },
  )
  dataInicio?: string;

  @ApiPropertyOptional({
    description:
      "Data final para filtro por data de criação (formato: YYYY-MM-DD)",
    example: "2024-12-31",
    type: "string",
    format: "date",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Data final deve estar no formato válido (YYYY-MM-DD)" },
  )
  dataFim?: string;

  @ApiPropertyOptional({
    description:
      "Data inicial para filtro de intervalo por data de criação (formato: YYYY-MM-DD)",
    example: "2024-01-01",
    type: "string",
    format: "date",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Data inicial deve estar no formato válido (YYYY-MM-DD)" },
  )
  startDate?: string;

  @ApiPropertyOptional({
    description:
      "Data final para filtro de intervalo por data de criação (formato: YYYY-MM-DD)",
    example: "2024-12-31",
    type: "string",
    format: "date",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Data final deve estar no formato válido (YYYY-MM-DD)" },
  )
  endDate?: string;

  @ApiPropertyOptional({
    description: "Filtrar apenas solicitações urgentes",
    example: true,
    type: "boolean",
  })
  @IsOptional()
  @IsBoolean({ message: "Urgente deve ser um valor booleano" })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  })
  urgente?: boolean;

  @ApiPropertyOptional({
    description: "Filtro por instituto",
    example: "IC",
    enum: ["IC", "II", "IML"],
  })
  @IsOptional()
  @IsString({ message: "Instituto deve ser uma string" })
  @IsIn(["IC", "II", "IML"], {
    message: "Instituto deve ser um valor válido: IC, II, IML",
  })
  @Transform(({ value }) => value?.trim())
  instituto?: string;

  @ApiPropertyOptional({
    description: "Filtro por requerente",
    example: "1ª Delegacia de Polícia Civil Natal/RN",
  })
  @IsOptional()
  @IsString({ message: "Requerente deve ser uma string" })
  @Transform(({ value }) => value?.trim())
  requerente?: string;

  @ApiPropertyOptional({
    description: "Filtrar apenas solicitações vencidas",
    example: false,
    type: "boolean",
  })
  @IsOptional()
  @IsBoolean({ message: "Vencidos deve ser um valor booleano" })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  })
  vencidos?: boolean;

  @ApiPropertyOptional({
    description:
      "Filtrar solicitações que exigem atenção necessária (SOLICITADO há mais de 5 dias)",
    example: true,
    type: "boolean",
  })
  @IsOptional()
  @IsBoolean({ message: "Atenção necessária deve ser um valor booleano" })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  })
  atencaoNecessaria?: boolean;

  @ApiPropertyOptional({
    description: "Campo para ordenação",
    example: "createdAt",
    enum: [
      "dataSolicitacao",
      "createdAt",
      "deletedAt",
      "nomeCompleto",
      "numeroNicLaudoAuto",
      "numeroProcesso",
      "status",
      "tipoDesarquivamento",
      "tipoDocumento",
      "setorDemandante",
      "servidorResponsavel",
      "finalidadeDesarquivamento",
      "solicitacaoProrrogacao",
      "dataDesarquivamentoSAG",
      "dataDevolucaoSetor",
    ],
    default: "createdAt",
  })
  @IsOptional()
  @IsString({ message: "Campo de ordenação deve ser uma string" })
  @IsIn(
    [
      "dataSolicitacao",
      "createdAt",
      "deletedAt",
      "nomeCompleto",
      "numeroNicLaudoAuto",
      "numeroProcesso",
      "status",
      "tipoDesarquivamento",
      "tipoDocumento",
      "setorDemandante",
      "servidorResponsavel",
      "finalidadeDesarquivamento",
      "solicitacaoProrrogacao",
      "dataDesarquivamentoSAG",
      "dataDevolucaoSetor",
    ],
    {
      message: "Campo de ordenação deve ser um dos valores válidos",
    },
  )
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Direção da ordenação",
    example: "DESC",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsString({ message: "Direção da ordenação deve ser uma string" })
  @IsIn(["ASC", "DESC"], {
    message: "Direção da ordenação deve ser ASC ou DESC",
  })
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({
    description: "Incluir registros excluídos (soft delete)",
    example: false,
    type: "boolean",
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: "Incluir excluídos deve ser um valor booleano" })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  })
  incluirExcluidos?: boolean = false;

  @ApiPropertyOptional({
    description:
      "Formato de resposta (para endpoints que suportam múltiplos formatos)",
    example: "json",
    enum: ["json", "excel", "pdf"],
    default: "json",
  })
  @IsOptional()
  @IsString({ message: "Formato deve ser uma string" })
  @IsIn(["json", "excel", "pdf"], {
    message: "Formato deve ser json, excel ou pdf",
  })
  formato?: string = "json";
}
