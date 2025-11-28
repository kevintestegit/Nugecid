import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsIn(["light", "dark"])
  theme?: "light" | "dark";

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSave?: boolean;

  @IsOptional()
  @IsBoolean()
  compactView?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  itemsPerPage?: number;
}
