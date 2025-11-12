import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsIn,
  Min,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class QueryUsersDto {
  @ApiProperty({
    description: "Número da página",
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Página deve ser um número" })
  @Min(1, { message: "Página deve ser maior que 0" })
  page?: number = 1;

  @ApiProperty({
    description: "Número de itens por página",
    example: 10,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Limit deve ser um número" })
  @Min(1, { message: "Limit deve ser maior que 0" })
  limit?: number = 10;

  @ApiProperty({
    description: "Termo de busca (nome ou usuario)",
    example: "João",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Search deve ser uma string" })
  search?: string;

  @ApiProperty({
    description: "ID da role para filtrar",
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Role ID deve ser um número" })
  roleId?: number;

  @ApiProperty({
    description: "Filtrar por status ativo",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean({ message: "Ativo deve ser um valor booleano" })
  ativo?: boolean;

  @ApiProperty({
    description: "Campo para ordenação",
    example: "criadoEm",
    required: false,
    enum: ["nome", "usuario", "criadoEm", "ultimoLogin"],
  })
  @IsOptional()
  @IsString({ message: "SortBy deve ser uma string" })
  @IsIn(["nome", "usuario", "criadoEm", "ultimoLogin"], {
    message:
      "SortBy deve ser um dos valores: nome, usuario, criadoEm, ultimoLogin",
  })
  sortBy?: string = "criadoEm";

  @ApiProperty({
    description: "Direção da ordenação",
    example: "DESC",
    required: false,
    enum: ["ASC", "DESC"],
  })
  @IsOptional()
  @IsString({ message: "SortOrder deve ser uma string" })
  @IsIn(["ASC", "DESC"], {
    message: "SortOrder deve ser ASC ou DESC",
  })
  sortOrder?: string = "DESC";
}
