import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import {
  FileX,
  FolderOpen,
  Search,
  Database,
  Inbox,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact' | 'card';
  children?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title = 'Nenhum item encontrado',
  description,
  action,
  secondaryAction,
  className,
  variant = 'default',
  children,
}) => {
  const variantStyles = {
    default: {
      container: 'py-16',
      iconSize: 'h-16 w-16',
      titleSize: 'text-xl',
    },
    compact: {
      container: 'py-8',
      iconSize: 'h-12 w-12',
      titleSize: 'text-lg',
    },
    card: {
      container: 'py-12 px-6 border border-border rounded-lg bg-muted/30',
      iconSize: 'h-14 w-14',
      titleSize: 'text-lg',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
        <Icon className={cn(styles.iconSize, 'text-muted-foreground')} />
      </div>

      <h3 className={cn('font-semibold text-foreground mb-2', styles.titleSize)}>
        {title}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}

      {children}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors font-medium"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Variantes pré-configuradas para casos comuns

export const NoResultsFound: React.FC<Omit<EmptyStateProps, 'icon' | 'title'>> = (props) => (
  <EmptyState
    icon={Search}
    title="Nenhum resultado encontrado"
    description="Tente ajustar os filtros ou termos de busca"
    {...props}
  />
);

export const NoDataAvailable: React.FC<Omit<EmptyStateProps, 'icon' | 'title'>> = (props) => (
  <EmptyState
    icon={Database}
    title="Nenhum dado disponível"
    description="Ainda não há dados para exibir"
    {...props}
  />
);

export const NoFilesFound: React.FC<Omit<EmptyStateProps, 'icon' | 'title'>> = (props) => (
  <EmptyState
    icon={FileX}
    title="Nenhum arquivo encontrado"
    description="Não foram encontrados arquivos nesta pasta"
    {...props}
  />
);

export const EmptyFolder: React.FC<Omit<EmptyStateProps, 'icon' | 'title'>> = (props) => (
  <EmptyState
    icon={FolderOpen}
    title="Pasta vazia"
    description="Esta pasta não contém itens"
    {...props}
  />
);

export const ErrorState: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'variant'>> = (
  props
) => (
  <EmptyState
    icon={AlertCircle}
    title="Erro ao carregar dados"
    description="Ocorreu um erro ao tentar carregar as informações"
    variant="card"
    {...props}
  />
);

// Componente de lista vazia com skeleton loading
interface EmptyStateWithLoadingProps extends EmptyStateProps {
  isLoading: boolean;
  loadingText?: string;
  skeletonCount?: number;
}

export const EmptyStateWithLoading: React.FC<EmptyStateWithLoadingProps> = ({
  isLoading,
  loadingText = 'Carregando...',
  skeletonCount = 3,
  ...emptyStateProps
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-8">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className="h-16 bg-muted rounded-lg animate-pulse"
          />
        ))}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {loadingText}
        </p>
      </div>
    );
  }

  return <EmptyState {...emptyStateProps} />;
};

export default EmptyState;
