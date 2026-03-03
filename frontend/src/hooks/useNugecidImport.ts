import { useState } from "react";
import axios from "axios";
import { nugecidService } from "@/services/nugecidService";
import type { ImportResultDto } from "@/types";

export const useNugecidImport = (onImportSuccess?: () => void) => {
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultDto | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleFileImport = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await nugecidService.importPlanilha(file);
      setImportResult(result);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (((err.response?.data as Record<string, unknown>)
            ?.message as string) ?? "Ocorreu um erro ao importar a planilha.")
        : "Ocorreu um erro ao importar a planilha.";
      setError(message);
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
    importResult,
    error,
    handleFileImport,
    openImportModal,
    closeImportModal,
  };
};
