import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Calendar } from '@/components/ui/Calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { CreateDesarquivamentoDto, UpdateDesarquivamentoDto, TipoDesarquivamento, StatusDesarquivamento } from '@/types'

// Schema de validação
const desarquivamentoSchema = z.object({
  tipoDesarquivamento: z.string().min(1, 'Tipo de desarquivamento é obrigatório'),
  desarquivamentoFisicoDigital: z.nativeEnum(TipoDesarquivamento, {
    required_error: 'Desarquivamento físico/digital é obrigatório'
  }),
  status: z.nativeEnum(StatusDesarquivamento).optional(),
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  numeroNicLaudoAuto: z.string().min(1, 'Número do NIC/LAUDO/AUTO é obrigatório'),
  numeroProcesso: z.string().min(1, 'Número do processo é obrigatório'),
  tipoDocumento: z.string().min(1, 'Tipo de documento é obrigatório'),
  dataSolicitacao: z.string().min(1, 'Data da solicitação é obrigatória'),
  dataDevolucaoSetor: z.string().optional(),
  setorDemandante: z.string().min(1, 'Setor demandante é obrigatório'),
  servidorResponsavel: z.string().min(1, 'Servidor responsável é obrigatório'),
  finalidadeDesarquivamento: z.string().min(1, 'Finalidade do desarquivamento é obrigatória'),
  solicitacaoProrrogacao: z.boolean().default(false),
  solicitacaoProrrogacaoTexto: z.string().optional(),
  dadosAdicionais: z.string().optional(),
  urgente: z.boolean().optional()
})

type FormData = z.infer<typeof desarquivamentoSchema>

interface DesarquivamentoFormProps {
  initialData?: Partial<CreateDesarquivamentoDto | UpdateDesarquivamentoDto>
  onSubmit: (data: CreateDesarquivamentoDto | UpdateDesarquivamentoDto) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isEdit?: boolean
}

