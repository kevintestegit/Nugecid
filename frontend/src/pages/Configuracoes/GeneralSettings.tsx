import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Bell,
  Monitor,
  Moon,
  Send,
  Sparkles,
  Sun,
  Volume2,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { apiService } from "@/services/api";
import { desktopNotificationsService } from "@/services/desktopNotificationsService";
import { pushSubscriptionService } from "@/services/pushSubscriptionService";
import type { Notificacao } from "@/services/notificacoesService";
import { NotificationPreferences } from "@/types";
import { toast } from "sonner";
import { PREFERENCES_UPDATED_EVENT } from "@/hooks/useDesktopNotifications";
import { NOTIFICATION_TYPE_DESCRIPTIONS } from "@/lib/notifications/notificationMeta";
import {
  DEFAULT_NUGECID_LOGO_PREFERENCE,
  readNugecidLogoPreference,
  writeNugecidLogoPreference,
  type NugecidLogoPreference,
} from "@/lib/logoPreferences";

export const GeneralSettings: React.FC = () => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [logoPreference, setLogoPreference] = useState<NugecidLogoPreference>(
    DEFAULT_NUGECID_LOGO_PREFERENCE,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [testingBrowserNotification, setTestingBrowserNotification] =
    useState(false);
  const [sendingServerNotification, setSendingServerNotification] =
    useState(false);
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");

  useEffect(() => {
    setBrowserPermission(desktopNotificationsService.getPermission());
    setLogoPreference(readNugecidLogoPreference());
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotificationPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
        setHasChanges(false);
      }
    } catch (error: unknown) {
      console.error("Erro ao carregar preferências:", error);
      toast.error("Erro ao carregar preferências de notificação");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await apiService.updateNotificationPreferences({
        inAppEnabled: preferences.inAppEnabled,
        desktopEnabled: preferences.desktopEnabled,
        pushEnabled: preferences.pushEnabled,
        soundEnabled: preferences.soundEnabled,
        enabledTypes: preferences.enabledTypes,
      });

      if (response.success && response.data) {
        if (response.data.pushEnabled) {
          const pushSyncResult =
            await pushSubscriptionService.ensureRegisteredWithServer();
          if (pushSyncResult === "server-disabled") {
            toast.warning(
              "As notificações em segundo plano dependem da configuração de Web Push no servidor.",
            );
          }
        } else {
          await pushSubscriptionService.detachCurrentSubscription();
        }

        window.dispatchEvent(
          new CustomEvent(PREFERENCES_UPDATED_EVENT, {
            detail: { preferences: response.data },
          }),
        );
        toast.success("Preferências salvas com sucesso!");
        setHasChanges(false);
        await loadPreferences();
      }
    } catch (error: unknown) {
      console.error("Erro ao salvar preferências:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotificationType = (type: string) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      enabledTypes: {
        ...preferences.enabledTypes,
        [type]: !preferences.enabledTypes[type],
      },
    });
    setHasChanges(true);
  };

  const handleLogoPreferenceChange = (value: NugecidLogoPreference) => {
    setLogoPreference(value);
    writeNugecidLogoPreference(value);
  };

  const handleDesktopNotificationsToggle = async (checked: boolean) => {
    if (!preferences) return;

    if (!checked) {
      setPreferences({ ...preferences, desktopEnabled: false });
      setHasChanges(true);
      return;
    }

    const currentPermission = desktopNotificationsService.getPermission();
    setBrowserPermission(currentPermission);

    if (currentPermission === "unsupported") {
      toast.error("Seu navegador não suporta notificações na área de trabalho");
      return;
    }

    if (currentPermission === "denied") {
      toast.error(
        "As notificações estão bloqueadas no navegador. Libere a permissão para ativar este canal.",
      );
      return;
    }

    let nextPermission: NotificationPermission | "unsupported" =
      currentPermission;
    if (currentPermission !== "granted") {
      nextPermission = await desktopNotificationsService.requestPermission();
      setBrowserPermission(nextPermission);
    }

    if (nextPermission !== "granted") {
      toast.error(
        "A permissão de notificações não foi concedida. O canal de área de trabalho continuará desativado.",
      );
      return;
    }

    setPreferences({ ...preferences, desktopEnabled: true });
    setHasChanges(true);
  };

  const handlePushNotificationsToggle = async (checked: boolean) => {
    if (!preferences) return;

    if (!checked) {
      setPreferences({ ...preferences, pushEnabled: false });
      setHasChanges(true);
      return;
    }

    const currentPermission = desktopNotificationsService.getPermission();
    setBrowserPermission(currentPermission);

    if (currentPermission === "unsupported") {
      toast.error("Seu navegador não suporta notificações push");
      return;
    }

    if (currentPermission === "denied") {
      toast.error(
        "As notificações estão bloqueadas no navegador. Libere a permissão para ativar o Web Push.",
      );
      return;
    }

    let nextPermission: NotificationPermission | "unsupported" =
      currentPermission;
    if (currentPermission !== "granted") {
      nextPermission = await desktopNotificationsService.requestPermission();
      setBrowserPermission(nextPermission);
    }

    if (nextPermission !== "granted") {
      toast.error(
        "A permissão de notificações não foi concedida. O Web Push continuará desativado.",
      );
      return;
    }

    setPreferences({ ...preferences, pushEnabled: true });
    setHasChanges(true);
  };

  const handleBrowserNotificationTest = async () => {
    if (!preferences) return;

    if (!preferences.desktopEnabled) {
      toast.error(
        "Ative as notificações na área de trabalho antes de executar o teste local.",
      );
      return;
    }

    try {
      setTestingBrowserNotification(true);

      let nextPermission = desktopNotificationsService.getPermission();
      setBrowserPermission(nextPermission);

      if (nextPermission === "unsupported") {
        toast.error(
          "Seu navegador não suporta notificações na área de trabalho",
        );
        return;
      }

      if (nextPermission === "denied") {
        toast.error(
          "As notificações estão bloqueadas no navegador. Libere a permissão para testar.",
        );
        return;
      }

      if (nextPermission !== "granted") {
        nextPermission = await desktopNotificationsService.requestPermission();
        setBrowserPermission(nextPermission);
      }

      if (nextPermission !== "granted") {
        toast.error(
          "A permissão de notificações não foi concedida. Não foi possível executar o teste local.",
        );
        return;
      }

      const timestamp = new Date().toISOString();
      const localTestNotification: Notificacao = {
        id: Date.now(),
        tipo: "novo_registro",
        titulo: "Teste local de notificação",
        descricao:
          "Se este alerta apareceu, o navegador consegue exibir notificações na área de trabalho.",
        prioridade: "baixa",
        lida: false,
        usuarioId: preferences.userId,
        link: "/configuracoes",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const shownNotification = desktopNotificationsService.show(
        localTestNotification,
      );

      if (!shownNotification) {
        toast.error("Não foi possível exibir a notificação local de teste");
        return;
      }

      toast.success("Notificação local exibida com sucesso");
    } catch (error: unknown) {
      console.error("Erro ao testar notificação local:", error);
      toast.error("Erro ao executar o teste local de notificações");
    } finally {
      setTestingBrowserNotification(false);
    }
  };

  const handleServerNotificationTest = async () => {
    if (!preferences) return;

    if (hasChanges) {
      toast.error(
        "Salve as alterações antes de executar o teste pelo servidor",
      );
      return;
    }

    if (!preferences.pushEnabled) {
      toast.error("Ative o Web Push antes de testar o envio pelo servidor.");
      return;
    }

    if (browserPermission !== "granted") {
      toast.error(
        "O navegador ainda não concedeu permissão para notificações na área de trabalho.",
      );
      return;
    }

    try {
      setSendingServerNotification(true);
      const pushSyncResult =
        await pushSubscriptionService.ensureRegisteredWithServer();

      if (pushSyncResult === "unsupported") {
        toast.error("Este navegador não oferece suporte a Web Push");
        return;
      }

      if (pushSyncResult === "permission-denied") {
        toast.error(
          "O navegador não concedeu permissão para notificações push.",
        );
        return;
      }

      if (pushSyncResult === "server-disabled") {
        toast.error(
          "O servidor está sem configuração válida de Web Push para este teste.",
        );
        return;
      }

      const response = await apiService.sendTestNotification();

      if (!response.success) {
        toast.error("O servidor não confirmou o envio da notificação de teste");
        return;
      }

      toast.success(
        "Notificação de teste enviada. O alerta deve aparecer em instantes.",
      );
    } catch (error: unknown) {
      console.error("Erro ao enviar notificação de teste:", error);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao enviar notificação de teste pelo servidor";
      toast.error(errorMessage);
    } finally {
      setSendingServerNotification(false);
    }
  };

  const getBrowserPermissionLabel = () => {
    switch (browserPermission) {
      case "granted":
        return "Permitido";
      case "denied":
        return "Bloqueado";
      case "default":
        return "Pendente";
      default:
        return "Indisponível";
    }
  };

  const getBrowserPermissionVariant = () => {
    switch (browserPermission) {
      case "granted":
        return "default" as const;
      case "unsupported":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Carregando preferências...
        </span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-muted-foreground">Erro ao carregar preferências</p>
        <Button onClick={loadPreferences} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const getServerTestHint = () => {
    if (hasChanges) {
      return "Salve as alterações atuais para liberar o teste pelo servidor.";
    }

    if (!preferences.pushEnabled) {
      return "Ative e salve o Web Push para validar o envio real em segundo plano.";
    }

    if (browserPermission !== "granted") {
      return "Conceda permissão ao navegador antes de validar o envio real pelo servidor.";
    }

    return "Esse teste dispara uma notificação real usando o backend e o Web Push.";
  };

  return (
    <div className="space-y-6">
      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDark ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tema atual:</span>
              <Badge variant={isDark ? "default" : "secondary"}>
                {isDark ? "Escuro" : "Claro"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              O tema é salvo automaticamente e aplicado em todas as páginas
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-sm font-medium">
                Modo escuro
              </Label>
              <p className="text-sm text-muted-foreground">
                Ativar tema escuro para reduzir o cansaço visual
              </p>
            </div>
            <ThemeToggle variant="switch" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <Label className="text-sm font-medium">
                Alternar tema rapidamente
              </Label>
              <p className="text-sm text-muted-foreground">
                Botão para alternar entre temas claro e escuro
              </p>
            </div>
            <ThemeToggle size="md" />
          </div>

          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Tema visual da logo NUGECID
                </Label>
                <p className="text-sm text-muted-foreground">
                  Salvo neste navegador e aplicado na sidebar em tempo real.
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Logo
              </Badge>
            </div>

            <Select
              value={logoPreference}
              onValueChange={(value) => {
                handleLogoPreferenceChange(value as NugecidLogoPreference);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tema da logo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático</SelectItem>
                <SelectItem value="saoJoao">São João</SelectItem>
                <SelectItem value="worldCup2026">Copa 2026</SelectItem>
                <SelectItem value="mothersDay">Dia das Mães</SelectItem>
                <SelectItem value="easter">Páscoa</SelectItem>
                <SelectItem value="standard">Padrão azul</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                Junho alterna São João e Copa
              </span>
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                Sidebar colapsado oculta a animação
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Canais de notificação */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              Canais de notificação
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">
                    Notificações in-app
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações dentro da aplicação
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.inAppEnabled}
                onCheckedChange={(checked) => {
                  setPreferences({ ...preferences, inAppEnabled: !!checked });
                  setHasChanges(true);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">
                      Notificações na área de trabalho
                    </Label>
                    <Badge variant={getBrowserPermissionVariant()}>
                      {getBrowserPermissionLabel()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Exibir alertas nativos do navegador enquanto a aplicação
                    estiver aberta em segundo plano
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.desktopEnabled}
                onCheckedChange={(checked) => {
                  void handleDesktopNotificationsToggle(!!checked);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Web Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Entregar notificações reais do servidor, inclusive com a aba
                    fechada
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.pushEnabled}
                onCheckedChange={(checked) => {
                  void handlePushNotificationsToggle(!!checked);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Som</Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir som nas notificações
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => {
                  setPreferences({ ...preferences, soundEnabled: !!checked });
                  setHasChanges(true);
                }}
              />
            </div>

            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h5 className="text-sm font-semibold text-foreground">
                    Testador de notificações
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    Valide primeiro o alerta local do navegador e depois o envio
                    real pelo servidor.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O teste do servidor usa o canal Web Push salvo e é o que
                    valida notificações com a aba fechada.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      void handleBrowserNotificationTest();
                    }}
                    disabled={testingBrowserNotification}
                  >
                    {testingBrowserNotification ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Testando navegador...
                      </>
                    ) : (
                      <>
                        <Monitor className="h-4 w-4" />
                        Testar no navegador
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      void handleServerNotificationTest();
                    }}
                    disabled={sendingServerNotification}
                  >
                    {sendingServerNotification ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando teste...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        Testar pelo servidor
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {getServerTestHint()}
              </p>
            </div>
          </div>

          {/* Tipos de notificação */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground">
              Tipos de notificação
            </h4>
            <p className="text-sm text-muted-foreground">
              Escolha quais tipos de eventos você deseja ser notificado
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(NOTIFICATION_TYPE_DESCRIPTIONS).map(
                ([type, { label, description }]) => (
                  <div
                    key={type}
                    className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                      preferences.enabledTypes[type]
                        ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex-1">
                      <Label className="text-sm font-medium cursor-pointer">
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {description}
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enabledTypes[type] ?? false}
                      onCheckedChange={() => handleToggleNotificationType(type)}
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
