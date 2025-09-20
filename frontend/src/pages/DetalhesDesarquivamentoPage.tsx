import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDesarquivamento } from '@/hooks/useDesarquivamentos'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageLoading } from '@/components/ui/Loading'
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
  Eye
} from 'lucide-react'
import { getStatusLabel } from '@/utils/format'
import { StatusDesarquivamento } from '@/types'

const DetalhesDesarquivamentoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: response, isLoading, error } = useDesarquivamento(id);
  const desarquivamento = response?.data;
  const isIdValid = id ? !isNaN(parseInt(id, 10)) : false;

  const canEdit = user?.role?.name === 'admin' || user?.role?.name === 'coordenador'

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
  const isPrazoVencido = false

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
              Solicitação #{desarquivamento.numeroNicLaudoAuto}
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
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = `/api/nugecid/${id}/termo`
                  link.download = `termo-desarquivamento-${id}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Imprimir Termo
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
              <p className="font-mono text-lg font-medium">{desarquivamento.numeroProcesso}</p>
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
              <p className="text-sm text-gray-600">Finalidade do Desarquivamento</p>
              <p className="text-gray-900 whitespace-pre-wrap">
                {desarquivamento.finalidadeDesarquivamento}
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
            {desarquivamento.solicitacaoProrrogacao && (
              <div>
                <p className="text-sm text-gray-600">Solicitação de Prorrogação</p>
                <Badge variant="secondary" className="mt-1">
                  Sim
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
    </div>
  )
}

export default DetalhesDesarquivamentoPage
