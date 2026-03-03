/**
 * DTOs for queue job payloads.
 * These describe the shape of data passed into each queue job.
 */

// ── Import queue ───────────────────────────────────────────────

export interface ImportXlsxJobData {
  /** Base-64 encoded file buffer (Multer files can't cross process boundary) */
  fileBase64: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  userId: number;
  userName: string;
}

// ── Document-generation queue ──────────────────────────────────

export interface GeneratePdfJobData {
  desarquivamentoId: number;
  userId: number;
  userName: string;
  /** Optional: generate the fixed-header variant */
  fixedHeaderFooter?: boolean;
}

export interface GenerateBatchPdfJobData {
  desarquivamentoIds: number[];
  userId: number;
  userName: string;
}

export interface GenerateDocxJobData {
  desarquivamentoId: number;
  userId: number;
  userName: string;
}

export interface ExportXlsxJobData {
  filters: Record<string, unknown>;
  userId: number;
  userName: string;
}

export interface GenerateReportPdfJobData {
  reportType: "geral" | "mensal";
  filters?: Record<string, unknown>;
  userId: number;
  userName: string;
}

// ── Notification queue ─────────────────────────────────────────

export interface NotifyAdminsJobData {
  type: "novo-registro" | "pasta-criada" | "evento-auditoria";
  autorId: number | null;
  payload: Record<string, unknown>;
}

export interface CheckPendingRequestsJobData {
  triggeredBy: "scheduler" | "manual";
}

export interface CheckTaskDeadlinesJobData {
  triggeredBy: "scheduler" | "manual";
}

export interface CheckOverdueTasksJobData {
  triggeredBy: "scheduler" | "manual";
}

// ── Backup queue ───────────────────────────────────────────────

export interface FullBackupJobData {
  triggeredBy: "scheduler" | "manual";
  userId?: number;
}

export interface IncrementalBackupJobData {
  triggeredBy: "scheduler" | "manual";
}

export interface BackupCleanupJobData {
  triggeredBy: "scheduler" | "manual";
}

// ── Job result types ───────────────────────────────────────────

export interface JobStatusResponse {
  jobId: string;
  queue: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress?: number;
  result?: unknown;
  failedReason?: string;
  createdAt?: number;
  finishedAt?: number;
}
