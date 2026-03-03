import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiService } from "@/services/api";

export interface PastaArquivo {
  id: string;
  tipo: "IMAGEM" | "PLANILHA";
  nomeOriginal: string;
  tamanhoBytes: number;
  dataUpload: string;
  url: string;
  previewUrl?: string;
}

export interface Pasta {
  id: string;
  nome: string;
  descricao: string;
  imagens: number;
  planilhas: number;
  dataCriacao: string;
  tags: string[];
  arquivos: PastaArquivo[];
}

export interface CreatePastaInput {
  nome: string;
  descricao: string;
  tags: string[];
  imagens?: File[];
  planilhas?: File[];
}

export interface UpdatePastaInput {
  id: string;
  nome?: string;
  descricao?: string;
  tags?: string[];
}

export interface UploadArquivosInput {
  pastaId: string;
  imagens?: File[];
  planilhas?: File[];
}

export interface PastaItem {
  id: string;
  pastaId: string;
  pastaNome: string;
  planilhaId: string;
  planilhaNome: string;
  sheetName: string;
  linha: number;
  destaque: string;
  valores: Record<string, string>;
}

export interface PastaPlanilhaDetalhe {
  planilhaId: string;
  planilhaNome: string;
  sheetName: string;
  colunas: string[];
  itens: PastaItem[];
}

export interface PastaDetalhes {
  pasta: Pasta;
  totalItens: number;
  planilhas: PastaPlanilhaDetalhe[];
}

const normalizePasta = (payload: Record<string, unknown> | null): Pasta => {
  if (!payload) {
    return {
      id: "",
      nome: "",
      descricao: "",
      imagens: 0,
      planilhas: 0,
      dataCriacao: "",
      tags: [],
      arquivos: [],
    };
  }

  const base = ((payload as Record<string, unknown>)?.data ??
    payload) as Record<string, unknown>;

  return {
    ...base,
    tags: Array.isArray(base?.tags) ? base.tags : [],
    arquivos: Array.isArray(base?.arquivos) ? base.arquivos : [],
  } as Pasta;
};

const normalizePastaList = (payload: unknown): Pasta[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      normalizePasta(item as Record<string, unknown>),
    );
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as Record<string, unknown>).data)
  ) {
    return (
      (payload as Record<string, unknown>).data as Record<string, unknown>[]
    ).map(normalizePasta);
  }

  return [];
};

const normalizePastaItem = (
  payload: Record<string, unknown> | null,
): PastaItem => {
  if (!payload) {
    return {
      id: "",
      pastaId: "",
      pastaNome: "",
      planilhaId: "",
      planilhaNome: "",
      sheetName: "",
      linha: 0,
      destaque: "",
      valores: {},
    };
  }

  const valores =
    payload.valores && typeof payload.valores === "object"
      ? payload.valores
      : {};

  return {
    id: String(payload.id ?? ""),
    pastaId: String(payload.pastaId ?? payload.pasta_id ?? ""),
    pastaNome: String(payload.pastaNome ?? payload.pasta_nome ?? ""),
    planilhaId: String(payload.planilhaId ?? payload.planilha_id ?? ""),
    planilhaNome: String(payload.planilhaNome ?? payload.planilha_nome ?? ""),
    sheetName: String(payload.sheetName ?? payload.sheet_name ?? ""),
    linha: Number(payload.linha ?? payload.row ?? 0),
    destaque: String(payload.destaque ?? ""),
    valores: valores as Record<string, string>,
  };
};

const normalizePlanilhaDetalhe = (
  payload: Record<string, unknown> | null,
): PastaPlanilhaDetalhe => {
  if (!payload) {
    return {
      planilhaId: "",
      planilhaNome: "",
      sheetName: "",
      colunas: [],
      itens: [],
    };
  }

  return {
    planilhaId: String(payload.planilhaId ?? payload.planilha_id ?? ""),
    planilhaNome: String(payload.planilhaNome ?? payload.planilha_nome ?? ""),
    sheetName: String(payload.sheetName ?? payload.sheet_name ?? ""),
    colunas: Array.isArray(payload.colunas)
      ? payload.colunas.map((col: unknown) => String(col ?? ""))
      : [],
    itens: Array.isArray(payload.itens)
      ? payload.itens.map((item: unknown) =>
          normalizePastaItem(item as Record<string, unknown>),
        )
      : [],
  };
};

const normalizePastaDetalhes = (
  payload: Record<string, unknown> | null,
): PastaDetalhes => {
  const base = (payload?.data ?? payload ?? {}) as Record<string, unknown>;
  const pasta = normalizePasta(base?.pasta as Record<string, unknown> | null);

  return {
    pasta,
    totalItens: Number(base?.totalItens ?? base?.total_itens ?? 0),
    planilhas: Array.isArray(base?.planilhas)
      ? (base.planilhas as Record<string, unknown>[]).map(
          normalizePlanilhaDetalhe,
        )
      : [],
  };
};

