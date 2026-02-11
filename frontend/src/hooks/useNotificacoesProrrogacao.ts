import { useState, useEffect, useCallback } from "react";
import { Desarquivamento, StatusDesarquivamento } from "@/types";
import { toast } from "sonner";
import { prorrogacaoService } from "@/services/prorrogacaoService";

interface NotificacaoProrrogacao {
  id: string;
  desarquivamento: Desarquivamento;
  diasSolicitacao: number;
  prioridade: "alta" | "media" | "baixa";
  lida: boolean;
}

interface UseNotificacoesProrrogacaoReturn {
  notificacoes: NotificacaoProrrogacao[];
  notificacoesNaoLidas: number;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;
  processarProrrogacao: (
    id: number,
    aprovada: boolean,
    observacoes?: string,
  ) => Promise<void>;
  atualizarNotificacoes: (desarquivamentos: Desarquivamento[]) => void;
}

const STORAGE_KEY = "nugecid_notificacoes_lidas";

export const useNotificacoesProrrogacao =
  (): UseNotificacoesProrrogacaoReturn => {
    const [notificacoes, setNotificacoes] = useState<NotificacaoProrrogacao[]>(
      [],
    );
    const [notificacoesLidas, setNotificacoesLidas] = useState<Set<string>>(
      new Set(),
    );

    // Carregar notificações lidas do localStorage
    useEffect(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const lidas = JSON.parse(stored) as string[];
          setNotificacoesLidas(new Set(lidas));
        }
      } catch (error) {
        console.error("Erro ao carregar notificações lidas:", error);
      }
    }, []);

    // Salvar notificações lidas no localStorage
    const salvarNotificacoesLidas = useCallback((lidas: Set<string>) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(lidas)));
      } catch (error) {
        console.error("Erro ao salvar notificações lidas:", error);
      }
    }, []);

    // Calcular prioridade baseada nos dias de solicitação
    const calcularPrioridade = (
      diasSolicitacao: number,
    ): "alta" | "media" | "baixa" => {
      if (diasSolicitacao > 10) return "alta";
      if (diasSolicitacao > 7) return "media";
      return "baixa";
    };

    // Atualizar notificações baseado nos desarquivamentos
    const atualizarNotificacoes = useCallback(
      (desarquivamentos: Desarquivamento[]) => {
        const hoje = new Date();

        const novasNotificacoes = desarquivamentos
          .filter(
            (d) =>
              d.solicitacaoProrrogacao &&
              d.status !== StatusDesarquivamento.FINALIZADO &&
              d.status !== StatusDesarquivamento.NAO_LOCALIZADO,
          )
          .map((d) => {
            const solicitacaoDate = new Date(d.dataSolicitacao);
            const diffTime = hoje.getTime() - solicitacaoDate.getTime();
            const diasSolicitacao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              id: `prorrogacao_${d.id}`,
              desarquivamento: d,
              diasSolicitacao,
              prioridade: calcularPrioridade(diasSolicitacao),
              lida: notificacoesLidas.has(`prorrogacao_${d.id}`),
            };
          })
          .sort((a, b) => {
            // Ordenar por prioridade e depois por dias de solicitação
            const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
            if (
              prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]
            ) {
              return (
                prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade]
              );
            }
            return b.diasSolicitacao - a.diasSolicitacao;
          });

        setNotificacoes(novasNotificacoes);
      },
      [notificacoesLidas],
    );

    // Marcar notificação como lida
    const marcarComoLida = useCallback(
      (id: string) => {
        const novasLidas = new Set(notificacoesLidas);
        novasLidas.add(id);
        setNotificacoesLidas(novasLidas);
        salvarNotificacoesLidas(novasLidas);

        setNotificacoes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
        );
      },
      [notificacoesLidas, salvarNotificacoesLidas],
    );

    // Marcar todas as notificações como lidas
    const marcarTodasComoLidas = useCallback(() => {
      const todasAsIds = new Set([
        ...notificacoesLidas,
        ...notificacoes.map((n) => n.id),
      ]);

      setNotificacoesLidas(todasAsIds);
      salvarNotificacoesLidas(todasAsIds);

      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));

      toast.success("Todas as notificações foram marcadas como lidas");
    }, [notificacoes, notificacoesLidas, salvarNotificacoesLidas]);

    // Processar prorrogação (aprovar/negar)
    const processarProrrogacao = useCallback(
      async (id: number, aprovada: boolean, observacoes?: string) => {
        try {
          // Usar o serviço de prorrogação
          await prorrogacaoService.simularProcessamento(
            String(id),
            aprovada,
            observacoes,
          );

          // Marcar como lida após processar
          marcarComoLida(`prorrogacao_${id}`);

          // Marcar notificação como lida no backend
          await prorrogacaoService.marcarNotificacaoLida(String(id));

          // Remover da lista de notificações após processar
          setNotificacoes((prev) =>
            prev.filter((n) => n.desarquivamento.id !== id),
          );

          const acao = aprovada ? "aprovada" : "negada";
          toast.success(`Prorrogação ${acao} com sucesso!`);
        } catch (error) {
          console.error("Erro ao processar prorrogação:", error);
          toast.error("Erro ao processar prorrogação");
          throw error;
        }
      },
      [marcarComoLida],
    );

    // Calcular número de notificações não lidas
    const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;

    // Mostrar toast para novas notificações de alta prioridade
    useEffect(() => {
      const altaPrioridadeNaoLidas = notificacoes.filter(
        (n) => n.prioridade === "alta" && !n.lida,
      );

      if (altaPrioridadeNaoLidas.length > 0) {
        const count = altaPrioridadeNaoLidas.length;
        toast.warning(
          `${count} ${count === 1 ? "prorrogação urgente" : "prorrogações urgentes"} ${count === 1 ? "requer" : "requerem"} atenção!`,
          {
            duration: 5000,
            action: {
              label: "Ver",
              onClick: () => {
                // Scroll para o componente de notificações
                const element = document.getElementById(
                  "prorrogacao-notifications",
                );
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              },
            },
          },
        );
      }
    }, [notificacoes]);

    return {
      notificacoes,
      notificacoesNaoLidas,
      marcarComoLida,
      marcarTodasComoLidas,
      processarProrrogacao,
      atualizarNotificacoes,
    };
  };

export default useNotificacoesProrrogacao;
