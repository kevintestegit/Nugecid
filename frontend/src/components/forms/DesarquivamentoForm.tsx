import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ButtonLoading } from '@/components/ui/Loading'
import { FileText } from 'lucide-react'
import { TipoDesarquivamento, CreateDesarquivamentoDto } from '@/types'
import { getTipoDesarquivamentoLabel } from '@/utils/format'
import { Checkbox } from '../ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { Textarea } from '@/components/ui/Textarea'
import { Combobox } from '@/components/ui/Combobox'
import { INSTITUTOS } from '@/constants/institutos'
import { REQUERENTES } from '@/constants/requerentes'

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
  dataSolicitacao: z.date({
    required_error: "A data de solicitação é obrigatória",
    invalid_type_error: "Data inválida",
  }),
  dataDesarquivamentoSAG: z.date().optional().nullable(),
  dataDevolucaoSetor: z.date().optional().nullable(),
  setorDemandante: z
    .string()
    .min(2, 'O setor demandante é obrigatório')
    .max(100, 'O setor demandante deve ter no máximo 100 caracteres'),
  servidorResponsavel: z
    .string()
    .min(3, 'O servidor responsável é obrigatório')
    .max(255, 'O servidor responsável deve ter no máximo 255 caracteres'),
  finalidadeDesarquivamento: z.string().max(1000, 'A finalidade deve ter no máximo 1000 caracteres').optional(),
  solicitacaoProrrogacao: z.boolean().default(false),
  solicitacaoProrrogacaoTexto: z.string().optional(),
  dadosAdicionais: z.string().optional(),
  urgente: z.boolean().optional(),
  numeroOficio: z.string().max(255, 'O número do ofício deve ter no máximo 255 caracteres').optional(),
  instituto: z.string().max(255, 'O instituto deve ter no máximo 255 caracteres').optional(),
  requerente: z.string().max(255, 'O requerente deve ter no máximo 255 caracteres').optional(),
})

type DesarquivamentoFormData = z.infer<typeof desarquivamentoSchema>

interface DesarquivamentoFormProps {
  onSubmit: (data: CreateDesarquivamentoDto) => Promise<void>
  isLoading?: boolean
  isEdit?: boolean
  initialData?: any
}

