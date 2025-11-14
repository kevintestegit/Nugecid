import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementPriority } from '../entities';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Título do aviso', example: 'Manutenção programada' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Conteúdo do aviso',
    example: 'O sistema ficará indisponível das 22h às 23h para manutenção.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiProperty({
    description: 'URL da imagem do aviso',
    example: '/uploads/announcements/manutencao.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Prioridade do aviso',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.HIGH,
  })
  @IsEnum(AnnouncementPriority)
  priority: AnnouncementPriority;

  @ApiProperty({
    description: 'Data e hora de início de exibição',
    example: '2025-11-14T18:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Data e hora de fim de exibição',
    example: '2025-11-15T23:59:59.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Aviso ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({
    description: 'Roles alvo (null ou vazio = todos)',
    example: ['admin', 'coordenador'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];
}