const fetchPastas = async (): Promise<Pasta[]> => {
  const { data } = await api.get("/pastas");
  return normalizePastaList(data);
};

const createPasta = async (input: CreatePastaInput): Promise<Pasta> => {
  const formData = new FormData();
  formData.append("nome", input.nome);
  formData.append("descricao", input.descricao);
  formData.append("tags", JSON.stringify(input.tags ?? []));

  input.imagens?.forEach((file) => {
    formData.append("imagens", file);
  });

  input.planilhas?.forEach((file) => {
    formData.append("planilha", file);
  });

  const { data } = await api.post("/pastas", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return normalizePasta(data);
};

const deletePasta = async (id: string): Promise<void> => {
  await api.delete(`/pastas/${id}`);
};

const updatePasta = async ({
  id,
  ...payload
}: UpdatePastaInput): Promise<Pasta> => {
  const { data } = await api.patch(`/pastas/${id}`, {
    ...payload,
    tags: payload.tags ?? undefined,
  });
  return normalizePasta(data);
};

const deletePastaArquivo = async (input: {
  pastaId: string;
  arquivoId: string;
}): Promise<void> => {
  await apiService.deletePastaArquivo(input.pastaId, input.arquivoId);
};

const fetchPastaDetalhes = async (id: string): Promise<PastaDetalhes> => {
  const { data } = await api.get(`/pastas/${id}/itens`);
  return normalizePastaDetalhes(data);
};

const uploadArquivos = async (input: UploadArquivosInput): Promise<Pasta> => {
  const { pastaId, imagens, planilhas } = input;

  if (!imagens?.length && !planilhas?.length) {
    throw new Error("Selecione ao menos um arquivo para enviar.");
  }

  const formData = new FormData();

  imagens?.forEach((file) => {
    formData.append("imagens", file);
  });

  planilhas?.forEach((file) => {
    formData.append("planilha", file);
  });

  const { data } = await api.post(`/pastas/${pastaId}/arquivos`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return normalizePasta(data);
};

export function usePastas() {
  const queryClient = useQueryClient();

  const {
    data: pastas,
    isLoading,
    error,
  } = useQuery<Pasta[]>({
    queryKey: ["pastas"],
    queryFn: fetchPastas,
  });

  const createPastaMutation = useMutation<Pasta, Error, CreatePastaInput>({
    mutationFn: createPasta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      queryClient.invalidateQueries({ queryKey: ["pastas", "item-search"] });
    },
  });

  const deletePastaMutation = useMutation<void, Error, string>({
    mutationFn: deletePasta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      queryClient.invalidateQueries({ queryKey: ["pastas", "item-search"] });
    },
  });

  const updatePastaMutation = useMutation<Pasta, Error, UpdatePastaInput>({
    mutationFn: updatePasta,
    onSuccess: (_pasta, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ["pastas", "detalhes", variables.id],
        });
      }
    },
  });

  const uploadArquivosMutation = useMutation<Pasta, Error, UploadArquivosInput>(
    {
      mutationFn: uploadArquivos,
      onSuccess: (_pasta, variables) => {
        queryClient.invalidateQueries({ queryKey: ["pastas"] });
        if (variables?.pastaId) {
          queryClient.invalidateQueries({
            queryKey: ["pastas", "detalhes", variables.pastaId],
          });
        }
        queryClient.invalidateQueries({ queryKey: ["pastas", "item-search"] });
        queryClient.invalidateQueries({
          queryKey: ["planilhas-controle", "geral"],
        });
      },
    },
  );

  const deleteArquivoMutation = useMutation<
    void,
    Error,
    { pastaId: string; arquivoId: string }
  >({
    mutationFn: deletePastaArquivo,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      if (variables?.pastaId) {
        queryClient.invalidateQueries({
          queryKey: ["pastas", "detalhes", variables.pastaId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["pastas", "item-search"] });
      queryClient.invalidateQueries({
        queryKey: ["planilhas-controle", "geral"],
      });
    },
  });

  return {
    pastas: pastas ?? [],
    isLoading,
    error,
    createPasta: createPastaMutation.mutateAsync,
    deletePasta: deletePastaMutation.mutateAsync,
    updatePasta: updatePastaMutation.mutateAsync,
    uploadArquivos: uploadArquivosMutation.mutateAsync,
    isUploadingArquivos: uploadArquivosMutation.isPending,
    deleteArquivo: deleteArquivoMutation.mutateAsync,
    isDeletingArquivo: deleteArquivoMutation.isPending,
    isUpdatingPasta: updatePastaMutation.isPending,
  };
}

export function usePastaDetalhes(pastaId?: string) {
  return useQuery<PastaDetalhes>({
    queryKey: ["pastas", "detalhes", pastaId],
    queryFn: () => fetchPastaDetalhes(pastaId as string),
    enabled: Boolean(pastaId),
    staleTime: 30 * 1000,
  });
}
