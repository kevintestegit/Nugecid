import React, { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Clock3, Tag, User, ListChecks, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { PrazoBadge } from './PrazoBadge'
import { PrioridadeBadge } from './PrioridadeBadge'
import { TagList } from './TagBadge'
import { Avatar } from './Avatar'
import { kanbanService } from '../../services/kanbanService'
import { Tarefa, Comentario } from '../../types/kanban.types'
import { cn } from '../../lib/utils'

type NormalizedComment = {
  id: number
  conteudo: string
  createdAt: string
  usuario?: {
    id: number
    nome?: string
    usuario?: string
    avatar?: string | null
  }
}

type NormalizedHistorico = {
  id: number
  acao: string
  campo?: string
  de?: string | null
  para?: string | null
  createdAt?: string
  usuarioId?: number
}

interface TaskDetailModalProps {
  open: boolean
  task: Tarefa | null
  onClose: () => void
  onRefresh?: () => Promise<void> | void
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  task,
  onClose,
  onRefresh,
}) => {
  const [comments, setComments] = useState<NormalizedComment[]>([])
  const [history, setHistory] = useState<NormalizedHistorico[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [commentText, setCommentText] = useState('')

  const colunaNome = task?.coluna?.nome

  const responsavel = task?.responsavel
  const criadorId = (task as any)?.criadorId || (task as any)?.criador_id

  const prazoLabel = useMemo(() => {
    if (!task?.prazo) return 'Sem prazo'
    const dt = new Date(task.prazo)
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }, [task?.prazo])

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !task) return
      setLoading(true)
      try {
        const [comentariosApi, historicoApi] = await Promise.all([
          kanbanService.getComentarios(task.id),
          kanbanService.getTarefaHistorico(task.id),
        ])

        const normalizedComments: NormalizedComment[] = (comentariosApi || []).map(
          (c: any) => ({
            id: c.id,
            conteudo: c.conteudo,
            createdAt: c.data_criacao || c.created_at || c.createdAt,
            usuario: c.usuario || c.autor || c.user,
          }),
        )
        setComments(normalizedComments)

        const normalizedHistorico: NormalizedHistorico[] = (historicoApi || []).map(
          (h: any) => ({
            id: h.id,
            acao: h.acao,
            campo: h.campo_alterado || h.campoAlterado,
            de: h.valor_anterior || h.valorAnterior,
            para: h.valor_novo || h.valorNovo,
            createdAt: h.data_acao || h.createdAt,
            usuarioId: h.usuarioId || h.usuario_id,
          }),
        )
        setHistory(normalizedHistorico)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar detalhes da tarefa', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, task])

  const handleAddComment = async () => {
    if (!task || !commentText.trim()) return
    setSending(true)
    try {
      const novo = await kanbanService.createComentario({
        conteudo: commentText.trim(),
        tarefa_id: task.id,
      })

      const normalized: NormalizedComment = {
        id: novo.id,
        conteudo: novo.conteudo,
        createdAt: novo.data_criacao || novo.created_at || novo.createdAt,
        usuario: novo.usuario,
      }
      setComments((prev) => [normalized, ...prev])
      setCommentText('')
      await onRefresh?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao adicionar comentário', error)
    } finally {
      setSending(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {colunaNome || 'Coluna'}
              </Badge>
              <PrioridadeBadge prioridade={task.prioridade} />
            </span>
            <PrazoBadge prazo={task.prazo} size="md" />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Título</p>
                  <h2 className="text-lg font-semibold text-gray-900">{task.titulo}</h2>
                </div>
                <Badge variant="secondary">{prazoLabel}</Badge>
              </div>
              {task.descricao && (
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">
                  {task.descricao}
                </p>
              )}
              {task.tags && task.tags.length > 0 && (
                <div className="mt-3">
                  <TagList tags={task.tags} max={5} />
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <MessageCircle className="w-4 h-4" />
                Comentários
              </div>
              <div className="space-y-3">
                <Textarea
                  placeholder="Escreva um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddComment} disabled={sending}>
                    {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Comentar
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando comentários...
                  </div>
                )}
                {!loading && comments.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum comentário ainda.</p>
                )}
                {!loading &&
                  comments.map((comentario) => (
                    <div
                      key={comentario.id}
                      className="flex items-start gap-3 border-b border-gray-100 pb-3"
                    >
                      <Avatar usuario={comentario.usuario} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                          <span className="font-semibold">
                            {comentario.usuario?.nome || comentario.usuario?.usuario || 'Usuário'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comentario.createdAt
                              ? new Date(comentario.createdAt).toLocaleString('pt-BR')
                              : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {comentario.conteudo}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Tag className="w-4 h-4" />
                Detalhes
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge variant="outline">{colunaNome || 'Coluna'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Prioridade</span>
                  <PrioridadeBadge prioridade={task.prioridade} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Prazo</span>
                  <PrazoBadge prazo={task.prazo} showIcon size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Responsável</span>
                  <div className="flex items-center gap-2">
                    <Avatar usuario={responsavel} size="xs" />
                    <span>{responsavel?.nome || responsavel?.usuario || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Criador</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>#{criadorId ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ListChecks className="w-4 h-4" />
                Histórico
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                {loading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando histórico...
                  </div>
                )}
                {!loading && history.length === 0 && (
                  <p className="text-gray-500 text-sm">Nenhum evento registrado.</p>
                )}
                {!loading &&
                  history.map((h) => (
                    <div key={h.id} className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="uppercase tracking-wide font-semibold text-gray-600">
                          {h.acao}
                        </span>
                        {h.createdAt && (
                          <span>{new Date(h.createdAt).toLocaleString('pt-BR')}</span>
                        )}
                      </div>
                      {h.campo && (
                        <p className="text-xs text-gray-700">
                          {h.campo}: {h.de || '—'} → {h.para || '—'}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
