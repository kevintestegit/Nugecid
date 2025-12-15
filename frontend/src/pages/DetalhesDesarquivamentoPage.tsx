import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDesarquivamento, useDownloadTermoPdf, useDownloadTermoDocx, useDesarquivamentoComments, useAddDesarquivamentoComment } from '@/hooks/useDesarquivamentos'
import { useDesarquivamentosAnexos, useUploadDesarquivamentoAnexo, useDownloadDesarquivamentoAnexo, useDeleteDesarquivamentoAnexo, useViewDesarquivamentoAnexo, useUpdateDesarquivamentoAnexo } from '@/hooks/useDesarquivamentosAnexos'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageLoading } from '@/components/ui/Loading'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  ArrowLeft,
  Edit,
  FileText,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MessageCircle,
  Send,
  Loader2,
  Upload,
  Download,
  Trash2,
  Paperclip,
  X,
  Copy,
  Check
} from 'lucide-react'
import { getStatusLabel } from '@/utils/format'
import { StatusDesarquivamento } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { ImagePreviewModal } from '@/components/desarquivamentos/ImagePreviewModal'
import { AnexosSection } from '@/components/desarquivamentos/AnexosSection'
import { HistoricoTimeline } from '@/components/desarquivamentos/HistoricoTimeline'
import { getInstitutoLabel } from '@/constants/institutos'

const DetalhesDesarquivamentoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: response, isLoading, error } = useDesarquivamento(id);
  const desarquivamento = response?.data;
  const isIdValid = id ? !isNaN(parseInt(id, 10)) : false;

  const downloadPdfMutation = useDownloadTermoPdf()
  const downloadDocxMutation = useDownloadTermoDocx()

  const { data: commentsResponse, isLoading: isLoadingComments } =
    useDesarquivamentoComments(Number(id));
  const comments = commentsResponse?.data ?? [];
  const addCommentMutation = useAddDesarquivamentoComment(Number(id));
  const [commentText, setCommentText] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Anexos - Separados por tipo
  const { data: anexosDesarquivamento, isLoading: isLoadingAnexosDesarq } = 
    useDesarquivamentosAnexos(Number(id), 'desarquivamento');
  const { data: anexosRearquivamento, isLoading: isLoadingAnexosRearq } = 
    useDesarquivamentosAnexos(Number(id), 'rearquivamento');
  
  const uploadAnexoMutation = useUploadDesarquivamentoAnexo();
  const downloadAnexoMutation = useDownloadDesarquivamentoAnexo();
  const deleteAnexoMutation = useDeleteDesarquivamentoAnexo();
  const viewAnexoMutation = useViewDesarquivamentoAnexo();
  const updateAnexoMutation = useUpdateDesarquivamentoAnexo();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAnexo, setPreviewAnexo] = useState<any>(null);

  const canEdit = user?.role?.name === 'admin' || user?.role?.name === 'coordenador'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (!previousOverflow || previousOverflow === 'hidden') {
      document.body.style.overflow = 'auto'
    }

    return () => {
      if (!previousOverflow) {
        document.body.style.overflow = ''
      } else {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.error('Digite um comentário antes de enviar.');
      return;
    }

    try {
      await addCommentMutation.mutateAsync(trimmed);
      setCommentText('');
      toast.success('Comentário adicionado com sucesso.');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Não foi possível adicionar o comentário.';
      toast.error(message);
    }
  };

  const handleUploadDesarquivamento = async (file: File, descricao: string, anexarAoProcesso?: boolean) => {
    if (!id) return;
    await uploadAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      file,
      descricao: descricao.trim() || undefined,
      tipoAnexo: 'desarquivamento',
      anexarAoProcesso
    });
  };

  const handleUploadRearquivamento = async (file: File, descricao: string, anexarAoProcesso?: boolean) => {
    if (!id) return;
    await uploadAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      file,
      descricao: descricao.trim() || undefined,
      tipoAnexo: 'rearquivamento',
      anexarAoProcesso
    });
  };

  const handleCopyToClipboard = async (value?: string, fieldKey?: string) => {
    if (!value) return;

    const markAsCopied = () => {
      setCopiedField(fieldKey ?? null);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldKey ? null : prev));
      }, 2000);
    };

    const fallbackCopy = () => {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          markAsCopied();
        } else {
          throw new Error('execCommand falhou');
        }
      } catch (error) {
        toast.error('Não foi possível copiar o conteúdo.');
      } finally {
        document.body.removeChild(textArea);
      }
    };

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        markAsCopied();
        return;
      } catch (error) {
        // fallback abaixo
      }
    }

    fallbackCopy();
  };

  const handleDownloadTermo = (format: 'pdf' | 'docx') => {
    if (!id || isNaN(Number(id))) {
      toast.error('Identificador invalido para o termo.');
      return;
    }

    if (desarquivamento?.status !== StatusDesarquivamento.DESARQUIVADO) {
      toast.error('Somente solicitacoes com status DESARQUIVADO podem gerar termos.');
      return;
    }

    const mutation = format === 'pdf' ? downloadPdfMutation : downloadDocxMutation;

    mutation.mutate(Number(id), {
      onSuccess: () => {
        toast.success(
          format === 'pdf'
            ? 'Termo em PDF gerado com sucesso.'
            : 'Termo em Word gerado com sucesso.'
        );
      },
      onError: (error: any) => {
        const message = error?.message || 'Nao foi possivel gerar o termo.';
        toast.error(message);
      },
    });
  };

  const handleDownloadAnexo = async (anexoId: number) => {
    if (!id) return;

    const allAnexos = [...(anexosDesarquivamento ?? []), ...(anexosRearquivamento ?? [])];
    const anexo = allAnexos.find(a => a.id === anexoId);

    if (!anexo) {
      toast.error('Anexo não encontrado');
      return;
    }

    try {
      let blob: Blob

      // Se anexo tem URL (vem do backend com URL correta), usar ela
      if (anexo.url) {
        const response = await fetch(anexo.url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
        if (!response.ok) throw new Error('Erro ao baixar anexo')
        blob = await response.blob()
      } else if (anexo.desarquivamentoId) {
        // Anexo de solicitação
        blob = await downloadAnexoMutation.mutateAsync({
          desarquivamentoId: Number(id),
          anexoId,
        });
      } else if (anexo.numeroProcesso) {
        // Anexo de processo
        const encodedProcesso = encodeURIComponent(anexo.numeroProcesso)
        const response = await fetch(`/api/nugecid/processo/${encodedProcesso}/anexos/${anexoId}/download`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
        if (!response.ok) throw new Error('Erro ao baixar anexo')
        blob = await response.blob()
      } else {
        throw new Error('Anexo sem vínculo válido')
      }

      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = anexo?.nomeOriginal || 'anexo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Erro ao baixar anexo.');
    }
  };

  const handleDeleteAnexo = async (anexoId: number) => {
    if (!id) return;
    await deleteAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      anexoId,
    });
  };

  const handleViewAnexo = async (anexo: any) => {
    if (!id) return;

    try {
      let blob: Blob
      
      // Se anexo tem previewUrl (URL correta do backend), usar ela
      if (anexo.previewUrl) {
        const response = await fetch(anexo.previewUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
        if (!response.ok) throw new Error('Erro ao carregar visualização')
        blob = await response.blob()
      } else if (anexo.desarquivamentoId) {
        // Anexo de solicitação
        blob = await viewAnexoMutation.mutateAsync({
          desarquivamentoId: Number(id),
          anexoId: anexo.id,
        });
      } else if (anexo.numeroProcesso) {
        // Anexo de processo
        const encodedProcesso = encodeURIComponent(anexo.numeroProcesso)
        const response = await fetch(`/api/nugecid/processo/${encodedProcesso}/anexos/${anexo.id}/view`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
        if (!response.ok) throw new Error('Erro ao carregar visualização')
        blob = await response.blob()
      } else {
        throw new Error('Anexo sem vínculo válido')
      }

      // Criar URL temporária do blob
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewAnexo(anexo);
    } catch (error: any) {
      toast.error('Erro ao carregar visualização.');
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewAnexo(null);
  };

  const handleUpdateDescricao = async (anexoId: number, descricao: string) => {
    if (!id) return;
    await updateAnexoMutation.mutateAsync({
      desarquivamentoId: Number(id),
      anexoId,
      descricao,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (isLoading) {
    return <PageLoading />
  }

  if (!isIdValid) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ID Inválido
          </h3>
          <p className="text-gray-600 mb-4">
            O ID fornecido na URL é inválido.
          </p>
          <Button onClick={() => navigate('/desarquivamentos')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <PageLoading />
  }

  if (error || !desarquivamento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Solicitação não encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            A solicitação que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => navigate('/desarquivamentos')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: StatusDesarquivamento) => {
    switch (status) {
      case StatusDesarquivamento.FINALIZADO:
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case StatusDesarquivamento.NAO_LOCALIZADO:
        return <XCircle className="h-5 w-5 text-red-600" />
      case StatusDesarquivamento.DESARQUIVADO:
        return <Eye className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: StatusDesarquivamento) => {
    switch (status) {
      case StatusDesarquivamento.FINALIZADO:
        return 'default'
      case StatusDesarquivamento.NAO_LOCALIZADO:
        return 'destructive'
      case StatusDesarquivamento.DESARQUIVADO:
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Removido prazoVencimento pois não existe na entidade
  const isPrazoVencido = false;

  const canGerarTermo = desarquivamento?.status === StatusDesarquivamento.DESARQUIVADO;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/desarquivamentos')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitação #{desarquivamento?.numeroSolicitacao || 'N/A'}
            </h1>
            <p className="text-gray-600 mt-1">
              Detalhes da solicitação de desarquivamento
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {canEdit && (
            <>
              <Button asChild>
                <Link to={`/desarquivamentos/${id}/editar`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTermo('pdf')}
                title={!canGerarTermo ? 'Somente solicitacoes com status DESARQUIVADO podem gerar termos.' : undefined}
                disabled={downloadPdfMutation.isPending || !canGerarTermo}
              >
                <FileText className="h-4 w-4 mr-2" />
                {downloadPdfMutation.isPending ? 'Baixando...' : 'Termo PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTermo('docx')}
                title={!canGerarTermo ? 'Somente solicitacoes com status DESARQUIVADO podem gerar termos.' : undefined}
                disabled={downloadDocxMutation.isPending || !canGerarTermo}
              >
                <FileText className="h-4 w-4 mr-2" />
                {downloadDocxMutation.isPending ? 'Baixando...' : 'Termo Word'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(desarquivamento.status)}
              <div>
                <CardTitle>Status da Solicitação</CardTitle>
                <CardDescription>
                  Situação atual do processo
                </CardDescription>
              </div>
            </div>
            <Badge variant={getStatusColor(desarquivamento.status)}>
              {getStatusLabel(desarquivamento.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Data de Criação</p>
              <p className="text-gray-900">
                {formatDate(desarquivamento.createdAt)}
              </p>
            </div>
            {desarquivamento.updatedAt && desarquivamento.updatedAt !== desarquivamento.createdAt && (
              <div>
                <p className="text-sm text-gray-600">Última Atualização</p>
                <p className="text-gray-900">
                  {formatDate(desarquivamento.updatedAt)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Prazo de Vencimento</p>
              <p className="text-gray-400">Não definido</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Solicitação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Número NIC/LAUDO/AUTO</p>
              <p className="font-mono text-lg font-medium">{desarquivamento.numeroNicLaudoAuto || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Número do Processo</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-mono text-lg font-medium break-all">{desarquivamento.numeroProcesso || 'N/A'}</p>
                {desarquivamento.numeroProcesso && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(desarquivamento.numeroProcesso, 'numeroProcesso')}
                      className="rounded-full p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title="Copiar número do processo"
                      aria-label="Copiar número do processo"
                    >
                      {copiedField === 'numeroProcesso' ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {copiedField === 'numeroProcesso' && (
                      <span className="text-xs text-emerald-600">Copiado</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Desarquivamento</p>
              <Badge variant="outline" className="mt-1">
                {desarquivamento.tipoDesarquivamento}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Documento</p>
              <p className="text-gray-900">
                {desarquivamento.tipoDocumento}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Instituto</p>
              <p className="text-gray-900">
                {getInstitutoLabel(desarquivamento.instituto)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Requerente</p>
              <p className="text-gray-900">
                {desarquivamento.requerente || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Setor Demandante</p>
              <p className="text-gray-900">
                {desarquivamento.setorDemandante}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Servidor Responsável</p>
              <p className="text-gray-900">
                {desarquivamento.servidorResponsavel}
              </p>
            </div>
            {desarquivamento.urgente && (
              <div>
                <p className="text-sm text-gray-600">Prioridade</p>
                <Badge variant="destructive" className="mt-1">
                  URGENTE
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Requerente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Requerente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Nome Completo</p>
              <p className="font-medium">{desarquivamento.nomeCompleto}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Usuário Solicitante</p>
              <p className="font-medium">{desarquivamento.usuario?.nome || 'N/A'}</p>
            </div>
            {desarquivamento.responsavel && (
              <div>
                <p className="text-sm text-gray-600">Responsável pelo Atendimento</p>
                <p className="font-medium">{desarquivamento.responsavel.nome}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Data de Solicitação</p>
              <p className="font-medium">{formatDate(desarquivamento.dataSolicitacao)}</p>
            </div>
            {desarquivamento.dataDesarquivamentoSAG && (
              <div>
                <p className="text-sm text-gray-600">Data do Desarquivamento - SAG</p>
                <p className="font-medium">{formatDate(desarquivamento.dataDesarquivamentoSAG)}</p>
              </div>
            )}
            {desarquivamento.dataDevolucaoSetor && (
              <div>
                <p className="text-sm text-gray-600">Data da Devolução pelo Setor</p>
                <p className="font-medium">{formatDate(desarquivamento.dataDevolucaoSetor)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Justificativa e Prazos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Justificativa e Prazos
          </CardTitle>
          <CardDescription>
            Finalidade, justificativa e prazos da solicitação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Finalidade do Desarquivamento *</p>
            <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
              {desarquivamento.finalidadeDesarquivamento}
            </p>
          </div>

          {desarquivamento.justificativa && (
            <div>
              <p className="text-sm text-gray-600 font-medium mb-2">Justificativa</p>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                {desarquivamento.justificativa}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {desarquivamento.prazoDesarquivamento && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Prazo de Desarquivamento</p>
                <p className="text-gray-900 text-base">
                  {formatDate(desarquivamento.prazoDesarquivamento)}
                </p>
              </div>
            )}
            
            {desarquivamento.prazoVencimento && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Prazo de Vencimento</p>
                <p className={`text-base font-medium ${new Date(desarquivamento.prazoVencimento) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(desarquivamento.prazoVencimento)}
                  {new Date(desarquivamento.prazoVencimento) < new Date() && (
                    <span className="ml-2 text-xs">(Vencido)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {desarquivamento.solicitacaoProrrogacao && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-gray-600 font-medium">Solicitação de Prorrogação</p>
                <Badge variant="secondary">
                  Sim
                </Badge>
              </div>
              {desarquivamento.solicitacaoProrrogacaoTexto && (
                <p className="text-sm text-gray-900 bg-amber-50 p-3 rounded-md border border-amber-200 whitespace-pre-wrap">
                  {desarquivamento.solicitacaoProrrogacaoTexto}
                </p>
              )}
            </div>
          )}

          {desarquivamento.dadosAdicionais && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-2">Dados Adicionais</p>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                {desarquivamento.dadosAdicionais}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comentários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários
          </CardTitle>
          <CardDescription>
            Comentários sobre esta solicitação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <textarea
              className="w-full min-h-[90px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Escreva um comentário sobre esta solicitação..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              maxLength={2000}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Registrado como{' '}
                <strong>
                  {user?.nome || user?.usuario || 'Usuário'}
                </strong>
              </span>
              <button
                type="submit"
                disabled={addCommentMutation.isPending}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Comentário
              </button>
            </div>
          </form>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhum comentário registrado até o momento.
              </p>
            ) : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  className="border border-gray-200 rounded-md px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">
                      {comment.authorName}
                    </span>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {comment.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Alterações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico
          </CardTitle>
          <CardDescription>
            Registro de alterações na solicitação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b last:border-b-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Solicitação criada</p>
                  <span className="text-sm text-gray-500">
                    {formatDate(desarquivamento.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Solicitação de desarquivamento criada no sistema
                </p>
              </div>
            </div>

            {desarquivamento.updatedAt !== desarquivamento.createdAt && (
              <div className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Solicitação atualizada</p>
                    <span className="text-sm text-gray-500">
                      {formatDate(desarquivamento.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Última modificação realizada na solicitação
                  </p>
                </div>
              </div>
            )}

            {desarquivamento.status !== StatusDesarquivamento.SOLICITADO && (
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  desarquivamento.status === StatusDesarquivamento.FINALIZADO ? 'bg-green-500' :
                  desarquivamento.status === StatusDesarquivamento.NAO_LOCALIZADO ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      Status alterado para {getStatusLabel(desarquivamento.status)}
                    </p>
                    <span className="text-sm text-gray-500">
                      {formatDate(desarquivamento.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Status da solicitação foi atualizado
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Ações */}
      {desarquivamento?.id && (
        <HistoricoTimeline desarquivamentoId={desarquivamento.id} />
      )}

      {/* Anexos - Divididos em Desarquivamento e Rearquivamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnexosSection
          title="Anexos de Desarquivamento"
          description="Documentos relacionados ao desarquivamento"
          anexos={anexosDesarquivamento ?? []}
          isLoading={isLoadingAnexosDesarq}
          canEdit={canEdit}
          tipoAnexo="desarquivamento"
          numeroProcesso={desarquivamento?.numeroProcesso}
          onUpload={handleUploadDesarquivamento}
          onDownload={handleDownloadAnexo}
          onDelete={handleDeleteAnexo}
          onView={handleViewAnexo}
          onUpdateDescricao={handleUpdateDescricao}
          isUploading={uploadAnexoMutation.isPending}
        />

        <AnexosSection
          title="Anexos de Rearquivamento"
          description="Documentos relacionados ao rearquivamento"
          anexos={anexosRearquivamento ?? []}
          isLoading={isLoadingAnexosRearq}
          canEdit={canEdit}
          tipoAnexo="rearquivamento"
          numeroProcesso={desarquivamento?.numeroProcesso}
          onUpload={handleUploadRearquivamento}
          onDownload={handleDownloadAnexo}
          onDelete={handleDeleteAnexo}
          onView={handleViewAnexo}
          onUpdateDescricao={handleUpdateDescricao}
          isUploading={uploadAnexoMutation.isPending}
        />
      </div>

      {/* Modal de Visualização */}
      <ImagePreviewModal
        anexo={previewAnexo}
        previewUrl={previewUrl}
        onClose={closePreview}
        onUpdateDescricao={handleUpdateDescricao}
        onDownload={anexoId => handleDownloadAnexo(Number(anexoId))}
        canEdit={canEdit}
        allImages={[...(anexosDesarquivamento ?? []), ...(anexosRearquivamento ?? [])]}
      />
    </div>
  )
}

export default DetalhesDesarquivamentoPage












