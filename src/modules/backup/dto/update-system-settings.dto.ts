import { IsBoolean, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemSettingsDto {
  @ApiPropertyOptional({ description: 'Ativar backup automático' })
  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;

  @ApiPropertyOptional({
    description: 'Frequência do backup automático',
    enum: ['hourly', 'daily', 'weekly', 'monthly']
  })
  @IsOptional()
  @IsString()
  @IsIn(['hourly', 'daily', 'weekly', 'monthly'])
  backupFrequency?: string;

  @ApiPropertyOptional({
    description: 'Nível de log do sistema',
    enum: ['error', 'warn', 'info', 'debug']
  })
  @IsOptional()
  @IsString()
  @IsIn(['error', 'warn', 'info', 'debug'])
  logLevel?: string;

  @ApiPropertyOptional({ description: 'Ativar modo manutenção' })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({ description: 'Ativar cache do sistema' })
  @IsOptional()
  @IsBoolean()
  cacheEnabled?: boolean;
}
