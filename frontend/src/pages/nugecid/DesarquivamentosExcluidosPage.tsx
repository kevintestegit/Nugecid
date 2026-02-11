import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Checkbox } from '../../components/ui/Checkbox';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Pagination } from '../../components/ui/Pagination';
import Loading from '../../components/ui/Loading';
import { Alert } from '../../components/ui/Alert';
import { RefreshCw, Trash2, RotateCcw, Filter, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { useDesarquivamentosExcluidos } from '../../hooks/useDesarquivamentosExcluidos';
import { formatDate } from '../../utils/date';
import { toast } from 'sonner';
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog';

interface FilterState {
  search: string;
  tipoDesarquivamento: string;
  dataExclusaoInicio: string;
  dataExclusaoFim: string;
  status: string;
}

const DesarquivamentosExcluidosPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tipoDesarquivamento: '',
    dataExclusaoInicio: '',
    dataExclusaoFim: '',
    status: ''
  });
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data,
    loading,
    error,
    refetch,
    restoreDesarquivamento,
    restoreMultiple
  } = useDesarquivamentosExcluidos({
    page: currentPage,
    limit: itemsPerPage,
    ...filters
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      tipoDesarquivamento: '',
      dataExclusaoInicio: '',
      dataExclusaoFim: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.items) {
      setSelectedIds(data.items.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleRestoreSelected = async () => {
    try {
      if (selectedIds.length === 1) {
        await restoreDesarquivamento(selectedIds[0]);
        toast.success('Desarquivamento restaurado com sucesso!');
      } else {
        await restoreMultiple(selectedIds);
        toast.success(`${selectedIds.length} desarquivamentos restaurados com sucesso!`);
      }
      
      setSelectedIds([]);
      setShowConfirmDialog(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao restaurar desarquivamento(s)');
    }
  };

  const getTipoDesarquivamentoBadge = (tipo: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'EXTRAVIO': 'destructive',
      'FURTO': 'secondary',
      'ROUBO': 'default',
      'OUTROS': 'outline'
    };
    return <Badge variant={variants[tipo] || 'outline'}>{tipo}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDENTE': 'outline',
      'EM_ANDAMENTO': 'secondary',
      'CONCLUIDO': 'default',
      'CANCELADO': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Desarquivamentos Excluídos</h1>
          <p className="text-gray-600 mt-1">
            Visualize e restaure registros de desarquivamento excluídos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filtros de Busca</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Buscar</label>
                <SearchInput
                  placeholder="Nome, código, solicitante..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Desarquivamento</label>
                <Select
                  value={filters.tipoDesarquivamento}
                  onValueChange={(value) => handleFilterChange('tipoDesarquivamento', value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="EXTRAVIO">Extravio</option>
                  <option value="FURTO">Furto</option>
                  <option value="ROUBO">Roubo</option>
                  <option value="OUTROS">Outros</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <option value="">Todos os status</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Data Exclusão (Início)</label>
                <Input
                  type="date"
                  value={filters.dataExclusaoInicio}
                  onChange={(e) => handleFilterChange('dataExclusaoInicio', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Data Exclusão (Fim)</label>
                <Input
                  type="date"
                  value={filters.dataExclusaoFim}
                  onChange={(e) => handleFilterChange('dataExclusaoFim', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <Trash2 className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Erro ao carregar dados</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Registros Excluídos
              </CardTitle>
              {data && (
                <p className="text-sm text-gray-600 mt-1">
                  {data.total} registro(s) encontrado(s)
                </p>
              )}
            </div>
            
            {selectedIds.length > 0 && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar Selecionados ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {data?.items && data.items.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th className="w-12">
                        <Checkbox
                          checked={data.items.length > 0 && selectedIds.length === data.items.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th>Código</th>
                      <th>Solicitante</th>
                      <th>Vítima</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th>Data Exclusão</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked === true)}
                          />
                        </td>
                        <td className="font-mono text-sm">{item.codigo}</td>
                        <td>{item.nomeSolicitante}</td>
                        <td>{item.nomeVitima}</td>
                        <td>{getTipoDesarquivamentoBadge(item.tipoDesarquivamento)}</td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>{formatDate(item.deletedAt)}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIds([item.id]);
                              setShowConfirmDialog(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restaurar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {data.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={data.totalPages}
                  totalItems={data.total}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum registro excluído encontrado
              </h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f) 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há registros excluídos no momento'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <EnhancedConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleRestoreSelected}
        title="Confirmar restauração"
        description={
          selectedIds.length === 1
            ? 'Tem certeza que deseja restaurar este desarquivamento?'
            : `Tem certeza que deseja restaurar ${selectedIds.length} desarquivamentos?`
        }
        variant="warning"
      />
    </div>
  );
};

export default DesarquivamentosExcluidosPage;
