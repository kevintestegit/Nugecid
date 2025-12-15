import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Plus, 
  FileText, 
  Search, 
  Download,
  Settings,
  Users,
  BarChart3,
  Filter
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'

interface QuickAction {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  bgColor: string
  hoverColor: string
  requiredRoles?: string[]
  featureFlagKey?: 'relatorios' | 'exportar' | 'usuarios' | 'configuracoes'
}

const QuickActions: React.FC = () => {
  const { user } = useAuth()

  const featureFlags = {
    relatorios: import.meta.env.VITE_FEATURE_RELATORIOS !== 'false',
    exportar: import.meta.env.VITE_FEATURE_EXPORTAR !== 'false',
    usuarios: import.meta.env.VITE_FEATURE_USUARIOS !== 'false',
    configuracoes: import.meta.env.VITE_FEATURE_CONFIGURACOES !== 'false',
  }

  const actions: QuickAction[] = [
    {
      title: 'Nova Solicitação',
      description: 'Criar nova solicitação de desarquivamento',
      icon: Plus,
      href: '/desarquivamentos/novo',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
    },
    {
      title: 'Buscar Solicitações',
      description: 'Pesquisar e filtrar solicitações',
      icon: Search,
      href: '/desarquivamentos',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
    },
    {
      title: 'Relatórios',
      description: 'Gerar relatórios e estatísticas',
      icon: BarChart3,
      href: '/relatorios',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      requiredRoles: ['admin', 'coordenador'],
      featureFlagKey: 'relatorios',
    },
    {
      title: 'Exportar Dados',
      description: 'Exportar dados para Excel/PDF',
      icon: Download,
      href: '/exportar',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      requiredRoles: ['admin', 'coordenador'],
      featureFlagKey: 'exportar',
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Administrar usuários do sistema',
      icon: Users,
      href: '/usuarios',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      hoverColor: 'hover:bg-red-100',
      requiredRoles: ['admin'],
      featureFlagKey: 'usuarios',
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: Settings,
      href: '/configuracoes',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      hoverColor: 'hover:bg-gray-100',
      requiredRoles: ['admin'],
      featureFlagKey: 'configuracoes',
    },
  ]

  const filteredActions = actions.filter(action => {
    if (action.featureFlagKey && featureFlags[action.featureFlagKey] === false) {
      return false
    }
    if (!action.requiredRoles) return true
    return action.requiredRoles.includes(user?.role || '')
  })

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "h-auto p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200",
                  action.hoverColor,
                  "hover:shadow-md hover:scale-105"
                )}
                asChild
              >
                <Link to={action.href} className="w-full">
                  <div className={cn("p-2 rounded-lg", action.bgColor)}>
                    <Icon className={cn("h-5 w-5", action.color)} />
                  </div>
                  <span className="font-medium text-xs text-center leading-tight mt-1">
                    {action.title}
                  </span>
                </Link>
              </Button>
            )
          })}
        </div>
        
        {/* Filtros rápidos */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Filtros Rápidos:</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/desarquivamentos?status=SOLICITADO" className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs">Solicitado</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/desarquivamentos?status=REARQUIVAMENTO_SOLICITADO" className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs">Rearquivamento</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/desarquivamentos?status=RETIRADO_PELO_SETOR" className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs">Retirado</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActions