import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemChecklistDto {
  @ApiProperty({ example: 'Verificar responsividade' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  texto: string;
}
