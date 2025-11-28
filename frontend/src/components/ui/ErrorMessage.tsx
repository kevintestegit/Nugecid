import React, { useState } from 'react'
import { cn } from '@/utils/cn'
import { AlertTriangle, XCircle, Info, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react'

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'critical'

export interface ErrorMessageProps {
  title?: string
  message: string
  severity?: ErrorSeverity
  details?: string
  technicalDetails?: string
  suggestion?: string
  dismissible?: boolean
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
  showIcon?: boolean
  fullWidth?: boolean
}

// Componente principal de mensagem de erro
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  severity = 'error',
  details,
  technicalDetails,
  suggestion,
  dismissible = true,
  onDismiss,
  onRetry,
  className,
  showIcon = true,
  fullWidth = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const severityConfig = {
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800 dark:text-red-200',
      textColor: 'text-red-700 dark:text-red-300',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800 dark:text-yellow-200',
      textColor: 'text-yellow-700 dark:text-yellow-300',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800 dark:text-blue-200',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    critical: {
      icon: AlertCircle,
      bgColor: 'bg-red-100 dark:bg-red-950/50',
      borderColor: 'border-red-500 dark:border-red-600',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900 dark:text-red-100',
      textColor: 'text-red-800 dark:text-red-200',
    },
  }

  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor,
        fullWidth ? 'w-full' : '',
        className
      )}
      role="alert"
      aria-live={severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        )}

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn('text-sm font-semibold mb-1', config.titleColor)}>
              {title}
            </h3>
          )}

          <p className={cn('text-sm', config.textColor)}>
            {message}
          </p>

          {details && (
            <p className={cn('text-sm mt-2', config.textColor)}>
              {details}
            </p>
          )}

          {suggestion && (
            <div className={cn('mt-3 p-2 rounded bg-background/50 border', config.borderColor)}>
              <p className={cn('text-xs font-medium', config.textColor)}>
                💡 Sugestão: {suggestion}
              </p>
            </div>
          )}

          {technicalDetails && (
            <div className="mt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium hover:underline',
                  config.textColor
                )}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Ocultar detalhes técnicos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Ver detalhes técnicos
                  </>
                )}
              </button>

              {isExpanded && (
                <pre className={cn(
                  'mt-2 p-2 rounded text-xs overflow-x-auto bg-background/50 border',
                  config.borderColor,
                  config.textColor
                )}>
                  {technicalDetails}
                </pre>
              )}
            </div>
          )}

          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className={cn(
                  'text-sm font-medium px-3 py-1.5 rounded hover:bg-background/50 transition-colors',
                  config.textColor
                )}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded hover:bg-background/50 transition-colors',
              config.iconColor
            )}
            aria-label="Fechar mensagem"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Componente para erros de validação de formulário
interface FieldErrorProps {
  message: string
  className?: string
}

export const FieldError: React.FC<FieldErrorProps> = ({ message, className }) => {
  if (!message) return null

  return (
    <p
      className={cn(
        'text-xs text-red-500 mt-1 flex items-center gap-1',
        className
      )}
      role="alert"
    >
      <XCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  )
}

// Componente para lista de erros
interface ErrorListProps {
  errors: Array<{
    field?: string
    message: string
  }>
  title?: string
  className?: string
}

export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  title = 'Foram encontrados os seguintes erros:',
  className,
}) => {
  if (!errors || errors.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
            {title}
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-300">
                {error.field && (
                  <span className="font-medium">{error.field}: </span>
                )}
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Componente para erro de página inteira
interface PageErrorProps {
  title?: string
  message?: string
  statusCode?: number
  onRetry?: () => void
  onGoBack?: () => void
  className?: string
}

export const PageError: React.FC<PageErrorProps> = ({
  title = 'Algo deu errado',
  message = 'Desculpe, ocorreu um erro inesperado. Por favor, tente novamente.',
  statusCode,
  onRetry,
  onGoBack,
  className,
}) => {
  return (
    <div className={cn('flex min-h-screen items-center justify-center bg-background p-4', className)}>
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          {statusCode && (
            <p className="text-4xl font-bold text-muted-foreground mb-2">
              {statusCode}
            </p>
          )}

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {title}
          </h1>

          <p className="text-muted-foreground mb-6">
            {message}
          </p>

          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Tentar novamente
              </button>
            )}

            {onGoBack && (
              <button
                onClick={onGoBack}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Voltar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para tratar erros de API
export const getErrorMessage = (error: any): {
  title: string
  message: string
  details?: string
  technicalDetails?: string
  suggestion?: string
} => {
  // Erro de rede
  if (error.message === 'Network Error' || !error.response) {
    return {
      title: 'Erro de Conexão',
      message: 'Não foi possível conectar ao servidor.',
      suggestion: 'Verifique sua conexão com a internet e tente novamente.',
      technicalDetails: error.toString(),
    }
  }

  const status = error.response?.status
  const data = error.response?.data

  // Erro 400 - Bad Request
  if (status === 400) {
    return {
      title: 'Dados Inválidos',
      message: data?.message || 'Os dados enviados são inválidos.',
      details: data?.error,
      suggestion: 'Verifique os campos do formulário e tente novamente.',
      technicalDetails: JSON.stringify(data, null, 2),
    }
  }

  // Erro 401 - Unauthorized
  if (status === 401) {
    return {
      title: 'Não Autorizado',
      message: 'Sua sessão expirou ou você não tem permissão para acessar este recurso.',
      suggestion: 'Faça login novamente para continuar.',
      technicalDetails: JSON.stringify(data, null, 2),
    }
  }

  // Erro 403 - Forbidden
  if (status === 403) {
    return {
      title: 'Acesso Negado',
      message: 'Você não tem permissão para realizar esta ação.',
      suggestion: 'Entre em contato com o administrador se precisar de acesso.',
      technicalDetails: JSON.stringify(data, null, 2),
    }
  }

  // Erro 404 - Not Found
  if (status === 404) {
    return {
      title: 'Não Encontrado',
      message: 'O recurso solicitado não foi encontrado.',
      suggestion: 'Verifique se o endereço está correto.',
      technicalDetails: JSON.stringify(data, null, 2),
    }
  }

  // Erro 429 - Too Many Requests
  if (status === 429) {
    return {
      title: 'Muitas Requisições',
      message: 'Você fez muitas requisições em pouco tempo.',
      suggestion: 'Aguarde alguns minutos e tente novamente.',
      technicalDetails: JSON.stringify(data, null, 2),
    }
  }

  // Erro 500 - Internal Server Error
  if (status >= 500) {
    return {
      title: 'Erro no Servidor',
      message: 'Ocorreu um erro interno no servidor.',
      suggestion: 'Tente novamente mais tarde. Se o problema persistir, entre em contato com o suporte.',
      technicalDetails: JSON.stringify(data, null, 2),
    }
  }

  // Erro genérico
  return {
    title: 'Erro',
    message: data?.message || error.message || 'Ocorreu um erro inesperado.',
    details: data?.error,
    technicalDetails: JSON.stringify(data || error, null, 2),
  }
}

export default ErrorMessage
