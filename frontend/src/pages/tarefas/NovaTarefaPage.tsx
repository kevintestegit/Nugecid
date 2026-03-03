import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import TarefaForm from "@/components/tarefas/TarefaForm";
import { useTarefas } from "@/hooks/useTarefas";
import { useUsers } from "@/hooks/useUsers";
import { CreateTarefaDto } from "@/types";
import { api } from "@/services/api";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ProjetoResumo {
  id: number;
  nome: string;
}

interface ColunaResumo {
  id: number;
  nome: string;
  ordem: number;
}

interface NovaTarefaLocationState {
  projetoId?: number;
  colunaId?: number;
}

const NovaTarefaPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as NovaTarefaLocationState | undefined;

  const initialProjetoId = locationState?.projetoId ?? null;
  const initialColunaId = locationState?.colunaId ?? null;

  const { createTarefa, loading: creatingTask } = useTarefas();
  const { data: usersResponse, isLoading: loadingUsers } = useUsers({
    page: 1,
    limit: 1000,
  });
  const usuarios = usersResponse?.data ?? [];

  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [colunas, setColunas] = useState<ColunaResumo[]>([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState<number | null>(
    initialProjetoId,
  );
  const [selectedColunaId, setSelectedColunaId] = useState<number | null>(
    initialColunaId,
  );
  const [defaultProjetoId, setDefaultProjetoId] = useState<number | null>(
    initialProjetoId,
  );
  const [defaultColunaId, setDefaultColunaId] = useState<number | null>(
    initialColunaId,
  );
  const [loadingProjetos, setLoadingProjetos] = useState(false);
  const [loadingColunas, setLoadingColunas] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const selectedProjetoRef = useRef<number | null>(initialProjetoId);
  const initialColunaRef = useRef<number | null>(initialColunaId);

  const fetchProjetos = useCallback(async () => {
    setLoadingProjetos(true);
    try {
      const response = await api.get<ApiResponse<ProjetoResumo[]>>("/projetos");
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Não foi possível carregar os projetos.",
        );
      }

      const lista = response.data.data ?? [];
      setProjetos(lista);

      if (!lista.length) {
        setSelectedProjetoId(null);
        selectedProjetoRef.current = null;
        setDefaultProjetoId(null);
        setColunas([]);
        setSelectedColunaId(null);
        setDefaultColunaId(null);
        initialColunaRef.current = null;
        return;
      }

      let nextProjetoId = selectedProjetoRef.current;
      if (nextProjetoId && !lista.some((proj) => proj.id === nextProjetoId)) {
        nextProjetoId = null;
      }
      if (
        !nextProjetoId &&
        initialProjetoId &&
        lista.some((proj) => proj.id === initialProjetoId)
      ) {
        nextProjetoId = initialProjetoId;
      }
      if (!nextProjetoId) {
        nextProjetoId = lista[0].id;
      }

      selectedProjetoRef.current = nextProjetoId;
      setSelectedProjetoId(nextProjetoId);
      setDefaultProjetoId(nextProjetoId);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      toast.error("Não foi possível carregar a lista de projetos.");
    } finally {
      setLoadingProjetos(false);
    }
  }, [initialProjetoId]);

  useEffect(() => {
    fetchProjetos();
  }, [fetchProjetos]);

  useEffect(() => {
    selectedProjetoRef.current = selectedProjetoId;
    if (selectedProjetoId !== initialProjetoId) {
      initialColunaRef.current = null;
    }
  }, [selectedProjetoId, initialProjetoId]);

  useEffect(() => {
    const fetchColunas = async () => {
      if (!selectedProjetoRef.current) {
        setColunas([]);
        setSelectedColunaId(null);
        setDefaultColunaId(null);
        initialColunaRef.current = null;
        return;
      }

      setLoadingColunas(true);
      try {
        const response = await api.get<ApiResponse<ColunaResumo[]>>(
          "/colunas",
          {
            params: { projetoId: selectedProjetoRef.current },
          },
        );
        if (!response.data.success) {
          throw new Error(
            response.data.message || "Não foi possível carregar as colunas.",
          );
        }

        const lista = (response.data.data ?? []).sort(
          (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
        );
        setColunas(lista);

        if (!lista.length) {
          setSelectedColunaId(null);
          setDefaultColunaId(null);
          initialColunaRef.current = null;
          return;
        }

        let nextColunaId = initialColunaRef.current;
        if (nextColunaId && !lista.some((col) => col.id === nextColunaId)) {
          nextColunaId = null;
        }
        if (!nextColunaId) {
          nextColunaId = lista[0].id;
        }

        setSelectedColunaId(nextColunaId);
        setDefaultColunaId(nextColunaId);
        initialColunaRef.current = nextColunaId;
      } catch (error) {
        console.error("Erro ao carregar colunas:", error);
        toast.error(
          "Não foi possível carregar as colunas do projeto selecionado.",
        );
        setColunas([]);
        setSelectedColunaId(null);
        setDefaultColunaId(null);
        initialColunaRef.current = null;
      } finally {
        setLoadingColunas(false);
      }
    };

    fetchColunas();
  }, [selectedProjetoId]);

  const handleProjetoChange = useCallback((projetoId: number | null) => {
    setSelectedProjetoId(projetoId);
    selectedProjetoRef.current = projetoId;
    initialColunaRef.current = null;
    setSelectedColunaId(null);
    setDefaultColunaId(null);
  }, []);

  const handleColunaChange = useCallback((colunaId: number | null) => {
    setSelectedColunaId(colunaId);
    setDefaultColunaId(colunaId);
    initialColunaRef.current = colunaId;
  }, []);

  const handleFormChange = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      const projetoId =
        formData?.projetoId ?? selectedProjetoRef.current ?? defaultProjetoId;
      const colunaId =
        formData?.colunaId ?? selectedColunaId ?? defaultColunaId;

      if (!projetoId || !colunaId) {
        toast.error(
          "Selecione um projeto e uma coluna válidos antes de salvar a tarefa.",
        );
        return;
      }

      const payload = {
        ...(formData as Record<string, unknown>),
        projetoId,
        colunaId,
      } as unknown as CreateTarefaDto;

      const novaTarefa = await createTarefa(payload);
      toast.success("Tarefa criada com sucesso!");
      setIsDirty(false);
      if (novaTarefa) {
        navigate(`/tarefas/${novaTarefa.id}`);
      } else {
        navigate("/tarefas");
      }
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast.error("Erro ao criar tarefa. Tente novamente.");
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
      return;
    }
    navigate("/tarefas");
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    navigate("/tarefas");
  };

  const combinedLoading =
    creatingTask || loadingUsers || loadingProjetos || loadingColunas;
  const isReady = projetos.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header glassmorphism */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/tarefas")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Nova Tarefa
              </h1>
              <p className="text-muted-foreground">
                Crie uma nova tarefa para você ou sua equipe
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-6 border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Informações da Tarefa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReady ? (
            <TarefaForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={combinedLoading}
              submitLabel="Criar Tarefa"
              cancelLabel="Cancelar"
              usuarios={usuarios}
              projetos={projetos}
              colunas={colunas}
              defaultProjetoId={defaultProjetoId ?? undefined}
              defaultColunaId={defaultColunaId ?? undefined}
              onProjetoChange={handleProjetoChange}
              onColunaChange={handleColunaChange}
              onChange={handleFormChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Loader2 className="mb-4 h-6 w-6 animate-spin text-muted-foreground" />
              <p>
                Não encontramos projetos disponíveis. Crie um projeto antes de
                cadastrar tarefas.
              </p>
              <Button className="mt-4" onClick={() => navigate("/projetos")}>
                Criar projeto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">
            Dicas para criar uma boa tarefa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Título claro</h4>
              <p>
                Use um título descritivo que explique o que precisa ser feito.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Descrição detalhada
              </h4>
              <p>
                Inclua todos os detalhes necessários para completar a tarefa.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Prazo realista
              </h4>
              <p>Defina um prazo que seja desafiador, mas alcançável.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Responsável correto
              </h4>
              <p>
                Atribua a tarefa para a pessoa mais adequada para executá-la.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EnhancedConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Cancelar criação de tarefa"
        description="Deseja realmente cancelar? As alterações não salvas serão perdidas."
        variant="warning"
        confirmationType="none"
      />
    </div>
  );
};

export default NovaTarefaPage;
