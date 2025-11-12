import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Switch,
  Badge
} from '@/components/ui';
import {
  User,
  Lock,
  Settings,
  Eye,
  EyeOff,
  Upload,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { UserSettings as UserSettingsType } from '@/types';

export const UserSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const derivePreferences = useCallback((settings?: UserSettingsType | null) => ({
    showEmail: settings?.showEmail ?? true,
    showPhone: settings?.showPhone ?? false,
    autoSave: settings?.autoSave ?? true,
    compactView: settings?.compactView ?? false,
    itemsPerPage: settings?.itemsPerPage ?? 10,
  }), []);

  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [userConfig, setUserConfig] = useState(() => derivePreferences(user?.settings));

  const baselinePreferences = useMemo(
    () => derivePreferences(user?.settings),
    [derivePreferences, user?.settings],
  );

  useEffect(() => {
    setUserConfig(baselinePreferences);
  }, [baselinePreferences]);

  const preferencesChanged = useMemo(
    () => JSON.stringify(userConfig) !== JSON.stringify(baselinePreferences),
    [userConfig, baselinePreferences],
  );
  
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const userInitial = user?.nome?.charAt(0)?.toUpperCase() ?? user?.usuario?.charAt(0)?.toUpperCase() ?? '?';
  
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(user?.avatarUrl ?? undefined);
    }
  }, [user?.avatarUrl, avatarFile]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem valido');
      event.target.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('A imagem deve ter no maximo 2 MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined;
      setAvatarPreview(result);
      setAvatarFile(file);
    };
    reader.onerror = () => {
      toast.error('Nao foi possível carregar a imagem selecionada');
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarSave = async () => {
    if (!user) {
      return;
    }
    if (!avatarFile) {
      toast.error('Selecione uma imagem antes de salvar');
      return;
    }

    setIsSavingAvatar(true);
    try {
      const response = await apiService.uploadMyAvatar(avatarFile);
      if (!response.success || !response.data?.avatarUrl) {
        throw new Error(response.message || 'Erro ao atualizar avatar');
      }

      // Buscar dados atualizados do usuário do backend
      const userResponse = await apiService.getCurrentUser();
      if (userResponse.success && userResponse.data) {
        updateUser(userResponse.data);
        setAvatarPreview(userResponse.data.avatarUrl ?? undefined);
      } else {
        // Fallback: atualizar apenas localmente
        const nextUser = {
          ...user,
          avatarUrl: response.data.avatarUrl,
        };
        updateUser(nextUser);
        setAvatarPreview(response.data.avatarUrl);
      }

      setAvatarFile(null);
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar a foto de perfil', error);
      toast.error('Erro ao atualizar a foto de perfil');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (avatarFile) {
      setAvatarFile(null);
      setAvatarPreview(user?.avatarUrl);
      return;
    }

    if (!user || !user.avatarUrl) {
      return;
    }

    setIsSavingAvatar(true);
    try {
      const response = await apiService.deleteMyAvatar();
      if (!response.success) {
        throw new Error(response.message || 'Erro ao remover avatar');
      }

      // Buscar dados atualizados do usuário do backend
      const userResponse = await apiService.getCurrentUser();
      if (userResponse.success && userResponse.data) {
        updateUser(userResponse.data);
        setAvatarPreview(userResponse.data.avatarUrl ?? undefined);
      } else {
        // Fallback: atualizar apenas localmente
        updateUser({ ...user, avatarUrl: null });
        setAvatarPreview(undefined);
      }

      toast.success('Foto de perfil removida');
    } catch (error) {
      console.error('Erro ao remover foto de perfil', error);
      toast.error('Erro ao remover a foto de perfil');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handlePreferencesSave = async () => {
    if (!user) {
      return;
    }

    setIsSavingPreferences(true);
    try {
      const response = await apiService.updateMySettings({
        showEmail: userConfig.showEmail,
        showPhone: userConfig.showPhone,
        autoSave: userConfig.autoSave,
        compactView: userConfig.compactView,
        itemsPerPage: userConfig.itemsPerPage,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Erro ao atualizar preferências');
      }

      const updatedSettings: UserSettingsType = {
        ...(user.settings || {}),
        ...response.data,
      };

      updateUser({
        ...user,
        settings: updatedSettings,
      });

      setUserConfig(derivePreferences(updatedSettings));
      toast.success('Preferências atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar preferências', error);
      toast.error('Erro ao atualizar preferências');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      // Simular alteração de senha
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>
            Informações pessoais e configurações do perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user?.nome ?? 'Foto do usuario'}
                  className="h-20 w-20 rounded-full object-cover border border-border/60 shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                  {userInitial}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">Foto do usuá
                  rio</p>
                <p className="text-xs text-muted-foreground">PNG ou JPG até 2 MB.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                id="user-avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <Button
                type="button"
                variant="outline"
                onClick={openFilePicker}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Selecionar
              </Button>
              <Button
                type="button"
                onClick={handleAvatarSave}
                disabled={!avatarFile || isSavingAvatar}
                className="gap-2"
              >
                {isSavingAvatar ? 'Salvando...' : 'Salvar foto'}
              </Button>
              {(avatarPreview || user?.avatarUrl) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleAvatarRemove}
                  className="gap-2"
                  disabled={isSavingAvatar}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nome completo</Label>
              <Input
                id="user-name"
                value={user?.nome || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-username">Usuário</Label>
              <Input
                id="user-username"
                value={user?.usuario || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="user-role">Perfil</Label>
            <div className="flex items-center gap-2">
              <Badge 
                variant={user?.role?.name === 'admin' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {user?.role?.name === 'admin' ? 'Administrador' : 
                 user?.role?.name === 'coordenador' ? 'Coordenador' : 'Usuário'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
            />
          </div>
          
          <Button 
            onClick={handlePasswordChange}
            disabled={!newPassword || !confirmPassword || isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferências
          </CardTitle>
          <CardDescription>
            Configure suas preferências de uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Exibir e-mail</Label>
              <p className="text-sm text-gray-500">Mostrar seu e-mail para outros usuários autorizados</p>
            </div>
            <Switch
              checked={userConfig.showEmail}
              onCheckedChange={(checked) =>
                setUserConfig(prev => ({ ...prev, showEmail: !!checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Exibir telefone</Label>
              <p className="text-sm text-gray-500">Compartilhar telefone em perfis e detalhes de tarefas</p>
            </div>
            <Switch
              checked={userConfig.showPhone}
              onCheckedChange={(checked) =>
                setUserConfig(prev => ({ ...prev, showPhone: !!checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Salvamento automático</Label>
              <p className="text-sm text-gray-500">Salvar alterações automaticamente</p>
            </div>
            <Switch
              checked={userConfig.autoSave}
              onCheckedChange={(checked) => 
                setUserConfig(prev => ({ ...prev, autoSave: !!checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Visualização compacta</Label>
              <p className="text-sm text-gray-500">Usar menos espaço nas listas</p>
            </div>
            <Switch
              checked={userConfig.compactView}
              onCheckedChange={(checked) => 
                setUserConfig(prev => ({ ...prev, compactView: !!checked }))
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="items-per-page">Itens por página</Label>
            <select
              id="items-per-page"
              value={userConfig.itemsPerPage}
              onChange={(e) => setUserConfig(prev => ({ 
                ...prev, 
                itemsPerPage: parseInt(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5 itens</option>
              <option value={10}>10 itens</option>
              <option value={25}>25 itens</option>
              <option value={50}>50 itens</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handlePreferencesSave}
              disabled={!preferencesChanged || isSavingPreferences}
              className="w-full md:w-auto"
            >
              {isSavingPreferences ? 'Salvando...' : 'Salvar preferências'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
