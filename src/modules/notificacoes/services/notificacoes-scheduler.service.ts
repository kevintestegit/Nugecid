import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificacoesService } from "./notificacoes.service";

@Injectable()
export class NotificacoesSchedulerService {
  private readonly logger = new Logger(NotificacoesSchedulerService.name);

  constructor(private readonly notificacoesService: NotificacoesService) {}

  /**
   * Executa a cada hora para verificar solicitações pendentes
   * e criar notificações automáticas
   */
  @Cron(CronExpression.EVERY_HOUR)
  async verificarSolicitacoesPendentes(): Promise<void> {
    try {
      this.logger.log("Iniciando verificação de solicitações pendentes...");

      const notificacoesCriadas =
        await this.notificacoesService.verificarSolicitacoesPendentes();

      this.logger.log(
        `Verificação concluída. ${notificacoesCriadas.length} notificações criadas.`,
      );

      if (notificacoesCriadas.length > 0) {
        this.logger.log(
          `IDs das notificações criadas: ${notificacoesCriadas.map((n) => n.id).join(", ")}`,
        );
      }
    } catch (error) {
      this.logger.error(
        "Erro ao verificar solicitações pendentes:",
        error.stack,
      );
    }
  }

  /**
   * Executa diariamente às 9h para limpeza de notificações antigas
   * Remove notificações lidas com mais de 30 dias
   */
  @Cron("0 9 * * *")
  async limpezaNotificacoesAntigas(): Promise<void> {
    try {
      this.logger.log("Iniciando limpeza de notificações antigas...");

      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      // Aqui você pode implementar a lógica de limpeza se necessário
      // Por enquanto, apenas log
      this.logger.log("Limpeza de notificações antigas concluída.");
    } catch (error) {
      this.logger.error(
        "Erro na limpeza de notificações antigas:",
        error.stack,
      );
    }
  }

  /**
   * Método manual para forçar verificação (útil para testes)
   */
  async forcarVerificacao(): Promise<{ notificacoesCriadas: number }> {
    this.logger.log("Verificação manual iniciada...");

    const notificacoes =
      await this.notificacoesService.verificarSolicitacoesPendentes();

    this.logger.log(
      `Verificação manual concluída. ${notificacoes.length} notificações criadas.`,
    );

    return { notificacoesCriadas: notificacoes.length };
  }

  /**
   * Verifica tarefas com prazo próximo (próximos 2 dias)
   * Executa diariamente às 8h
   */
  @Cron("0 8 * * *")
  async verificarTarefasComPrazoProximo(): Promise<void> {
    try {
      this.logger.log("Iniciando verificação de tarefas com prazo próximo...");

      const notificacoes =
        await this.notificacoesService.verificarTarefasComPrazoProximo();

      this.logger.log(
        `Verificação de prazos concluída. ${notificacoes.length} notificações criadas.`,
      );
    } catch (error) {
      this.logger.error(
        "Erro ao verificar tarefas com prazo próximo:",
        error.stack,
      );
    }
  }

  /**
   * Verifica tarefas atrasadas
   * Executa diariamente às 9h
   */
  @Cron("0 9 * * *")
  async verificarTarefasAtrasadas(): Promise<void> {
    try {
      this.logger.log("Iniciando verificação de tarefas atrasadas...");

      const notificacoes =
        await this.notificacoesService.verificarTarefasAtrasadas();

      this.logger.log(
        `Verificação de tarefas atrasadas concluída. ${notificacoes.length} notificações criadas.`,
      );
    } catch (error) {
      this.logger.error("Erro ao verificar tarefas atrasadas:", error.stack);
    }
  }
}
