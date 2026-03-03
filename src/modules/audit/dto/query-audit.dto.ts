import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import { AuditAction } from "../entities/auditoria.entity";

export class QueryAuditDto {
  @ApiPropertyOptional({ description: "Página atual", default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Itens por página", default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: AuditAction, description: "Filtrar por ação" })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: "Filtrar por entidade/módulo, ex.: auth, nugecid, users",
  })
  @IsOptional()
  @IsString()
  entityName?: string;

  @ApiPropertyOptional({
    description: "Filtrar por ID de usuário responsável pela ação",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    description: "Filtrar por sucesso: true ou false",
    example: "true",
  })
  @IsOptional()
  @IsString()
  success?: string;

  @ApiPropertyOptional({
    description: "Buscar por usuário, entidade, IP ou mensagem de erro",
  })
  @IsOptional()
  @IsString()
  search?: string;
}
