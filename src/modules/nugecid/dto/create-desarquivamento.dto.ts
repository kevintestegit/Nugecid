import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { TipoDesarquivamentoEnum } from "../domain/enums/tipo-desarquivamento.enum";
import { StatusDesarquivamentoEnum } from "../domain/enums/status-desarquivamento.enum";

export class CreateDesarquivamentoDto {
  @ApiProperty({
    description: "Desarquivamento Físico/Digital ou não localizado",
    example: "FISICO",
    enum: ["FISICO", "DIGITAL", "NAO_LOCALIZADO"],
  })
  @Transform(({ value, obj }) => {
    const v = value ?? obj?.desarquivamentoFisicoDigital;
    if (typeof v !== "string") return v;
    return v
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  })
  @IsNotEmpty({ message: "Tipo de desarquivamento é obrigatório" })
  tipoDesarquivamento: string;

  @ApiProperty({
    description:
      "Desarquivamento Físico/Digital ou não localizado (compatibilidade)",
    example: TipoDesarquivamentoEnum.FISICO,
    enum: TipoDesarquivamentoEnum,
  })
  @Transform(({ value }) => {
    if (typeof value !== "string") return value;
    return value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  })
  @IsOptional()
  @IsEnum(TipoDesarquivamentoEnum, {
    message:
      "Tipo de desarquivamento deve ser FISICO, DIGITAL ou NAO_LOCALIZADO",
  })
  @IsNotEmpty({ message: "Tipo de desarquivamento é obrigatório" })
  desarquivamentoFisicoDigital?: TipoDesarquivamentoEnum;

  @ApiProperty({
    description: "Nome completo do solicitante",
    example: "João da Silva Santos",
  })
  @IsString()
  @IsNotEmpty({ message: "Nome completo é obrigatório" })
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nomeCompleto: string;

  @ApiProperty({
    description: "Número do NIC, Laudo, Auto ou Informação Técnica",
    example: "BIC Nº 146.040 - João Silva Santos",
  })
  @IsString()
  @IsNotEmpty({ message: "Número NIC/Laudo/Auto é obrigatório" })
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  numeroNicLaudoAuto: string;

  @ApiPropertyOptional({
    description: "Número do processo",
    example: "2025.001.123456",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim() || null)
  numeroProcesso?: string;

  @ApiProperty({
    description: "Tipo do documento",
    example: "Laudo de Perícia Criminal",
  })
  @IsString()
  @IsNotEmpty({ message: "Tipo de documento é obrigatório" })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  tipoDocumento: string;

  @ApiProperty({
    description: "Data da solicitação (aceita YYYY-MM-DD ou ISO 8601)",
    example: "2025-01-15",
  })
  @Transform(({ value }) => {
    if (!value) throw new Error("Data de solicitação é obrigatória");

    // Se já for ISO 8601, retorna
    if (typeof value === "string" && value.includes("T")) {
      return value;
    }

    // Se for YYYY-MM-DD, converte para ISO 8601
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00.000Z").toISOString();
    }

    // Tenta converter qualquer outro formato
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error("Data de solicitação deve estar em formato válido");
    }
    return date.toISOString();
  })
  @IsNotEmpty({ message: "Data de solicitação é obrigatória" })
  dataSolicitacao: string;

  @ApiPropertyOptional({
    description:
      "Data do desarquivamento no sistema SAG (aceita YYYY-MM-DD ou ISO 8601)",
    example: "2025-01-20",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // Se já for ISO 8601, retorna
    if (typeof value === "string" && value.includes("T")) {
      return value;
    }

    // Se for YYYY-MM-DD, converte para ISO 8601
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00.000Z").toISOString();
    }

    // Tenta converter qualquer outro formato
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(
        "Data de desarquivamento SAG deve estar em formato válido",
      );
    }
    return date.toISOString();
  })
  dataDesarquivamentoSAG?: string;

  @ApiPropertyOptional({
    description: "Data da devolução pelo setor (aceita YYYY-MM-DD ou ISO 8601)",
    example: "2025-01-25",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // Se já for ISO 8601, retorna
    if (typeof value === "string" && value.includes("T")) {
      return value;
    }

    // Se for YYYY-MM-DD, converte para ISO 8601
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00.000Z").toISOString();
    }

    // Tenta converter qualquer outro formato
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error("Data de devolução deve estar em formato válido");
    }
    return date.toISOString();
  })
  dataDevolucaoSetor?: string;

  @ApiPropertyOptional({
    description: "Setor que está solicitando o desarquivamento",
    example: "Instituto de Identificação",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim() || null)
  setorDemandante?: string;

  @ApiProperty({
    description:
      "Servidor do ITEP responsável pela solicitação (Nome e Matrícula)",
    example: "Maria Oliveira (mat. 654321)",
  })
  @IsString()
  @IsNotEmpty({ message: "Servidor responsável é obrigatório" })
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  servidorResponsavel: string;

  @ApiProperty({
    description: "Finalidade e justificativa para o desarquivamento",
    example: "Para instrução em processo judicial.",
  })
  @IsString()
  @IsNotEmpty({ message: "Finalidade é obrigatória" })
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  finalidadeDesarquivamento: string;

  @ApiProperty({
    description: "Indica se há uma solicitação de prorrogação de prazo",
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty({ message: "Solicitação de prorrogação é obrigatória" })
  solicitacaoProrrogacao: boolean;

  @ApiPropertyOptional({
    description: "Indica se a solicitação é urgente",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  urgente?: boolean = false;

  @ApiPropertyOptional({
    description: "Instituto que solicitou o desarquivamento",
    example: "Instituto de Criminalística",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim() || null)
  instituto?: string;

  @ApiPropertyOptional({
    description: "Requerente da solicitação",
    example: "Delegacia de Crimes Contra o Patrimônio",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim() || null)
  requerente?: string;

  @ApiPropertyOptional({
    description: "Texto detalhado da solicitação de prorrogação",
    example:
      "Prazo de desarquivamento prorrogado em 18/06/25 para atendimento de perícia documentoscópica",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  solicitacaoProrrogacaoTexto?: string;

  @ApiPropertyOptional({
    description: "Dados adicionais do solicitante",
    example:
      "Filiação: João Batista de Farias Filho e Cleide Aquino Ferreira de Farias\nNaturalidade: Natal/RN\nData de Nascimento: 14/03/1983",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  dadosAdicionais?: string;

  @ApiPropertyOptional({
    description: "Status inicial do desarquivamento (opcional em importações)",
    enum: StatusDesarquivamentoEnum,
  })
  @IsOptional()
  @IsEnum(StatusDesarquivamentoEnum, {
    message: "Status deve ser um dos valores válidos",
  })
  status?: StatusDesarquivamentoEnum;
}
