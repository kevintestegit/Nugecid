import { ApiProperty } from "@nestjs/swagger";

class ImportError {
  @ApiProperty()
  row: number;

  @ApiProperty()
  details: any;
}

export class ImportResultDto {
  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty({ type: [ImportError] })
  errors: { row: number; details: any }[];

  @ApiProperty({ required: false })
  processingTime?: number;

  @ApiProperty({ required: false })
  fileName?: string;

  @ApiProperty({ required: false })
  fileSize?: number;

  @ApiProperty({ required: false })
  importedAt?: Date;

  @ApiProperty({ required: false })
  importedBy?: string;
}
