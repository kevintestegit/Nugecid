import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Archive,
  Download,
  Printer,
} from "lucide-react";
import {
  useDeleteDesarquivamento,
  useDesarquivamento,
} from "@/hooks/useDesarquivamentos";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";
import { PageLoading } from "@/components/ui";
import { formatDate, formatDateTime } from "@/utils/date";
import { cn } from "@/utils/cn";
import { toast } from "@/lib/toast";

interface NugecidDetailPageProps {
  className?: string;
}

const NugecidDetailPage: React.FC<NugecidDetailPageProps> = ({ className }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: response, isLoading, error } = useDesarquivamento(id);
  const deleteDesarquivamento = useDeleteDesarquivamento();
  const desarquivamento = response?.data;

  // Loading state
  if (isLoading) {
    return <PageLoading />;
  }

  // Error state
  if (error) {
    return (
      <div className={cn("container mx-auto px-4 py-6 max-w-6xl", className)}>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Erro ao carregar registro
          </h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || "Não foi possível carregar os dados do registro"}
          </p>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => navigate("/nugecid")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à Lista
            </Button>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!desarquivamento) {
    return (
      <div className={cn("container mx-auto px-4 py-6 max-w-6xl", className)}>
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Registro não encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            O registro solicitado não existe ou foi removido
          </p>
          <Button variant="outline" onClick={() => navigate("/nugecid")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Lista
          </Button>
        </div>
      </div>
    );
  }

  const getTipoLabel = (tipo: string) => {
    const tipos = {
      DESARQUIVAMENTO: "Desarquivamento",
      COPIA: "Cópia",
      VISTA: "Vista",
      CERTIDAO: "Certidão",
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const isOverdue = (prazoAtendimento?: string, status?: string) => {
    if (
      !prazoAtendimento ||
      status === "FINALIZADO" ||
      status === "NAO_COLETADO" ||
      status === "NAO_LOCALIZADO"
    ) {
      return false;
    }
    return new Date(prazoAtendimento) < new Date();
  };

  const canEdit = !["FINALIZADO", "NAO_COLETADO", "NAO_LOCALIZADO"].includes(
    desarquivamento.status,
  );

  const handleDelete = async () => {
    if (!desarquivamento?.id) {
      toast.error(
        "Erro",
        "Não foi possível identificar o registro para exclusão.",
      );
      return;
    }

    try {
      const result = await deleteDesarquivamento.mutateAsync(
        desarquivamento.id,
      );

      if (!result?.success) {
        toast.error(
          "Erro na exclusão",
          "A exclusão não foi confirmada pelo servidor.",
        );
        return;
      }

      toast.success(
        "Desarquivamento excluído com sucesso!",
        "O item foi movido para a lixeira.",
      );
      setIsDeleteDialogOpen(false);
      navigate("/nugecid");
    } catch (err: unknown) {
      toast.error(
        "Falha ao excluir desarquivamento",
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o registro no momento.",
      );
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.08),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.06),transparent_55%),linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0))]",
        className,
      )}
    >
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Glassmorphism Header */}
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
          {/* Decorative blur circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl dark:bg-orange-400/10" />

          <div className="relative z-10">
            {/* Breadcrumb */}
            <nav className="mb-4" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link
                    to="/nugecid"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    NUGECID
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="mx-2 text-muted-foreground/50">/</span>
                    <span className="text-sm font-medium text-foreground">
                      {desarquivamento.codigoBarras}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {desarquivamento.codigoBarras}
                    </h1>
                    {desarquivamento.urgente && (
                      <Badge
                        variant="destructive"
                        className="flex items-center space-x-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Urgente</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Registro NUGECID -{" "}
                    {getTipoLabel(
                      desarquivamento.tipo ||
                        desarquivamento.tipoDesarquivamento ||
                        "",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                {canEdit && (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/nugecid/${desarquivamento.id}/editar`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteDesarquivamento.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {isOverdue(
          desarquivamento.prazoAtendimento,
          desarquivamento.status,
        ) && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Prazo de Atendimento Vencido
              </h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              Este registro está com o prazo de atendimento vencido desde{" "}
              {formatDateTime(desarquivamento.prazoAtendimento!)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <Card className="border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Informações Básicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nome Completo
                    </label>
                    <p className="text-lg font-semibold text-foreground">
                      {desarquivamento.nomeCompleto}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo de Desarquivamento
                    </label>
                    <p className="text-base text-foreground">
                      {desarquivamento.tipoDesarquivamento}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Desarquivamento Físico/Digital
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {desarquivamento.desarquivamentoFisicoDigital}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nº NIC/LAUDO/AUTO/IT
                    </label>
                    <p className="text-base font-medium text-foreground">
                      {desarquivamento.numeroNicLaudoAuto}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nº do Processo
                    </label>
                    <p className="text-base font-medium text-foreground">
                      {desarquivamento.numeroProcesso}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo de Documento
                    </label>
                    <p className="text-base text-foreground">
                      {desarquivamento.tipoDocumento}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Setor Demandante
                    </label>
                    <p className="text-base text-foreground">
                      {desarquivamento.setorDemandante}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Servidor Responsável
                    </label>
                    <p className="text-base text-foreground">
                      {desarquivamento.servidorResponsavel}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Prorrogação Solicitada
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          desarquivamento.solicitacaoProrrogacao
                            ? "default"
                            : "secondary"
                        }
                      >
                        {desarquivamento.solicitacaoProrrogacao ? "Sim" : "Não"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {desarquivamento.finalidadeDesarquivamento && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Finalidade do Desarquivamento
                    </label>
                    <p className="text-base text-foreground mt-1 p-3 bg-muted/50 rounded-lg">
                      {desarquivamento.finalidadeDesarquivamento}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações de Datas */}
            <Card className="border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Datas Importantes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(desarquivamento.createdAt ||
                    desarquivamento.dataSolicitacao) && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Data de Criação
                        </label>
                        <p className="text-base text-foreground">
                          {formatDate(
                            desarquivamento.createdAt ||
                              desarquivamento.dataSolicitacao,
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {desarquivamento.dataDevolucaoSetor && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Data da Devolução pelo Setor
                        </label>
                        <p className="text-base text-foreground">
                          {formatDate(desarquivamento.dataDevolucaoSetor)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge
                    variant={
                      desarquivamento.status === "FINALIZADO"
                        ? "default"
                        : desarquivamento.status === "SOLICITADO"
                          ? "secondary"
                          : desarquivamento.status === "NAO_COLETADO" ||
                              desarquivamento.status === "NAO_LOCALIZADO"
                            ? "destructive"
                            : "outline"
                    }
                    className="px-3 py-1 text-sm"
                  >
                    {desarquivamento.status === "FINALIZADO" && (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {(desarquivamento.status === "NAO_COLETADO" ||
                      desarquivamento.status === "NAO_LOCALIZADO") && (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {desarquivamento.status === "SOLICITADO" && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {desarquivamento.status === "DESARQUIVADO" && (
                      <Archive className="w-3 h-3 mr-1" />
                    )}
                    {desarquivamento.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Criado em:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDateTime(desarquivamento.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Atualizado em:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDateTime(desarquivamento.updatedAt)}
                    </span>
                  </div>

                  {desarquivamento.prazoAtendimento && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Prazo:
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isOverdue(
                            desarquivamento.prazoAtendimento,
                            desarquivamento.status,
                          )
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground",
                        )}
                      >
                        {formatDateTime(desarquivamento.prazoAtendimento)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usuário Responsável */}
            {desarquivamento.usuario && (
              <Card className="border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Responsável</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {desarquivamento.usuario.nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {desarquivamento.usuario.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ações Rápidas */}
            <Card className="border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEdit && (
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/nugecid/${desarquivamento.id}/editar`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Registro
                    </Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>

                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <EnhancedConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Excluir Solicitação"
          description={`Tem certeza que deseja excluir a solicitação ${desarquivamento.numeroNicLaudoAuto || desarquivamento.codigoBarras}?`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          isLoading={deleteDesarquivamento.isPending}
          confirmationType="checkbox"
          checkboxLabel="Sim, desejo excluir esta solicitação"
          warningList={[
            "O item será removido da lista principal",
            "O item será movido para a lixeira",
            "A restauração só poderá ser feita pela tela de lixeira",
          ]}
        />
      </div>
    </div>
  );
};

export default NugecidDetailPage;
