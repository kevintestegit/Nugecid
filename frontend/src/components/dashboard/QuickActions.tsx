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
}

const QuickActions: React.FC = () => {
  const { user } = useAuth()

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
    },
  ]

  const filteredActions = actions.filter(action => {
    if (!action.requiredRoles) return true
    return action.requiredRoles.includes(user?.role || '')
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>
          Acesso rápido às principais funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="ghost"
                className={cn(
                  "h-auto p-4 flex flex-col items-center justify-center gap-3 border border-gray-200 transition-all duration-200 min-h-[140px]",
                  action.hoverColor,
                  "hover:border-gray-300 hover:shadow-sm"
                )}
                asChild
              >
                <Link to={action.href} className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className={cn("p-3 rounded-lg flex-shrink-0", action.bgColor)}>
                    <Icon className={cn("h-6 w-6", action.color)} />
                  </div>
                  <div className="text-center flex-1 flex flex-col justify-center">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2 text-wrap break-words">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
        
        {/* Ações secundárias */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/desarquivamentos?status=SOLICITADO" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Solicitado
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/desarquivamentos?status=REARQUIVAMENTO_SOLICITADO" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Rearquivamento Solicitado
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/desarquivamentos?status=RETIRADO_PELO_SETOR" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Retirado pelo Setor
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickActions