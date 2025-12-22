import React, { useEffect, useMemo, useState } from 'react'
import { UserPlus, Shield, X, Loader2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Avatar } from './Avatar'
import { kanbanService } from '../../services/kanbanService'
import { MembroProjeto, PapelMembro } from '../../types/kanban.types'
import { cn } from '../../lib/utils'

type UserOption = {
  id: number
  nome?: string
  usuario?: string
  avatarUrl?: string | null
}

interface ProjectMembersModalProps {
  open: boolean
  projetoId: number
  initialMembers?: MembroProjeto[]
  onClose: () => void
  onChanged?: () => Promise<void> | void
}

const papelLabels: Record<PapelMembro, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  open,
  projetoId,
  initialMembers = [],
  onClose,
  onChanged,
}) => {
  const normalizeMembers = (list: any): MembroProjeto[] =>
    Array.isArray(list) ? list : [];

  const [members, setMembers] = useState<MembroProjeto[]>(normalizeMembers(initialMembers))
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMembers(normalizeMembers(initialMembers));
  }, [initialMembers]);

  useEffect(() => {
    if (!open) return
    const loadMembers = async () => {
      setLoading(true)
      try {
        const data = await kanbanService.getProjetoMembros(projetoId)
        setMembers(normalizeMembers(data))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar membros do projeto', error)
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [open, projetoId])

  useEffect(() => {
    let active = true
    const fetchSuggestions = async () => {
      if (!searchTerm.trim()) {
        setSuggestions([])
        return
      }
      try {
        const data = await kanbanService.searchUsuariosParaProjeto(
          projetoId,
          searchTerm.trim(),
        )
        if (active) setSuggestions(data)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao buscar usuários', error)
      }
    }
    fetchSuggestions()
    return () => {
      active = false
    }
  }, [searchTerm, projetoId])

  const handleAdd = async (user: UserOption, papel: PapelMembro) => {
    setSaving(true)
    try {
      const novo = await kanbanService.addProjetoMembro(projetoId, {
        usuarioId: user.id,
        papel,
      })
      setMembers((prev) => [novo, ...prev])
      setSearchTerm('')
      setSuggestions([])
      await onChanged?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao adicionar membro', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (membro: MembroProjeto, papel: PapelMembro) => {
    setSaving(true)
    try {
      const atualizado = await kanbanService.updateProjetoMembro(
        projetoId,
        membro.id,
        { papel },
      )
      setMembers((prev) =>
        prev.map((m) => (m.id === membro.id ? atualizado : m)),
      )
      await onChanged?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao alterar papel', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (membro: MembroProjeto) => {
    setSaving(true)
    try {
      await kanbanService.removeProjetoMembro(projetoId, membro.id)
      setMembers((prev) => prev.filter((m) => m.id !== membro.id))
      await onChanged?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao remover membro', error)
    } finally {
      setSaving(false)
    }
  }

  const memberCards = useMemo(
    () =>
      normalizeMembers(members).map((membro) => (
        <div
          key={membro.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
        >
          <div className="flex items-center gap-3">
            <Avatar usuario={membro.usuario} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {membro.usuario?.nome || membro.usuario?.usuario || `#${membro.usuarioId}`}
              </span>
              <span className="text-xs text-gray-500">ID {membro.usuarioId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={membro.papel}
              onValueChange={(value) => handleRoleChange(membro, value as PapelMembro)}
              disabled={saving}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(membro)}
              className="text-red-500 hover:text-red-600"
              disabled={saving}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )),
    [members, saving],
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Membros do Projeto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-700 mb-3">
              Adicione usuários ao projeto e defina o papel (Admin, Editor ou Viewer).
            </p>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Buscar usuário por nome ou usuário"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {suggestions.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-white">
                  {suggestions.map((sugestao) => {
                    const suggestionUser = {
                      id: sugestao.id,
                      nome: sugestao.nome ?? sugestao.usuario ?? `#${sugestao.id}`,
                      usuario: sugestao.usuario ?? sugestao.nome ?? '',
                      avatarUrl: sugestao.avatarUrl ?? null,
                    }

                    return (
                      <div
                        key={sugestao.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar usuario={suggestionUser} size="sm" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {sugestao.nome || sugestao.usuario || `#${sugestao.id}`}
                            </span>
                            {sugestao.usuario && (
                              <span className="text-xs text-gray-500">@{sugestao.usuario}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            defaultValue="editor"
                            onValueChange={(papel) =>
                              handleAdd(sugestao, papel as PapelMembro)
                            }
                            disabled={saving}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Papel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleAdd(sugestao, 'editor')}
                            disabled={saving}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={cn('space-y-2', loading && 'opacity-60')}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                Membros ({members.length})
              </span>
              {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
            </div>
            {members.length === 0 && !loading && (
              <div className="text-sm text-gray-500">Nenhum membro adicionado ainda.</div>
            )}
            {memberCards}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
