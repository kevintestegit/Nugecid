import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class StartEscavadorDto {
  @IsOptional()
  @IsString()
  usuario?: string;

  @IsOptional()
  @IsString()
  senha?: string;

  @IsOptional()
  @IsString()
  launchUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(3600)
  watchInterval?: number;

  @IsOptional()
  @IsBoolean()
  beepOnNew?: boolean;

  @IsOptional()
  @IsBoolean()
  clickLast?: boolean;
}
