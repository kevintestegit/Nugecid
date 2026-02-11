import React, { useCallback, useState } from 'react';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { FileUploadProgress } from './ProgressBar';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface MultiFileUploadProps {
  onFilesSelect: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // em MB
  accept?: string;
  className?: string;
  autoUpload?: boolean; // Upload automático ao selecionar
  showPreview?: boolean; // Mostrar preview dos arquivos
}

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  onFilesSelect,
  onUpload,
  maxFiles = 5,
  maxSize = 10,
  accept = '*',
  className,
  autoUpload = false,
  showPreview = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    // Validar tamanho
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }

    // Validar tipo se accept foi especificado
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const fileType = file.type;

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExt === type.toLowerCase();
        }
        return fileType.match(new RegExp(type.replace('*', '.*')));
      });

      if (!isAccepted) {
        return `Tipo de arquivo não permitido. Permitidos: ${accept}`;
      }
    }

    return null;
  }, [accept, maxSize]);

  const handleUpload = useCallback(async (filesToUpload: File[] = selectedFiles) => {
    if (!onUpload || filesToUpload.length === 0) return;

    setIsUploading(true);
    setError(null);

    // Inicializar progresso
    const uploading: UploadingFile[] = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadingFiles(uploading);

    try {
      // Simular progresso (em produção, use XMLHttpRequest ou axios com onUploadProgress)
      for (let i = 0; i < uploading.length; i++) {
        // Atualizar progresso
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadingFiles(prev =>
            prev.map((f, idx) =>
              idx === i ? { ...f, progress } : f
            )
          );
        }

        // Marcar como completo
        setUploadingFiles(prev =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 100, status: 'completed' } : f
          )
        );
      }

      // Chamar callback de upload
      await onUpload(filesToUpload);

      // Limpar após 2 segundos
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadingFiles([]);
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer upload dos arquivos');
      setUploadingFiles(prev =>
        prev.map(f => ({ ...f, status: 'error' as const, error: error.message }))
      );
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, selectedFiles]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    // Validar número de arquivos
    if (selectedFiles.length + fileArray.length > maxFiles) {
      setError(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push(file);
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    onFilesSelect(newFiles);

    // Upload automático se habilitado
    if (autoUpload && onUpload) {
      handleUpload(newFiles);
    }
  }, [autoUpload, handleUpload, maxFiles, onFilesSelect, onUpload, selectedFiles, validateFile]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelect(newFiles);
  };

  const borderStyle = isDragging
    ? 'border-primary bg-primary/10'
    : error
    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
    : 'border-border bg-muted/50';

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300',
          borderStyle,
          isUploading && 'cursor-not-allowed opacity-60'
        )}
      >
        <label className="flex flex-col items-center justify-center w-full cursor-pointer">
          <Upload className="h-10 w-10 mb-4 text-muted-foreground" />
          <p className="mb-2 text-sm text-foreground">
            <span className="font-semibold">Clique para enviar</span> ou arraste e solte
          </p>
          <p className="text-xs text-muted-foreground">
            {accept === '*' ? 'Qualquer tipo de arquivo' : accept.replace(/\./g, '').toUpperCase()}
            {' • '}
            Máximo {maxFiles} arquivo{maxFiles > 1 ? 's' : ''} de {maxSize}MB cada
          </p>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
            disabled={isUploading}
            multiple={maxFiles > 1}
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* File Preview */}
      {showPreview && selectedFiles.length > 0 && !isUploading && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Arquivos selecionados ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-background rounded transition-colors"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Enviando arquivos...
          </h4>
          <FileUploadProgress
            files={uploadingFiles.map(f => ({
              name: f.file.name,
              progress: f.progress,
              status: f.status,
              error: f.error,
            }))}
          />
        </div>
      )}

      {/* Upload Button */}
      {!autoUpload && selectedFiles.length > 0 && !isUploading && (
        <button
          onClick={() => handleUpload()}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
        >
          Enviar {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};

export default MultiFileUpload;
