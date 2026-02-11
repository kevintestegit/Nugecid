import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NovaPastaModal } from '@/components/arquivos/NovaPastaModal';
import { EditarPastaModal } from '@/components/arquivos/EditarPastaModal';

import {
  FolderOpen,
  Upload,
  Filter,
  Eye,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileSpreadsheet,
  Image,
  Grid3X3,
  List,
  Tag,
  MapPin,
  Calendar,
  Hash,
  Download,
  Loader2,
} from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/utils/cn';
import { usePastas, Pasta, CreatePastaInput } from '@/hooks/usePastas';
import { usePlanilhasControle } from '@/hooks/usePlanilhasControle';
import { toast } from 'sonner';
import { SpreadsheetPreview } from '@/components/ui/SpreadsheetPreview';
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog';

interface Caixa {
  id: string;
  numero: string;
  conteudo: string;
  localizacao: string;
  prateleira: string;
  pasta: string;
  dataArquivamento: string;
  responsavel: string;
  observacoes?: string;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes || Number.isNaN(bytes)) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
};

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Data desconhecida';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Data desconhecida';
  }

  return parsed.toLocaleDateString('pt-BR');
};

const ArquivoPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pastas' | 'planilhas' | 'caixas'>(
    'pastas',
  );
  const [deletePastaId, setDeletePastaId] = useState<string | null>(null);
  const [deletePlanilhaItem, setDeletePlanilhaItem] = useState<{ id: string; nome: string } | null>(null);
  const canManageArquivos =
    checkPermission('create', 'arquivos') ||
    checkPermission('update', 'arquivos') ||
    checkPermission('delete', 'arquivos');

  const ensureManagePermission = () => {
    if (canManageArquivos) {
      return true;
    }
    toast.error('Você não tem permissão para alterar arquivos ou planilhas.');
    return false;
  };

  const planilhaInputRef = useRef<HTMLInputElement | null>(null);
  const {
    planilhas: planilhasControle,
    isLoading: isLoadingPlanilhas,
    uploadPlanilha,
    isUploadingPlanilha,
    deletePlanilha,
    isDeletingPlanilha,
    planilhaGeral,
    isLoadingPlanilhaGeral,
    planilhaGeralError,
    refetchPlanilhaGeral,
  } = usePlanilhasControle();

  const {
    pastas,
    isLoading,
    error,
    createPasta,
    deletePasta,
    updatePasta,
    isUpdatingPasta,
  } = usePastas();
  const safePastas = useMemo<Pasta[]>(
    () => (Array.isArray(pastas) ? pastas : []),
    [pastas],
  );
  const [caixas] = useState<Caixa[]>([]);

  const totalPastas = safePastas.length;
  const totalImagens = useMemo(() => safePastas.reduce((acc, pasta) => acc + pasta.imagens, 0), [safePastas]);
  const totalPlanilhas = useMemo(() => safePastas.reduce((acc, pasta) => acc + pasta.planilhas, 0), [safePastas]);
  const [editingPasta, setEditingPasta] = useState<Pasta | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const planilhasControleIds = useMemo(
    () => new Set(planilhasControle.map(planilha => planilha.id)),
    [planilhasControle],
  );

  const planilhaGeralSections = useMemo(() => {
    if (!planilhaGeral?.linhas?.length) {
      return [];
    }

    const colunasBase =
      planilhaGeral.colunas && planilhaGeral.colunas.length > 0
        ? planilhaGeral.colunas
        : Object.keys(planilhaGeral.linhas[0] ?? {});

    if (!planilhaGeral.grupos?.length) {
      return [
        {
          id: 'planilha-geral',
          titulo: planilhaGeral.linhas[0]?.Planilha || 'Planilha Consolidada',
          subtitulo: `${planilhaGeral.totalItens} item(s)`,
          planilhaId:
            planilhaGeral.grupos?.[0]?.planilhas?.[0]?.planilhaId ||
            planilhaGeral.linhas[0]?.planilhaId,
          sheetName: planilhaGeral.grupos?.[0]?.planilhas?.[0]?.sheetName ?? 'Principal',
          linhas: planilhaGeral.linhas,
          colunas: colunasBase,
          pastaNome: planilhaGeral.linhas[0]?.Pasta || undefined,
        },
      ];
    }

    const sections: Array<{
      id: string;
      titulo: string;
      subtitulo: string;
      planilhaId?: string;
      sheetName?: string;
      linhas: Record<string, string>[];
      colunas: string[];
      pastaNome?: string;
    }> = [];

    planilhaGeral.grupos.forEach(grupo => {
      grupo.planilhas.forEach(planilha => {
        const linhasFiltradas = planilhaGeral.linhas.filter(linha => {
          const linhaPasta = linha['Pasta'] ?? linha['Prateleira/NºTOMBO'] ?? linha['Prateleira'] ?? '';
          const linhaPlanilha = linha['Planilha'] ?? '';
          const pastaMatches =
            !grupo.pastaNome ||
            linhaPasta === grupo.pastaNome ||
            linhaPasta === grupo.pastaId;
          const planilhaMatches =
            !planilha.planilhaNome ||
            !linhaPlanilha ||
            linhaPlanilha === planilha.planilhaNome;

          return pastaMatches && planilhaMatches;
        });

        sections.push({
          id: `${grupo.pastaId}-${planilha.planilhaId}`,
          titulo: planilha.planilhaNome || grupo.pastaNome || 'Planilha',
          subtitulo: `Aba: ${planilha.sheetName || 'Principal'} (${planilha.totalItens} ${
            planilha.totalItens === 1 ? 'item' : 'itens'
          })`,
          planilhaId: planilha.planilhaId,
          sheetName: planilha.sheetName,
          linhas: linhasFiltradas.length ? linhasFiltradas : planilhaGeral.linhas,
          colunas: colunasBase,
          pastaNome: grupo.pastaNome,
        });
      });
    });

    return sections;
  }, [planilhaGeral]);

  const handleAddPasta = async (novaPasta: CreatePastaInput) => {
    if (!ensureManagePermission()) return;
    await createPasta(novaPasta);
    setShowUploadModal(false);
  };

  const handleUpdatePasta = async (values: { nome: string; descricao: string; tags: string[] }) => {
    if (!editingPasta || !ensureManagePermission()) return;
    try {
      await updatePasta({
        id: editingPasta.id,
        ...values,
      });
      toast.success('Pasta atualizada com sucesso!');
      setShowEditModal(false);
      setEditingPasta(null);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível atualizar a pasta.');
    }
  };

  const handleDelete = (pastaId: string) => {
    if (!ensureManagePermission()) return;
    setDeletePastaId(pastaId);
  };

  const handleConfirmDeletePasta = async () => {
    if (!deletePastaId || !ensureManagePermission()) return;

    try {
      await deletePasta(deletePastaId);
      toast.success('Pasta excluída com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível excluir a pasta.');
    } finally {
      setDeletePastaId(null);
    }
  };

  const handleSelectPlanilha = () => {
    if (!ensureManagePermission()) return;
    planilhaInputRef.current?.click();
  };

  const handleUploadPlanilhaChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!ensureManagePermission()) {
      event.target.value = '';
      return;
    }

    try {
      await uploadPlanilha(file);
      toast.success('Planilha adicionada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Nao foi possivel enviar a planilha.');
    } finally {
      event.target.value = '';
    }
  };

  const handleDeletePlanilha = (planilhaId: string, planilhaNome: string) => {
    if (!planilhaId || !ensureManagePermission()) return;
    setDeletePlanilhaItem({ id: planilhaId, nome: planilhaNome });
  };

  const handleConfirmDeletePlanilha = async () => {
    if (!deletePlanilhaItem || !ensureManagePermission()) return;

    try {
      await deletePlanilha(deletePlanilhaItem.id);
      toast.success('Planilha removida com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível remover a planilha.');
    } finally {
      setDeletePlanilhaItem(null);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredPastas = useMemo(() => {
    if (!normalizedSearchTerm) {
      return safePastas;
    }

    return safePastas.filter(pasta => {
      const nomeMatch = pasta.nome.toLowerCase().includes(normalizedSearchTerm);
      const tagMatch = pasta.tags.some(tag =>
        tag.toLowerCase().includes(normalizedSearchTerm),
      );
      return nomeMatch || tagMatch;
    });
  }, [safePastas, normalizedSearchTerm]);

  const filteredCaixas = useMemo(() => {
    if (!normalizedSearchTerm) {
      return caixas;
    }

    return caixas.filter(caixa =>
      caixa.numero.toLowerCase().includes(normalizedSearchTerm) ||
      caixa.conteudo.toLowerCase().includes(normalizedSearchTerm) ||
      caixa.localizacao.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [caixas, normalizedSearchTerm]);

  return (
    <div className="relative space-y-6 text-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
              arquivo operacional
            </p>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3 md:text-3xl">
              <span className="rounded-xl bg-primary/10 p-2 ring-1 ring-white/70 shadow-sm backdrop-blur">
                <FolderOpen className="h-6 w-6 text-primary" />
              </span>
              Arquivo - NUGECID/SAG
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de gerenciamento do acervo documental do Núcleo de Gestão
              do Conhecimento, Informação, Documentação e Memória.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                if (!ensureManagePermission()) return;
                setShowUploadModal(true);
              }}
              disabled={!canManageArquivos}
              title={
                canManageArquivos
                  ? undefined
                  : 'Apenas administradores ou coordenadores podem criar pastas'
              }
              className="flex items-center gap-2 text-sm bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nova Pasta
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 text-sm border-border/60 bg-background/70 backdrop-blur">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedFilter('todos')}>
                  Todas as pastas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter('recentes')}>
                  Recentes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedFilter('destacadas')}
                >
                  Destacadas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-sm border border-border/60 bg-card/85 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]">
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Total de Pastas</span>
              <FolderOpen className="h-4 w-4" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {totalPastas}
            </p>
          </CardContent>
        </Card>
        <Card className="text-sm border border-border/60 bg-card/85 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]">
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Fotos Registradas</span>
              <Image className="h-4 w-4" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {totalImagens}
            </p>
          </CardContent>
        </Card>
        <Card className="text-sm border border-border/60 bg-card/85 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]">
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Planilhas Anexadas</span>
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {totalPlanilhas}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={activeTab === 'pastas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pastas')}
            className={cn(activeTab === 'pastas' ? 'bg-primary/90' : 'border-border/60 bg-background/70 backdrop-blur', 'text-[11px] font-semibold uppercase tracking-[0.08em]')}
          >
            Pastas
          </Button>
          <Button
            variant={activeTab === 'planilhas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('planilhas')}
            className={cn(activeTab === 'planilhas' ? 'bg-primary/90' : 'border-border/60 bg-background/70 backdrop-blur', 'text-[11px] font-semibold uppercase tracking-[0.08em]')}
          >
            Planilhas
          </Button>
          <Button
            variant={activeTab === 'caixas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('caixas')}
            className={cn(activeTab === 'caixas' ? 'bg-primary/90' : 'border-border/60 bg-background/70 backdrop-blur', 'text-[11px] font-semibold uppercase tracking-[0.08em]')}
          >
            Caixas Documentais
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder="Realizar uma busca"
        />
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


      {activeTab === 'pastas' && (
        <>
          {isLoading && <p>Carregando pastas...</p>}
          {error && <p>Erro ao carregar pastas.</p>}
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1',
            )}
          >
            {filteredPastas.map(pasta => (
              <Card
                key={pasta.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/arquivo/${pasta.id}`)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/arquivo/${pasta.id}`);
                  }
                }}
                className="cursor-pointer border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] transition-all hover:border-primary/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {pasta.nome}
                      </CardTitle>
                      <CardDescription className="mt-1 text-[11px] text-muted-foreground">
                        {pasta.descricao}
                      </CardDescription>
                    </div>
                    {canManageArquivos && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={event => event.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={event => event.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={event => {
                              event.stopPropagation();
                              setEditingPasta(pasta);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={event => {
                              event.stopPropagation();
                              handleDelete(pasta.id);
                            }}
                            className="text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Criada em{' '}
                    {new Date(pasta.dataCriacao).toLocaleDateString('pt-BR')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 text-xs">
                        <Image className="h-4 w-4" />
                        {pasta.imagens}{' '}
                        {pasta.imagens === 1 ? 'imagem' : 'imagens'}
                      </span>
                      <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-600 text-xs">
                        <FileSpreadsheet className="h-4 w-4" />
                        {pasta.planilhas}{' '}
                        {pasta.planilhas === 1 ? 'planilha' : 'planilhas'}
                      </span>
                    </div>
                    {pasta.tags.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {pasta.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[11px] px-2 py-1 flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground">
                      Clique para visualizar os anexos, adicionar novas imagens e consultar os itens desta prateleira.
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-sm py-2"
                      onClick={() => navigate(`/arquivo/${pasta.id}`)}
                    >
                      Ver prateleira
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'caixas' && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de Caixas Documentais</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Controle detalhado das caixas arquivadas com suas respectivas
              localizacoes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Número
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Conteúdo
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Localização
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Responsável
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaixas.map(caixa => (
                    <tr
                      key={caixa.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{caixa.numero}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{caixa.conteudo}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {caixa.localizacao}
                        </div>
                      </td>
                      <td className="py-3 px-4">{caixa.responsavel}</td>
                      <td className="py-3 px-4">
                        {new Date(caixa.dataArquivamento).toLocaleDateString(
                          'pt-BR',
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'planilhas' && (
        <div className="space-y-6">
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Upload de Planilha
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Faça upload de uma nova planilha de controle
              </p>
              <Button
                onClick={handleSelectPlanilha}
                disabled={!canManageArquivos || isUploadingPlanilha}
                title={
                  canManageArquivos
                    ? undefined
                    : 'Apenas administradores ou coordenadores podem enviar planilhas'
                }
                className="px-6"
              >
                {isUploadingPlanilha ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Planilha
                  </>
                )}
              </Button>
              <input
                ref={planilhaInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleUploadPlanilhaChange}
              />
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-muted/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">
                Planilha Geral Consolidada
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Visualize em uma única visão todos os itens catalogados nas planilhas das pastas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {planilhaGeralError ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                  <span>Não foi possível carregar a planilha geral.</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchPlanilhaGeral()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : null}

              {isLoadingPlanilhaGeral ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Consolidando dados das planilhas...
                </div>
              ) : planilhaGeralSections.length ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Pastas com planilhas
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {planilhaGeral.totalPastas}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Planilhas processadas
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {planilhaGeral.totalPlanilhas}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Itens catalogados
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {planilhaGeral.totalItens}
                      </p>
                    </div>
                  </div>

                  {planilhaGeral.grupos.length ? (
                    <div className="flex flex-wrap gap-2">
                      {planilhaGeral.grupos.map(grupo => (
                        <Badge
                          key={grupo.pastaId}
                          variant="secondary"
                          className="text-[11px] font-medium"
                        >
                          {grupo.pastaNome || 'Pasta'} - {grupo.totalItens}{' '}
                          {grupo.totalItens === 1 ? 'item' : 'itens'}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {planilhaGeralSections.length ? (
                    <div className="space-y-5">
                      {planilhaGeralSections.map(section => (
                        <div
                          key={section.id}
                          className="rounded-xl border border-border/60 bg-background/80 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                {section.titulo}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {section.subtitulo}
                                {section.pastaNome ? ` • ${section.pastaNome}` : ''}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (section.planilhaId) {
                                  window.open(
                                    `/api/planilhas/${section.planilhaId}/download`,
                                    '_blank',
                                    'noopener',
                                  );
                                }
                              }}
                              disabled={
                                !section.planilhaId ||
                                !planilhasControleIds.has(section.planilhaId)
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Baixar planilha
                            </Button>
                          </div>
                          <div className="mt-4">
                            {section.linhas.length ? (
                              <SpreadsheetPreview
                                headers={section.colunas}
                                data={section.linhas}
                                maxHeight="max-h-[420px]"
                                showRowNumbers
                              />
                            ) : (
                              <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 py-10 text-center text-sm text-muted-foreground">
                                Nenhum item foi encontrado para esta planilha.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : planilhaGeral.linhas.length ? (
                    <SpreadsheetPreview
                      headers={planilhaGeral.colunas}
                      data={planilhaGeral.linhas}
                      maxHeight="max-h-[480px]"
                      showRowNumbers
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 bg-background/70 py-10 text-center text-sm text-muted-foreground">
                      Nenhum dado consolidado disponível no momento.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 bg-background/70 py-10 text-center text-sm text-muted-foreground">
                  Nenhuma planilha foi encontrada nas pastas cadastradas.
                </div>
              )}
            </CardContent>
          </Card>

          {isLoadingPlanilhas ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando planilhas...
            </div>
          ) : planilhasControle.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {planilhasControle.map(planilha => (
                <Card
                  key={planilha.id}
                  className="border border-border/60 bg-muted/10 transition-colors hover:border-primary/60"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          <span className="break-all">
                            {planilha.nomeOriginal || 'Planilha'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(planilha.dataUpload)}
                          {' - '}
                          {formatFileSize(planilha.tamanhoBytes)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (planilha.url) {
                              window.open(planilha.url, '_blank', 'noopener');
                            }
                          }}
                          disabled={!planilha.url}
                          aria-label="Baixar planilha"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canManageArquivos && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeletePlanilha(
                                planilha.id,
                                planilha.nomeOriginal || 'Planilha',
                              )
                            }
                            disabled={isDeletingPlanilha}
                            aria-label="Remover planilha"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 bg-background/70 py-10 text-center text-sm text-muted-foreground">
              Nenhuma planilha geral manual cadastrada ate o momento.
            </div>
          )}
        </div>
      )}

      <NovaPastaModal
        isOpen={canManageArquivos && showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onAddPasta={handleAddPasta}
      />

      <EditarPastaModal
        isOpen={canManageArquivos && showEditModal && Boolean(editingPasta)}
        pasta={editingPasta}
        onClose={() => {
          setShowEditModal(false);
          setEditingPasta(null);
        }}
        onSubmit={handleUpdatePasta}
        isSubmitting={isUpdatingPasta}
      />

      {/* Enhanced Confirm Dialogs */}
      <EnhancedConfirmDialog
        isOpen={canManageArquivos && deletePastaId !== null}
        onClose={() => setDeletePastaId(null)}
        onConfirm={handleConfirmDeletePasta}
        title="Excluir pasta"
        description="Tem certeza que deseja excluir esta pasta?"
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir esta pasta permanentemente"
        warningList={[
          'Esta ação não pode ser desfeita',
          'Todos os arquivos da pasta serão perdidos',
          'Imagens e planilhas serão removidas'
        ]}
      />

      <EnhancedConfirmDialog
        isOpen={canManageArquivos && deletePlanilhaItem !== null}
        onClose={() => setDeletePlanilhaItem(null)}
        onConfirm={handleConfirmDeletePlanilha}
        title="Remover planilha"
        description={`Tem certeza que deseja remover a planilha "${deletePlanilhaItem?.nome}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo remover esta planilha permanentemente"
        warningList={[
          'Esta ação não pode ser desfeita',
          'Os dados da planilha serão perdidos'
        ]}
      />
    </div>
  );
};

export default ArquivoPage;
