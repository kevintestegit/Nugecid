import { PartialType } from "@nestjs/swagger";
import { CreateVestigioDto } from "./create-vestigio.dto";

export class UpdateVestigioDto extends PartialType(CreateVestigioDto) {}
