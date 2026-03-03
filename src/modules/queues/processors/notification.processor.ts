import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { QUEUE_NAMES, NOTIFICATION_JOBS } from "../queue.constants";
import {
  NotifyAdminsJobData,
  CheckPendingRequestsJobData,
  CheckTaskDeadlinesJobData,
  CheckOverdueTasksJobData,
} from "../dto/queue-job.dto";
import { NotificacoesService } from "../../notificacoes/services/notificacoes.service";

type NotificationJobData =
  | NotifyAdminsJobData
  | CheckPendingRequestsJobData
  | CheckTaskDeadlinesJobData
  | CheckOverdueTasksJobData;

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificacoesService: NotificacoesService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<unknown> {
    this.logger.log(`Processing ${job.name} job ${job.id}`);

    try {
      await job.updateProgress(10);

      switch (job.name) {
        case NOTIFICATION_JOBS.NOTIFY_ADMINS:
          return await this.handleNotifyAdmins(job as Job<NotifyAdminsJobData>);
        case NOTIFICATION_JOBS.CHECK_PENDING_REQUESTS:
          return await this.handleCheckPendingRequests(
            job as Job<CheckPendingRequestsJobData>,
          );
        case NOTIFICATION_JOBS.CHECK_TASK_DEADLINES:
          return await this.handleCheckTaskDeadlines(
            job as Job<CheckTaskDeadlinesJobData>,
          );
        case NOTIFICATION_JOBS.CHECK_OVERDUE_TASKS:
          return await this.handleCheckOverdueTasks(
            job as Job<CheckOverdueTasksJobData>,
          );
        default:
          throw new Error(`Unknown notification job type: ${job.name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Notification job ${job.id} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // ── Handlers ─────────────────────────────────────────────────

  private async handleNotifyAdmins(
    job: Job<NotifyAdminsJobData>,
  ): Promise<void> {
    const { type, autorId, payload } = job.data;

    await job.updateProgress(30);

    switch (type) {
      case "novo-registro":
        await this.notificacoesService.notificarNovoRegistro(
          autorId,
          payload.registroId as string | undefined,
          payload.resumo as
            | {
                numeroProcesso?: string;
                delegacia?: string;
                totalImportado?: number;
              }
            | undefined,
        );
        break;
      case "pasta-criada":
        await this.notificacoesService.notificarPastaCriada(
          autorId,
          payload.pastaId as string,
          payload.nomePasta as string,
        );
        break;
      case "evento-auditoria":
        await this.notificacoesService.notificarEventoAuditoria(
          autorId!,
          payload.entidade as string,
          payload.acao as string,
          payload.entityId as number | string | undefined,
          payload.detalhesExtras as Record<string, unknown> | undefined,
        );
        break;
      default:
        this.logger.warn(`Unknown notify-admins type: ${type}`);
    }

    await job.updateProgress(100);
    this.logger.log(`Notify admins job ${job.id} (${type}) completed.`);
  }

  private async handleCheckPendingRequests(
    job: Job<CheckPendingRequestsJobData>,
  ): Promise<{ count: number }> {
    await job.updateProgress(30);
    const notifications =
      await this.notificacoesService.verificarSolicitacoesPendentes();
    await job.updateProgress(100);
    this.logger.log(
      `Pending requests check completed: ${notifications.length} notifications created.`,
    );
    return { count: notifications.length };
  }

  private async handleCheckTaskDeadlines(
    job: Job<CheckTaskDeadlinesJobData>,
  ): Promise<{ count: number }> {
    await job.updateProgress(30);
    const notifications =
      await this.notificacoesService.verificarTarefasComPrazoProximo();
    await job.updateProgress(100);
    this.logger.log(
      `Task deadlines check completed: ${notifications.length} notifications created.`,
    );
    return { count: notifications.length };
  }

  private async handleCheckOverdueTasks(
    job: Job<CheckOverdueTasksJobData>,
  ): Promise<{ count: number }> {
    await job.updateProgress(30);
    const notifications =
      await this.notificacoesService.verificarTarefasAtrasadas();
    await job.updateProgress(100);
    this.logger.log(
      `Overdue tasks check completed: ${notifications.length} notifications created.`,
    );
    return { count: notifications.length };
  }
}
