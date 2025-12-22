import {
  IsBoolean,
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSystemSettingsDto {
  @ApiPropertyOptional({ description: "Ativar backup automático" })
  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;

  @ApiPropertyOptional({
    description: "Frequência do backup automático",
    enum: ["hourly", "daily", "weekly", "monthly"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["hourly", "daily", "weekly", "monthly"])
  backupFrequency?: string;

  @ApiPropertyOptional({
    description: "Nível de log do sistema",
    enum: ["error", "warn", "info", "debug"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["error", "warn", "info", "debug"])
  logLevel?: string;

  @ApiPropertyOptional({ description: "Ativar modo manutenção" })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({ description: "Ativar cache do sistema" })
  @IsOptional()
  @IsBoolean()
  cacheEnabled?: boolean;

  // Security settings
  @ApiPropertyOptional({
    description: "Tempo limite da sessão em minutos",
    minimum: 5,
    maximum: 480,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
  sessionTimeout?: number;

  @ApiPropertyOptional({
    description: "Expiração de senha em dias",
    minimum: 30,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(365)
  passwordExpiry?: number;

  @ApiPropertyOptional({
    description: "Número máximo de tentativas de login",
    minimum: 3,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(10)
  maxLoginAttempts?: number;

  @ApiPropertyOptional({ description: "Ativar autenticação de dois fatores" })
  @IsOptional()
  @IsBoolean()
  twoFactorAuth?: boolean;

  @ApiPropertyOptional({ description: "Exigir senha forte" })
  @IsOptional()
  @IsBoolean()
  requireStrongPassword?: boolean;
}
