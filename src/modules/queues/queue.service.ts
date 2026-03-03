import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";

import {
  QUEUE_NAMES,
  IMPORT_JOBS,
  DEFAULT_JOB_OPTIONS,
} from "./queue.constants";

import {
  ImportXlsxJobData,
  GeneratePdfJobData,
  GenerateDocxJobData,
  ExportXlsxJobData,
  GenerateReportPdfJobData,
  GenerateBatchPdfJobData,
  NotifyAdminsJobData,
  CheckPendingRequestsJobData,
  CheckTaskDeadlinesJobData,
  CheckOverdueTasksJobData,
  FullBackupJobData,
  IncrementalBackupJobData,
  BackupCleanupJobData,
  JobStatusResponse,
} from "./dto/queue-job.dto";

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly enabled: boolean;

  constructor(
    @InjectQueue(QUEUE_NAMES.IMPORT)
    private readonly importQueue: Queue,
    @InjectQueue(QUEUE_NAMES.DOCUMENT_GENERATION)
    private readonly documentGenerationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BACKUP)
    private readonly backupQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.enabled =
      this.configService.get<string>("FEATURE_QUEUE_ENABLED", "false") ===
      "true";

    if (!this.enabled) {
      this.logger.warn(
        "Queue system is DISABLED (FEATURE_QUEUE_ENABLED=false). Job submissions will be rejected.",
      );
    } else {
      this.logger.log("Queue system is ENABLED.");
    }
  }

  // ── Guard ────────────────────────────────────────────────────

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new Error(
        "Queue system is disabled. Set FEATURE_QUEUE_ENABLED=true to enable.",
      );
    }
  }

  // ── Import queue ─────────────────────────────────────────────

  async addImportJob(data: ImportXlsxJobData): Promise<string> {
    this.assertEnabled();
    const job = await this.importQueue.add(
      IMPORT_JOBS.IMPORT_XLSX,
      data,
      DEFAULT_JOB_OPTIONS,
    );
    this.logger.log(
      `Import job enqueued: ${job.id} (file: ${data.originalName})`,
    );
    return job.id!;
  }

  async addImportRegistrosJob(data: ImportXlsxJobData): Promise<string> {
    this.assertEnabled();
    const job = await this.importQueue.add(
      IMPORT_JOBS.IMPORT_REGISTROS,
      data,
      DEFAULT_JOB_OPTIONS,
    );
    this.logger.log(
      `Import registros job enqueued: ${job.id} (file: ${data.originalName})`,
    );
    return job.id!;
  }

  // ── Document generation queue ────────────────────────────────

  async addDocumentGenerationJob(
    type: string,
    data:
      | GeneratePdfJobData
      | GenerateDocxJobData
      | ExportXlsxJobData
      | GenerateReportPdfJobData
      | GenerateBatchPdfJobData,
  ): Promise<string> {
    this.assertEnabled();
    const job = await this.documentGenerationQueue.add(
      type,
      data,
      DEFAULT_JOB_OPTIONS,
    );
    this.logger.log(
      `Document generation job enqueued: ${job.id} (type: ${type})`,
    );
    return job.id!;
  }

  // ── Notification queue ───────────────────────────────────────

  async addNotificationJob(
    type: string,
    data:
      | NotifyAdminsJobData
      | CheckPendingRequestsJobData
      | CheckTaskDeadlinesJobData
      | CheckOverdueTasksJobData,
  ): Promise<string> {
    this.assertEnabled();
    const job = await this.notificationQueue.add(
      type,
      data,
      DEFAULT_JOB_OPTIONS,
    );
    this.logger.log(`Notification job enqueued: ${job.id} (type: ${type})`);
    return job.id!;
  }

  // ── Backup queue ─────────────────────────────────────────────

  async addBackupJob(
    type: string,
    data: FullBackupJobData | IncrementalBackupJobData | BackupCleanupJobData,
  ): Promise<string> {
    this.assertEnabled();
    const job = await this.backupQueue.add(type, data, DEFAULT_JOB_OPTIONS);
    this.logger.log(`Backup job enqueued: ${job.id} (type: ${type})`);
    return job.id!;
  }

  // ── Job status ───────────────────────────────────────────────

  async getJobStatus(
    queueName: string,
    jobId: string,
  ): Promise<JobStatusResponse> {
    const queue = this.resolveQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      return {
        jobId,
        queue: queueName,
        status: "waiting",
      };
    }

    const state = await job.getState();

    return {
      jobId: job.id!,
      queue: queueName,
      status: state as JobStatusResponse["status"],
      progress: typeof job.progress === "number" ? job.progress : undefined,
      result: job.returnvalue ?? undefined,
      failedReason: job.failedReason ?? undefined,
      createdAt: job.timestamp,
      finishedAt: job.finishedOn ?? undefined,
    };
  }

  // ── Queue stats ──────────────────────────────────────────────

  async getQueueStats(): Promise<
    Record<
      string,
      {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
      }
    >
  > {
    const queues: Record<string, Queue> = {
      [QUEUE_NAMES.IMPORT]: this.importQueue,
      [QUEUE_NAMES.DOCUMENT_GENERATION]: this.documentGenerationQueue,
      [QUEUE_NAMES.NOTIFICATION]: this.notificationQueue,
      [QUEUE_NAMES.BACKUP]: this.backupQueue,
    };

    const stats: Record<
      string,
      {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
      }
    > = {};

    for (const [name, queue] of Object.entries(queues)) {
      const counts = await queue.getJobCounts(
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed",
      );
      stats[name] = {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      };
    }

    return stats;
  }

  // ── Helpers ──────────────────────────────────────────────────

  private resolveQueue(queueName: string): Queue {
    const map: Record<string, Queue> = {
      [QUEUE_NAMES.IMPORT]: this.importQueue,
      [QUEUE_NAMES.DOCUMENT_GENERATION]: this.documentGenerationQueue,
      [QUEUE_NAMES.NOTIFICATION]: this.notificationQueue,
      [QUEUE_NAMES.BACKUP]: this.backupQueue,
    };

    const queue = map[queueName];
    if (!queue) {
      throw new Error(`Unknown queue: ${queueName}`);
    }
    return queue;
  }
}
