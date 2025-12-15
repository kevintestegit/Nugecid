import { PartialType, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateTarefaDto } from "./create-tarefa.dto";

export class UpdateTarefaDto extends PartialType(
  OmitType(CreateTarefaDto, ["projetoId"] as const),
) {
  /**
   * Campo de compatibilidade: algumas telas legadas enviam "estado".
   * Não persiste na entidade, apenas evita erro de validação.
   */
  @IsOptional()
  @IsString()
  estado?: string;
}
