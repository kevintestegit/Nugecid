import type { Notificacao } from "@/services/notificacoesService";

type NotificationNavigationTarget = Pick<
  Notificacao,
  "link" | "processoId" | "solicitacaoId" | "tarefaId"
>;

export const getNotificationDestination = (
  notificacao: NotificationNavigationTarget,
): string | null => {
  if (notificacao.link) {
    return notificacao.link;
  }

  if (notificacao.processoId) {
    return `/desarquivamentos/${notificacao.processoId}`;
  }

  if (notificacao.solicitacaoId) {
    return `/desarquivamentos/${notificacao.solicitacaoId}`;
  }

  if (notificacao.tarefaId) {
    return `/tarefas/${notificacao.tarefaId}`;
  }

  return null;
};
