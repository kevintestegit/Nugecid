export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  solicitacao_pendente: "Solicitação Pendente",
  novo_processo: "Novo Processo",
  novo_desarquivamento: "Novo Desarquivamento",
  mencao: "Menção",
  tarefa_atribuida: "Tarefa Atribuída",
  tarefa_alterada: "Tarefa Alterada",
  tarefa_comentada: "Comentário",
  prazo_proximo: "Prazo Próximo",
  tarefa_atrasada: "Tarefa Atrasada",
  projeto_atualizado: "Projeto Atualizado",
  novo_registro: "Novo Registro",
  pasta_criada: "Pasta Criada",
  evento_auditoria: "Auditoria",
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<
  string,
  { label: string; description: string }
> = {
  solicitacao_pendente: {
    label: "Solicitações Pendentes",
    description: "Notificações de solicitações aguardando ação",
  },
  novo_processo: {
    label: "Novos Processos",
    description: "Novos processos de desarquivamento",
  },
  novo_desarquivamento: {
    label: "Novos Desarquivamentos",
    description: "Novos desarquivamentos registrados",
  },
  mencao: {
    label: "Menções",
    description: "Quando alguém menciona você",
  },
  tarefa_atribuida: {
    label: "Tarefas Atribuídas",
    description: "Quando uma tarefa é atribuída a você",
  },
  tarefa_alterada: {
    label: "Tarefas Alteradas",
    description: "Quando uma tarefa é modificada",
  },
  tarefa_comentada: {
    label: "Comentários em Tarefas",
    description: "Novos comentários em tarefas",
  },
  prazo_proximo: {
    label: "Prazos Próximos",
    description: "Alertas de prazos se aproximando",
  },
  tarefa_atrasada: {
    label: "Tarefas Atrasadas",
    description: "Tarefas que passaram do prazo",
  },
  projeto_atualizado: {
    label: "Projetos Atualizados",
    description: "Atualizações em projetos",
  },
  novo_registro: {
    label: "Novos Registros",
    description: "Novos registros no sistema",
  },
  pasta_criada: {
    label: "Pastas Criadas",
    description: "Novas pastas de arquivos",
  },
  evento_auditoria: {
    label: "Eventos de Auditoria",
    description: "Eventos de auditoria do sistema (apenas admins)",
  },
};

export const NOTIFICATION_PRIORITY_META: Record<
  string,
  { label: string; color: string }
> = {
  critica: {
    label: "Crítica",
    color: "bg-red-500/10 text-red-700 border-red-200",
  },
  alta: {
    label: "Alta",
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
  },
  media: {
    label: "Média",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  },
  baixa: {
    label: "Baixa",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
};

export type NotificationIconVariant = "clock" | "info" | "alert";

const CLOCK_NOTIFICATION_TYPES = new Set([
  "solicitacao_pendente",
  "prazo_proximo",
  "tarefa_atrasada",
]);

const INFO_NOTIFICATION_TYPES = new Set([
  "novo_processo",
  "novo_registro",
  "novo_desarquivamento",
]);

export const normalizeNotificationType = (value?: string): string =>
  (value || "").trim().toLowerCase();

export const normalizeNotificationPriority = (value?: string): string =>
  (value || "").trim().toLowerCase();

export const getNotificationIconVariant = (
  type?: string,
): NotificationIconVariant => {
  const normalizedType = normalizeNotificationType(type);

  if (CLOCK_NOTIFICATION_TYPES.has(normalizedType)) {
    return "clock";
  }

  if (INFO_NOTIFICATION_TYPES.has(normalizedType)) {
    return "info";
  }

  return "alert";
};
