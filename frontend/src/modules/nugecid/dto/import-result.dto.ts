export interface ImportError {
  line: number;
  error: string;
}

export interface ImportResultDto {
  fileName: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  processingTime: string;
  errors: ImportError[];
}
