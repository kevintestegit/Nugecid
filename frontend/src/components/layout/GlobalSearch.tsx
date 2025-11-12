import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, User, Loader2, X, CheckSquare, Kanban, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiService } from '@/services/api'
import { SearchResult } from '@/types'

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atalho de teclado (Ctrl+K ou Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Navegação com teclado
  useEffect(() => {
    if (!isOpen || !results || results.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  // Buscar resultados
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      setIsOpen(true)
      try {
        console.log('🔍 Buscando:', query.trim())
        const response = await apiService.search({
          query: query.trim(),
          limit: 20,
        })

        console.log('✅ Resposta recebida:', response)

        // A resposta vem dentro de response.data por causa do TransformInterceptor
        const searchData = response.data || response

        // Validar se a resposta tem o formato correto
        if (searchData && Array.isArray(searchData.results)) {
          console.log('📊 Resultados encontrados:', searchData.results.length)
          setResults(searchData.results)
        } else if (Array.isArray(response.results)) {
          console.log('📊 Resultados encontrados:', response.results.length)
          setResults(response.results)
        } else {
          console.warn('⚠️ Resposta em formato inesperado:', response)
          setResults([])
        }

        setSelectedIndex(0)
      } catch (error) {
        console.error('❌ Erro ao buscar:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.url)
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'desarquivamento':
        return <FileText className="h-4 w-4" />
      case 'usuario':
        return <User className="h-4 w-4" />
      case 'tarefa':
        return <CheckSquare className="h-4 w-4" />
      case 'projeto':
        return <Kanban className="h-4 w-4" />
      case 'custodia':
        return <Shield className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getResultColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'desarquivamento':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
      case 'usuario':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
      case 'tarefa':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
      case 'projeto':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300'
      case 'custodia':
        return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div ref={searchRef} className="relative">
      {/* Input de busca */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) {
                setIsOpen(true)
              }
            }}
            placeholder="Buscar..."
            className={cn(
              "w-48 rounded-lg border border-gray-300 bg-white px-10 py-2 text-sm transition-all",
              "placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
              "dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            )}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {isOpen && (query.trim() || isLoading) && (
          <div className="absolute top-full z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            {/* Resultados */}
            <div className="max-h-96 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : results && results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                        index === selectedIndex
                          ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        getResultColor(result.type)
                      )}>
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 truncate dark:text-gray-400">{result.subtitle}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Nenhum resultado encontrado para "{query}"
                  </p>
                </div>
              ) : null}
            </div>

            {/* Footer com dicas */}
            {results && results.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Use ↑↓ para navegar</span>
                  <span>Enter para selecionar</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
