import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Button,
} from '@/components/ui';
import {
  Shield,
  Clock,
  Key,
  UserX,
  Unlock,
  RefreshCw,
  AlertCircle,
  Save,
} from 'lucide-react';
import { IpMonitoring } from '@/components/Security/IpMonitoring';
import { apiService } from '@/services/api';
import backupService from '@/services/backupService';
import { toast } from 'sonner';

interface BlockedUser {
  id: number;
  usuario: string;
  nome: string;
  bloqueadoAte: string;
  tentativasLogin: number;
}

interface SecurityConfig {
  sessionTimeout: number;
  twoFactorAuth: boolean;
  passwordExpiry: number;
  maxLoginAttempts: number;
  requireStrongPassword: boolean;
}

export const SecuritySettings: React.FC = () => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    requireStrongPassword: true
  });
  const [originalConfig, setOriginalConfig] = useState<SecurityConfig | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState<number | null>(null);

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const response = await backupService.getSystemSettings();
      // Handle both wrapped { success, data } and unwrapped response
      const data = response?.data ?? response;
      if (data) {
        const config: SecurityConfig = {
          sessionTimeout: data.sessionTimeout ?? 30,
          twoFactorAuth: data.twoFactorAuth ?? false,
          passwordExpiry: data.passwordExpiry ?? 90,
          maxLoginAttempts: data.maxLoginAttempts ?? 5,
          requireStrongPassword: data.requireStrongPassword ?? true,
        };
        setSecurityConfig(config);
        setOriginalConfig(config);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de segurança:', error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const loadBlockedUsers = useCallback(async () => {
    setLoadingBlockedUsers(true);
    try {
      const response = await apiService.listBlockedUsers();
      if (response.success && response.data) {
        setBlockedUsers(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários bloqueados:', error);
    } finally {
      setLoadingBlockedUsers(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadBlockedUsers();
  }, [loadSettings, loadBlockedUsers]);

  const saveSettings = useCallback(async (config: SecurityConfig) => {
    setSavingSettings(true);
    try {
      await backupService.updateSystemSettings({
        sessionTimeout: config.sessionTimeout,
        twoFactorAuth: config.twoFactorAuth,
        passwordExpiry: config.passwordExpiry,
        maxLoginAttempts: config.maxLoginAttempts,
        requireStrongPassword: config.requireStrongPassword,
      });
      setOriginalConfig(config);
      toast.success('Configurações de segurança salvas');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar configurações');
    } finally {
      setSavingSettings(false);
    }
  }, []);

  // Auto-save with debounce when config changes
  const handleConfigChange = useCallback((newConfig: SecurityConfig) => {
    setSecurityConfig(newConfig);
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout to save after 1 second of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings(newConfig);
    }, 1000);
  }, [saveSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleUnblockUser = async (userId: number, userName: string) => {
    setUnblockingUserId(userId);
    try {
      const response = await apiService.unblockUser(userId);
      if (response.success) {
        toast.success(`Usuário ${userName} desbloqueado com sucesso`);
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao desbloquear usuário');
    } finally {
      setUnblockingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const hasChanges = originalConfig && JSON.stringify(securityConfig) !== JSON.stringify(originalConfig);

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status de salvamento */}
      {(savingSettings || hasChanges) && (
        <div className="flex items-center justify-end gap-2 text-sm">
          {savingSettings ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-blue-500">Salvando...</span>
            </>
          ) : hasChanges ? (
            <>
              <Save className="h-4 w-4 text-amber-500" />
              <span className="text-amber-500">Alterações pendentes</span>
            </>
          ) : null}
        </div>
      )}

      {/* Sessão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sessão
          </CardTitle>
          <CardDescription>
            Configure o tempo limite e comportamento da sessão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Tempo limite da sessão (minutos)</Label>
            <Input
              id="session-timeout"
              type="number"
              min="5"
              max="480"
              value={securityConfig.sessionTimeout}
              onChange={(e) => handleConfigChange({ 
                ...securityConfig, 
                sessionTimeout: parseInt(e.target.value) || 30 
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Autenticação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Autenticação
          </CardTitle>
          <CardDescription>
            Configure políticas de autenticação e segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Autenticação de dois fatores</Label>
              <p className="text-sm text-gray-500">Adicionar camada extra de segurança</p>
            </div>
            <Switch
              checked={securityConfig.twoFactorAuth}
              onCheckedChange={(checked) => 
                handleConfigChange({ ...securityConfig, twoFactorAuth: !!checked })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password-expiry">Expiração de senha (dias)</Label>
            <Input
              id="password-expiry"
              type="number"
              min="30"
              max="365"
              value={securityConfig.passwordExpiry}
              onChange={(e) => handleConfigChange({ 
                ...securityConfig, 
                passwordExpiry: parseInt(e.target.value) || 90 
              })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="login-attempts">Tentativas de login máximas</Label>
            <Input
              id="login-attempts"
              type="number"
              min="3"
              max="10"
              value={securityConfig.maxLoginAttempts}
              onChange={(e) => handleConfigChange({ 
                ...securityConfig, 
                maxLoginAttempts: parseInt(e.target.value) || 5 
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Senha forte obrigatória</Label>
              <p className="text-sm text-gray-500">Exigir senhas complexas</p>
            </div>
            <Switch
              checked={securityConfig.requireStrongPassword}
              onCheckedChange={(checked) => 
                handleConfigChange({ ...securityConfig, requireStrongPassword: !!checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Usuários Bloqueados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Usuários Bloqueados
              </CardTitle>
              <CardDescription>
                Gerencie usuários bloqueados por tentativas de login excessivas
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBlockedUsers}
              disabled={loadingBlockedUsers}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingBlockedUsers ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBlockedUsers ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando...</span>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mb-2 text-green-500" />
              <p className="text-sm">Nenhum usuário bloqueado no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user.nome}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.usuario}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Bloqueado até: {formatDate(user.bloqueadoAte)} • {user.tentativasLogin} tentativas
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblockUser(user.id, user.usuario)}
                    disabled={unblockingUserId === user.id}
                    className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    {unblockingUserId === user.id ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4 mr-2" />
                    )}
                    Desbloquear
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitoramento de IPs */}
      <IpMonitoring />
    </div>
  );
};
