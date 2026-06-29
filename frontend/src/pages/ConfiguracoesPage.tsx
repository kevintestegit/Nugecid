import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, User, Shield, Database, Megaphone } from "lucide-react";

import { GeneralSettings } from "./Configuracoes/GeneralSettings";
import { SystemSettings } from "./Configuracoes/SystemSettings";
import { SecuritySettings } from "./Configuracoes/SecuritySettings";
import { UserSettings } from "./Configuracoes/UserSettings";
import { AnnouncementsSettings } from "./Configuracoes/AnnouncementsSettings";

type TabType = "geral" | "sistema" | "seguranca" | "usuario" | "avisos";

const ConfiguracoesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("geral");
  const navRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<TabType, HTMLButtonElement | null>>>(
    {},
  );
  const [sliderStyle, setSliderStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const isAdmin = user?.role?.name === "admin";
  const isCoordenador = user?.role?.name === "coordenador" || isAdmin;

  const tabs = [
    { id: "geral" as TabType, label: "Geral", icon: Settings, available: true },
    {
      id: "sistema" as TabType,
      label: "Sistema",
      icon: Database,
      available: isAdmin,
    },
    {
      id: "avisos" as TabType,
      label: "Avisos",
      icon: Megaphone,
      available: isAdmin,
    },
    {
      id: "seguranca" as TabType,
      label: "Segurança",
      icon: Shield,
      available: isCoordenador,
    },
    { id: "usuario" as TabType, label: "Usuário", icon: User, available: true },
  ].filter((tab) => tab.available);

  useEffect(() => {
    const updateSlider = () => {
      const nav = navRef.current;
      const activeButton = tabRefs.current[activeTab];
      if (!nav || !activeButton) return;

      const navRect = nav.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setSliderStyle({
        left: buttonRect.left - navRect.left,
        top: buttonRect.top - navRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
        ready: true,
      });
    };

    updateSlider();
    window.addEventListener("resize", updateSlider);
    return () => window.removeEventListener("resize", updateSlider);
  }, [activeTab, tabs.length]);

  return (
    <div className="settings-typography relative container mx-auto max-w-6xl space-y-6 p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(249,115,22,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(14,116,144,0.24),transparent_55%),radial-gradient(120%_80%_at_92%_10%,rgba(194,65,12,0.18),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0))]" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />

        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema e suas preferências pessoais
        </p>
      </div>

      {/* Navegação por abas */}
      <div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-2 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.75)] backdrop-blur">
          <nav ref={navRef} className="relative flex flex-wrap gap-2">
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute rounded-xl border border-primary/25 bg-primary/10 shadow-sm backdrop-blur transition-all duration-300 ease-out ${
                sliderStyle.ready ? "opacity-100" : "opacity-0"
              }`}
              style={{
                left: sliderStyle.left,
                top: sliderStyle.top,
                width: sliderStyle.width,
                height: sliderStyle.height,
              }}
            />
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[tab.id] = element;
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all ${
                    activeTab === tab.id
                      ? "border-transparent bg-transparent text-primary"
                      : "border-transparent text-foreground/80 hover:border-border/60 hover:bg-card/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div className="mb-6">
        {activeTab === "geral" && <GeneralSettings />}
        {activeTab === "sistema" && isAdmin && <SystemSettings />}
        {activeTab === "avisos" && isAdmin && <AnnouncementsSettings />}
        {activeTab === "seguranca" && isCoordenador && <SecuritySettings />}
        {activeTab === "usuario" && <UserSettings />}
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
