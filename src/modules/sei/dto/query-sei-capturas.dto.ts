import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Transform } from "class-transformer";
import { SeiCapturaStatus } from "../sei-captura.types";

export class QuerySeiCapturasDto {
  @IsOptional()
  @IsEnum(SeiCapturaStatus)
  status?: SeiCapturaStatus;

  @IsOptional()
  @IsString()
  numeroProcessoSei?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
