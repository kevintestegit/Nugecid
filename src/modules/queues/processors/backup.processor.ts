import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { QUEUE_NAMES, BACKUP_JOBS } from "../queue.constants";
import {
  FullBackupJobData,
  IncrementalBackupJobData,
  BackupCleanupJobData,
} from "../dto/queue-job.dto";
import { BackupService } from "../../backup/services/backup.service";

type BackupJobData =
  | FullBackupJobData
  | IncrementalBackupJobData
  | BackupCleanupJobData;

@Processor(QUEUE_NAMES.BACKUP)
export class BackupProcessor extends WorkerHost {
  private readonly logger = new Logger(BackupProcessor.name);

  constructor(private readonly backupService: BackupService) {
    super();
  }

  async process(job: Job<BackupJobData>): Promise<unknown> {
    this.logger.log(`Processing ${job.name} job ${job.id}`);

    try {
      await job.updateProgress(10);

      switch (job.name) {
        case BACKUP_JOBS.FULL_BACKUP:
          return await this.handleFullBackup(job);
        case BACKUP_JOBS.INCREMENTAL_BACKUP:
          return await this.handleIncrementalBackup(job);
        case BACKUP_JOBS.CLEANUP:
          return await this.handleCleanup(job);
        default:
          throw new Error(`Unknown backup job type: ${job.name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Backup job ${job.id} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // ── Handlers ─────────────────────────────────────────────────

  private async handleFullBackup(
    job: Job<FullBackupJobData>,
  ): Promise<unknown> {
    await job.updateProgress(20);
    const result = await this.backupService.createFullBackup();
    await job.updateProgress(100);
    this.logger.log(
      `Full backup job ${job.id} completed: ${result.success ? result.filename : result.error}`,
    );
    return result;
  }

  private async handleIncrementalBackup(
    job: Job<IncrementalBackupJobData>,
  ): Promise<unknown> {
    await job.updateProgress(20);
    const result = await this.backupService.createDesarquivamentoBackup();
    await job.updateProgress(100);
    this.logger.log(
      `Incremental backup job ${job.id} completed: ${result.success ? result.filename : result.error}`,
    );
    return result;
  }

  private async handleCleanup(
    job: Job<BackupCleanupJobData>,
  ): Promise<{ removedCount: number }> {
    await job.updateProgress(20);
    const removedCount = await this.backupService.cleanOldBackups();
    await job.updateProgress(100);
    this.logger.log(
      `Backup cleanup job ${job.id} completed: ${removedCount} old backups removed.`,
    );
    return { removedCount };
  }
}
