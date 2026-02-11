import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Tag, Users, AlertCircle } from 'lucide-react';
import { FiltrosKanban } from '../../types/kanban.types';
import { Usuario } from '../../types/kanban.types';

interface KanbanFiltersProps {
  filtros: FiltrosKanban;
  onFiltrosChange: (filtros: FiltrosKanban) => void;
  usuarios?: Usuario[];
  todasTags?: string[];
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  filtros,
  onFiltrosChange,
  usuarios = [],
  todasTags = [],
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [busca, setBusca] = useState(filtros.busca || '');

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busca !== filtros.busca) {
        onFiltrosChange({ ...filtros, busca: busca || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, filtros, onFiltrosChange]);

  const handleClearFilters = () => {
    setBusca('');
    onFiltrosChange({});
  };

  const hasActiveFilters = 
    filtros.responsavelId || 
    filtros.prioridade || 
    filtros.prazo || 
    (filtros.tags && filtros.tags.length > 0) ||
    filtros.busca;

  const activeFiltersCount = [
    filtros.responsavelId,
    filtros.prioridade,
    filtros.prazo,
    filtros.tags?.length,
    filtros.busca,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Barra de Busca e Toggle de Filtros */}
      <div className="flex gap-2">
        {/* Campo de Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botão de Filtros */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            hasActiveFilters
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Painel de Filtros Expandido */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Responsável */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4" />
                Responsável
              </label>
              <select
                value={filtros.responsavelId || ''}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    responsavelId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">Todos</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Prioridade */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4" />
                Prioridade
              </label>
              <select
                value={filtros.prioridade || ''}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    prioridade: e.target.value as any || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">Todas</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            {/* Filtro de Prazo */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Prazo
              </label>
              <select
                value={filtros.prazo || ''}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    prazo: e.target.value as any || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">Todos</option>
                <option value="atrasadas">Atrasadas</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mês</option>
                <option value="sem_prazo">Sem Prazo</option>
              </select>
            </div>

            {/* Filtro de Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <select
                multiple
                value={filtros.tags || []}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  onFiltrosChange({
                    ...filtros,
                    tags: selectedOptions.length > 0 ? selectedOptions : undefined,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                size={3}
              >
                {todasTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Ctrl/Cmd + clique para selecionar múltiplos
              </p>
            </div>
          </div>

          {/* Filtros Adicionais */}
          <div className="flex gap-4 pt-2 border-t border-gray-200">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.comComentarios || false}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    comComentarios: e.target.checked || undefined,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Com comentários
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.comAnexos || false}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    comAnexos: e.target.checked || undefined,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Com anexos
            </label>
          </div>
        </div>
      )}

      {/* Tags Ativas dos Filtros */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filtros.responsavelId && (
            <FilterTag
              label={`Responsável: ${usuarios.find(u => u.id === filtros.responsavelId)?.nome}`}
              onRemove={() => onFiltrosChange({ ...filtros, responsavelId: undefined })}
            />
          )}
          {filtros.prioridade && (
            <FilterTag
              label={`Prioridade: ${filtros.prioridade}`}
              onRemove={() => onFiltrosChange({ ...filtros, prioridade: undefined })}
            />
          )}
          {filtros.prazo && (
            <FilterTag
              label={`Prazo: ${filtros.prazo}`}
              onRemove={() => onFiltrosChange({ ...filtros, prazo: undefined })}
            />
          )}
          {filtros.tags?.map((tag) => (
            <FilterTag
              key={tag}
              label={`Tag: ${tag}`}
              onRemove={() =>
                onFiltrosChange({
                  ...filtros,
                  tags: filtros.tags?.filter((t) => t !== tag),
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para tags de filtros ativos
const FilterTag: React.FC<{ label: string; onRemove: () => void }> = ({
  label,
  onRemove,
}) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
    {label}
    <button
      onClick={onRemove}
      className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);
