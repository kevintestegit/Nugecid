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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ButtonLoading } from '@/components/ui/Loading'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            NUGECID
          </h1>
          <p className="text-gray-600">
            Sistema de Gerenciamento de Controle de Desarquivamentos - Polícia Científica do Rio Grande do Norte
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLoading ? 'Entrando...' : 'Fazer Login'}</CardTitle>
            <CardDescription>
              {isLoading
                ? 'Validando suas credenciais...'
                : 'Entre com suas credenciais para acessar o sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Seu usuário"
                  autoComplete="username"
                  disabled={isLoading}
                  aria-invalid={!!errors.usuario}
                  {...register('usuario')}
                />
                {errors.usuario && (
                  <p className="text-sm text-destructive">{errors.usuario.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    disabled={isLoading}
                    aria-invalid={!!errors.senha}
                    className="pr-10"
                    {...register('senha')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
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
                className="w-full hover:text-primary-700 data-[state=pressed]:text-primary-900"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ButtonLoading className="mr-2" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>Problemas para acessar?</p>
          <p>Não consigo te ajudar.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
