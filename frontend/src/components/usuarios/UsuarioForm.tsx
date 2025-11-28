import React, { useState, useEffect } from 'react'
import { Save, X, User, Lock, Shield } from 'lucide-react'
import { CreateUserDto, UpdateUserDto, UserRole } from '@/types'
import { ValidatedInput } from '@/components/ui/ValidatedInput'

interface UsuarioFormProps {
  initialData?: Partial<UpdateUserDto>
  onSubmit: (data: CreateUserDto | UpdateUserDto) => void
  onCancel: () => void
  isLoading: boolean
  mode: 'create' | 'edit'
}

interface FormData {
  nome: string
  usuario: string
  matricula: string
  senha: string
  confirmSenha: string
  role: UserRole
  ativo: boolean
}

interface FormErrors {
  nome?: string
  usuario?: string
  matricula?: string
  senha?: string
  confirmSenha?: string
  role?: string
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  mode
}) => {
  const [formData, setFormData] = useState<FormData>({
    nome: initialData?.nome || '',
    usuario: initialData?.usuario || '',
    matricula: initialData?.matricula || '',
    senha: '',
    confirmSenha: '',
    role: initialData?.role || UserRole.USUARIO,
    ativo: initialData?.ativo ?? true
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        nome: initialData.nome || '',
        usuario: initialData.usuario || '',
        matricula: initialData.matricula || '',
        role: (initialData.role as UserRole) || UserRole.USUARIO,
        ativo: initialData.ativo ?? true
      }))
    }
  }, [initialData])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validação do nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres'
    }

    // Validação do usuario
    const usuarioRegex = /^[a-zA-Z0-9._-]+$/
    if (!formData.usuario.trim()) {
      newErrors.usuario = 'Usuário é obrigatório'
    } else if (formData.usuario.trim().length < 3) {
      newErrors.usuario = 'Usuário deve ter pelo menos 3 caracteres'
    } else if (formData.usuario.trim().length > 50) {
      newErrors.usuario = 'Usuário deve ter no máximo 50 caracteres'
    } else if (!usuarioRegex.test(formData.usuario)) {
      newErrors.usuario = 'Usuário deve conter apenas letras, números, pontos, hífens e underscores'
    }

    // Validação da matrícula
    if (!formData.matricula.trim()) {
      newErrors.matricula = 'Matrícula é obrigatória'
    } else if (formData.matricula.trim().length < 3) {
      newErrors.matricula = 'Matrícula deve ter pelo menos 3 caracteres'
    } else if (formData.matricula.trim().length > 50) {
      newErrors.matricula = 'Matrícula deve ter no máximo 50 caracteres'
    }

    // Validação da senha (obrigatória apenas na criação)
    if (mode === 'create') {
      if (!formData.senha) {
        newErrors.senha = 'Senha é obrigatória'
      } else if (formData.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
      }

      if (!formData.confirmSenha) {
        newErrors.confirmSenha = 'Confirmação de senha é obrigatória'
      } else if (formData.senha !== formData.confirmSenha) {
        newErrors.confirmSenha = 'Senhas não coincidem'
      }
    } else if (mode === 'edit' && formData.senha) {
      // Na edição, validar senha apenas se foi preenchida
      if (formData.senha.length < 6) {
        newErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
      }
      if (formData.confirmSenha !== formData.senha) {
        newErrors.confirmSenha = 'Senhas não coincidem'
      }
    }

    // Validação do papel
    if (!formData.role) {
      newErrors.role = 'Papel é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (mode === 'create') {
      const createData: CreateUserDto = {
        nome: formData.nome.trim(),
        usuario: formData.usuario.trim().toLowerCase(),
        senha: formData.senha,
        role: formData.role,
        matricula: formData.matricula.trim()
      }
      onSubmit(createData)
    } else {
      const updateData: UpdateUserDto = {
        nome: formData.nome.trim(),
        usuario: formData.usuario.trim().toLowerCase(),
        role: formData.role,
        ativo: formData.ativo,
        matricula: formData.matricula.trim()
      }
      
      // Incluir senha apenas se foi preenchida
      if (formData.senha) {
        updateData.senha = formData.senha
      }
      
      onSubmit(updateData)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome */}
        <div className="space-y-2">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-1" />
            Nome completo *
          </label>
          <ValidatedInput
            id="nome"
            type="text"
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            placeholder="Digite o nome completo"
            disabled={isLoading}
            error={errors.nome}
            showValidation={true}
            validationRules={[
              {
                type: 'required',
                message: 'Nome é obrigatório'
              },
              {
                type: 'minLength',
                value: 2,
                message: 'Nome deve ter pelo menos 2 caracteres'
              }
            ]}
          />
        </div>

        {/* Usuario */}
        <div className="space-y-2">
          <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-1" />
            Usuário *
          </label>
          <ValidatedInput
            id="usuario"
            type="text"
            value={formData.usuario}
            onChange={(e) => handleInputChange('usuario', e.target.value)}
            placeholder="Digite o nome de usuário"
            disabled={isLoading}
            error={errors.usuario}
            showValidation={true}
            validationRules={[
              {
                type: 'required',
                message: 'Usuário é obrigatório'
              },
              {
                type: 'minLength',
                value: 3,
                message: 'Usuário deve ter pelo menos 3 caracteres'
              },
              {
                type: 'maxLength',
                value: 50,
                message: 'Usuário deve ter no máximo 50 caracteres'
              },
              {
                type: 'alphanumeric',
                message: 'Usuário deve conter apenas letras, números, pontos, hífens e underscores'
              }
            ]}
          />
        </div>

        {/* Matrícula */}
        <div className="space-y-2">
          <label htmlFor="matricula" className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-1" />
            Matrícula *
          </label>
          <ValidatedInput
            id="matricula"
            type="text"
            value={formData.matricula}
            onChange={(e) => handleInputChange('matricula', e.target.value)}
            placeholder="Informe a matrícula"
            disabled={isLoading}
            error={errors.matricula}
            showValidation={true}
            validationRules={[
              {
                type: 'required',
                message: 'Matrícula é obrigatória'
              },
              {
                type: 'minLength',
                value: 3,
                message: 'Matrícula deve ter pelo menos 3 caracteres'
              },
              {
                type: 'maxLength',
                value: 50,
                message: 'Matrícula deve ter no máximo 50 caracteres'
              }
            ]}
          />
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
            <Lock className="inline h-4 w-4 mr-1" />
            Senha {mode === 'create' ? '*' : '(deixe em branco para manter)'}
          </label>
          <ValidatedInput
            id="senha"
            type="password"
            value={formData.senha}
            onChange={(e) => handleInputChange('senha', e.target.value)}
            placeholder={mode === 'create' ? 'Digite a senha' : 'Nova senha (opcional)'}
            disabled={isLoading}
            error={errors.senha}
            showValidation={true}
            showPasswordToggle={true}
            validationRules={
              mode === 'create'
                ? [
                    {
                      type: 'required',
                      message: 'Senha é obrigatória'
                    },
                    {
                      type: 'minLength',
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres'
                    }
                  ]
                : formData.senha ? [
                    {
                      type: 'minLength',
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres'
                    }
                  ] : []
            }
          />
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-2">
          <label htmlFor="confirmSenha" className="block text-sm font-medium text-gray-700">
            <Lock className="inline h-4 w-4 mr-1" />
            Confirmar senha {mode === 'create' ? '*' : ''}
          </label>
          <ValidatedInput
            id="confirmSenha"
            type="password"
            value={formData.confirmSenha}
            onChange={(e) => handleInputChange('confirmSenha', e.target.value)}
            placeholder="Confirme a senha"
            disabled={isLoading}
            error={errors.confirmSenha}
            showValidation={true}
            showPasswordToggle={true}
            validationRules={
              mode === 'create'
                ? [
                    {
                      type: 'required',
                      message: 'Confirmação de senha é obrigatória'
                    },
                    {
                      type: 'match',
                      value: formData.senha,
                      message: 'Senhas não coincidem'
                    }
                  ]
                : formData.senha ? [
                    {
                      type: 'match',
                      value: formData.senha,
                      message: 'Senhas não coincidem'
                    }
                  ] : []
            }
          />
        </div>

        {/* Papel */}
        <div className="space-y-2">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            <Shield className="inline h-4 w-4 mr-1" />
            Papel do usuário *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.role ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="usuario">Usuário</option>
            <option value="coordenador">Coordenador</option>
            <option value="admin">Administrador</option>
          </select>
          {errors.role && (
            <p className="text-sm text-red-600">{errors.role}</p>
          )}
        </div>

        {/* Status (apenas na edição) */}
        {mode === 'edit' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Status do usuário
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={() => handleInputChange('ativo', true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Ativo</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="ativo"
                  checked={!formData.ativo}
                  onChange={() => handleInputChange('ativo', false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">Inativo</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="inline h-4 w-4 mr-1" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Save className="h-4 w-4 mr-1" />
          {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  )
}

export default UsuarioForm
