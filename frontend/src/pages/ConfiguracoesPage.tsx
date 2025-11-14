import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import {
  Settings,
  User,
  Shield,
  Database,
  Save,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';

import { GeneralSettings } from './Configuracoes/GeneralSettings';
import { SystemSettings } from './Configuracoes/SystemSettings';
import { SecuritySettings } from './Configuracoes/SecuritySettings';
import { UserSettings } from './Configuracoes/UserSettings';
import { AnnouncementsSettings } from './Configuracoes/AnnouncementsSettings';

type TabType = 'geral' | 'sistema' | 'seguranca' | 'usuario' | 'avisos';

const ConfiguracoesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role?.name === 'admin';
  const isCoordenador = user?.role?.name === 'coordenador' || isAdmin;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'geral' as TabType, label: 'Geral', icon: Settings, available: true },
    { id: 'sistema' as TabType, label: 'Sistema', icon: Database, available: isAdmin },
    { id: 'avisos' as TabType, label: 'Avisos', icon: Megaphone, available: isAdmin },
    { id: 'seguranca' as TabType, label: 'Segurança', icon: Shield, available: isCoordenador },
    { id: 'usuario' as TabType, label: 'Usuário', icon: User, available: true }
  ].filter(tab => tab.available);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">
          Gerencie as configurações do sistema e suas preferências pessoais
        </p>
      </div>

      {/* Navegação por abas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        {activeTab === 'geral' && <GeneralSettings />}
        {activeTab === 'sistema' && isAdmin && <SystemSettings />}
        {activeTab === 'avisos' && isAdmin && <AnnouncementsSettings />}
        {activeTab === 'seguranca' && isCoordenador && <SecuritySettings />}
        {activeTab === 'usuario' && <UserSettings />}
      </div>

      {/* Botão de salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