const DesarquivamentoForm: React.FC<DesarquivamentoFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false
}) => {
  const [dataSolicitacaoOpen, setDataSolicitacaoOpen] = useState(false)
  const [dataDevolucaoOpen, setDataDevolucaoOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(desarquivamentoSchema),
    defaultValues: {
      tipoDesarquivamento: initialData?.tipoDesarquivamento || 'FISICO',
      desarquivamentoFisicoDigital: initialData?.desarquivamentoFisicoDigital || TipoDesarquivamento.FISICO,
      status: initialData?.status || StatusDesarquivamento.SOLICITADO,
      nomeCompleto: initialData?.nomeCompleto || '',
      numeroNicLaudoAuto: initialData?.numeroNicLaudoAuto || '',
      numeroProcesso: initialData?.numeroProcesso || '',
      tipoDocumento: initialData?.tipoDocumento || '',
      dataSolicitacao: initialData?.dataSolicitacao || format(new Date(), 'yyyy-MM-dd'),
      dataDevolucaoSetor: initialData?.dataDevolucaoSetor || '',
      setorDemandante: initialData?.setorDemandante || '',
      servidorResponsavel: initialData?.servidorResponsavel || '',
      finalidadeDesarquivamento: initialData?.finalidadeDesarquivamento || '',
      solicitacaoProrrogacao: initialData?.solicitacaoProrrogacao || false,
      solicitacaoProrrogacaoTexto: initialData?.solicitacaoProrrogacaoTexto || '',
      dadosAdicionais: initialData?.dadosAdicionais || '',
      urgente: initialData?.urgente || false
    }
  })

  const watchedValues = watch()

  const onFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Erro no formulário:', error)
    }
  }

  const handleDateChange = (field: 'dataSolicitacao' | 'dataDevolucaoSetor', date: Date | undefined) => {
    if (date) {
      setValue(field, format(date, 'yyyy-MM-dd'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Tipo de Desarquivamento e Desarquivamento Físico/Digital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipoDesarquivamento">Tipo de Desarquivamento *</Label>
          <Input
            id="tipoDesarquivamento"
            {...register('tipoDesarquivamento')}
            placeholder="Digite o tipo de desarquivamento"
            className={cn(errors.tipoDesarquivamento && 'border-red-500')}
          />
          {errors.tipoDesarquivamento && (
            <p className="text-sm text-red-600">{errors.tipoDesarquivamento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="desarquivamentoFisicoDigital">Desarquivamento Físico/Digital *</Label>
          <Select
            value={watchedValues.desarquivamentoFisicoDigital}
            onValueChange={(value) => setValue('desarquivamentoFisicoDigital', value as TipoDesarquivamento)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TipoDesarquivamento.FISICO}>Físico</SelectItem>
              <SelectItem value={TipoDesarquivamento.DIGITAL}>Digital</SelectItem>
              <SelectItem value={TipoDesarquivamento.NAO_LOCALIZADO}>Não Localizado</SelectItem>
            </SelectContent>
          </Select>
          {errors.desarquivamentoFisicoDigital && (
            <p className="text-sm text-red-600">{errors.desarquivamentoFisicoDigital.message}</p>
          )}
        </div>
      </div>

      {/* Status */}
      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watchedValues.status}
            onValueChange={(value) => setValue('status', value as StatusDesarquivamento)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={StatusDesarquivamento.SOLICITADO}>Solicitado</SelectItem>
              <SelectItem value={StatusDesarquivamento.DESARQUIVADO}>Desarquivado</SelectItem>
              <SelectItem value={StatusDesarquivamento.NAO_COLETADO}>Não Coletado</SelectItem>
              <SelectItem value={StatusDesarquivamento.RETIRADO_PELO_SETOR}>Retirado pelo Setor</SelectItem>
              <SelectItem value={StatusDesarquivamento.REARQUIVAMENTO_SOLICITADO}>Rearquivamento Solicitado</SelectItem>
              <SelectItem value={StatusDesarquivamento.FINALIZADO}>Finalizado</SelectItem>
              <SelectItem value={StatusDesarquivamento.NAO_LOCALIZADO}>Não Localizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nome Completo */}
      <div className="space-y-2">
        <Label htmlFor="nomeCompleto">Nome Completo *</Label>
        <Input
          id="nomeCompleto"
          {...register('nomeCompleto')}
          placeholder="Digite o nome completo"
          className={cn(errors.nomeCompleto && 'border-red-500')}
        />
        {errors.nomeCompleto && (
          <p className="text-sm text-red-600">{errors.nomeCompleto.message}</p>
        )}
      </div>

      {/* Números de Identificação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numeroNicLaudoAuto">Nº DO NIC/LAUDO/AUTO/INFORMAÇÃO TÉCNICA *</Label>
          <Input
            id="numeroNicLaudoAuto"
            {...register('numeroNicLaudoAuto')}
            placeholder="Digite o número"
            className={cn(errors.numeroNicLaudoAuto && 'border-red-500')}
          />
          {errors.numeroNicLaudoAuto && (
            <p className="text-sm text-red-600">{errors.numeroNicLaudoAuto.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numeroProcesso">Nº DO PROCESSO *</Label>
          <Input
            id="numeroProcesso"
            {...register('numeroProcesso')}
            placeholder="Digite o número do processo"
            className={cn(errors.numeroProcesso && 'border-red-500')}
          />
          {errors.numeroProcesso && (
            <p className="text-sm text-red-600">{errors.numeroProcesso.message}</p>
          )}
        </div>
      </div>

      {/* Tipo de Documento */}
      <div className="space-y-2">
        <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
        <Input
          id="tipoDocumento"
          {...register('tipoDocumento')}
          placeholder="Digite o tipo de documento"
          className={cn(errors.tipoDocumento && 'border-red-500')}
        />
        {errors.tipoDocumento && (
          <p className="text-sm text-red-600">{errors.tipoDocumento.message}</p>
        )}
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data da Solicitação *</Label>
          <Popover open={dataSolicitacaoOpen} onOpenChange={setDataSolicitacaoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !watchedValues.dataSolicitacao && 'text-muted-foreground',
                  errors.dataSolicitacao && 'border-red-500'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watchedValues.dataSolicitacao ? (
                  format(new Date(watchedValues.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={watchedValues.dataSolicitacao ? new Date(watchedValues.dataSolicitacao) : undefined}
                onSelect={(date) => {
                  handleDateChange('dataSolicitacao', date)
                  setDataSolicitacaoOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.dataSolicitacao && (
            <p className="text-sm text-red-600">{errors.dataSolicitacao.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Data da Devolução pelo Setor</Label>
          <Popover open={dataDevolucaoOpen} onOpenChange={setDataDevolucaoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watchedValues.dataDevolucaoSetor ? (
                  format(new Date(watchedValues.dataDevolucaoSetor), 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={watchedValues.dataDevolucaoSetor ? new Date(watchedValues.dataDevolucaoSetor) : undefined}
                onSelect={(date) => {
                  handleDateChange('dataDevolucaoSetor', date)
                  setDataDevolucaoOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Setor e Servidor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="setorDemandante">Setor Demandante *</Label>
          <Input
            id="setorDemandante"
            {...register('setorDemandante')}
            placeholder="Digite o setor demandante"
            className={cn(errors.setorDemandante && 'border-red-500')}
          />
          {errors.setorDemandante && (
            <p className="text-sm text-red-600">{errors.setorDemandante.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="servidorResponsavel">Servidor do ITEP Responsável (Matrícula) *</Label>
          <Input
            id="servidorResponsavel"
            {...register('servidorResponsavel')}
            placeholder="Digite a matrícula do servidor"
            className={cn(errors.servidorResponsavel && 'border-red-500')}
          />
          {errors.servidorResponsavel && (
            <p className="text-sm text-red-600">{errors.servidorResponsavel.message}</p>
          )}
        </div>
      </div>

      {/* Finalidade */}
      <div className="space-y-2">
        <Label htmlFor="finalidadeDesarquivamento">Finalidade do Desarquivamento *</Label>
        <Textarea
          id="finalidadeDesarquivamento"
          {...register('finalidadeDesarquivamento')}
          placeholder="Descreva a finalidade do desarquivamento"
          rows={3}
          className={cn(errors.finalidadeDesarquivamento && 'border-red-500')}
        />
        {errors.finalidadeDesarquivamento && (
          <p className="text-sm text-red-600">{errors.finalidadeDesarquivamento.message}</p>
        )}
      </div>

      {/* Solicitação de Prorrogação - Texto */}
      {watchedValues.solicitacaoProrrogacao && (
        <div className="space-y-2">
          <Label htmlFor="solicitacaoProrrogacaoTexto">Texto da Solicitação de Prorrogação</Label>
          <Textarea
            id="solicitacaoProrrogacaoTexto"
            {...register('solicitacaoProrrogacaoTexto')}
            placeholder="Descreva os detalhes da solicitação de prorrogação (ex: Prazo prorrogado em 18/06/25 para atendimento de perícia documentoscópica)"
            rows={2}
          />
        </div>
      )}

      {/* Dados Adicionais */}
      <div className="space-y-2">
        <Label htmlFor="dadosAdicionais">Dados Adicionais</Label>
        <Textarea
          id="dadosAdicionais"
          {...register('dadosAdicionais')}
          placeholder="Informações complementares (ex: filiação, naturalidade, data de nascimento, etc.)"
          rows={3}
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="solicitacaoProrrogacao"
            checked={watchedValues.solicitacaoProrrogacao}
            onCheckedChange={(checked) => setValue('solicitacaoProrrogacao', !!checked)}
          />
          <Label htmlFor="solicitacaoProrrogacao" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Solicitação de prorrogação de prazo de desarquivamento
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="urgente"
            checked={watchedValues.urgente}
            onCheckedChange={(checked) => setValue('urgente', !!checked)}
          />
          <Label htmlFor="urgente" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Solicitação urgente
          </Label>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  )
}

export default DesarquivamentoForm