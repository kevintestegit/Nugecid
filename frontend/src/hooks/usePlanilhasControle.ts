import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface PlanilhaControle {
  id: string;
  nomeOriginal: string;
  tamanhoBytes: number;
  dataUpload: string;
  url: string;
}

export interface PlanilhaGeralLinha {
  [coluna: string]: string;
}

export interface PlanilhaGeralGrupo {
  pastaId: string;
  pastaNome: string;
  totalPlanilhas: number;
  totalItens: number;
  planilhas: Array<{
    planilhaId: string;
    planilhaNome: string;
    sheetName: string;
    totalItens: number;
  }>;
}

export interface PlanilhaGeralResumo {
  totalPastas: number;
  totalPlanilhas: number;
  totalItens: number;
  colunas: string[];
  linhas: PlanilhaGeralLinha[];
  grupos: PlanilhaGeralGrupo[];
}

const normalizePlanilhaControle = (
  payload: Record<string, unknown>,
): PlanilhaControle => {
  if (!payload) {
    return {
      id: "",
      nomeOriginal: "",
      tamanhoBytes: 0,
      dataUpload: "",
      url: "",
    };
  }

  return {
    id: String(payload.id ?? payload.planilhaId ?? ""),
    nomeOriginal: String(
      payload.nomeOriginal ?? payload.nome_original ?? payload.nome ?? "",
    ),
    tamanhoBytes: Number(
      payload.tamanhoBytes ?? payload.tamanho_bytes ?? payload.tamanho ?? 0,
    ),
    dataUpload: String(
      payload.dataUpload ?? payload.data_upload ?? payload.createdAt ?? "",
    ),
    url: String(payload.url ?? payload.downloadUrl ?? ""),
  };
};

const fetchPlanilhasControle = async (): Promise<PlanilhaControle[]> => {
  const { data } = await api.get("/planilhas");

  if (Array.isArray(data)) {
    return data.map(normalizePlanilhaControle);
  }

  if (Array.isArray(data?.data)) {
    return data.data.map(normalizePlanilhaControle);
  }

  return [];
};

const uploadPlanilhaControle = async (
  file: File,
): Promise<PlanilhaControle> => {
  const formData = new FormData();
  formData.append("planilha", file);

  const { data } = await api.post("/planilhas", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return normalizePlanilhaControle(data);
};

const deletePlanilhaControle = async (id: string): Promise<void> => {
  await api.delete(`/planilhas/${id}`);
};

const normalizePlanilhaGeral = (
  payload: Record<string, unknown> | null,
): PlanilhaGeralResumo => {
  const defaultValue: PlanilhaGeralResumo = {
    totalPastas: 0,
    totalPlanilhas: 0,
    totalItens: 0,
    colunas: [],
    linhas: [],
    grupos: [],
  };

  if (!payload || typeof payload !== "object") {
    return defaultValue;
  }

  const colunas = Array.isArray(payload.colunas)
    ? payload.colunas.map((coluna: unknown) => String(coluna ?? ""))
    : [];

  const linhas = Array.isArray(payload.linhas)
    ? payload.linhas.map((linha: unknown) => {
        const normalizado: PlanilhaGeralLinha = {};
        if (linha && typeof linha === "object") {
          Object.entries(linha as Record<string, unknown>).forEach(
            ([chave, valor]) => {
              normalizado[String(chave)] =
                valor !== null && valor !== undefined ? String(valor) : "";
            },
          );
        }
        return normalizado;
      })
    : [];

  const grupos = Array.isArray(payload.grupos)
    ? payload.grupos.map((grupo: Record<string, unknown>) => ({
        pastaId: String(grupo?.pastaId ?? grupo?.pasta_id ?? ""),
        pastaNome: String(grupo?.pastaNome ?? grupo?.pasta_nome ?? ""),
        totalPlanilhas: Number(
          grupo?.totalPlanilhas ?? grupo?.total_planilhas ?? 0,
        ),
        totalItens: Number(grupo?.totalItens ?? grupo?.total_itens ?? 0),
        planilhas: Array.isArray(grupo?.planilhas)
          ? (grupo.planilhas as Record<string, unknown>[]).map(
              (planilha: Record<string, unknown>) => ({
                planilhaId: String(
                  planilha?.planilhaId ?? planilha?.planilha_id ?? "",
                ),
                planilhaNome: String(
                  planilha?.planilhaNome ?? planilha?.planilha_nome ?? "",
                ),
                sheetName: String(
                  planilha?.sheetName ?? planilha?.sheet_name ?? "",
                ),
                totalItens: Number(
                  planilha?.totalItens ?? planilha?.total_itens ?? 0,
                ),
              }),
            )
          : [],
      }))
    : [];

  return {
    totalPastas: Number(
      payload.totalPastas ?? payload.total_pastas ?? grupos.length ?? 0,
    ),
    totalPlanilhas: Number(
      payload.totalPlanilhas ?? payload.total_planilhas ?? 0,
    ),
    totalItens: Number(payload.totalItens ?? payload.total_itens ?? 0),
    colunas,
    linhas,
    grupos,
  };
};

const fetchPlanilhaGeral = async (): Promise<PlanilhaGeralResumo> => {
  const { data } = await api.get("/planilhas/geral");
  return normalizePlanilhaGeral(data);
};

export function usePlanilhasControle() {
  const queryClient = useQueryClient();

  const {
    data: planilhas,
    isLoading,
    error,
  } = useQuery<PlanilhaControle[]>({
    queryKey: ["planilhas-controle"],
    queryFn: fetchPlanilhasControle,
  });

  const {
    data: planilhaGeral,
    isLoading: isLoadingPlanilhaGeral,
    error: planilhaGeralError,
    refetch: refetchPlanilhaGeral,
  } = useQuery<PlanilhaGeralResumo>({
    queryKey: ["planilhas-controle", "geral"],
    queryFn: fetchPlanilhaGeral,
    staleTime: 30 * 1000,
  });

  const uploadMutation = useMutation<PlanilhaControle, Error, File>({
    mutationFn: uploadPlanilhaControle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planilhas-controle"] });
      queryClient.invalidateQueries({
        queryKey: ["planilhas-controle", "geral"],
      });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deletePlanilhaControle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planilhas-controle"] });
      queryClient.invalidateQueries({
        queryKey: ["planilhas-controle", "geral"],
      });
    },
  });

  return {
    planilhas: planilhas ?? [],
    isLoading,
    error,
    uploadPlanilha: uploadMutation.mutateAsync,
    isUploadingPlanilha: uploadMutation.isPending,
    deletePlanilha: deleteMutation.mutateAsync,
    isDeletingPlanilha: deleteMutation.isPending,
    planilhaGeral: planilhaGeral ?? normalizePlanilhaGeral(null),
    isLoadingPlanilhaGeral,
    planilhaGeralError,
    refetchPlanilhaGeral,
  };
}
