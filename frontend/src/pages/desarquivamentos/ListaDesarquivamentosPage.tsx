import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Download, Upload, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useDesarquivamentos, useDeleteDesarquivamento } from '@/hooks/useDesarquivamentos'
import { useDesarquivamentosImport } from '@/hooks/useDesarquivamentosImport'
import { StatusDesarquivamento, TipoSolicitacao } from '@/types/desarquivamento'
import { Desarquivamento } from '@/types/desarquivamento'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { ListingStats } from '@/components/desarquivamentos/ListingStats'
import { DesarquivamentosTable } from '@/components/desarquivamentos/DesarquivamentosTable'
import { Pagination } from '@/components/ui/Pagination'
import { ImportModal } from '@/components/desarquivamentos/ImportModal'
import { AdminConfirmDialog } from '@/components/ui/AdminConfirmDialog'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ui/EmptyState'

interface FilterState {
  search: string
  status: StatusDesarquivamento | ''
  tipo: TipoSolicitacao | ''
  dataInicio: string
  dataFim: string
  requerente: string
  vencidas: boolean
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ListaDesarquivamentosPage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState('dataCriacao')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as StatusDesarquivamento) || '',
    tipo: (searchParams.get('tipo') as TipoSolicitacao) || '',
    dataInicio: searchParams.get('dataInicio') || '',
    dataFim: searchParams.get('dataFim') || '',
    requerente: searchParams.get('requerente') || '',
    vencidas: searchParams.get('vencidas') === 'true'
  })

  const [pagination, setPagination] = useState<PaginationState>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '25'),
    total: 0,
    totalPages: 0
  })

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {
      page: pagination.page,
      limit: pagination.limit,
      sortBy,
      sortOrder
    }

    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.tipo) params.tipo = filters.tipo
    if (filters.dataInicio) params.dataInicio = filters.dataInicio

    // Adiciona 1 dia à data final para incluir o dia completo
    if (filters.dataFim) {
      const endDate = new Date(filters.dataFim + 'T00:00:00')
      endDate.setDate(endDate.getDate() + 1)
      const yyyy = endDate.getFullYear()
      const mm = String(endDate.getMonth() + 1).padStart(2, '0')
      const dd = String(endDate.getDate()).padStart(2, '0')
      params.dataFim = `${yyyy}-${mm}-${dd}`
    }

    if (filters.requerente) params.requerente = filters.requerente
    if (filters.vencidas) params.vencidos = 'true'

    return params
  }, [filters, pagination.page, pagination.limit, sortBy, sortOrder])

  // Fetch data
  const queryParams = buildQueryParams()
  const { data, isLoading, error, refetch } = useDesarquivamentos(queryParams)
  const deleteDesarquivamento = useDeleteDesarquivamento()
  const importDesarquivamentos = useDesarquivamentosImport()

  // Update pagination when data changes
  useEffect(() => {
    if (data?.meta) {
      setPagination(prev => ({
        ...prev,
        total: data.meta.total,
        totalPages: data.meta.totalPages
      }))
    }
  }, [data])

  // Update URL params when filters/pagination change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    if (filters.tipo) params.set('tipo', filters.tipo)
    if (filters.dataInicio) params.set('dataInicio', filters.dataInicio)
    if (filters.dataFim) params.set('dataFim', filters.dataFim)
    if (filters.requerente) params.set('requerente', filters.requerente)
    if (filters.vencidas) params.set('vencidas', 'true')
    if (pagination.page > 1) params.set('page', pagination.page.toString())
    if (pagination.limit !== 25) params.set('limit', pagination.limit.toString())
    if (sortBy !== 'dataCriacao') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)

    setSearchParams(params)
  }, [filters, pagination.page, pagination.limit, sortBy, sortOrder, setSearchParams])

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  // Handle filter reset
  const handleFilterReset = () => {
    const resetFilters: FilterState = {
      search: '',
      status: '',
      tipo: '',
      dataInicio: '',
      dataFim: '',
      requerente: '',
      vencidas: false
    }
    setFilters(resetFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }

  // Handle delete
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null; item?: any }>({ isOpen: false, id: null })

  const handleDeleteClick = (id: number, item?: any) => {
    setDeleteConfirm({ isOpen: true, id, item })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return

    try {
      // Validar se o ID é um número válido
      if (deleteConfirm.id <= 0) {
        toast.error('ID inválido', {
          description: 'O ID do desarquivamento não é válido.',
          duration: 5000,
        })
        setDeleteConfirm({ isOpen: false, id: null })
        return
      }

      const result = await deleteDesarquivamento.mutateAsync(deleteConfirm.id)
      
      if (result?.success) {
        toast.success('Desarquivamento excluído com sucesso!', {
          description: `O item foi removido do banco de dados e movido para a lixeira.`,
          duration: 5000,
        })
      }
      
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Delete error:', error)
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido'
      toast.error('Falha ao excluir desarquivamento', {
        description: `Erro: ${errorMessage}`,
        duration: 7000,
      })
      
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, id: null })
  }

  // Calculate stats from current data
  const stats = useMemo(() => {
    if (!data?.data) {
      return {
        total: 0,
        pendente: 0,
        emAnalise: 0,
        aprovado: 0,
        expirados: 0
      }
    }

    const items = data.data
    const now = new Date()

    return {
      total: items.length,
      pendente: items.filter((item: Desarquivamento) => item.status === StatusDesarquivamento.SOLICITADO).length,
      emAnalise: items.filter((item: Desarquivamento) => item.status === StatusDesarquivamento.DESARQUIVADO).length,
      aprovado: items.filter((item: Desarquivamento) => item.status === StatusDesarquivamento.FINALIZADO).length,
      expirados: items.filter((item: Desarquivamento) => {
        // Calculate expiration based on dataSolicitacao + 30 days
        if (!item.dataSolicitacao) return false
        const deadline = new Date(item.dataSolicitacao)
        deadline.setDate(deadline.getDate() + 30)
        return now > deadline && item.status !== StatusDesarquivamento.FINALIZADO && item.status !== StatusDesarquivamento.NAO_COLETADO && item.status !== StatusDesarquivamento.NAO_LOCALIZADO
      }).length
    }
  }, [data?.data])

  // Handle export
  const handleExport = async () => {
    try {
      // TODO: Implement export functionality
      toast.info('Funcionalidade de exportação em desenvolvimento')
    } catch (error) {
      toast.error('Erro ao exportar dados')
    }
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          description="Ocorreu um erro ao carregar as solicitações de desarquivamento."
          action={{
            label: 'Tentar novamente',
            onClick: () => refetch()
          }}
          secondaryAction={{
            label: 'Voltar',
            onClick: () => window.history.back()
          }}
        />
      </div>
    )
  }

  const breadcrumbItems = [
    { label: 'Desarquivamentos', current: true }
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitações de Desarquivamento
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie e acompanhe todas as solicitações de desarquivamento
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          {(user?.role?.name === 'admin' || user?.role?.name === 'coordenador') && (
            <Button 
              variant="outline" 
              onClick={() => setIsImportModalOpen(true)}
              disabled={importDesarquivamentos.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importDesarquivamentos.isPending ? 'Importando...' : 'Importar Planilha'}
            </Button>
          )}
          
          <Button asChild>
            <Link to="/desarquivamentos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={(filters: FilterState) => handleFilterChange(filters)}
        onReset={handleFilterReset}
        isLoading={isLoading}
        totalResults={data?.data?.length || 0}
      />

      {/* Stats */}
      <ListingStats
        stats={stats}
        isLoading={isLoading}
      />

      {/* Table */}
      <DesarquivamentosTable
        data={data?.data || []}
        isLoading={isLoading}
        onDelete={(id: number) => handleDeleteClick(id)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        isDeleting={deleteDesarquivamento.isPending}
      />

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          setIsImportModalOpen(false)
          // The mutation's cache invalidation will automatically refresh the data
        }}
      />

      <AdminConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este desarquivamento? Esta ação irá mover o item para a lixeira."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={deleteDesarquivamento.isPending}
      />
    </div>
  )
}

export default ListaDesarquivamentosPage