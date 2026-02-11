import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Server, 
  Database, 
  Users, 
  Shield,
  Clock,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'

interface SystemStatus {
  service: string
  status: 'online' | 'warning' | 'offline'
  lastCheck: string
  description: string
}

interface SystemInfoData {
  version: string
  uptime: string
  totalUsers: number
  activeUsers: number
  databaseSize: string
  lastBackup: string
  services: SystemStatus[]
}

interface SystemInfoProps {
  data?: SystemInfoData
  isLoading?: boolean
}

const SystemInfo: React.FC<SystemInfoProps> = ({ data, isLoading = false }) => {
  const { user } = useAuth()

  // Dados mockados para demonstração
  const defaultData: SystemInfoData = {
    version: '2.0.0',
    uptime: '15 dias, 8 horas',
    totalUsers: 45,
    activeUsers: 12,
    databaseSize: '2.3 GB',
    lastBackup: '2024-01-15 03:00:00',
    services: [
      {
        service: 'API Backend',
        status: 'online',
        lastCheck: '2024-01-15 14:30:00',
        description: 'Serviço principal funcionando'
      },
      {
        service: 'Banco de Dados',
        status: 'online',
        lastCheck: '2024-01-15 14:30:00',
        description: 'PostgreSQL operacional'
      },
      {
        service: 'Sistema de Backup',
        status: 'warning',
        lastCheck: '2024-01-15 03:00:00',
        description: 'Último backup há 11 horas'
      },
      {
        service: 'Monitoramento',
        status: 'online',
        lastCheck: '2024-01-15 14:29:00',
        description: 'Sistema de logs ativo'
      }
    ]
  }

  const systemData = data || defaultData
  const isMock = !data

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  // Só mostra para administradores
  if (user?.role?.name !== 'admin') {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
          <CardDescription>
            Status e estatísticas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
          {isMock && (
            <Badge variant="outline" className="text-[11px]">
              Dados de demonstração
            </Badge>
          )}
        </div>
        <CardDescription>
          Status e estatísticas do sistema SGC-ITEP v{systemData.version}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Uptime
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {systemData.uptime}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              Usuários
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {systemData.activeUsers}/{systemData.totalUsers}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="h-4 w-4" />
              Banco de Dados
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {systemData.databaseSize}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <HardDrive className="h-4 w-4" />
              Último Backup
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(systemData.lastBackup)}
            </div>
          </div>
        </div>

        {/* Status dos Serviços */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Status dos Serviços
          </h4>
          <div className="space-y-2">
            {systemData.services.map((service, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {service.service}
                    </div>
                    <div className="text-xs text-gray-600">
                      {service.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(service.status))}
                  >
                    {service.status === 'online' ? 'Online' : 
                     service.status === 'warning' ? 'Atenção' : 'Offline'}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(service.lastCheck)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicador de Conectividade */}
        <div className="flex items-center justify-center pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Wifi className="h-4 w-4" />
            <span>Sistema operacional - Todos os serviços funcionando</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SystemInfo
