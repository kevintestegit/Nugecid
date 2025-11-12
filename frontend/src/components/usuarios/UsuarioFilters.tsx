import React from 'react'
import { Filter, X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { UsersQueryParams, UserRole } from '@/types'

interface UsuarioFiltersProps {
  params: UsersQueryParams
  onParamsChange: (params: Partial<UsersQueryParams>) => void
  canManageUsers: boolean
}

const UsuarioFilters: React.FC<UsuarioFiltersProps> = ({
  params,
  onParamsChange,
  canManageUsers
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ search: e.target.value || undefined })
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onParamsChange({ role: value ? (value as UserRole) : undefined })
  }

  const handleActiveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onParamsChange({ 
      active: value === '' ? undefined : value === 'true' 
    })
  }

  const handleClearFilters = () => {
    onParamsChange({
      search: undefined,
      role: undefined,
      active: true // Manter apenas usuários ativos por padrão
    })
  }

  const hasActiveFilters = params.search || params.role || params.active === false

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Campo de busca */}
        <div className="space-y-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Buscar usuário
          </label>
          <SearchInput
            id="search"
            placeholder="Nome ou login..."
            value={params.search || ''}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filtro por papel */}
        <div className="space-y-2">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Papel do usuário
          </label>
          <select
            id="role"
            value={params.role || ''}
            onChange={handleRoleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Todos os papéis</option>
            <option value="admin">Administrador</option>
            <option value="coordenador">Coordenador</option>
            <option value="usuario">Usuário</option>
          </select>
        </div>

        {/* Filtro por status (apenas para admins) */}
        {canManageUsers && (
          <div className="space-y-2">
            <label htmlFor="active" className="block text-sm font-medium text-gray-700">
              Status do usuário
            </label>
            <select
              id="active"
              value={params.active === undefined ? '' : params.active.toString()}
              onChange={handleActiveChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Todos os status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        )}
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Filtros ativos:</span>
          
          {params.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Busca: "{params.search}"
              <button
                onClick={() => onParamsChange({ search: undefined })}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {params.role && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Papel: {params.role === 'admin' ? 'Administrador' : params.role === 'coordenador' ? 'Coordenador' : 'Usuário'}
              <button
                onClick={() => onParamsChange({ role: undefined })}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {params.active === false && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Status: Inativos
              <button
                onClick={() => onParamsChange({ active: true })}
                className="hover:bg-red-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default UsuarioFilters