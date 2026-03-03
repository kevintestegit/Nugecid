import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

const SearchIconTest: React.FC = () => {
  return (
    <div className="p-8 space-y-6 bg-background">
      <h2 className="text-xl font-bold text-foreground">
        Teste de Ícones de Busca
      </h2>

      {/* Teste 1: Ícone isolado */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">1. Ícone Search isolado:</h3>
        <div className="flex items-center gap-4">
          <Search className="h-4 w-4 text-gray-400" />
          <Search className="h-5 w-5 text-blue-500" />
          <Search className="h-6 w-6 text-green-500" />
        </div>
      </div>

      {/* Teste 2: Ícone com posicionamento absoluto */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          2. Ícone com posicionamento absoluto:
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input type="text" placeholder="Digite aqui..." className="pl-10" />
        </div>
      </div>

      {/* Teste 3: Implementação similar ao UsuarioFilters */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          3. Implementação do UsuarioFilters:
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nome ou login..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Teste 4: Com z-index explícito */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">4. Com z-index explícito:</h3>
        <div className="relative w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
            style={{ zIndex: 10 }}
          />
          <Input
            type="text"
            placeholder="Com z-index..."
            className="pl-10 relative z-0"
          />
        </div>
      </div>

      {/* Teste 5: Verificação de visibilidade */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">5. Teste de visibilidade:</h3>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-200 flex items-center justify-center">
            <Search className="h-4 w-4 text-red-600" />
          </div>
          <div className="w-8 h-8 bg-blue-200 flex items-center justify-center">
            <Search className="h-4 w-4 text-blue-600" />
          </div>
          <div className="w-8 h-8 bg-green-200 flex items-center justify-center">
            <Search className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchIconTest;
