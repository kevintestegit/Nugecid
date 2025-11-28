import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import backupService, { BackupListItem } from '@/services/backupService';
import escavadorService, { EscavadorStatus } from '@/services/escavadorService';
import { toast } from 'sonner';
import { LinearProgress, MultiStepProgress } from '@/components/ui/ProgressBar';
import { ErrorMessage, getErrorMessage } from '@/components/ui/ErrorMessage';

export const SystemSettings: React.FC = () => {
  const [systemConfig, setSystemConfig] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    logLevel: 'info',
    maintenanceMode: false,
    cacheEnabled: true
  });

  // Estados para backup
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<BackupListItem[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupListItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSteps, setRestoreSteps] = useState([
    { label: 'Preparação', description: 'Validando backup', status: 'pending' as const },
    { label: 'Banco de Dados', description: 'Restaurando dados', status: 'pending' as const },
    { label: 'Arquivos', description: 'Restaurando uploads', status: 'pending' as const },
    { label: 'Finalização', description: 'Concluindo operação', status: 'pending' as const },
  ]);
  const [confirmationText, setConfirmationText] = useState('');
  const [backupError, setBackupError] = useState<any>(null);
  const [escavadorStatus, setEscavadorStatus] = useState<EscavadorStatus | null>(null);
  const [isLoadingEscavador, setIsLoadingEscavador] = useState(false);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
    loadEscavadorStatus();
  }, []);

  // Carregar configurações do backend
  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await backupService.getSystemSettings();
      setSystemConfig({
        autoBackup: settings.autoBackup,
        backupFrequency: settings.backupFrequency,
        logLevel: settings.logLevel,
        maintenanceMode: settings.maintenanceMode,
        cacheEnabled: settings.cacheEnabled,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar configurações', {
        description: error.message,
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadEscavadorStatus = async () => {
    setIsLoadingEscavador(true);
    try {
      const status = await escavadorService.getStatus();
      setEscavadorStatus(status);
    } catch (error: any) {
      console.error('Erro ao carregar escavador:', error);
    } finally {
      setIsLoadingEscavador(false);
    }
  };

  // Salvar configurações no backend
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await backupService.updateSystemSettings(systemConfig);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar configurações', {
        description: error.message,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Carregar lista de backups ao abrir o diálogo
  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const response = await backupService.listBackups();
      
      // O backend envolve a resposta em { data: ... } através do TransformInterceptor
      const backups = (response as any).data?.backups || response?.backups || [];
      
      setAvailableBackups(backups);
    } catch (error: any) {
      console.error('Erro ao carregar backups:', error);
      toast.error('Erro ao carregar backups', {
        description: error.message,
      });
      setAvailableBackups([]);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Criar backup completo
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    setBackupError(null);

    try {
      // Simular progresso enquanto o backup está sendo criado
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      const result = await backupService.createFullBackup();

      clearInterval(progressInterval);
      setBackupProgress(100);

      if (result.success) {
        toast.success('Backup criado com sucesso!', {
          description: `Arquivo: ${result.filename} (${result.size})`,
          duration: 5000,
        });

        // Resetar progresso após 2 segundos
        setTimeout(() => {
          setBackupProgress(0);
        }, 2000);
      } else {
        throw new Error(result.error || 'Falha ao criar backup');
      }
    } catch (error: any) {
      setBackupError(error);
      const errorInfo = getErrorMessage(error);
      toast.error(errorInfo.title, {
        description: errorInfo.message,
      });
      setBackupProgress(0);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Abrir diálogo de restauração
  const handleOpenRestoreDialog = async () => {
    setShowRestoreDialog(true);
    setConfirmationText('');
    setSelectedBackup(null);
    setBackupError(null);
    // Resetar os passos da restauração
    setRestoreSteps([
      { label: 'Preparação', description: 'Validando backup', status: 'pending' },
      { label: 'Banco de Dados', description: 'Restaurando dados', status: 'pending' },
      { label: 'Arquivos', description: 'Restaurando uploads', status: 'pending' },
      { label: 'Finalização', description: 'Concluindo operação', status: 'pending' },
    ]);
    await loadBackups();
  };

  // Restaurar backup
  const handleRestoreBackup = async () => {
    if (!selectedBackup) {
      toast.error('Nenhum backup selecionado');
      return;
    }

    if (confirmationText !== 'CONFIRMAR') {
      toast.error('Digite "CONFIRMAR" para prosseguir com a restauração');
      return;
    }

    setIsRestoring(true);
    setBackupError(null);

    // Função para atualizar o status de um passo
    const updateStepStatus = (stepIndex: number, status: 'pending' | 'current' | 'completed' | 'error') => {
      setRestoreSteps(prev => prev.map((step, idx) =>
        idx === stepIndex ? { ...step, status } : step
      ));
    };

    try {
      // Passo 1: Preparação
      updateStepStatus(0, 'current');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(0, 'completed');

      // Passo 2: Banco de Dados
      updateStepStatus(1, 'current');
      const result = await backupService.restoreBackup(selectedBackup.filename);

      if (!result.success) {
        throw new Error(result.error || 'Falha ao restaurar backup');
      }

      updateStepStatus(1, 'completed');

      // Passo 3: Arquivos
      updateStepStatus(2, 'current');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus(2, 'completed');

      // Passo 4: Finalização
      updateStepStatus(3, 'current');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(3, 'completed');

      toast.success('Backup restaurado com sucesso!', {
        description: 'A aplicação será recarregada em 3 segundos...',
        duration: 3000,
      });

      // Recarregar a página após 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);

      setShowRestoreDialog(false);
    } catch (error: any) {
      // Marcar o passo atual como erro
      const currentStepIndex = restoreSteps.findIndex(step => step.status === 'current');
      if (currentStepIndex >= 0) {
        updateStepStatus(currentStepIndex, 'error');
      }

      setBackupError(error);
      const errorInfo = getErrorMessage(error);
      toast.error(errorInfo.title, {
        description: errorInfo.message,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup e Recuperação
          </CardTitle>
          <CardDescription>
            Configure backups automáticos e recuperação de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Backup automático</label>
              <p className="text-sm text-muted-foreground">Realizar backups automaticamente</p>
            </div>
            <Switch
              checked={systemConfig.autoBackup}
              onCheckedChange={(checked) => 
                setSystemConfig(prev => ({ ...prev, autoBackup: !!checked }))
              }
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="backup-frequency" className="block text-sm font-medium">Frequência do backup</label>
            <select
              id="backup-frequency"
              value={systemConfig.backupFrequency}
              onChange={(e) => setSystemConfig(prev => ({ ...prev, backupFrequency: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="hourly">A cada hora</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {/* Progress Bar para Backup */}
            {isCreatingBackup && backupProgress > 0 && (
              <div className="space-y-2">
                <LinearProgress
                  value={backupProgress}
                  label="Criando backup"
                  showLabel={true}
                  animated={backupProgress < 100}
                  variant={backupProgress === 100 ? 'success' : 'default'}
                />
              </div>
            )}

            {/* Mensagem de erro */}
            {backupError && !isCreatingBackup && (
              <ErrorMessage
                {...getErrorMessage(backupError)}
                severity="error"
                dismissible={true}
                onDismiss={() => setBackupError(null)}
              />
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
              >
                {isCreatingBackup ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isCreatingBackup ? 'Criando backup...' : 'Fazer Backup Agora'}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleOpenRestoreDialog}
                disabled={isCreatingBackup}
              >
                <Upload className="h-4 w-4" />
                Restaurar Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs e Monitoramento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Logs e Monitoramento
          </CardTitle>
          <CardDescription>
            Configure o nível de logs e monitoramento do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="log-level" className="block text-sm font-medium">Nível de log</label>
            <select
              id="log-level"
              value={systemConfig.logLevel}
              onChange={(e) => setSystemConfig(prev => ({ ...prev, logLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="error">Apenas erros</option>
              <option value="warn">Avisos e erros</option>
              <option value="info">Informações, avisos e erros</option>
              <option value="debug">Todos os logs (debug)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Cache habilitado</label>
              <p className="text-sm text-muted-foreground">Melhorar performance com cache</p>
            </div>
            <Switch
              checked={systemConfig.cacheEnabled}
              onCheckedChange={(checked) => 
                setSystemConfig(prev => ({ ...prev, cacheEnabled: !!checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manutenção
          </CardTitle>
          <CardDescription>
            Configurações de manutenção do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Modo manutenção</label>
              <p className="text-sm text-gray-500">Bloquear acesso para manutenção</p>
            </div>
            <div className="flex items-center gap-2">
              {systemConfig.maintenanceMode && (
                <Badge variant="destructive">Ativo</Badge>
              )}
              <Switch
                checked={systemConfig.maintenanceMode}
                onCheckedChange={(checked) => 
                  setSystemConfig(prev => ({ ...prev, maintenanceMode: !!checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escavador SEIRN */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Escavador SEIRN</CardTitle>
            <CardDescription>Monitora “Recebidos” no SEI e gera notificações internas.</CardDescription>
          </div>
          <Badge variant={escavadorStatus?.running ? 'success' : 'secondary'}>
            {escavadorStatus?.running ? 'Rodando' : 'Parado'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadEscavadorStatus} disabled={isLoadingEscavador}>
              {isLoadingEscavador ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar status
            </Button>
            {escavadorStatus?.lastProcess && (
              <Badge variant="outline">Último: {escavadorStatus.lastProcess}</Badge>
            )}
          </div>

          {escavadorStatus?.lastOutput && (
            <div className="text-sm text-muted-foreground">
              Última linha: <code>{escavadorStatus.lastOutput}</code>
            </div>
          )}
          <div className="text-sm text-muted-foreground space-y-1">
            <div><span className="font-semibold">Último processo conhecido:</span> {escavadorStatus?.lastProcess || '—'}</div>
            {escavadorStatus?.lastTitle && <div><span className="font-semibold">Título:</span> {escavadorStatus.lastTitle}</div>}
            {escavadorStatus?.lastLink && (
              <div>
                <span className="font-semibold">Link:</span>{' '}
                <a href={escavadorStatus.lastLink} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                  {escavadorStatus.lastLink}
                </a>
              </div>
            )}
            {escavadorStatus?.lastChangeAt && (
              <div>Última mudança: {new Date(escavadorStatus.lastChangeAt).toLocaleString()}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Restauração */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Restaurar Backup
            </DialogTitle>
            <DialogDescription>
              <span className="text-yellow-600 dark:text-yellow-500 font-medium">
                ⚠️ ATENÇÃO: Esta operação irá sobrescrever todos os dados atuais!
              </span>
              <br />
              Selecione um backup para restaurar:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {isLoadingBackups ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Carregando backups...</p>
              </div>
            ) : !availableBackups || availableBackups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum backup disponível</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableBackups.map((backup) => (
                  <div
                    key={backup.filename}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedBackup?.filename === backup.filename
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedBackup(backup)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          <span className="font-medium text-sm">{backup.filename}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          <p>Criado: {new Date(backup.created).toLocaleString('pt-BR')}</p>
                          <p>Tamanho: {backup.size}</p>
                          <Badge 
                            variant={backup.type === 'full' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {backup.type === 'full' ? 'Completo' : 'Desarquivamentos'}
                          </Badge>
                        </div>
                      </div>
                      {selectedBackup?.filename === backup.filename && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedBackup && !isRestoring && (
            <div className="space-y-2 pt-4 border-t border-border">
              <label htmlFor="confirmation" className="block text-sm font-medium text-foreground">
                Para confirmar, digite <span className="font-bold text-destructive">CONFIRMAR</span> no campo abaixo:
              </label>
              <input
                id="confirmation"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Digite CONFIRMAR"
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:ring-2 focus:ring-destructive focus:border-destructive"
                disabled={isRestoring}
              />
            </div>
          )}

          {/* Multi-Step Progress para Restauração */}
          {isRestoring && (
            <div className="pt-4 border-t border-border">
              <MultiStepProgress steps={restoreSteps} />
            </div>
          )}

          {/* Mensagem de erro na restauração */}
          {backupError && isRestoring && (
            <div className="pt-4 border-t border-border">
              <ErrorMessage
                {...getErrorMessage(backupError)}
                severity="error"
                dismissible={false}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={isRestoring}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestoreBackup}
              disabled={!selectedBackup || isRestoring || confirmationText !== 'CONFIRMAR'}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Restaurando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
