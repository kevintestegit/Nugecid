import { PartialType } from "@nestjs/mapped-types";
import { CreatePastaDto } from "./create-pasta.dto";

export class UpdatePastaDto extends PartialType(CreatePastaDto) {}
