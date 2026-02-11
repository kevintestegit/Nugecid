import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Upload,
  Download,
  Trash2,
  Paperclip,
  X,
  Loader2,
  Eye,
  Edit2,
} from 'lucide-react'
import { toast } from 'sonner'
import { DesarquivamentoAnexo } from '@/hooks/useDesarquivamentosAnexos'
import { ImageThumbnail } from './ImageThumbnail'
import { LinearProgress } from '@/components/ui/ProgressBar'
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog'
import { NoFilesFound } from '@/components/ui/EmptyState'

interface AnexosSectionProps {
  title: string
  description: string
  anexos: DesarquivamentoAnexo[]
  isLoading: boolean
  canEdit: boolean
  tipoAnexo: 'desarquivamento' | 'rearquivamento'
  numeroProcesso?: string | null
  onUpload: (file: File, descricao: string, anexarAoProcesso?: boolean) => Promise<void>
  onDownload: (anexoId: number) => Promise<void>
  onDelete: (anexoId: number) => Promise<void>
  onView?: (anexo: DesarquivamentoAnexo) => void
  onUpdateDescricao?: (anexoId: number, descricao: string) => Promise<void>
  isUploading?: boolean
}

export const AnexosSection: React.FC<AnexosSectionProps> = ({
  title,
  description,
  anexos,
  isLoading,
  canEdit,
  tipoAnexo,
  numeroProcesso,
  onUpload,
  onDownload,
  onDelete,
  onView,
  onUpdateDescricao,
  isUploading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDescricao, setFileDescricao] = useState('')
  const [anexarAoProcesso, setAnexarAoProcesso] = useState(false)
  const [editingAnexoId, setEditingAnexoId] = useState<number | null>(null)
  const [editDescricao, setEditDescricao] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteAnexoId, setDeleteAnexoId] = useState<number | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploadProgress(0)
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 200)

      await onUpload(selectedFile, fileDescricao, anexarAoProcesso)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setTimeout(() => {
        setSelectedFile(null)
        setFileDescricao('')
        setAnexarAoProcesso(false)
        setUploadProgress(0)
      }, 1000)

      toast.success('Anexo enviado com sucesso!')
    } catch (error: any) {
      setUploadProgress(0)
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao enviar anexo'
      toast.error(message)
    }
  }

  const handleDeleteClick = (anexoId: number) => {
    setDeleteAnexoId(anexoId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteAnexoId) return

    try {
      await onDelete(deleteAnexoId)
      setDeleteAnexoId(null)
      toast.success('Anexo excluído com sucesso!')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao excluir anexo'
      toast.error(message)
    }
  }

  const handleStartEdit = (anexo: DesarquivamentoAnexo) => {
    setEditingAnexoId(anexo.id)
    setEditDescricao(anexo.descricao || '')
  }

  const handleSaveEdit = async (anexoId: number) => {
    if (!onUpdateDescricao) return

    try {
      await onUpdateDescricao(anexoId, editDescricao)
      setEditingAnexoId(null)
      toast.success('Descrição atualizada com sucesso!')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao atualizar descrição'
      toast.error(message)
    }
  }

  return (
    <Card className="border-border/60 bg-card/85 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload de anexo */}
        {canEdit && (
          <div className="rounded-xl border-2 border-dashed border-border/70 bg-background/40 p-4">
            <div className="text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                Arraste um arquivo aqui ou clique para selecionar
              </p>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id={`file-upload-${tipoAnexo}`}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
              <label
                htmlFor={`file-upload-${tipoAnexo}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Upload className="h-4 w-4" />
                Selecionar arquivo
              </label>
              {selectedFile && (
                <div className="mt-4 space-y-3 rounded-xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setFileDescricao('')
                      }}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`fileDescricao-${tipoAnexo}`} className="text-sm">
                      Título / Descrição (opcional)
                    </Label>
                    <Input
                      id={`fileDescricao-${tipoAnexo}`}
                      value={fileDescricao}
                      onChange={(e) => setFileDescricao(e.target.value)}
                      placeholder="Ex: Laudo pericial anexado, Documentos complementares..."
                      maxLength={500}
                      className="w-full"
                    />
                  </div>
                  {numeroProcesso && (
                    <div className="flex items-center gap-2 rounded border border-primary/20 bg-primary/10 p-3">
                      <input
                        type="checkbox"
                        id={`anexarAoProcesso-${tipoAnexo}`}
                        checked={anexarAoProcesso}
                        onChange={(e) => setAnexarAoProcesso(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                      />
                      <Label 
                        htmlFor={`anexarAoProcesso-${tipoAnexo}`} 
                        className="flex-1 cursor-pointer text-sm font-medium text-foreground"
                      >
                        Anexar ao processo inteiro
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          Este anexo ficará disponível em todas as {anexos.filter(a => a.numeroProcesso === numeroProcesso).length || 'outras'} solicitações do processo {numeroProcesso}
                        </span>
                      </Label>
                    </div>
                  )}

                  {/* Progress bar */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <LinearProgress
                        value={uploadProgress}
                        label={selectedFile.name}
                        showLabel={true}
                        animated={uploadProgress < 100}
                        variant={uploadProgress === 100 ? 'success' : 'default'}
                        size="sm"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 rounded-xl border border-primary/20 bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isUploading ? 'Enviando...' : 'Enviar Anexo'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setFileDescricao('')
                      }}
                      disabled={isUploading}
                      className="rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de anexos */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : anexos.length === 0 ? (
            <NoFilesFound
              description="Nenhum anexo foi adicionado ainda."
              variant="compact"
            />
          ) : (
            anexos.map((anexo) => (
              <div
                key={anexo.id}
                className="flex flex-col rounded-md border border-border/60 bg-background/55 p-3 transition-colors hover:border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <ImageThumbnail
                        desarquivamentoId={anexo.desarquivamentoId}
                        numeroProcesso={anexo.numeroProcesso}
                        anexoId={anexo.id}
                        nomeOriginal={anexo.nomeOriginal}
                        tipoMime={anexo.tipoMime}
                        previewUrl={anexo.previewUrl}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {anexo.nomeOriginal}
                        </p>
                        {anexo.tipoVinculo === 'processo' && (
                          <span className="inline-flex flex-shrink-0 items-center rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Processo
                          </span>
                        )}
                        {anexo.tipoVinculo === 'solicitacao' && (
                          <span className="inline-flex flex-shrink-0 items-center rounded border border-border/70 bg-muted/35 px-2 py-0.5 text-xs font-medium text-foreground/85">
                            Solicitação
                          </span>
                        )}
                      </div>
                      {editingAnexoId === anexo.id ? (
                        <div className="mt-2 flex gap-2">
                          <Input
                            value={editDescricao}
                            onChange={(e) => setEditDescricao(e.target.value)}
                            placeholder="Descrição do anexo"
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(anexo.id)}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingAnexoId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          {anexo.descricao ? (
                            <p className="mt-0.5 text-sm text-foreground/90">
                              {anexo.descricao}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Enviado por {anexo.usuario?.nome || 'Usuário'} em{' '}
                            {new Date(anexo.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {onView && (anexo.tipoMime.startsWith('image/') || anexo.tipoMime === 'application/pdf') && (
                      <button
                        onClick={() => onView(anexo)}
                        className="rounded p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {canEdit && onUpdateDescricao && editingAnexoId !== anexo.id && (
                      <button
                        onClick={() => handleStartEdit(anexo)}
                        className="rounded p-2 text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-600"
                        title="Editar descrição"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDownload(anexo.id)}
                      className="rounded p-2 text-muted-foreground transition-colors hover:bg-green-500/10 hover:text-green-600"
                      title="Baixar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteClick(anexo.id)}
                        className="rounded p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Confirm Delete Dialog */}
        <EnhancedConfirmDialog
          isOpen={deleteAnexoId !== null}
          onClose={() => setDeleteAnexoId(null)}
          onConfirm={handleConfirmDelete}
          title="Excluir anexo"
          description="Tem certeza que deseja excluir este anexo?"
          variant="danger"
          confirmationType="checkbox"
          checkboxLabel="Sim, quero excluir este anexo permanentemente"
          warningList={[
            'O anexo será removido permanentemente',
            'Esta ação não pode ser desfeita',
            'O arquivo será apagado do servidor'
          ]}
        />
      </CardContent>
    </Card>
  )
}
