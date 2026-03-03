import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kanbanService } from "@/services/kanbanService";

export interface ProjetoKanban {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  ativo: boolean;
  favorito?: boolean;
  total_tarefas?: number;
  total_membros?: number;
  progresso?: number;
}

type ProjetoApi = ProjetoKanban & {
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  ativo?: boolean;
  favorito?: boolean;
};

const QUERY_KEY = ["projetos"] as const;

const normalizeProjeto = (projeto: ProjetoApi): ProjetoKanban => ({
  ...projeto,
  data_criacao:
    projeto.data_criacao ||
    projeto.created_at ||
    projeto.createdAt ||
    undefined,
  data_atualizacao:
    projeto.data_atualizacao ||
    projeto.updated_at ||
    projeto.updatedAt ||
    undefined,
  ativo: projeto.ativo !== undefined ? projeto.ativo : true,
});

export const useProjetosKanban = (enabled = true) => {
  const queryClient = useQueryClient();

  const projetosQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await kanbanService.getProjetos();
      const projetos = Array.isArray(response)
        ? (response as ProjetoApi[])
        : [];
      return projetos.map(normalizeProjeto);
    },
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const invalidateProjetos = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createProjeto = useMutation({
    mutationFn: async (data: { nome: string; descricao?: string }) =>
      kanbanService.createProjeto(data),
    onSuccess: async () => {
      await invalidateProjetos();
    },
  });

  const updateProjeto = useMutation({
    mutationFn: async (input: {
      id: number;
      data: {
        nome?: string;
        descricao?: string;
        cor?: string;
        ativo?: boolean;
      };
    }) => kanbanService.updateProjeto(input.id, input.data),
    onSuccess: async () => {
      await invalidateProjetos();
    },
  });

  const deleteProjeto = useMutation({
    mutationFn: async (id: number) => {
      await kanbanService.deleteProjeto(id);
    },
    onSuccess: async () => {
      await invalidateProjetos();
    },
  });

  return {
    ...projetosQuery,
    projetos: projetosQuery.data ?? [],
    createProjeto,
    updateProjeto,
    deleteProjeto,
  };
};
