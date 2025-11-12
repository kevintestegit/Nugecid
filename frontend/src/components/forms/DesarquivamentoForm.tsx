import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ButtonLoading } from '@/components/ui/Loading'
import { AlertCircle, FileText, User, Briefcase, Calendar, Hash } from 'lucide-react'
import { TipoDesarquivamento, CreateDesarquivamentoDto, TipoSolicitacao, StatusDesarquivamento } from '@/types'
import { getTipoDesarquivamentoLabel, getTipoSolicitacaoLabel, getStatusLabel } from '@/utils/format'
import { Checkbox } from '../ui/Checkbox'

const desarquivamentoSchema = z.object({
  tipoDesarquivamento: z.nativeEnum(TipoDesarquivamento, {
    errorMap: () => ({ message: 'O tipo de desarquivamento é obrigatório' }),
  }),
  nomeCompleto: z
    .string()
    .min(3, 'O nome completo deve ter pelo menos 3 caracteres')
    .max(255, 'O nome completo deve ter no máximo 255 caracteres'),
  numeroNicLaudoAuto: z.string().optional(),
  numeroProcesso: z
    .string()
    .min(5, 'O número do processo deve ter pelo menos 5 caracteres')
    .max(50, 'O número do processo deve ter no máximo 50 caracteres'),
  tipoDocumento: z
    .string()
    .min(3, 'O tipo de documento é obrigatório')
    .max(100, 'O tipo de documento deve ter no máximo 100 caracteres'),
  dataSolicitacao: z
    .string()
    .min(1, 'A data de solicitação é obrigatória')
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, 'Formato de data inválido'),
  dataDesarquivamentoSAG: z.string().optional(),
  dataDevolucaoSetor: z.string().optional(),
  setorDemandante: z
    .string()
    .min(2, 'O setor demandante é obrigatório')
    .max(100, 'O setor demandante deve ter no máximo 100 caracteres'),
  servidorResponsavel: z
    .string()
    .min(3, 'O servidor responsável é obrigatório')
    .max(255, 'O servidor responsável deve ter no máximo 255 caracteres'),
  finalidadeDesarquivamento: z
    .string()
    .min(10, 'A finalidade deve ter pelo menos 10 caracteres')
    .max(1000, 'A finalidade deve ter no máximo 1000 caracteres'),
  solicitacaoProrrogacao: z.boolean().default(false),
  solicitacaoProrrogacaoTexto: z.string().optional(),
  dadosAdicionais: z.string().optional(),
  urgente: z.boolean().optional(),
})

type DesarquivamentoFormData = z.infer<typeof desarquivamentoSchema>

interface DesarquivamentoFormProps {
  onSubmit: (data: CreateDesarquivamentoDto) => Promise<void>
  isLoading?: boolean
  isEdit?: boolean
  initialData?: any // Simplificado para o exemplo
}

