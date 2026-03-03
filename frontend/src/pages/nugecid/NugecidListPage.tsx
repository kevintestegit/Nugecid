import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Upload,
  Trash2,
} from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { useNugecidImport } from "@/hooks/useNugecidImport";
import { ImportModal } from "./components/ImportModal";
import { useDesarquivamentos } from "../../hooks/useDesarquivamentos";
import { QueryDesarquivamentoDto } from "../../types";
import { Button } from "../../components/ui/Button";
import DesarquivamentosTable from "@/components/nugecid/DesarquivamentosTable";
import DashboardStats from "@/components/nugecid/DashboardStats";
import ProrrogacaoNotification from "@/components/nugecid/ProrrogacaoNotification";
import NotificationBadge from "@/components/nugecid/NotificationBadge";
import { useNotificacoesProrrogacao } from "@/hooks/useNotificacoesProrrogacao";
import { PageLoading } from "@/components/ui/Loading";
import { toast } from "sonner";

const NugecidListPage: React.FC = () => {
  const [query, setQuery] = useState<QueryDesarquivamentoDto>({
    page: 1,
    // Exibir tudo em uma única página (até 100 itens suportados pela API)
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const normalizedSearch = debouncedSearchTerm || undefined;
    setQuery((prev) => {
      if (prev.search === normalizedSearch) {
        return prev;
      }

      return {
        ...prev,
        search: normalizedSearch,
        page: 1,
      };
    });
  }, [debouncedSearchTerm]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useDesarquivamentos(query);

  const { isImportModalOpen, openImportModal, closeImportModal } =
    useNugecidImport();

  const {
    notificacoes,
    notificacoesNaoLidas,
    marcarTodasComoLidas,
    processarProrrogacao,
    atualizarNotificacoes,
  } = useNotificacoesProrrogacao();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (filters: Partial<QueryDesarquivamentoDto>) => {
    setQuery((prev) => ({
      ...prev,
      ...filters,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setQuery((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: "ASC" | "DESC") => {
    setQuery((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Lista atualizada com sucesso!");
  };

  const { data: desarquivamentos = [], meta } = response || {};

  // Atualizar notificações quando os dados mudarem
  React.useEffect(() => {
    if (desarquivamentos) {
      atualizarNotificacoes(desarquivamentos);
    }
  }, [desarquivamentos, atualizarNotificacoes]);

  const handleExport = () => {
    // TODO: Implementar exportação
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };

  if (isLoading && !response) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro ao carregar a lista de desarquivamentos.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              NUGECID - Desarquivamentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie solicitações de desarquivamento, cópias, vistas e
              certidões
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBadge
              count={notificacoesNaoLidas}
              showAnimation={notificacoesNaoLidas > 0}
            />

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={openImportModal} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar Planilha
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/nugecid/excluidos">
                <Trash2 className="w-4 h-4 mr-2" />
                Registros Excluídos
              </Link>
            </Button>
            <Button asChild>
              <Link to="/nugecid/novo">
                <Plus className="w-4 h-4 mr-2" />
                Nova Solicitação
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <DashboardStats
        desarquivamentos={desarquivamentos}
        isLoading={isLoading}
      />

      {/* Notificações de Prorrogação */}
      <div id="prorrogacao-notifications">
        <ProrrogacaoNotification
          desarquivamentos={desarquivamentos || []}
          onUpdateProrrogacao={processarProrrogacao}
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Buscar por nome, registro, código de barras..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"}
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {Object.keys(query).filter(
              (key) =>
                !["page", "limit", "sortBy", "sortOrder", "search"].includes(
                  key,
                ) && query[key as keyof QueryDesarquivamentoDto] !== undefined,
            ).length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                {
                  Object.keys(query).filter(
                    (key) =>
                      ![
                        "page",
                        "limit",
                        "sortBy",
                        "sortOrder",
                        "search",
                      ].includes(key) &&
                      query[key as keyof QueryDesarquivamentoDto] !== undefined,
                  ).length
                }
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters - Temporariamente desabilitado */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="text-center text-muted-foreground py-4">
              <p>Filtros avançados temporariamente indisponíveis</p>
              <p className="text-sm mt-1">
                Componente NugecidFilters será reimplementado
              </p>
              <Button
                onClick={() => {
                  setQuery({
                    page: 1,
                    limit: 100,
                    sortBy: "createdAt",
                    sortOrder: "DESC",
                  });
                  setSearchTerm("");
                }}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <DesarquivamentosTable
        desarquivamentos={desarquivamentos}
        isLoading={isLoading}
        onEdit={(id) => {
          // Navegação já é feita pelo Link dentro da tabela
        }}
        onDelete={(id) => {
          // TODO: Implementar lógica de exclusão
          toast.info("Funcionalidade de exclusão em desenvolvimento");
        }}
        onView={(id) => {
          // Navegação já é feita pelo Link dentro da tabela
        }}
      />

      {/* Empty State */}
      {!isLoading && desarquivamentos.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {query.search ||
            Object.keys(query).some(
              (key) =>
                !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
                query[key as keyof QueryDesarquivamentoDto] !== undefined,
            )
              ? "Nenhum resultado encontrado"
              : "Nenhuma solicitação cadastrada"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {query.search ||
            Object.keys(query).some(
              (key) =>
                !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
                query[key as keyof QueryDesarquivamentoDto] !== undefined,
            )
              ? "Tente ajustar os filtros ou termos de busca."
              : "Comece criando sua primeira solicitação de desarquivamento."}
          </p>
          {!query.search &&
            !Object.keys(query).some(
              (key) =>
                !["page", "limit", "sortBy", "sortOrder"].includes(key) &&
                query[key as keyof QueryDesarquivamentoDto] !== undefined,
            ) && (
              <Button asChild>
                <Link to="/nugecid/novo">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Solicitação
                </Link>
              </Button>
            )}
        </div>
      )}

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onImportSuccess={() => {
          closeImportModal();
          refetch();
          toast.success("Planilha importada e dados atualizados com sucesso!");
        }}
      />
    </div>
  );
};

export default NugecidListPage;
