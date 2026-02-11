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
  Phone,
  Mail,
  MapPin,
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
// Componentes StatusBadge e ActionButtons removidos - implementações temporárias abaixo
// import { StatusBadge, ActionButtons } from '@/components/nugecid'
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
          <div className="text-red-600 mb-4">
            <XCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar registro
          </h2>
          <p className="text-gray-600 mb-4">
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
          <div className="text-gray-400 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Registro não encontrado
          </h2>
          <p className="text-gray-600 mb-4">
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

  const getTipoBadgeVariant = (tipo: string) => {
    const variants = {
      DESARQUIVAMENTO: "default",
      COPIA: "secondary",
      VISTA: "outline",
      CERTIDAO: "destructive",
    };
    return variants[tipo as keyof typeof variants] || "default";
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
    } catch (err: any) {
      toast.error(
        "Falha ao excluir desarquivamento",
        err?.message || "Não foi possível excluir o registro no momento.",
      );
    }
  };

  return (
    <div className={cn("container mx-auto px-4 py-6 max-w-6xl", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/nugecid")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à Lista</span>
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
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
              <p className="text-gray-600">
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
            {/* ActionButtons temporariamente desabilitado */}
            <div className="flex items-center space-x-2">
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

      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              to="/nugecid"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              NUGECID
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-500">
                {desarquivamento.codigoBarras}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Status Alert */}
      {isOverdue(desarquivamento.prazoAtendimento, desarquivamento.status) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-medium text-red-800">
              Prazo de Atendimento Vencido
            </h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Este registro está com o prazo de atendimento vencido desde{" "}
            {formatDateTime(desarquivamento.prazoAtendimento!)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Nome Completo
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {desarquivamento.nomeCompleto}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Tipo de Desarquivamento
                  </label>
                  <p className="text-base text-gray-900">
                    {desarquivamento.tipoDesarquivamento}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
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
                  <label className="text-sm font-medium text-gray-500">
                    Nº NIC/LAUDO/AUTO/IT
                  </label>
                  <p className="text-base font-medium text-gray-900">
                    {desarquivamento.numeroNicLaudoAuto}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Nº do Processo
                  </label>
                  <p className="text-base font-medium text-gray-900">
                    {desarquivamento.numeroProcesso}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Tipo de Documento
                  </label>
                  <p className="text-base text-gray-900">
                    {desarquivamento.tipoDocumento}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Setor Demandante
                  </label>
                  <p className="text-base text-gray-900">
                    {desarquivamento.setorDemandante}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Servidor Responsável
                  </label>
                  <p className="text-base text-gray-900">
                    {desarquivamento.servidorResponsavel}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
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
                  <label className="text-sm font-medium text-gray-500">
                    Finalidade do Desarquivamento
                  </label>
                  <p className="text-base text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                    {desarquivamento.finalidadeDesarquivamento}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Datas Importantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {desarquivamento.dataSolicitacao && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Data da Solicitação
                      </label>
                      <p className="text-base text-gray-900">
                        {formatDate(desarquivamento.dataSolicitacao)}
                      </p>
                    </div>
                  </div>
                )}
                {desarquivamento.dataDevolucaoSetor && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Data da Devolução pelo Setor
                      </label>
                      <p className="text-base text-gray-900">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* StatusBadge temporariamente substituído */}
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
                  <span className="text-sm text-gray-500">Criado em:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(desarquivamento.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Atualizado em:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(desarquivamento.updatedAt)}
                  </span>
                </div>

                {desarquivamento.prazoAtendimento && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Prazo:</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isOverdue(
                          desarquivamento.prazoAtendimento,
                          desarquivamento.status,
                        )
                          ? "text-red-600"
                          : "text-gray-900",
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Responsável</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {desarquivamento.usuario.nome}
                    </p>
                    <p className="text-sm text-gray-500">
                      {desarquivamento.usuario.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações Rápidas */}
          <Card>
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
  );
};

export default NugecidDetailPage;