const DesarquivamentoForm: React.FC<DesarquivamentoFormProps> = ({
  onSubmit,
  isLoading = false,
  isEdit = false,
  initialData,
}) => {
  // Converte strings de data do initialData para objetos Date, se necessário
  const defaultValues = React.useMemo(() => {
    const data = initialData || {}
    return {
      ...data,
      tipoDesarquivamento: data.tipoDesarquivamento || undefined, // Evita string vazia
      dataSolicitacao: data.dataSolicitacao ? new Date(data.dataSolicitacao) : new Date(),
      dataDesarquivamentoSAG: data.dataDesarquivamentoSAG ? new Date(data.dataDesarquivamentoSAG) : undefined,
      dataDevolucaoSetor: data.dataDevolucaoSetor ? new Date(data.dataDevolucaoSetor) : undefined,
      solicitacaoProrrogacao: data.solicitacaoProrrogacao || false,
      solicitacaoProrrogacaoTexto: data.solicitacaoProrrogacaoTexto || '',
      dadosAdicionais: data.dadosAdicionais || '',
      urgente: data.urgente || false,
      numeroOficio: data.numeroOficio || '',
      instituto: data.instituto || '',
      requerente: data.requerente || '',
    }
  }, [initialData])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<DesarquivamentoFormData>({
    resolver: zodResolver(desarquivamentoSchema),
    defaultValues,
  })

  const onFormSubmit = async (data: DesarquivamentoFormData) => {
    // Debug: log dados do formulário
    console.log('[DesarquivamentoForm] Dados do formulário:', {
      dadosAdicionais: data.dadosAdicionais,
      solicitacaoProrrogacaoTexto: data.solicitacaoProrrogacaoTexto,
      numeroOficio: data.numeroOficio,
    })
    // Converter datas para ISO string antes de enviar
    const formattedData = {
      ...data,
      numeroNicLaudoAuto: data.numeroNicLaudoAuto || '',
      dataSolicitacao: data.dataSolicitacao.toISOString(),
      dataDesarquivamentoSAG: data.dataDesarquivamentoSAG?.toISOString(),
      dataDevolucaoSetor: data.dataDevolucaoSetor?.toISOString(),
    }
    console.log('[DesarquivamentoForm] Dados formatados para envio:', {
      dadosAdicionais: formattedData.dadosAdicionais,
    })
    await onSubmit(formattedData as unknown as CreateDesarquivamentoDto)
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
            <Controller
              control={control}
              name="tipoDesarquivamento"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className={errors.tipoDesarquivamento ? 'border-destructive' : ''}>
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
              )}
            />
            {errors.tipoDesarquivamento && <p className="text-sm text-destructive">{errors.tipoDesarquivamento.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome completo/Vestígio</Label>
            <Input
              id="nomeCompleto"
              placeholder="Nome completo/Vestígio"
              {...register('nomeCompleto')}
              className={errors.nomeCompleto ? 'border-destructive' : ''}
            />
            {errors.nomeCompleto && <p className="text-sm text-destructive">{errors.nomeCompleto.message}</p>}
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
              className={errors.numeroProcesso ? 'border-destructive' : ''}
            />
            {errors.numeroProcesso && <p className="text-sm text-destructive">{errors.numeroProcesso.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
            <Input
              id="tipoDocumento"
              placeholder="Ex: Laudo Pericial, Inquérito Policial"
              {...register('tipoDocumento')}
              className={errors.tipoDocumento ? 'border-destructive' : ''}
            />
            {errors.tipoDocumento && <p className="text-sm text-destructive">{errors.tipoDocumento.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataSolicitacao">Data de Solicitação *</Label>
            <Controller
              control={control}
              name="dataSolicitacao"
              render={({ field }) => (
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                />
              )}
            />
            {errors.dataSolicitacao && <p className="text-sm text-destructive">{errors.dataSolicitacao.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataDesarquivamentoSAG">Data do Desarquivamento - SAG</Label>
            <Controller
              control={control}
              name="dataDesarquivamentoSAG"
              render={({ field }) => (
                <DatePicker
                  date={field.value || undefined}
                  setDate={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataDevolucaoSetor">Data da Devolução pelo Setor</Label>
            <Controller
              control={control}
              name="dataDevolucaoSetor"
              render={({ field }) => (
                <DatePicker
                  date={field.value || undefined}
                  setDate={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="dadosAdicionais">Descrição da Solicitação</Label>
            <Textarea
              id="dadosAdicionais"
              placeholder="Informações complementares sobre a solicitação..."
              {...register('dadosAdicionais')}
              rows={3}
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
            <Label htmlFor="numeroOficio">Nº do Ofício</Label>
            <Input
              id="numeroOficio"
              placeholder="Ex: OFÍCIO Nº 123/2025"
              {...register('numeroOficio')}
              className={errors.numeroOficio ? 'border-destructive' : ''}
            />
            {errors.numeroOficio && <p className="text-sm text-destructive">{errors.numeroOficio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instituto">Instituto</Label>
            <Controller
              control={control}
              name="instituto"
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className={errors.instituto ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione o instituto" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTOS.map((instituto) => (
                      <SelectItem key={instituto.value} value={instituto.value}>
                        {instituto.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.instituto && <p className="text-sm text-destructive">{errors.instituto.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requerente">Requerente</Label>
            <Controller
              name="requerente"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={REQUERENTES}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  placeholder="Selecione o requerente"
                  searchPlaceholder="Buscar requerente..."
                  emptyMessage="Nenhum requerente encontrado."
                  className={errors.requerente ? 'border-destructive' : ''}
                />
              )}
            />
            {errors.requerente && <p className="text-sm text-destructive">{errors.requerente.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="setorDemandante">Setor Demandante *</Label>
            <Input
              id="setorDemandante"
              placeholder="Nome do setor"
              {...register('setorDemandante')}
              className={errors.setorDemandante ? 'border-destructive' : ''}
            />
            {errors.setorDemandante && <p className="text-sm text-destructive">{errors.setorDemandante.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="servidorResponsavel">Servidor do ITEP Responsável (Matrícula) *</Label>
            <Input
              id="servidorResponsavel"
              placeholder="Matrícula do servidor"
              {...register('servidorResponsavel')}
              className={errors.servidorResponsavel ? 'border-destructive' : ''}
            />
            {errors.servidorResponsavel && <p className="text-sm text-destructive">{errors.servidorResponsavel.message}</p>}
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Justificativa e Prazos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finalidadeDesarquivamento">Finalidade do Desarquivamento</Label>
            <Textarea
              id="finalidadeDesarquivamento"
              placeholder="Descreva o motivo da solicitação..."
              {...register('finalidadeDesarquivamento')}
              className={errors.finalidadeDesarquivamento ? 'border-destructive' : ''}
              rows={4}
            />
            {errors.finalidadeDesarquivamento && (
              <p className="text-sm text-destructive">{errors.finalidadeDesarquivamento.message}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="solicitacaoProrrogacao"
              render={({ field }) => (
                <Checkbox
                  id="solicitacaoProrrogacao"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="solicitacaoProrrogacao">Solicitação de Prorrogação de Prazo de Desarquivamento</Label>
          </div>

          {watch('solicitacaoProrrogacao') && (
            <div className="space-y-2">
              <Label htmlFor="solicitacaoProrrogacaoTexto">Texto da Solicitação de Prorrogação</Label>
              <Textarea
                id="solicitacaoProrrogacaoTexto"
                placeholder="Descreva os detalhes da solicitação de prorrogação..."
                {...register('solicitacaoProrrogacaoTexto')}
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="urgente"
              render={({ field }) => (
                <Checkbox
                  id="urgente"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
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
