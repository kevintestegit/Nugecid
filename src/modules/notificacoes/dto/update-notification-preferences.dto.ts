import {
  IsBoolean,
  IsOptional,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class EnabledTypesDto {
  @ApiProperty({
    required: false,
    description: "Notificações de solicitações pendentes",
  })
  @IsOptional()
  @IsBoolean()
  solicitacao_pendente?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de novos processos",
  })
  @IsOptional()
  @IsBoolean()
  novo_processo?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de novos desarquivamentos",
  })
  @IsOptional()
  @IsBoolean()
  novo_desarquivamento?: boolean;

  @ApiProperty({ required: false, description: "Notificações de menções" })
  @IsOptional()
  @IsBoolean()
  mencao?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de tarefas atribuídas",
  })
  @IsOptional()
  @IsBoolean()
  tarefa_atribuida?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de tarefas alteradas",
  })
  @IsOptional()
  @IsBoolean()
  tarefa_alterada?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de comentários em tarefas",
  })
  @IsOptional()
  @IsBoolean()
  tarefa_comentada?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de prazos próximos",
  })
  @IsOptional()
  @IsBoolean()
  prazo_proximo?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de tarefas atrasadas",
  })
  @IsOptional()
  @IsBoolean()
  tarefa_atrasada?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de projetos atualizados",
  })
  @IsOptional()
  @IsBoolean()
  projeto_atualizado?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de novos registros",
  })
  @IsOptional()
  @IsBoolean()
  novo_registro?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de pastas criadas",
  })
  @IsOptional()
  @IsBoolean()
  pasta_criada?: boolean;

  @ApiProperty({
    required: false,
    description: "Notificações de eventos de auditoria",
  })
  @IsOptional()
  @IsBoolean()
  evento_auditoria?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    required: false,
    description: "Habilitar notificações in-app",
  })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiProperty({
    required: false,
    description: "Habilitar som nas notificações",
  })
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiProperty({
    required: false,
    description: "Tipos de notificação habilitados",
    type: EnabledTypesDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EnabledTypesDto)
  enabledTypes?: EnabledTypesDto;
}
