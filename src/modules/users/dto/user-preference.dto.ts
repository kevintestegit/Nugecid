import { IsString, IsNotEmpty, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserPreferenceDto {
  @ApiProperty({
    description: "Preference key",
    example: "dashboard-layout",
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: "Preference value (JSON)",
    example: { cards: [], updatedAt: "2025-10-31T17:00:00Z" },
  })
  @IsObject()
  @IsNotEmpty()
  value: any;
}

export class GetUserPreferenceDto {
  @ApiProperty({
    description: "Preference key",
    example: "dashboard-layout",
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}
