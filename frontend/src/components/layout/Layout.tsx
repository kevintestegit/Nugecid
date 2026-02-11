import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/ui/NotificationBell";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NugecidLogo } from "@/components/ui/NugecidLogo";
import { preloadByPath } from "@/routes/lazyPages";
import {
  Home,
  FileText,
  Users,
  Settings,
  Settings2,
  LogOut,
  Menu,
  X,
  BarChart,
  Shield,
  CheckSquare,
  FolderOpen,
  Kanban,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
} from "lucide-react";

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarLowQuality, setAvatarLowQuality] = useState(false);

  // Load sidebar state from localStorage or default to false
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  // Controle de submenu para Custódia de Vestígios
  const [custodiaExpanded, setCustodiaExpanded] = useState(() => {
    return location.pathname.startsWith("/custodia");
  });

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    setAvatarLowQuality(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    setSidebarOpen(false);

    if (location.pathname.startsWith("/custodia")) {
      setCustodiaExpanded(true);
    }

    const html = document.documentElement;
    const body = document.body;

    const isScrollLocked =
      body.hasAttribute("data-scroll-locked") ||
      html.hasAttribute("data-scroll-locked") ||
      body.style.overflow === "hidden" ||
      html.style.overflowY === "hidden";

    if (!isScrollLocked) return;

    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousHtmlOverflowY = html.style.overflowY;

    body.style.overflow = "auto";
    body.style.removeProperty("position");
    html.style.overflowY = "auto";
    body.removeAttribute("data-scroll-locked");
    html.removeAttribute("data-scroll-locked");

    return () => {
      body.style.overflow = previousBodyOverflow;
      if (previousBodyPosition) body.style.position = previousBodyPosition;
      else body.style.removeProperty("position");
      html.style.overflowY = previousHtmlOverflowY;
    };
  }, [location.pathname]);

  useEffect(() => {
    const preload = () => {
      void preloadByPath["/desarquivamentos"]?.();
      void preloadByPath["/tarefas"]?.();
      void preloadByPath["/projetos"]?.();
      void preloadByPath["/arquivo"]?.();
    };

    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (win.requestIdleCallback) {
      const handle = win.requestIdleCallback(preload, { timeout: 2000 });
      return () => win.cancelIdleCallback?.(handle);
    }

    const timeoutId = window.setTimeout(preload, 500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const preloadHref = (href: string) => {
    void preloadByPath[href]?.();
  };

  const userInitial = user?.nome?.charAt(0)?.toUpperCase() ?? "?";
  const userAvatar = user?.avatarUrl;
  const userRoleLabel = user?.role?.name
    ? user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1)
    : undefined;
  const shouldShowAvatarImage = Boolean(userAvatar) && !avatarLowQuality;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      current: location.pathname === "/",
    },
    {
      name: "Desarquivamentos",
      href: "/desarquivamentos",
      icon: FileText,
      current: location.pathname.startsWith("/desarquivamentos"),
    },
    {
      name: "Custódia de Vestígios",
      href: "/custodia",
      icon: Shield,
      current: location.pathname.startsWith("/custodia"),
      hasSubmenu: true,
      submenu: [
        {
          name: "Etiquetas",
          href: "/custodia",
          icon: Shield,
          current: location.pathname === "/custodia",
        },
        {
          name: "Banco de Vestígios",
          href: "/custodia/banco-vestigios",
          icon: Database,
          current: location.pathname === "/custodia/banco-vestigios",
        },
      ],
    },
    {
      name: "Relatórios",
      href: "/relatorios",
      icon: BarChart,
      current: location.pathname.startsWith("/relatorios"),
    },
    {
      name: "Tarefas",
      href: "/tarefas",
      icon: CheckSquare,
      current: location.pathname.startsWith("/tarefas"),
    },
    {
      name: "Projetos",
      href: "/projetos",
      icon: Kanban,
      current:
        location.pathname.startsWith("/projetos") ||
        location.pathname.startsWith("/kanban"),
    },
    {
      name: "Arquivo",
      href: "/arquivo",
      icon: FolderOpen,
      current: location.pathname.startsWith("/arquivo"),
    },
    {
      name: "Usuários",
      href: "/usuarios",
      icon: Users,
      current: location.pathname.startsWith("/usuarios"),
      adminOnly: true,
    },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (!item.adminOnly) return true;
    return user?.role?.name === "admin";
  });

  // Verificar se deve mostrar configurações (apenas admin)
  const showSettings = user?.role?.name === "admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-background/80 backdrop-blur-xl backdrop-saturate-150 border-r border-border/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.4)] animate-slide-in-left">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center">
              <NugecidLogo showText={true} className="h-10 w-auto" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pt-4 pb-6">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;

              // Se tem submenu, renderizar com expansão
              if (item.hasSubmenu && item.submenu) {
                const isExpanded = custodiaExpanded;

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setCustodiaExpanded(!isExpanded)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl border border-transparent bg-background/45 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                        item.current
                          ? "border-primary/25 bg-primary/10 text-primary shadow-sm backdrop-blur"
                          : "text-foreground/85 hover:border-border/60 hover:bg-card/70 hover:text-foreground hover:backdrop-blur",
                      )}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded ? "rotate-180" : "",
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={cn(
                                "group flex items-center rounded-lg border border-transparent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
                                subItem.current
                                  ? "border-primary/25 bg-primary/10 text-primary shadow-sm backdrop-blur"
                                  : "text-foreground/80 hover:border-border/60 hover:bg-card/70 hover:text-foreground",
                              )}
                              onMouseEnter={() => preloadHref(subItem.href)}
                              onFocus={() => preloadHref(subItem.href)}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Item normal sem submenu
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-xl border border-transparent px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                    item.current
                      ? "border-primary/25 bg-primary/10 text-primary shadow-sm backdrop-blur"
                      : "text-foreground/85 hover:border-border/60 hover:bg-card/70 hover:text-foreground hover:backdrop-blur",
                  )}
                  onMouseEnter={() => preloadHref(item.href)}
                  onFocus={() => preloadHref(item.href)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Beta Warning Banner - Mobile */}
          <div className="mx-4 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="h-4 w-4 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Versão Beta
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  Algumas funcionalidades podem não funcionar corretamente.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/80 p-4 space-y-3">
            <div className="flex items-center gap-3">
              {shouldShowAvatarImage ? (
                <img
                  src={userAvatar ?? undefined}
                  alt={user?.nome ?? "Avatar do usuario"}
                  className="h-10 w-10 rounded-full object-cover border border-border/60"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (image.naturalWidth < 64 || image.naturalHeight < 64) {
                      setAvatarLowQuality(true);
                    }
                  }}
                  onError={() => setAvatarLowQuality(true)}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  <span className="text-sm">{userInitial}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userRoleLabel ?? "Usuário"}
                </p>
              </div>
            </div>
            {showSettings && (
              <Link
                to="/configuracoes"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-destructive"
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
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:z-30 lg:w-64",
          sidebarCollapsed && "lg:w-16",
        )}
        style={{
          transition: "width 0.2s ease-out",
        }}
      >
        <div className="flex flex-col h-full bg-background/80 backdrop-blur-xl backdrop-saturate-150 border-r border-border/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.4)]">
          {/* Toggle Button - Minimalist Design */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "absolute top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-card/95 text-muted-foreground shadow-sm backdrop-blur-sm hover:h-7 hover:w-7 hover:bg-card hover:text-foreground hover:shadow-md hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 active:scale-95",
              "-right-3",
            )}
            style={{
              transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
            }}
            title={sidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <div className="relative flex items-center justify-center">
              {/* Icon with rotation animation */}
              <div
                className="relative z-10"
                style={{
                  transform: sidebarCollapsed
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease-out",
                }}
              >
                <ChevronLeft className="h-3 w-3" />
              </div>
            </div>
          </button>

          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <Link to="/" className="flex items-center justify-center w-full">
              <NugecidLogo
                showText={!sidebarCollapsed}
                className={cn(
                  "transition-all duration-300",
                  sidebarCollapsed ? "h-12 w-12" : "h-12 w-auto",
                )}
              />
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6 pt-4">
            {filteredNavigation.map((item, index) => {
              const Icon = item.icon;

              // Se tem submenu, renderizar com expansão
              if (item.hasSubmenu && item.submenu) {
                const isExpanded = custodiaExpanded;

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setCustodiaExpanded(!isExpanded)}
                      className={cn(
                        "group flex w-full items-center rounded-xl border border-transparent px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                        sidebarCollapsed ? "justify-center" : "justify-between",
                        item.current
                          ? "border-primary/25 bg-primary/10 text-primary shadow-sm backdrop-blur"
                          : "text-foreground/85 hover:border-border/60 hover:bg-card/70 hover:text-foreground hover:backdrop-blur",
                      )}
                      title={sidebarCollapsed ? item.name : undefined}
                      onMouseEnter={() => preloadHref(item.href)}
                      onFocus={() => preloadHref(item.href)}
                    >
                      <div className="flex items-center">
                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                            sidebarCollapsed ? "mr-0" : "mr-3",
                          )}
                        />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded ? "rotate-180" : "",
                          )}
                        />
                      )}
                    </button>

                    {isExpanded && !sidebarCollapsed && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={cn(
                                "group flex items-center rounded-lg border border-transparent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
                                subItem.current
                                  ? "border-primary/25 bg-primary/10 text-primary shadow-sm backdrop-blur"
                                  : "text-foreground/80 hover:border-border/60 hover:bg-card/70 hover:text-foreground",
                              )}
                              onMouseEnter={() => preloadHref(subItem.href)}
                              onFocus={() => preloadHref(subItem.href)}
                            >
                              <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Item normal sem submenu
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-xl border border-transparent px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                    sidebarCollapsed ? "justify-center" : "",
                    item.current
                      ? "border-primary/25 bg-primary/10 text-primary shadow-sm backdrop-blur"
                      : "text-foreground/85 hover:border-border/60 hover:bg-card/70 hover:text-foreground hover:backdrop-blur",
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                  onMouseEnter={() => preloadHref(item.href)}
                  onFocus={() => preloadHref(item.href)}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                      sidebarCollapsed ? "mr-0" : "mr-3",
                    )}
                  />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Beta Warning Banner */}
          <div
            className={cn(
              "mx-4 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 transition-all duration-300",
              sidebarCollapsed ? "hidden" : "block",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="h-4 w-4 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Versão Beta
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  Algumas funcionalidades podem não funcionar corretamente.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/80 p-4">
            <div
              className={cn(
                "flex items-center gap-3 transition-all",
                sidebarCollapsed ? "justify-center" : "",
              )}
            >
              {shouldShowAvatarImage ? (
                <img
                  src={userAvatar ?? undefined}
                  alt={user?.nome ?? "Avatar do usuario"}
                  className={cn(
                    "h-10 w-10 rounded-full object-cover border border-border/60",
                    sidebarCollapsed ? "h-9 w-9" : "",
                  )}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (image.naturalWidth < 64 || image.naturalHeight < 64) {
                      setAvatarLowQuality(true);
                    }
                  }}
                  onError={() => setAvatarLowQuality(true)}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  <span className="text-sm">{userInitial}</span>
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userRoleLabel ?? "Usuário"}
                  </p>
                </div>
              )}
            </div>
            {showSettings && (
              <Link
                to="/configuracoes"
                className={cn(
                  "mt-3 flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/85 transition-all hover:border-border/60 hover:bg-card/70 hover:text-foreground hover:backdrop-blur",
                  sidebarCollapsed
                    ? "mx-auto mt-2 h-10 w-10 justify-center rounded-full border-transparent bg-primary/10 p-0 text-primary shadow-sm backdrop-blur hover:bg-primary/15"
                    : "justify-start",
                )}
                title={sidebarCollapsed ? "Configurações" : undefined}
              >
                <Settings2
                  className={cn("h-4 w-4", sidebarCollapsed && "h-5 w-5")}
                  strokeWidth={2.25}
                />
                {!sidebarCollapsed && <span>Configurações</span>}
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={cn(
                "mt-3 flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/85 transition-all hover:border-border/60 hover:bg-card/70 hover:text-destructive hover:backdrop-blur",
                sidebarCollapsed ? "justify-center" : "justify-start",
              )}
              title={sidebarCollapsed ? "Sair" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn("lg:pl-64", sidebarCollapsed && "lg:pl-16")}
        style={{ transition: "padding-left 0.2s ease-out" }}
      >
        {/* Top bar - Modern glassmorphism */}
        <div
          className="sticky top-0 z-40 flex shrink-0 items-center gap-x-4 bg-background/80 backdrop-blur-xl backdrop-saturate-150 px-4 sm:gap-x-6 sm:px-6 lg:px-8"
          style={{ height: "64px" }}
        >
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
              {/* Campo de busca global */}
              <GlobalSearch />

              {/* Notifications - Novo componente integrado */}
              <NotificationBell />
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
  );
};

export default Layout;
