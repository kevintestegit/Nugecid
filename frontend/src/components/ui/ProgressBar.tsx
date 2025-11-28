import React from 'react'
import { cn } from '@/utils/cn'

interface BaseProgressProps {
  value: number // 0-100
  className?: string
  'aria-label'?: string
}

interface LinearProgressProps extends BaseProgressProps {
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  animated?: boolean
}

interface CircularProgressProps extends BaseProgressProps {
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}

interface MultiStepProgressProps {
  steps: Array<{
    label: string
    description?: string
    status: 'pending' | 'current' | 'completed' | 'error'
  }>
  className?: string
}

// Linear Progress Bar
export const LinearProgress: React.FC<LinearProgressProps> = ({
  value,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className,
  'aria-label': ariaLabel,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100)

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {label || 'Progresso'}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-secondary rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || label || 'Progress'}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantClasses[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}

// Circular Progress
export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  variant = 'default',
  className,
  'aria-label': ariaLabel,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedValue / 100) * circumference

  const variantColors = {
    default: 'stroke-primary',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    error: 'stroke-red-500',
  }

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || 'Circular progress'}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-300 ease-out', variantColors[variant])}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Multi-Step Progress
export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({
  steps,
  className,
}) => {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          const statusStyles = {
            completed: 'bg-primary border-primary',
            current: 'border-primary bg-background',
            error: 'bg-red-500 border-red-500',
            pending: 'border-muted bg-background',
          }

          const iconStyles = {
            completed: 'text-primary-foreground',
            current: 'text-primary',
            error: 'text-red-foreground',
            pending: 'text-muted-foreground',
          }

          const lineStyles = {
            completed: 'bg-primary',
            current: 'bg-muted',
            error: 'bg-red-500',
            pending: 'bg-muted',
          }

          return (
            <li
              key={index}
              className={cn(
                'relative',
                !isLast && 'flex-1'
              )}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    statusStyles[step.status]
                  )}
                >
                  {step.status === 'completed' ? (
                    <svg
                      className={cn('h-5 w-5', iconStyles[step.status])}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : step.status === 'error' ? (
                    <svg
                      className={cn('h-5 w-5', iconStyles[step.status])}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className={cn('text-sm font-medium', iconStyles[step.status])}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2">
                    <div
                      className={cn(
                        'h-full w-full transition-colors',
                        lineStyles[step.status]
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-foreground">
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// File Upload Progress (specialized component)
interface FileUploadProgressProps {
  files: Array<{
    name: string
    progress: number
    status: 'uploading' | 'completed' | 'error'
    error?: string
  }>
  className?: string
}

export const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  files,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {files.map((file, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {file.status === 'completed' ? (
                <svg
                  className="h-4 w-4 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : file.status === 'error' ? (
                <svg
                  className="h-4 w-4 text-red-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <div className="h-4 w-4 flex-shrink-0">
                  <CircularProgress
                    value={file.progress}
                    size={16}
                    strokeWidth={2}
                    showLabel={false}
                  />
                </div>
              )}
              <span className="text-sm text-foreground truncate">
                {file.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {file.status === 'completed'
                ? 'Concluído'
                : file.status === 'error'
                ? 'Erro'
                : `${Math.round(file.progress)}%`}
            </span>
          </div>
          {file.status === 'uploading' && (
            <LinearProgress
              value={file.progress}
              size="sm"
              animated={true}
              showLabel={false}
            />
          )}
          {file.status === 'error' && file.error && (
            <p className="text-xs text-red-500 mt-1">{file.error}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default LinearProgress
