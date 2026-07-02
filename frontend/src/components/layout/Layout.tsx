import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/ui/NotificationBell";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useDomainSyncSSE } from "@/hooks/useDomainSyncSSE";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { DailySummaryModal } from "@/components/ui/DailySummaryModal";
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
  ChevronDown,
  Database,
  ClipboardList,
} from "lucide-react";

const SIDEBAR_ANIMATION_MS = 220;
const SIDEBAR_EXPAND_DELTA_PX = 192;

const RealtimeRuntimeHooks: React.FC = () => {
  useNotificacoes();
  useDomainSyncSSE();
  useRealtimeSync();
  return null;
};

const RealtimeRuntime: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (win.requestIdleCallback) {
      const handle = win.requestIdleCallback(() => setReady(true), {
        timeout: 1500,
      });
      return () => win.cancelIdleCallback?.(handle);
    }

    const timeoutId = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(timeoutId);
  }, [enabled]);

  if (!enabled || !ready) {
    return null;
  }

  return <RealtimeRuntimeHooks />;
};

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarLowQuality, setAvatarLowQuality] = useState(false);
  const [isSidebarAnimating, setIsSidebarAnimating] = useState(false);
  const sidebarAnimationTimeoutRef = useRef<number | null>(null);

  // Load sidebar state from localStorage or default to false
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
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
    return () => {
      if (sidebarAnimationTimeoutRef.current !== null) {
        window.clearTimeout(sidebarAnimationTimeoutRef.current);
      }
    };
  }, []);

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

  const preloadHref = useCallback((href: string) => {
    void preloadByPath[href]?.();
  }, []);

  const handleDesktopSidebarToggle = useCallback(() => {
    setIsSidebarAnimating(true);
    setSidebarCollapsed((previous) => !previous);

    if (sidebarAnimationTimeoutRef.current !== null) {
      window.clearTimeout(sidebarAnimationTimeoutRef.current);
    }

    sidebarAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarAnimating(false);
      sidebarAnimationTimeoutRef.current = null;
    }, SIDEBAR_ANIMATION_MS + 40);
  }, []);

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

  const navigation = useMemo(
    () => [
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
            name: "Catalogação",
            href: "/custodia/catalogacao",
            icon: ClipboardList,
            current: location.pathname === "/custodia/catalogacao",
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
    ],
    [location.pathname],
  );

  const filteredNavigation = useMemo(
    () =>
      navigation.filter((item) => {
        if (!item.adminOnly) return true;
        return user?.role?.name === "admin";
      }),
    [navigation, user?.role?.name],
  );

  // Verificar se deve mostrar configurações (apenas admin)
  const showSettings = user?.role?.name === "admin";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Pular para o conteúdo principal
      </a>
      <RealtimeRuntime enabled={Boolean(user)} />
      <DailySummaryModal />
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
              <NugecidLogo
                showText={true}
                showAnimation={true}
                className="h-10 w-auto"
              />
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
                    "group flex items-center rounded-xl border border-transparent px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-[background-color,border-color,color]",
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-16 lg:overflow-visible lg:z-30">
        <div
          className="absolute inset-y-0 left-0 w-64"
          style={{
            transform: sidebarCollapsed
              ? `translate3d(-${SIDEBAR_EXPAND_DELTA_PX}px, 0, 0)`
              : "translate3d(0, 0, 0)",
            transition: `transform ${SIDEBAR_ANIMATION_MS}ms cubic-bezier(0.2, 0, 0, 1)`,
            willChange: isSidebarAnimating ? "transform" : "auto",
            contain: "layout paint style",
            backfaceVisibility: "hidden",
          }}
          id="desktop-sidebar"
        >
          <div
            className={cn(
              "flex h-full flex-col bg-background/80 border-r border-border/50",
              isSidebarAnimating
                ? "backdrop-blur-none shadow-none"
                : "backdrop-blur-xl backdrop-saturate-150 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.4)]",
            )}
            id="desktop-sidebar-panel"
          >
            <div
              className={cn(
                "flex flex-shrink-0 items-center",
                sidebarCollapsed
                  ? "ml-auto h-24 w-16 flex-col justify-center gap-2 px-0"
                  : "relative h-16 w-full justify-center px-4",
              )}
            >
              {sidebarCollapsed ? (
                <>
                  <button
                    type="button"
                    aria-controls="desktop-sidebar"
                    aria-expanded="false"
                    aria-label="Abrir barra lateral"
                    onClick={handleDesktopSidebarToggle}
                    className="group flex h-9 w-9 cursor-e-resize items-center justify-center rounded-lg text-foreground/80 outline-none transition-colors hover:bg-card/70 hover:text-foreground focus-visible:bg-card/70 focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <ChevronLeft className="hidden h-5 w-5 rotate-180 group-hover:block group-focus-visible:block" />
                  </button>
                  <Link
                    to="/"
                    className="flex h-10 w-10 items-center justify-center"
                    aria-label="NUGECID"
                  >
                    <NugecidLogo
                      showText={false}
                      showAnimation={false}
                      className="h-10 w-10"
                    />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="flex w-full min-w-0 items-center justify-center"
                    data-testid="desktop-sidebar-logo-link"
                  >
                    <NugecidLogo
                      showText={true}
                      showAnimation={true}
                      className="h-12 w-[200px] justify-center"
                    />
                  </Link>
                  <button
                    type="button"
                    aria-controls="desktop-sidebar"
                    aria-expanded="true"
                    aria-label="Recolher barra lateral"
                    onClick={handleDesktopSidebarToggle}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-w-resize items-center justify-center rounded-lg text-foreground/75 outline-none transition-colors hover:bg-card/70 hover:text-foreground focus-visible:bg-card/70 focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <nav
              aria-label="Navegação principal desktop"
              className={cn(
                "flex flex-1 flex-col gap-1 overflow-y-auto pb-6 pt-4",
                sidebarCollapsed ? "ml-auto w-16 px-0" : "px-4",
              )}
            >
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
                          "group flex w-full items-center rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium leading-snug tracking-normal transition-[background-color,border-color,color]",
                          sidebarCollapsed
                            ? "justify-center"
                            : "justify-between",
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
                                  "group flex items-center rounded-lg border border-transparent px-3 py-2 text-xs font-medium tracking-normal transition-colors",
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
                      "group flex items-center rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-normal transition-[background-color,border-color,color]",
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

            <div
              className={cn(
                "border-t border-border/80",
                sidebarCollapsed ? "ml-auto w-16 p-2" : "p-4",
              )}
            >
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
                    "mt-3 flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-normal text-foreground/85 transition-[background-color,border-color,color] hover:border-border/60 hover:bg-card/70 hover:text-foreground hover:backdrop-blur",
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
                  "mt-3 flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium tracking-normal text-foreground/85 transition-[background-color,border-color,color] hover:border-border/60 hover:bg-card/70 hover:text-destructive hover:backdrop-blur",
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
      </div>

      {/* Main content */}
      <div
        className={cn(
          "min-w-0 overflow-x-hidden lg:ml-16 lg:transition-[margin-left] lg:duration-200 lg:ease-out",
          !sidebarCollapsed && "lg:ml-64",
        )}
        style={{
          willChange: isSidebarAnimating ? "margin-left" : "auto",
        }}
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
        <main
          id="main-content"
          tabIndex={-1}
          className="py-8 focus:outline-none"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
