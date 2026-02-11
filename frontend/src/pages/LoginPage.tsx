import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { ButtonLoading } from '@/components/ui/Loading'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import loginHero from '@/assets/images/login-hero.webp'

const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuário é obrigatório'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data)
      toast.success('Login realizado com sucesso!')
      navigate(from, { replace: true })
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>
      const message = error.response?.data?.message || 'Usuário ou senha inválidos.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.2),transparent_42%),radial-gradient(circle_at_88%_86%,rgba(239,68,68,0.16),transparent_44%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_100%)] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[44%_56%]">
        <div className="relative hidden overflow-hidden lg:block">
          <img
            src={loginHero}
            alt="Painel institucional"
            className="h-full w-full object-cover object-[center_25%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.78)_8%,rgba(15,23,42,0.34)_42%,rgba(59,130,246,0.22)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(56,189,248,0.36),transparent_50%)]" />
          <div className="absolute bottom-10 left-8 right-8 rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Acesso Seguro</p>
            <p className="mt-2 text-lg font-semibold leading-tight text-white">
              Sistema de Gerenciamento de Desarquivamentos
            </p>
          </div>
        </div>

        <div className="relative flex min-h-screen flex-col">
          <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-16 h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />

          <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
            <div className="glass-panel w-full max-w-md rounded-3xl p-7 sm:p-9">
              <div className="mb-7 space-y-2 text-center">
                <h1 className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                  NUGECID
                </h1>
                <h2 className="text-xl font-semibold tracking-tight">Acesse sua conta</h2>
                <p className="text-sm text-muted-foreground">Entre com suas credenciais</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="usuario" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Usuário</Label>
                  <Input
                    id="usuario"
                    type="text"
                    placeholder="Seu usuário"
                    autoComplete="username"
                    disabled={isLoading}
                    aria-invalid={!!errors.usuario}
                    className="h-11 border-border/70 bg-background/70 focus-visible:ring-blue-500/40"
                    {...register('usuario')}
                  />
                  {errors.usuario && (
                    <p className="text-sm text-destructive">{errors.usuario.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Senha</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      aria-invalid={!!errors.senha}
                      className="h-11 border-border/70 bg-background/70 pr-10 focus-visible:ring-blue-500/40"
                      {...register('senha')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.senha && (
                    <p className="text-sm text-destructive">{errors.senha.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 font-semibold text-white shadow-[0_18px_32px_-20px_rgba(37,99,235,0.8)] transition-all hover:brightness-110"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ButtonLoading className="mr-2 h-4 w-4" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Em caso de acesso bloqueado, To nem ai
                </p>
              </div>
            </div>
          </div>

          <footer className="px-6 pb-6 text-center sm:px-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/90">
              Polícia Científica do RN | Setor de Arquivo Geral
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
