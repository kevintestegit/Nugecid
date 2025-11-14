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
      await onUpload(selectedFile, fileDescricao, anexarAoProcesso)
      setSelectedFile(null)
      setFileDescricao('')
      setAnexarAoProcesso(false)
      toast.success('Anexo enviado com sucesso!')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao enviar anexo'
      toast.error(message)
    }
  }

  const handleDelete = async (anexoId: number) => {
    if (!confirm('Deseja realmente excluir este anexo?')) return

    try {
      await onDelete(anexoId)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload de anexo */}
        {canEdit && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Selecionar arquivo
              </label>
              {selectedFile && (
                <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setFileDescricao('')
                      }}
                      className="text-gray-400 hover:text-gray-600"
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
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                      <input
                        type="checkbox"
                        id={`anexarAoProcesso-${tipoAnexo}`}
                        checked={anexarAoProcesso}
                        onChange={(e) => setAnexarAoProcesso(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <Label 
                        htmlFor={`anexarAoProcesso-${tipoAnexo}`} 
                        className="text-sm font-medium text-blue-900 cursor-pointer flex-1"
                      >
                        Anexar ao processo inteiro
                        <span className="block text-xs font-normal text-blue-700 mt-0.5">
                          Este anexo ficará disponível em todas as {anexos.filter(a => a.numeroProcesso === numeroProcesso).length || 'outras'} solicitações do processo {numeroProcesso}
                        </span>
                      </Label>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isUploading ? 'Enviando...' : 'Enviar Anexo'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setFileDescricao('')
                      }}
                      className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : anexos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Nenhum anexo encontrado.
            </p>
          ) : (
            anexos.map((anexo) => (
              <div
                key={anexo.id}
                className="flex flex-col p-3 border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
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
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {anexo.nomeOriginal}
                        </p>
                        {anexo.tipoVinculo === 'processo' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                            Processo
                          </span>
                        )}
                        {anexo.tipoVinculo === 'solicitacao' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 flex-shrink-0">
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
                            <p className="text-sm text-gray-700 mt-0.5">
                              {anexo.descricao}
                            </p>
                          ) : null}
                          <p className="text-xs text-gray-500 mt-1">
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
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {canEdit && onUpdateDescricao && editingAnexoId !== anexo.id && (
                      <button
                        onClick={() => handleStartEdit(anexo)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar descrição"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDownload(anexo.id)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Baixar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(anexo.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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
      </CardContent>
    </Card>
  )
}
