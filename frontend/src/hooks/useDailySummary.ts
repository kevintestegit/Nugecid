import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

interface ResumoItem {
  id: number;
  nomeCompleto: string;
  numeroProcesso: string | null;
  status: string;
  dataSolicitacao: string;
  setorDemandante: string;
}

interface ResumoGrupo {
  data: string;
  total: number;
  itens: ResumoItem[];
}

interface ResumoDiarioResponse {
  success: boolean;
  data: ResumoGrupo[];
  totalGeral: number;
}

const DISMISS_KEY = "daily_summary_dismissed_at";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function isDismissedToday(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  return dismissed === getTodayKey();
}

export function useDailySummary() {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery<ResumoDiarioResponse>({
    queryKey: ["resumo-diario"],
    queryFn: () => api.get("/nugecid/resumo-diario").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !isDismissedToday(),
  });

  useEffect(() => {
    if (data && data.totalGeral > 0 && !isDismissedToday()) {
      setIsOpen(true);
    }
  }, [data]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, getTodayKey());
    setIsOpen(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    isLoading,
    grupos: data?.data ?? [],
    totalGeral: data?.totalGeral ?? 0,
    dismiss,
    close,
  };
}
