export type RouteMetadata = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
};

const DEFAULT_METADATA: RouteMetadata = {
  title: "SGC-ITEP",
  description:
    "Sistema interno de gestão documental, desarquivamento, arquivo e apoio operacional do ITEP.",
  canonicalPath: "/",
  robots: "noindex, nofollow",
};

const ROUTE_METADATA: Array<{
  match: RegExp;
  metadata: RouteMetadata;
}> = [
  {
    match: /^\/login$/,
    metadata: {
      title: "Entrar | SGC-ITEP",
      description:
        "Acesso ao sistema interno de gestão documental e desarquivamento do ITEP.",
      canonicalPath: "/login",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/$/,
    metadata: {
      title: "Dashboard | SGC-ITEP",
      description:
        "Visão geral operacional com métricas, tarefas e atalhos do sistema SGC-ITEP.",
      canonicalPath: "/",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/desarquivamentos$/,
    metadata: {
      title: "Desarquivamentos | SGC-ITEP",
      description:
        "Consulta, filtro e acompanhamento das solicitações de desarquivamento.",
      canonicalPath: "/desarquivamentos",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/desarquivamentos\/novo$/,
    metadata: {
      title: "Novo Desarquivamento | SGC-ITEP",
      description:
        "Cadastro de nova solicitação de desarquivamento no fluxo documental do ITEP.",
      canonicalPath: "/desarquivamentos/novo",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/desarquivamentos\/\d+$/,
    metadata: {
      title: "Detalhe do Desarquivamento | SGC-ITEP",
      description:
        "Detalhes, anexos, histórico e acompanhamento de uma solicitação de desarquivamento.",
      canonicalPath: "/desarquivamentos/:id",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/desarquivamentos\/\d+\/editar$/,
    metadata: {
      title: "Editar Desarquivamento | SGC-ITEP",
      description:
        "Atualização dos dados operacionais e documentais da solicitação de desarquivamento.",
      canonicalPath: "/desarquivamentos/:id/editar",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/desarquivamentos\/\d+\/termo\/visualizar$/,
    metadata: {
      title: "Pré-visualização do Termo | SGC-ITEP",
      description:
        "Pré-visualização do termo de desarquivamento para conferência, impressão e exportação.",
      canonicalPath: "/desarquivamentos/:id/termo/visualizar",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/arquivo(\/.*)?$/,
    metadata: {
      title: "Arquivo | SGC-ITEP",
      description:
        "Consulta de pastas, planilhas e documentos armazenados no acervo do sistema.",
      canonicalPath: "/arquivo",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/usuarios(\/.*)?$/,
    metadata: {
      title: "Usuários | SGC-ITEP",
      description:
        "Gestão de usuários, perfis e permissões de acesso do sistema.",
      canonicalPath: "/usuarios",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/configuracoes$/,
    metadata: {
      title: "Configurações | SGC-ITEP",
      description:
        "Configurações funcionais e operacionais do sistema interno SGC-ITEP.",
      canonicalPath: "/configuracoes",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/relatorios$/,
    metadata: {
      title: "Relatórios | SGC-ITEP",
      description:
        "Relatórios e indicadores operacionais do sistema de gestão documental.",
      canonicalPath: "/relatorios",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/tarefas(\/.*)?$/,
    metadata: {
      title: "Tarefas | SGC-ITEP",
      description:
        "Acompanhamento de tarefas, projetos e atividades operacionais associadas ao sistema.",
      canonicalPath: "/tarefas",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/projetos(\/.*)?$/,
    metadata: {
      title: "Projetos | SGC-ITEP",
      description:
        "Gestão de projetos e quadros operacionais de apoio no SGC-ITEP.",
      canonicalPath: "/projetos",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/custodia(\/.*)?$/,
    metadata: {
      title: "Custódia de Vestígios | SGC-ITEP",
      description:
        "Consulta operacional relacionada à custódia e banco de vestígios.",
      canonicalPath: "/custodia",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/sobre$/,
    metadata: {
      title: "Sobre o Sistema | SGC-ITEP",
      description:
        "Visão geral do sistema interno de gestão documental e desarquivamento do ITEP.",
      canonicalPath: "/sobre",
      robots: "noindex, nofollow",
    },
  },
  {
    match: /^\/404$/,
    metadata: {
      title: "Página não encontrada | SGC-ITEP",
      description: "A rota solicitada não foi encontrada no sistema SGC-ITEP.",
      canonicalPath: "/404",
      robots: "noindex, nofollow",
    },
  },
];

export function getRouteMetadata(pathname: string): RouteMetadata {
  const entry = ROUTE_METADATA.find(({ match }) => match.test(pathname));
  return entry?.metadata ?? DEFAULT_METADATA;
}
