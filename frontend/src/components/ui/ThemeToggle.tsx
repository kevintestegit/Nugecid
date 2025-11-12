import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'switch'
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  size = 'md',
  variant = 'button'
}) => {
  const { theme, toggleTheme, isDark } = useTheme()

  if (variant === 'switch') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Sun className={cn(
          'h-4 w-4 transition-all',
          isDark ? 'text-muted-foreground' : 'text-yellow-500'
        )} />
        <button
          onClick={toggleTheme}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            isDark ? 'bg-primary' : 'bg-muted'
          )}
          role="switch"
          aria-checked={isDark}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out',
              isDark ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        <Moon className={cn(
          'h-4 w-4 transition-all',
          isDark ? 'text-blue-400' : 'text-muted-foreground'
        )} />
      </div>
    )
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        sizeClasses[size],
        'relative overflow-hidden transition-all hover:scale-105',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative flex items-center justify-center">
        <Sun className={cn(
          iconSizes[size],
          'absolute transition-all duration-500',
          isDark 
            ? 'rotate-90 scale-0 opacity-0' 
            : 'rotate-0 scale-100 opacity-100'
        )} />
        <Moon className={cn(
          iconSizes[size],
          'absolute transition-all duration-500',
          isDark 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
        )} />
      </div>
    </Button>
  )
}

export default ThemeToggle