const DesarquivamentoForm: React.FC<DesarquivamentoFormProps> = ({
  onSubmit,
  isLoading = false,
  isEdit = false,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DesarquivamentoFormData>({
    resolver: zodResolver(desarquivamentoSchema),
    defaultValues: initialData || {
      solicitacaoProrrogacao: false,
      solicitacaoProrrogacaoTexto: '',
      dadosAdicionais: '',
      urgente: false,
      dataSolicitacao: new Date().toISOString().split('T')[0],
    },
  })

  const normalizeDate = (value?: string) => {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const parsed = new Date(`${trimmed}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return undefined
    return parsed.toISOString()
  }
  const onFormSubmit = async (data: DesarquivamentoFormData) => {
    // Garantir que as datas estejam no formato correto (YYYY-MM-DD) quando preenchidas
    const dataSolicitacaoISO = normalizeDate(data.dataSolicitacao)
    const formattedData = {
      ...data,
      numeroNicLaudoAuto: data.numeroNicLaudoAuto || '',
      dataSolicitacao: dataSolicitacaoISO ?? data.dataSolicitacao,
      dataDesarquivamentoSAG: normalizeDate(data.dataDesarquivamentoSAG) ?? undefined,
      dataDevolucaoSetor: normalizeDate(data.dataDevolucaoSetor) ?? undefined,
    }
    await onSubmit(formattedData as CreateDesarquivamentoDto)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Solicitação
          </CardTitle>
          <CardDescription>
            Preencha as informações principais do desarquivamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tipoDesarquivamento">Desarquivamento Físico/Digital *</Label>
            <Select
              value={watch('tipoDesarquivamento')}
              onValueChange={(value) => setValue('tipoDesarquivamento', value as TipoDesarquivamento)}
            >
              <SelectTrigger className={errors.tipoDesarquivamento ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TipoDesarquivamento).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {getTipoDesarquivamentoLabel(tipo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipoDesarquivamento && <p className="text-sm text-red-600">{errors.tipoDesarquivamento.message}</p>}
          </div>



          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome Completo *</Label>
            <Input
              id="nomeCompleto"
              placeholder="Nome completo"
              {...register('nomeCompleto')}
              className={errors.nomeCompleto ? 'border-red-500' : ''}
            />
            {errors.nomeCompleto && <p className="text-sm text-red-600">{errors.nomeCompleto.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroNicLaudoAuto">Nº DO NIC/LAUDO/AUTO/INFORMAÇÃO TÉCNICA</Label>
            <Input
              id="numeroNicLaudoAuto"
              placeholder="Opcional"
              {...register('numeroNicLaudoAuto')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroProcesso">Nº do Processo *</Label>
            <Input
              id="numeroProcesso"
              placeholder="Ex: 5000123-45.2025.8.20.0001"
              {...register('numeroProcesso')}
              className={errors.numeroProcesso ? 'border-red-500' : ''}
            />
            {errors.numeroProcesso && <p className="text-sm text-red-600">{errors.numeroProcesso.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
            <Input
              id="tipoDocumento"
              placeholder="Ex: Laudo Pericial, Inquérito Policial"
              {...register('tipoDocumento')}
              className={errors.tipoDocumento ? 'border-red-500' : ''}
            />
            {errors.tipoDocumento && <p className="text-sm text-red-600">{errors.tipoDocumento.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataSolicitacao">Data de Solicitação *</Label>
            <Input
              id="dataSolicitacao"
              type="date"
              {...register('dataSolicitacao')}
              className={errors.dataSolicitacao ? 'border-red-500' : ''}
            />
            {errors.dataSolicitacao && <p className="text-sm text-red-600">{errors.dataSolicitacao.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataDesarquivamentoSAG">Data do Desarquivamento - SAG</Label>
            <Input
              id="dataDesarquivamentoSAG"
              type="date"
              {...register('dataDesarquivamentoSAG')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataDevolucaoSetor">Data da Devolução pelo Setor</Label>
            <Input
              id="dataDevolucaoSetor"
              type="date"
              {...register('dataDevolucaoSetor')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="setorDemandante">Setor Demandante *</Label>
            <Input
              id="setorDemandante"
              placeholder="Nome do setor"
              {...register('setorDemandante')}
              className={errors.setorDemandante ? 'border-red-500' : ''}
            />
            {errors.setorDemandante && <p className="text-sm text-red-600">{errors.setorDemandante.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="servidorResponsavel">Servidor do ITEP Responsável (Matrícula) *</Label>
            <Input
              id="servidorResponsavel"
              placeholder="Matrícula do servidor"
              {...register('servidorResponsavel')}
              className={errors.servidorResponsavel ? 'border-red-500' : ''}
            />
            {errors.servidorResponsavel && <p className="text-sm text-red-600">{errors.servidorResponsavel.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Justificativa e Prazos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finalidadeDesarquivamento">Finalidade do Desarquivamento *</Label>
            <textarea
              id="finalidadeDesarquivamento"
              placeholder="Descreva o motivo da solicitação..."
              {...register('finalidadeDesarquivamento')}
              className={`min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${errors.finalidadeDesarquivamento ? 'border-red-500' : ''}`}
              rows={4}
            />
            {errors.finalidadeDesarquivamento && <p className="text-sm text-red-600">{errors.finalidadeDesarquivamento.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="solicitacaoProrrogacao"
              checked={watch('solicitacaoProrrogacao')}
              onCheckedChange={(checked) => setValue('solicitacaoProrrogacao', !!checked)}
            />
            <Label htmlFor="solicitacaoProrrogacao">Solicitação de Prorrogação de Prazo de Desarquivamento</Label>
          </div>

          {watch('solicitacaoProrrogacao') && (
            <div className="space-y-2">
              <Label htmlFor="solicitacaoProrrogacaoTexto">Texto da Solicitação de Prorrogação</Label>
              <textarea
                id="solicitacaoProrrogacaoTexto"
                placeholder="Descreva os detalhes da solicitação de prorrogação..."
                {...register('solicitacaoProrrogacaoTexto')}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dadosAdicionais">Dados Adicionais</Label>
            <textarea
              id="dadosAdicionais"
              placeholder="Informações complementares (filiação, naturalidade, etc.)..."
              {...register('dadosAdicionais')}
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="urgente"
              checked={watch('urgente')}
              onCheckedChange={(checked) => setValue('urgente', !!checked)}
            />
            <Label htmlFor="urgente">Solicitação Urgente</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <ButtonLoading className="mr-2" />
              {isEdit ? 'Atualizando...' : 'Salvar Solicitação'}
            </>
          ) : (
            isEdit ? 'Salvar Alterações' : 'Criar Solicitação'
          )}
        </Button>
      </div>
    </form>
  )
}

export default DesarquivamentoForm
