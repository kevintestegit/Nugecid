import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Badge,
  Button
} from '@/components/ui';
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Smartphone,
  Volume2,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface NotificationPreferences {
  id: number;
  userId: number;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  enabledTypes: Record<string, boolean>;
  pushSubscription: any | null;
}

const notificationTypeLabels: Record<string, { label: string; description: string }> = {
  solicitacao_pendente: {
    label: 'Solicitações Pendentes',
    description: 'Notificações de solicitações aguardando ação'
  },
  novo_processo: {
    label: 'Novos Processos',
    description: 'Novos processos de desarquivamento'
  },
  novo_desarquivamento: {
    label: 'Novos Desarquivamentos',
    description: 'Novos desarquivamentos registrados'
  },
  mencao: {
    label: 'Menções',
    description: 'Quando alguém menciona você'
  },
  tarefa_atribuida: {
    label: 'Tarefas Atribuídas',
    description: 'Quando uma tarefa é atribuída a você'
  },
  tarefa_alterada: {
    label: 'Tarefas Alteradas',
    description: 'Quando uma tarefa é modificada'
  },
  tarefa_comentada: {
    label: 'Comentários em Tarefas',
    description: 'Novos comentários em tarefas'
  },
  prazo_proximo: {
    label: 'Prazos Próximos',
    description: 'Alertas de prazos se aproximando'
  },
  tarefa_atrasada: {
    label: 'Tarefas Atrasadas',
    description: 'Tarefas que passaram do prazo'
  },
  projeto_atualizado: {
    label: 'Projetos Atualizados',
    description: 'Atualizações em projetos'
  },
  novo_registro: {
    label: 'Novos Registros',
    description: 'Novos registros no sistema'
  },
  pasta_criada: {
    label: 'Pastas Criadas',
    description: 'Novas pastas de arquivos'
  },
  evento_auditoria: {
    label: 'Eventos de Auditoria',
    description: 'Eventos de auditoria do sistema (apenas admins)'
  },
};

export const GeneralSettings: React.FC = () => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
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
    } catch (error: any) {
      console.error('Erro ao carregar preferências:', error);
      toast.error('Erro ao carregar preferências de notificação');
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
        pushEnabled: preferences.pushEnabled,
        soundEnabled: preferences.soundEnabled,
        enabledTypes: preferences.enabledTypes,
      });

      if (response.success) {
        toast.success('Preferências salvas com sucesso!');
        setHasChanges(false);
        await loadPreferences();
      }
    } catch (error: any) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Notificações push não são suportadas neste navegador');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      toast.error('Service Workers não são suportados neste navegador');
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        setPreferences(prev => prev ? { ...prev, pushEnabled: true } : null);
        setHasChanges(true);
        toast.success('Notificações push habilitadas!');
      } else if (permission === 'denied') {
        toast.error('Permissão para notificações push foi negada');
      } else {
        toast.warning('Permissão para notificações push foi ignorada');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao habilitar notificações push');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando preferências...</span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600">Erro ao carregar preferências</p>
        <Button onClick={loadPreferences} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
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
              <Badge variant={isDark ? 'default' : 'secondary'}>
                {isDark ? 'Escuro' : 'Claro'}
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
            <h4 className="text-sm font-semibold text-foreground">Canais de notificação</h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Notificações in-app</Label>
                  <p className="text-sm text-muted-foreground">Notificações dentro da aplicação</p>
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
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Push (Navegador)</Label>
                  <p className="text-sm text-muted-foreground">Notificações push do navegador</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {preferences.pushEnabled && (
                  <Badge variant="outline" className="text-xs">Habilitado</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnablePushNotifications}
                  disabled={preferences.pushEnabled}
                >
                  {preferences.pushEnabled ? 'Habilitado' : 'Habilitar'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Som</Label>
                  <p className="text-sm text-muted-foreground">Reproduzir som nas notificações</p>
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
          </div>

          {/* Tipos de notificação */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground">Tipos de notificação</h4>
            <p className="text-sm text-muted-foreground">
              Escolha quais tipos de eventos você deseja ser notificado
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(notificationTypeLabels).map(([type, { label, description }]) => (
                <div
                  key={type}
                  className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                    preferences.enabledTypes[type]
                      ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
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
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
