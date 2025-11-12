import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table'
import { TableLoading } from '@/components/ui/Loading'
import { AdminConfirmDialog } from '@/components/ui/AdminConfirmDialog'
import { 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Clock,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Desarquivamento, StatusDesarquivamento, TipoSolicitacao } from '@/types'
import { formatDate, getStatusLabel, getTipoLabel } from '@/utils/format'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'

interface DesarquivamentosTableProps {
  data: Desarquivamento[]
  isLoading?: boolean
  onDelete?: (id: number) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (field: string) => void
  isDeleting?: boolean
}

const DesarquivamentosTable: React.FC<DesarquivamentosTableProps> = ({
  data,
  isLoading = false,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  isDeleting = false
}) => {
  const { user } = useAuth()
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: Desarquivamento | null }>({
    isOpen: false,
    item: null
  })
  const canEdit = user?.role?.name === 'admin' || user?.role?.name === 'coordenador'
  const canDelete = user?.role?.name === 'admin'

  const getStatusColor = (status: StatusDesarquivamento) => {
    switch (status) {
      case StatusDesarquivamento.SOLICITADO:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case StatusDesarquivamento.DESARQUIVADO:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case StatusDesarquivamento.FINALIZADO:
        return 'bg-green-100 text-green-800 border-green-200'
      case StatusDesarquivamento.NAO_COLETADO:
      case StatusDesarquivamento.NAO_LOCALIZADO:
        return 'bg-red-100 text-red-800 border-red-200'
      case StatusDesarquivamento.RETIRADO_PELO_SETOR:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO:
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTipoColor = (tipo: TipoSolicitacao) => {
    switch (tipo) {
      case TipoSolicitacao.DESARQUIVAMENTO:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case TipoSolicitacao.COPIA:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case TipoSolicitacao.VISTA:
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case TipoSolicitacao.CERTIDAO:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isExpired = (dataSolicitacao: string) => {
    // Calculate based on dataSolicitacao + 30 days
    const deadline = new Date(dataSolicitacao)
    deadline.setDate(deadline.getDate() + 30)
    return deadline < new Date()
  }

  const getDaysUntilExpiration = (dataSolicitacao: string) => {
    const today = new Date()
    const deadline = new Date(dataSolicitacao)
    deadline.setDate(deadline.getDate() + 30)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field)
    }
  }

  const handleDeleteClick = (item: Desarquivamento) => {
    console.log('[DesarquivamentosTable] handleDeleteClick - item:', item)
    console.log('[DesarquivamentosTable] handleDeleteClick - item.id:', item.id, 'tipo:', typeof item.id)
    
    // Validação adicional do ID antes de abrir o modal
    if (!item.id || item.id <= 0 || isNaN(item.id)) {
      console.error('[DesarquivamentosTable] ID inválido detectado:', item.id)
      toast.error('Erro', {
        description: `Não é possível excluir este item. ID inválido: ${item.id}`,
        duration: 5000,
      })
      return
    }
    
    setDeleteConfirm({ isOpen: true, item })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm.item && onDelete) {
      console.log('[DesarquivamentosTable] handleDeleteConfirm - item.id:', deleteConfirm.item.id, 'tipo:', typeof deleteConfirm.item.id)
      onDelete(deleteConfirm.item.id)
      setDeleteConfirm({ isOpen: false, item: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, item: null })
  }

  const SortButton: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </Button>
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitações de Desarquivamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableLoading />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitações de Desarquivamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma solicitação encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Não há solicitações que correspondam aos filtros aplicados.
            </p>
            <Button asChild>
              <Link to="/desarquivamentos/novo">
                Nova Solicitação
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Solicitações de Desarquivamento
            </div>
            <Badge variant="outline" className="text-sm">
              {data.length} resultado(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">
                  <SortButton field="numeroNicLaudoAuto">NIC/Laudo</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="tipoDesarquivamento">Tipo</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="nomeCompleto">Nome Completo</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="status">Status</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="dataSolicitacao">Data Solicitação</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="setorDemandante">Setor</SortButton>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const expired = isExpired(item.dataSolicitacao)
                const daysUntilExpiration = getDaysUntilExpiration(item.dataSolicitacao)
                
                return (
                  <TableRow 
                    key={item.id} 
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      expired && "bg-red-50 hover:bg-red-100"
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {item.numeroNicLaudoAuto}
                        </span>
                        {expired && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {item.urgente && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            URGENTE
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                      >
                        {item.tipoDesarquivamento}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{item.nomeCompleto}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getStatusColor(item.status))}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.dataSolicitacao)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {item.setorDemandante}
                        </span>
                        {!expired && daysUntilExpiration <= 7 && daysUntilExpiration > 0 && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            {daysUntilExpiration}d restantes
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/desarquivamentos/${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        {canEdit && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/desarquivamentos/${item.id}/editar`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        
                        {canDelete && onDelete && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Excluir Solicitação"
        description={`Tem certeza que deseja excluir a solicitação ${deleteConfirm.item?.numeroNicLaudoAuto}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

export default DesarquivamentosTable