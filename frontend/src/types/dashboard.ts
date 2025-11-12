export interface DashboardCard {
  id: string;
  type: 'stats' | 'quick-actions' | 'tasks' | 'activity' | 'calendar' | 'online-users' | 'system-info';
  title: string;
  position: number;
  visible: boolean;
  size: 'small' | 'medium' | 'large' | 'full';
  gridColumn?: string;
}

export interface DashboardLayout {
  userId: number;
  cards: DashboardCard[];
  updatedAt: string;
}

export const DEFAULT_DASHBOARD_CARDS: DashboardCard[] = [
  {
    id: 'stats',
    type: 'stats',
    title: 'Estatísticas',
    position: 0,
    visible: true,
    size: 'large',
    gridColumn: 'col-span-1'
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Ações Rápidas',
    position: 1,
    visible: true,
    size: 'large',
    gridColumn: 'col-span-1'
  },
  {
    id: 'calendar',
    type: 'calendar',
    title: 'Calendário de Prazos',
    position: 2,
    visible: true,
    size: 'large',
    gridColumn: 'col-span-1'
  },
  {
    id: 'tasks',
    type: 'tasks',
    title: 'Minhas Tarefas',
    position: 3,
    visible: true,
    size: 'large',
    gridColumn: 'col-span-1'
  },
  {
    id: 'activity',
    type: 'activity',
    title: 'Atividade Recente',
    position: 4,
    visible: true,
    size: 'large',
    gridColumn: 'col-span-1'
  },
  {
    id: 'online-users',
    type: 'online-users',
    title: 'Usuários Online',
    position: 5,
    visible: true,
    size: 'large',
    gridColumn: 'col-span-1'
  }
];
