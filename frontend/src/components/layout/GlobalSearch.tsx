import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  User,
  Loader2,
  X,
  CheckSquare,
  Kanban,
  Shield,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { SearchResult } from "@/types";

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Atalho de teclado (Ctrl+K ou Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Navegação com teclado
  const handleSelectResult = useCallback((result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  }, [navigate]);

  useEffect(() => {
    if (!isOpen || !results || results.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + results.length) % results.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectResult, isOpen, results, selectedIndex]);

  // Buscar resultados
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      setIsOpen(true);
      try {
        const response = await apiService.search({
          query: query.trim(),
          limit: 20,
        }, controller.signal);

        const searchData = response as any;

        if (!active) return;
        if (Array.isArray(searchData?.results)) {
          setResults(searchData.results);
        } else if (Array.isArray(searchData?.data)) {
          setResults(searchData.data);
        } else {
          setResults([]);
        }

        setSelectedIndex(0);
      } catch (error: any) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
          return;
        }
        setResults([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(searchTimeout);
      controller.abort();
    };
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "desarquivamento":
        return <FileText className="h-4 w-4" />;
      case "usuario":
        return <User className="h-4 w-4" />;
      case "tarefa":
        return <CheckSquare className="h-4 w-4" />;
      case "projeto":
        return <Kanban className="h-4 w-4" />;
      case "custodia":
        return <Shield className="h-4 w-4" />;
      case "pasta":
        return <FolderOpen className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getResultColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "desarquivamento":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      case "usuario":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
      case "tarefa":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
      case "projeto":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
      case "custodia":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
      case "pasta":
        return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Input de busca */}
      <div className="relative">
        <div className="pointer-events-none absolute -inset-x-2 -inset-y-2 -z-10 rounded-2xl bg-[radial-gradient(70%_70%_at_8%_20%,rgba(56,189,248,0.12),transparent_70%),radial-gradient(70%_70%_at_92%_70%,rgba(249,115,22,0.10),transparent_70%)]" />
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) {
                setIsOpen(true);
              }
            }}
            placeholder="Buscar..."
            className={cn(
              "w-48 rounded-xl border border-border/70 bg-card/75 px-10 py-2 text-sm font-medium text-foreground shadow-[0_10px_24px_-20px_rgba(15,23,42,0.8)] backdrop-blur transition-all",
              "placeholder:text-muted-foreground/80 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/25",
            )}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {isOpen && (query.trim() || isLoading) && (
          <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_26px_55px_-38px_rgba(2,6,23,0.92)] backdrop-blur">
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 -bottom-12 h-24 w-24 rounded-full bg-orange-400/10 blur-2xl" />
            {/* Resultados */}
            <div className="max-h-96 overflow-y-auto bg-background/45 p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : results && results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        index === selectedIndex
                          ? "bg-primary/12 text-primary"
                          : "text-foreground/85 hover:bg-muted/55 hover:text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          getResultColor(result.type),
                        )}
                      >
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nenhum resultado encontrado para "{query}"
                  </p>
                </div>
              ) : null}
            </div>

            {/* Footer com dicas */}
            {results && results.length > 0 && (
              <div className="border-t border-border/60 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
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
  );
};
