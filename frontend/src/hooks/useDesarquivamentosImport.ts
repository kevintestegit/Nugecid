import { useState } from 'react';
import { apiService } from '@/services/api';
import { ImportResultDto } from '@/types';

export const useDesarquivamentosImport = (onImportSuccess?: () => void) => {
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileImport = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await apiService.importDesarquivamentos(file);
      setImportResult(result.data || result);

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      // Se a API retornou HTTP 400 com detalhes dos erros de validação
      if (err.response?.status === 400 && err.response?.data?.error) {
        const apiError = err.response.data;

        // Extrair os erros da resposta
        const errors = apiError.error?.errors || [];

        // Criar o resultado com os erros
        setImportResult({
          totalRecords: apiError.data?.totalRows || 0,
          successCount: apiError.data?.successCount || 0,
          errorCount: apiError.data?.errorCount || errors.length,
          errors: errors,
          fileName: file.name,
        });

        // Definir mensagem de erro principal
        setError(apiError.message || apiError.error?.summary || 'Erro na validação dos dados.');
      } else {
        // Erro genérico (rede, servidor, etc)
        setError(err.response?.data?.message || err.message || 'Ocorreu um erro ao importar a planilha.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openImportModal = () => {
    setImportModalOpen(true);
    setError(null);
    setImportResult(null);
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
  };

  return {
    isImportModalOpen,
    isLoading,
    isPending: isLoading, // Alias para compatibilidade
    importResult,
    error,
    handleFileImport,
    openImportModal,
    closeImportModal,
  };
};