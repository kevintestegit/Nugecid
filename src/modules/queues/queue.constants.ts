/**
 * BullMQ queue names and job type constants.
 *
 * Each queue handles a category of async work so that heavy I/O
 * (file parsing, PDF rendering, pg_dump, batch DB writes) never
 * blocks the HTTP request/response cycle.
 */

// ── Queue names ────────────────────────────────────────────────
export const QUEUE_NAMES = {
  /** XLSX/CSV import processing */
  IMPORT: "import",

  /** PDF / DOCX / XLSX export & document generation */
  DOCUMENT_GENERATION: "document-generation",

  /** Batch notification creation (admin broadcasts, scheduled checks) */
  NOTIFICATION: "notification",

  /** Database backups (full, incremental, restore) */
  BACKUP: "backup",
} as const;

// ── Job types per queue ────────────────────────────────────────

export const IMPORT_JOBS = {
  IMPORT_XLSX: "import-xlsx",
  IMPORT_REGISTROS: "import-registros",
} as const;

export const DOCUMENT_JOBS = {
  GENERATE_PDF: "generate-pdf",
  GENERATE_DOCX: "generate-docx",
  EXPORT_XLSX: "export-xlsx",
  GENERATE_REPORT_PDF: "generate-report-pdf",
  GENERATE_BATCH_PDF: "generate-batch-pdf",
} as const;

export const NOTIFICATION_JOBS = {
  NOTIFY_ADMINS: "notify-admins",
  CHECK_PENDING_REQUESTS: "check-pending-requests",
  CHECK_TASK_DEADLINES: "check-task-deadlines",
  CHECK_OVERDUE_TASKS: "check-overdue-tasks",
} as const;

export const BACKUP_JOBS = {
  FULL_BACKUP: "full-backup",
  INCREMENTAL_BACKUP: "incremental-backup",
  CLEANUP: "cleanup",
} as const;

// ── Default job options ────────────────────────────────────────

export const DEFAULT_JOB_OPTIONS = {
  /** Retry failed jobs up to 3 times with exponential back-off */
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5_000, // 5 s initial delay
  },
  /** Remove completed jobs after 24 h, failed after 7 d */
  removeOnComplete: { age: 86_400 },
  removeOnFail: { age: 604_800 },
};
