import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateDesarquivamento } from '@/hooks/useDesarquivamentos'
import DesarquivamentoForm from '@/components/forms/DesarquivamentoForm'
import { CreateDesarquivamentoDto } from '@/types'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const NovoDesarquivamentoPage: React.FC = () => {
  const navigate = useNavigate()
  const createDesarquivamento = useCreateDesarquivamento()

  const handleSubmit = async (data: CreateDesarquivamentoDto) => {
    try {
      const result = await createDesarquivamento.mutateAsync(data)
      toast.success('Solicitação criada com sucesso!')
      navigate(`/desarquivamentos/${result?.data?.id}`)
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao criar solicitação'
      toast.error(message)
      throw error // Re-throw para que o form mantenha o estado de loading
    }
  }

  return (
    <div className="relative space-y-6">
      <div className="glass-accent-bg">
        <div className="absolute inset-0 bg-[radial-gradient(135%_95%_at_10%_8%,rgba(56,189,248,0.22),transparent_55%),radial-gradient(120%_85%_at_90%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.64),rgba(255,255,255,0))] dark:bg-[radial-gradient(135%_95%_at_10%_8%,rgba(14,116,144,0.28),transparent_55%),radial-gradient(120%_85%_at_90%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>
      <div className="glass-header p-6 md:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/desarquivamentos')}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 text-muted-foreground backdrop-blur hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                Formulário
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Novo Desarquivamento
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Preencha os dados abaixo para criar uma nova solicitação
              </p>
            </div>
          </div>
        </div>
      </div>

      <DesarquivamentoForm
        onSubmit={handleSubmit}
        isLoading={createDesarquivamento.isPending}
      />
    </div>
  )
}

export default NovoDesarquivamentoPage
