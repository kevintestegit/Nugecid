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
    if (value === 'deleted') {
      onParamsChange({ 
        active: undefined,
        includeDeleted: true 
      })
    } else {
      onParamsChange({ 
        active: value === '' ? undefined : value === 'true',
        includeDeleted: undefined
      })
    }
  }

  const handleClearFilters = () => {
    onParamsChange({
      search: undefined,
      role: undefined,
      active: true, // Manter apenas usuários ativos por padrão
      includeDeleted: undefined
    })
  }

  const hasActiveFilters = params.search || params.role || params.active === false || params.includeDeleted

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Campo de busca */}
        <div className="space-y-2">
          <label htmlFor="search" className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
          <label htmlFor="role" className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Papel do usuário
          </label>
          <select
            id="role"
            value={params.role || ''}
            onChange={handleRoleChange}
            className="w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/35"
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
            <label htmlFor="active" className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Status do usuário
            </label>
            <select
              id="active"
              value={params.includeDeleted ? 'deleted' : (params.active === undefined ? '' : params.active.toString())}
              onChange={handleActiveChange}
              className="w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/35"
            >
              <option value="">Todos os status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
              <option value="deleted">Incluir deletados</option>
            </select>
          </div>
        )}
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 border-t border-border/70 pt-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {params.search && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
              Busca: "{params.search}"
              <button
                onClick={() => onParamsChange({ search: undefined })}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {params.role && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
              Papel: {params.role === 'admin' ? 'Administrador' : params.role === 'coordenador' ? 'Coordenador' : 'Usuário'}
              <button
                onClick={() => onParamsChange({ role: undefined })}
                className="rounded-full p-0.5 hover:bg-emerald-500/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {params.active === false && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-700 dark:text-red-300">
              Status: Inativos
              <button
                onClick={() => onParamsChange({ active: true })}
                className="rounded-full p-0.5 hover:bg-red-500/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {params.includeDeleted && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-xs text-foreground/85">
              Incluindo deletados
              <button
                onClick={() => onParamsChange({ includeDeleted: undefined, active: true })}
                className="rounded-full p-0.5 hover:bg-muted"
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
