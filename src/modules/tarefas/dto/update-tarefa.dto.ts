import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateTarefaDto } from "./create-tarefa.dto";

export class UpdateTarefaDto extends PartialType(
  OmitType(CreateTarefaDto, ["projetoId"] as const),
) {}
