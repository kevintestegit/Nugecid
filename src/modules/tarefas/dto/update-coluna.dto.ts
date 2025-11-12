import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateColunaDto } from "./create-coluna.dto";

export class UpdateColunaDto extends PartialType(
  OmitType(CreateColunaDto, ["projetoId"] as const),
) {}
