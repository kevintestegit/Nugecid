import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { TipoDesarquivamentoEnum } from "../domain/enums/tipo-desarquivamento.enum";
import { StatusDesarquivamentoEnum } from "../domain/enums/status-desarquivamento.enum";
import { IsFlexibleDate } from "../../../common/validators/is-flexible-date.validator";

export class UpdateDesarquivamentoDto {
  @ApiPropertyOptional({
    description: "Desarquivamento Físico/Digital ou não localizado",
    example: TipoDesarquivamentoEnum.FISICO,
    enum: TipoDesarquivamentoEnum,
  })
  @IsOptional()
  @IsEnum(TipoDesarquivamentoEnum, {
    message:
      "Tipo de desarquivamento deve ser: FISICO, DIGITAL ou NAO_LOCALIZADO",
  })
  desarquivamentoFisicoDigital?: TipoDesarquivamentoEnum;

  @ApiPropertyOptional({
    description: "Status da solicitação",
    enum: StatusDesarquivamentoEnum,
    example: StatusDesarquivamentoEnum.SOLICITADO,
  })
  @IsOptional()
  @IsEnum(StatusDesarquivamentoEnum, {
    message:
      "Status deve ser um dos valores válidos: FINALIZADO, DESARQUIVADO, NAO_COLETADO, SOLICITADO, REARQUIVAMENTO_SOLICITADO, RETIRADO_PELO_SETOR, NAO_LOCALIZADO",
  })
  status?: StatusDesarquivamentoEnum;

  @ApiPropertyOptional({
    description: "Nome completo do solicitante",
    example: "João Silva Santos",
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nomeCompleto?: string;

  @ApiPropertyOptional({
    description: "Número do NIC, Laudo, Auto ou Informação Técnica",
    example: "NIC-2024-123456",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Número NIC/Laudo/Auto deve ter no máximo 100 caracteres",
  })
  @Transform(({ value }) => {
    if (!value) return value;
    const trimmed = value.trim();
    // Trunca para 100 caracteres se exceder o limite
    return trimmed.length > 100 ? trimmed.substring(0, 100) : trimmed;
  })
  numeroNicLaudoAuto?: string;

  @ApiPropertyOptional({
    description: "Número do processo",
    example: "2025.001.123456",
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  numeroProcesso?: string;

  @ApiPropertyOptional({
    description: "Tipo do documento solicitado",
    example: "Laudo Pericial",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  tipoDocumento?: string;

  @ApiPropertyOptional({
    description: "Data da solicitação (aceita YYYY-MM-DD ou ISO 8601)",
    example: "2024-01-15",
    type: "string",
  })
  @IsOptional()
  @IsFlexibleDate({
    message: "Data da solicitação deve estar no formato válido",
  })
  @Transform(({ value }) => {
    if (!value) return null;

    // Se for YYYY-MM-DD, converte para Date UTC
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00.000Z");
    }

    // Converte qualquer outro formato para Date
    return new Date(value);
  })
  dataSolicitacao?: Date;

  @ApiPropertyOptional({
    description:
      "Data do desarquivamento pelo SAG (aceita YYYY-MM-DD ou ISO 8601)",
    example: "2024-01-20",
    type: "string",
  })
  @IsOptional()
  @IsFlexibleDate({
    message: "Data do desarquivamento SAG deve estar no formato válido",
  })
  @Transform(({ value }) => {
    if (!value) return null;

    // Se for YYYY-MM-DD, converte para Date UTC
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00.000Z");
    }

    // Converte qualquer outro formato para Date
    return new Date(value);
  })
  dataDesarquivamentoSAG?: Date;

  @ApiPropertyOptional({
    description:
      "Data de devolução ao setor demandante (aceita YYYY-MM-DD ou ISO 8601)",
    example: "2024-01-25",
    type: "string",
  })
  @IsOptional()
  @IsFlexibleDate({
    message: "Data de devolução ao setor deve estar no formato válido",
  })
  @Transform(({ value }) => {
    if (!value) return null;

    // Se for YYYY-MM-DD, converte para Date UTC
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + "T00:00:00.000Z");
    }

    // Converte qualquer outro formato para Date
    return new Date(value);
  })
  dataDevolucaoSetor?: Date;

  @ApiPropertyOptional({
    description: "Setor que está solicitando o desarquivamento",
    example: "Delegacia de Plantão da Zona Sul",
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  setorDemandante?: string;

  @ApiPropertyOptional({
    description: "Servidor do ITEP responsável pela solicitação",
    example: "Maria Oliveira (mat. 654321)",
    minLength: 3,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  servidorResponsavel?: string;

  @ApiPropertyOptional({
    description: "Finalidade e justificativa para o desarquivamento",
    example: "Para instrução em processo judicial.",
    minLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @Transform(({ value }) => value?.trim())
  finalidadeDesarquivamento?: string;

  @ApiPropertyOptional({
    description: "Indica se há uma solicitação de prorrogação de prazo",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  solicitacaoProrrogacao?: boolean;

  @ApiPropertyOptional({
    description: "Indica se a solicitação é urgente",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  })
  urgente?: boolean;

  @ApiPropertyOptional({
    description: "Texto detalhado da solicitação de prorrogação",
    example:
      "Prazo de desarquivamento prorrogado em 18/06/25 para atendimento de perícia documentoscópica",
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  solicitacaoProrrogacaoTexto?: string;

  @ApiPropertyOptional({
    description: "Dados adicionais do solicitante",
    example:
      "Filiação: João Batista de Farias Filho e Cleide Aquino Ferreira de Farias\nNaturalidade: Natal/RN\nData de Nascimento: 14/03/1983",
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  dadosAdicionais?: string;

  @ApiPropertyOptional({
    description: "ID do usuário responsável pelo atendimento",
    example: 2,
    type: "integer",
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: "ID do responsável deve ser um número" })
  @Min(1, { message: "ID do responsável deve ser maior que 0" })
  responsavelId?: number;
}
