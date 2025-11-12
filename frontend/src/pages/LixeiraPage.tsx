import React, { useState } from 'react';
import { useDesarquivamentosLixeira, useRestoreDesarquivamento } from '../hooks/useDesarquivamentos';
import { Desarquivamento } from '../types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trash2, RotateCcw, Calendar, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const LixeiraPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const navigate = useNavigate();

  const {
    data: lixeiraData,
    isLoading,
    error,
    refetch
  } = useDesarquivamentosLixeira({ page, limit });

  const restoreDesarquivamento = useRestoreDesarquivamento();
  const handlePermanentDelete = async (desarquivamento: Desarquivamento) => {
    try {
      const ok = window.confirm(`Excluir permanentemente o registro ${desarquivamento.numeroProcesso}? Esta ação é irreversível.`)
      if (!ok) return

      // Chama endpoint de exclusão permanente (requer role ADMIN)
      await apiService.deleteDesarquivamentoPermanente(desarquivamento.id)

      toast.success('Desarquivamento excluído permanentemente')
      refetch()
    } catch (error) {
      console.error('Erro ao excluir permanentemente:', error)
      toast.error('Erro ao excluir permanentemente. Verifique permissões.')
    }
  }

  const handleRestore = async (desarquivamento: Desarquivamento) => {
    try {
      console.log('🔄 Iniciando restauração do desarquivamento:', desarquivamento.id);

      // Validar se o ID é válido
      if (!desarquivamento.id || desarquivamento.id <= 0) {
        console.error('❌ ID inválido:', desarquivamento.id);
        toast.error('ID do desarquivamento é inválido.');
        return;
      }

      await restoreDesarquivamento.mutateAsync(desarquivamento.id);

      toast.success(`Desarquivamento "${desarquivamento.numeroProcesso}" restaurado com sucesso!`);
      console.log('✅ Desarquivamento restaurado com sucesso:', desarquivamento.id);

      // Forçar atualização da lista
      refetch();
    } catch (error) {
      console.error('❌ Erro ao restaurar desarquivamento:', error);
      toast.error('Erro ao restaurar desarquivamento. Tente novamente.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente':
        return 'secondary';
      case 'em_andamento':
        return 'default';
      case 'concluido':
        return 'default';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'urgente':
        return 'destructive';
      case 'normal':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando itens da lixeira...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg text-red-600">Erro ao carregar lixeira</div>
            <Button onClick={() => refetch()} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const desarquivamentos = lixeiraData?.data || [];
  const meta = lixeiraData?.meta;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/desarquivamentos')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Trash2 className="h-8 w-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lixeira</h1>
            <p className="text-gray-600">Itens excluídos que podem ser restaurados</p>
          </div>
        </div>
        
        {meta && meta.total > 0 && (
          <div className="text-sm text-gray-500">
            {meta.total} {meta.total === 1 ? 'item' : 'itens'} na lixeira
          </div>
        )}
      </div>

      {desarquivamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Lixeira vazia</h3>
            <p className="text-gray-500 text-center">
              Não há itens excluídos para exibir.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {desarquivamentos.map((desarquivamento) => (
            <Card key={desarquivamento.id} className="border-l-4 border-l-red-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      Processo: {desarquivamento.numeroProcesso}
                    </CardTitle>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant={getStatusBadgeVariant(desarquivamento.status)}>
                        {desarquivamento.status}
                      </Badge>
                      <Badge variant={getTipoBadgeVariant(desarquivamento.tipoDesarquivamento)}>
                        {desarquivamento.tipoDesarquivamento}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleRestore(desarquivamento)}
                    disabled={restoreDesarquivamento.isPending}
                    size="sm"
                    className="ml-4"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {restoreDesarquivamento.isPending ? 'Restaurando...' : 'Restaurar'}
                  </Button>
                  <Button
                    onClick={() => handlePermanentDelete(desarquivamento)}
                    size="sm"
                    variant="destructive"
                    className="ml-2"
                  >
                    Excluir permanentemente
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Criado por:</span>
                      <span>{desarquivamento.usuario?.nome || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Criado em:</span>
                      <span>
                        {/* Exemplo de formatação - ajuste conforme necessário */}
                        {desarquivamento?.createdAt ? format(new Date(desarquivamento.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Excluído em:</span>
                      <span>
                        {desarquivamento?.deletedAt ? format(new Date(desarquivamento.deletedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {desarquivamento?.finalidadeDesarquivamento && (
                  <div className="mt-4">
                    <span className="font-medium">Finalidade:</span>
                    <p className="text-gray-600 mt-1">{desarquivamento.finalidadeDesarquivamento}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {/* Paginação */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Página {meta.page} de {meta.totalPages}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!meta.hasPrev}
                >
                  Anterior
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!meta.hasNext}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LixeiraPage;
