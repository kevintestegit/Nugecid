export const OCR_STATUSES = [
  "completed",
  "failed",
  "skipped_disabled",
  "skipped_non_pdf",
  "skipped_signed",
] as const;

export type OcrStatus = (typeof OCR_STATUSES)[number];

export interface OcrProcessRequest {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  storageKey: string;
  source?: string;
}

export interface OcrProcessResult {
  status: OcrStatus;
  processedAt: Date;
  text?: string;
  searchablePdfKey?: string;
  textKey?: string;
  error?: string;
}
