import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
} from '@/components/ui';
import {
  Shield,
  Clock,
  Key,
} from 'lucide-react';
import { IpMonitoring } from '@/components/Security/IpMonitoring';

export const SecuritySettings: React.FC = () => {
  const [securityConfig, setSecurityConfig] = useState({
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordExpiry: 90,
    loginAttempts: 5,
    requireStrongPassword: true
  });

  return (
    <div className="space-y-6">
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
              onChange={(e) => setSecurityConfig(prev => ({ 
                ...prev, 
                sessionTimeout: parseInt(e.target.value) || 30 
              }))}
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
                setSecurityConfig(prev => ({ ...prev, twoFactorAuth: !!checked }))
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
              onChange={(e) => setSecurityConfig(prev => ({ 
                ...prev, 
                passwordExpiry: parseInt(e.target.value) || 90 
              }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="login-attempts">Tentativas de login</Label>
            <Input
              id="login-attempts"
              type="number"
              min="3"
              max="10"
              value={securityConfig.loginAttempts}
              onChange={(e) => setSecurityConfig(prev => ({ 
                ...prev, 
                loginAttempts: parseInt(e.target.value) || 5 
              }))}
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
                setSecurityConfig(prev => ({ ...prev, requireStrongPassword: !!checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Monitoramento de IPs */}
      <IpMonitoring />
    </div>
  );
};
