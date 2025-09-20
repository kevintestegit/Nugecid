import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/NotificationBell'
import {
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Archive,
  BarChart,
  CheckSquare,
  FolderOpen,
  Kanban,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load sidebar state from localStorage or default to false
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const userInitial = user?.nome?.charAt(0)?.toUpperCase() ?? '?'
  const userAvatar = user?.avatarUrl
  const userRoleLabel = user?.role?.name
    ? user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1)
    : undefined



  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      current: location.pathname === '/'
    },
    {
      name: 'Desarquivamentos',
      href: '/desarquivamentos',
      icon: FileText,
      current: location.pathname.startsWith('/desarquivamentos')
    },
    {
      name: 'Relatórios',
      href: '/relatorios',
      icon: BarChart,
      current: location.pathname.startsWith('/relatorios')
    },
    {
      name: 'Tarefas',
      href: '/tarefas',
      icon: CheckSquare,
      current: location.pathname.startsWith('/tarefas')
    },
    {
      name: 'Projetos',
      href: '/projetos',
      icon: Kanban,
      current: location.pathname.startsWith('/projetos') || location.pathname.startsWith('/kanban')
    },
    {
      name: 'Arquivo',
      href: '/arquivo',
      icon: FolderOpen,
      current: location.pathname.startsWith('/arquivo')
    },
    {
      name: 'Usuários',
      href: '/usuarios',
      icon: Users,
      current: location.pathname.startsWith('/usuarios'),
      adminOnly: true
    }
  ]

  const filteredNavigation = navigation.filter(item => {
    if (!item.adminOnly) return true
    
    // Para o item de usuários, permitir apenas admin
    if (item.name === 'Usuários') {
      return user?.role?.name === 'admin'
    }
    
    // Para outros itens adminOnly, apenas admin
    return user?.role?.name === 'admin'
  })

  // Verificar se deve mostrar configurações (apenas admin)
  const showSettings = user?.role?.name === 'admin'

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', sidebarOpen ? 'block' : 'hidden')}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-card border-r border-border shadow-lg animate-slide-in-left">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <Archive className='h-8 w-auto' />
              <h1 className='text-xl font-bold text-foreground'>NUGECID</h1>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pt-4 pb-6">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    item.current
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-border/80 p-4 space-y-3">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={user?.nome ?? 'Avatar do usuario'}
                  className="h-10 w-10 rounded-full object-cover border border-border/60"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  <span className="text-sm">{userInitial}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.nome}</p>
                <p className="text-xs text-muted-foreground">{userRoleLabel ?? 'Usuário'}</p>
              </div>
            </div>
            {showSettings && (
              <Link
                to="/configuracoes"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-500 ease-in-out relative z-30",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div className="relative flex flex-col flex-grow border-r border-border bg-card shadow-lg">
          {/* Toggle Button - Minimalist Design */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "group absolute top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out hover:h-7 hover:w-7 hover:bg-card hover:text-foreground hover:shadow-md hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 active:scale-95",
              sidebarCollapsed ? "-right-3" : "-right-3"
            )}
            title={sidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <div className="relative flex items-center justify-center">
              {/* Background ripple effect */}
              <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 transition-opacity duration-200 group-active:opacity-100" />

              {/* Icon with rotation animation */}
              <div className={cn(
                "relative z-10 transition-transform duration-300 ease-in-out",
                sidebarCollapsed ? "rotate-180" : "rotate-0"
              )}>
                <ChevronLeft className="h-3 w-3 transition-all duration-200 group-hover:scale-110" />
              </div>

              {/* Subtle indicator dot */}
              <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-primary/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
          </button>

          <div className="flex h-16 flex-shrink-0 items-center border-b border-border/80 px-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Archive className="h-5 w-5" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-xl font-semibold text-foreground">
                  NUGECID
                </span>
              )}
            </Link>
          </div>
          
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6 pt-4">
            {filteredNavigation.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    sidebarCollapsed ? 'justify-center' : '',
                    item.current
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 transition-transform duration-300',
                      sidebarCollapsed ? 'mr-0' : 'mr-3'
                    )}
                  />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border/80 p-4">
            <div
              className={cn(
                'flex items-center gap-3 transition-all',
                sidebarCollapsed ? 'justify-center' : ''
              )}
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={user?.nome ?? 'Avatar do usuario'}
                  className={cn(
                    'h-10 w-10 rounded-full object-cover border border-border/60',
                    sidebarCollapsed ? 'h-9 w-9' : ''
                  )}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  <span className="text-sm">{userInitial}</span>
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.nome}</p>
                  <p className="text-xs text-muted-foreground">{userRoleLabel ?? 'Usuário'}</p>
                </div>
              )}
            </div>
            {showSettings && (
              <Link
                to="/configuracoes"
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  sidebarCollapsed ? 'justify-center' : 'justify-start'
                )}
                title={sidebarCollapsed ? 'Configurações' : undefined}
              >
                <Settings className="h-4 w-4" />
                {!sidebarCollapsed && <span>Configurações</span>}
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={cn(
                'mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive',
                sidebarCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={sidebarCollapsed ? 'Sair' : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Top bar - Modern glassmorphism */}
        <div className="sticky top-0 z-40 flex shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8" style={{height: '64px'}}>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications - Novo componente integrado */}
              <NotificationBell />
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-foreground">
                  Bem-vindo, <span className="font-semibold">{user?.nome}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content - Enhanced spacing */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout