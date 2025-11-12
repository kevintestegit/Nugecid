import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { Badge } from '@/components/ui'
import { 
  Filter, 
  X, 
  Search, 
  Calendar, 
  User, 
  Flag,
  RefreshCw
} from 'lucide-react'
import { QueryTarefaDto, StatusTarefa, PrioridadeTarefa, User as UserType } from '@/types'

interface TarefaFiltersProps {
  filters: QueryTarefaDto
  onFiltersChange: (filters: QueryTarefaDto) => void
  usuarios?: UserType[]
  projetos?: any[]
  onClearFilters: () => void
  loading?: boolean
  showAdvanced?: boolean
  onToggleAdvanced?: () => void
}

const TarefaFilters: React.FC<TarefaFiltersProps> = ({
  filters,
  onFiltersChange,
  usuarios = [],
  projetos = [],
  onClearFilters,
  loading = false,
  showAdvanced = false,
  onToggleAdvanced
}) => {
  const handleFilterChange = (field: keyof QueryTarefaDto, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
      page: 1 // Reset para primeira página quando filtrar
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.responsavelId) count++
    if (filters.criadorId) count++
    if (filters.projetoId) count++
    if (filters.prioridade) count++
    if (filters.incluirExcluidas) count++
    return count
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return 'Pendente'
      case StatusTarefa.EM_ANDAMENTO:
        return 'Em Andamento'
      case StatusTarefa.CONCLUIDA:
        return 'Concluída'
      case StatusTarefa.CANCELADA:
        return 'Cancelada'
      default:
        return 'Todos os status'
    }
  }

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case PrioridadeTarefa.BAIXA:
        return 'Baixa'
      case PrioridadeTarefa.MEDIA:
        return 'Média'
      case PrioridadeTarefa.ALTA:
        return 'Alta'
      case PrioridadeTarefa.CRITICA:
        return 'Crítica'
      default:
        return 'Todas as prioridades'
    }
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onToggleAdvanced && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleAdvanced}
              >
                {showAdvanced ? 'Ocultar' : 'Avançado'}
              </Button>
            )}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Buscar por título ou descrição..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros básicos em linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Select
                value={filters.responsavelId?.toString() || 'all'}
                onValueChange={(value) => handleFilterChange('responsavelId', value && value !== 'all' ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id.toString()}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {usuario.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select
                value={filters.prioridade || 'all'}
                onValueChange={(value) => handleFilterChange('prioridade', value && value !== 'all' ? value : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {Object.values(PrioridadeTarefa).map((prioridade) => (
                  <SelectItem key={prioridade} value={prioridade}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      {getPrioridadeLabel(prioridade)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projeto */}
          {projetos.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="projeto">Projeto</Label>
              <Select
                  value={filters.projetoId?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('projetoId', value && value !== 'all' ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projetos.map((projeto) => (
                    <SelectItem key={projeto.id} value={projeto.id.toString()}>
                      {projeto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Filtros avançados */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Criador */}
              <div className="space-y-2">
                <Label htmlFor="criador">Criado por</Label>
                <Select
                    value={filters.criadorId?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('criadorId', value && value !== 'all' ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os criadores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os criadores</SelectItem>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {usuario.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenação */}
              <div className="space-y-2">
                <Label htmlFor="ordenacao">Ordenar por</Label>
                <Select
                  value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-')
                    handleFilterChange('sortBy', sortBy)
                    handleFilterChange('sortOrder', sortOrder)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Mais recentes</SelectItem>
                    <SelectItem value="createdAt-asc">Mais antigas</SelectItem>
                    <SelectItem value="titulo-asc">Título (A-Z)</SelectItem>
                    <SelectItem value="titulo-desc">Título (Z-A)</SelectItem>
                    <SelectItem value="prazo-asc">Prazo (próximo)</SelectItem>
                    <SelectItem value="prazo-desc">Prazo (distante)</SelectItem>
                    <SelectItem value="prioridade-desc">Prioridade (alta)</SelectItem>
                    <SelectItem value="prioridade-asc">Prioridade (baixa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opções adicionais */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.incluirExcluidas || false}
                  onChange={(e) => handleFilterChange('incluirExcluidas', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Incluir tarefas excluídas</span>
              </label>
            </div>
          </div>
        )}

        {/* Resumo dos filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Filtros ativos:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Busca: {filters.search}
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.responsavelId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Responsável: {usuarios.find(u => u.id === filters.responsavelId)?.nome}
                  <button
                    onClick={() => handleFilterChange('responsavelId', undefined)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.prioridade && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  {getPrioridadeLabel(filters.prioridade)}
                  <button
                    onClick={() => handleFilterChange('prioridade', undefined)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TarefaFilters