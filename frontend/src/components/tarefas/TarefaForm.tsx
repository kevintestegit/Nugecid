import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Textarea } from '@/components/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { Save, Loader2 } from 'lucide-react'
import { CreateTarefaDto, UpdateTarefaDto, Tarefa, PrioridadeTarefa, User } from '@/types'
import { toast } from 'sonner'

type ProjetoOption = {
  id: number
  nome: string
}

type ColunaOption = {
  id: number
  nome: string
}

interface FormState {
  titulo: string
  descricao: string
  prioridade: PrioridadeTarefa
  responsavelId: string
  projetoId: string
  colunaId: string
  prazo: string
}

interface TarefaFormProps {
  tarefa?: Tarefa | null
  usuarios?: User[]
  projetos?: ProjetoOption[]
  colunas?: ColunaOption[]
  defaultProjetoId?: number | null
  defaultColunaId?: number | null
  onProjetoChange?: (projectId: number | null) => void
  onColunaChange?: (colunaId: number | null) => void
  onChange?: (data: FormState) => void
  onSubmit: (data: CreateTarefaDto | UpdateTarefaDto) => Promise<void>
  onCancel: () => void
  loading?: boolean
  title?: string
  submitLabel?: string
  cancelLabel?: string
}

const emptyState: FormState = {
  titulo: '',
  descricao: '',
  prioridade: PrioridadeTarefa.MEDIA,
  responsavelId: '',
  projetoId: '',
  colunaId: '',
  prazo: '',
}

const cleanObject = <T extends Record<string, unknown>>(obj: T): T => {
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
  return Object.fromEntries(entries) as T
}

const TarefaForm: React.FC<TarefaFormProps> = ({
  tarefa,
  usuarios = [],
  projetos = [],
  colunas = [],
  defaultProjetoId,
  defaultColunaId,
  onProjetoChange,
  onColunaChange,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  title,
  submitLabel,
  cancelLabel,
}) => {
  const [formData, setFormData] = useState<FormState>(emptyState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEditing = Boolean(tarefa)

  const updateFormData = useCallback(
    (updater: (prev: FormState) => FormState, emitChange = true) => {
      setFormData(prev => {
        const next = updater(prev)
        if (emitChange && onChange) {
          onChange(next)
        }
        return next
      })
    },
    [onChange],
  )

  useEffect(() => {
    if (tarefa) {
      updateFormData(() => ({
        titulo: tarefa.titulo ?? '',
        descricao: tarefa.descricao ?? '',
        prioridade: tarefa.prioridade ?? PrioridadeTarefa.MEDIA,
        responsavelId: tarefa.responsavelId ? tarefa.responsavelId.toString() : '',
        projetoId: tarefa.projetoId ? tarefa.projetoId.toString() : '',
        colunaId: tarefa.colunaId ? tarefa.colunaId.toString() : '',
        prazo: tarefa.prazo ? new Date(tarefa.prazo).toISOString().split('T')[0] : '',
      }), false)
    } else {
      updateFormData(() => emptyState, false)
    }
  }, [tarefa, updateFormData])

  useEffect(() => {
    if (!tarefa && defaultProjetoId && !formData.projetoId) {
      updateFormData(prev => ({ ...prev, projetoId: defaultProjetoId.toString(), colunaId: '' }), false)
    }
  }, [defaultProjetoId, tarefa, formData.projetoId, updateFormData])

  useEffect(() => {
    if (!tarefa && defaultColunaId && !formData.colunaId) {
      updateFormData(prev => ({ ...prev, colunaId: defaultColunaId.toString() }), false)
    } else if (!tarefa && colunas.length === 0 && formData.colunaId) {
      updateFormData(prev => ({ ...prev, colunaId: '' }), false)
    }
  }, [defaultColunaId, colunas.length, tarefa, formData.colunaId, updateFormData])

  const handleInputChange = (field: keyof FormState, value: string) => {
    if (field === 'projetoId') {
      updateFormData(prev => ({ ...prev, projetoId: value, colunaId: '' }))
      onProjetoChange?.(value ? Number(value) : null)
      if (errors.projetoId) {
        setErrors(prev => ({ ...prev, projetoId: '' }))
      }
      return
    }

    if (field === 'colunaId') {
      updateFormData(prev => ({ ...prev, colunaId: value }))
      onColunaChange?.(value ? Number(value) : null)
      if (errors.colunaId) {
        setErrors(prev => ({ ...prev, colunaId: '' }))
      }
      return
    }

    updateFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório'
    }

    const responsavelId = Number(formData.responsavelId)
    if (!formData.responsavelId || Number.isNaN(responsavelId) || responsavelId <= 0) {
      newErrors.responsavelId = 'Selecione um responsável válido'
    }

    if (!isEditing) {
      const projetoId = Number(formData.projetoId)
      if (!formData.projetoId || Number.isNaN(projetoId) || projetoId <= 0) {
        newErrors.projetoId = 'Selecione um projeto'
      }

      const colunaId = Number(formData.colunaId)
      if (!formData.colunaId || Number.isNaN(colunaId) || colunaId <= 0) {
        newErrors.colunaId = 'Selecione uma coluna'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    try {
      const responsavelId = Number(formData.responsavelId)
      const prazoIso = formData.prazo ? new Date(formData.prazo).toISOString() : undefined
      const descricao = formData.descricao.trim() || undefined
      const prioridade = formData.prioridade

      if (isEditing) {
        const colunaId = formData.colunaId ? Number(formData.colunaId) : undefined
        const payload = cleanObject<UpdateTarefaDto>({
          titulo: formData.titulo.trim(),
          descricao,
          prioridade,
          responsavelId,
          colunaId,
          prazo: prazoIso,
        })

        await onSubmit(payload)
      } else {
        const projetoId = Number(formData.projetoId)
        const colunaId = Number(formData.colunaId)

        const payload: CreateTarefaDto = cleanObject({
          titulo: formData.titulo.trim(),
          descricao,
          prioridade,
          responsavelId,
          projetoId,
          colunaId,
          prazo: prazoIso,
        })

        await onSubmit(payload)
        updateFormData(() => emptyState, false)
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
    }
  }

  const prioridadeOptions = useMemo(() => Object.values(PrioridadeTarefa), [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {title || (tarefa ? 'Editar tarefa' : 'Nova tarefa')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(event) => handleInputChange('titulo', event.target.value)}
                placeholder="Resumo da tarefa"
                className={errors.titulo ? 'border-red-500' : ''}
              />
              {errors.titulo && <p className="text-sm text-red-600">{errors.titulo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => handleInputChange('prioridade', value as PrioridadeTarefa)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {prioridadeOptions.map((prioridade) => (
                    <SelectItem key={prioridade} value={prioridade}>
                      {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={4}
              value={formData.descricao}
              onChange={(event) => handleInputChange('descricao', event.target.value)}
              placeholder="Inclua detalhes, links ou informações adicionais relevantes"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavelId">Responsável *</Label>
              <Select
                value={formData.responsavelId}
                onValueChange={(value) => handleInputChange('responsavelId', value)}
              >
                <SelectTrigger className={errors.responsavelId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={usuarios.length ? 'Selecione o responsável' : 'Nenhum usuário disponível'} />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.responsavelId && <p className="text-sm text-red-600">{errors.responsavelId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                type="date"
                value={formData.prazo}
                onChange={(event) => handleInputChange('prazo', event.target.value)}
              />
            </div>
          </div>

          {(projetos.length > 0 || colunas.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projetoId">Projeto *</Label>
                <Select
                  value={formData.projetoId}
                  onValueChange={(value) => handleInputChange('projetoId', value)}
                  disabled={!projetos.length || isEditing}
                >
                  <SelectTrigger className={errors.projetoId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={projetos.length ? 'Selecione o projeto' : 'Nenhum projeto disponível'} />
                  </SelectTrigger>
                  <SelectContent>
                    {projetos.map((projeto) => (
                      <SelectItem key={projeto.id} value={projeto.id.toString()}>
                        {projeto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.projetoId && <p className="text-sm text-red-600">{errors.projetoId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="colunaId">Coluna *</Label>
                <Select
                  value={formData.colunaId}
                  onValueChange={(value) => handleInputChange('colunaId', value)}
                  disabled={!colunas.length}
                >
                  <SelectTrigger className={errors.colunaId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={colunas.length ? 'Selecione a coluna' : 'Nenhuma coluna disponível'} />
                  </SelectTrigger>
                  <SelectContent>
                    {colunas.map((coluna) => (
                      <SelectItem key={coluna.id} value={coluna.id.toString()}>
                        {coluna.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.colunaId && <p className="text-sm text-red-600">{errors.colunaId}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel || 'Cancelar'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {submitLabel || (tarefa ? 'Salvar alterações' : 'Criar tarefa')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default TarefaForm
