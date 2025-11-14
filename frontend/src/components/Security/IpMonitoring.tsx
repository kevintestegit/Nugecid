import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import {
  Shield,
  Ban,
  CheckCircle,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface IpAccessStat {
  ipAddress: string;
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  lastAttempt: string;
  firstAttempt: string;
  userAgents: string[];
  isBlocked: boolean;
  blockedReason?: string;
}

interface BlockedIp {
  id: number;
  ipAddress: string;
  reason: string | null;
  blockedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  attemptsCount: number;
  lastAttemptAt: string | null;
}

export const IpMonitoring: React.FC = () => {
  const [ipStats, setIpStats] = useState<IpAccessStat[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(7);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedIp, setSelectedIp] = useState<IpAccessStat | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState<string>('24');

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, blockedResponse] = await Promise.all([
        apiService.getIpAccessStats(days, 100),
        apiService.listBlockedIps(false),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setIpStats(statsResponse.data);
      }

      if (blockedResponse.success && blockedResponse.data) {
        setBlockedIps(blockedResponse.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar estatísticas de IPs');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIp = async () => {
    if (!selectedIp) return;

    try {
      const expiresAt = blockDuration !== 'permanent'
        ? new Date(Date.now() + parseInt(blockDuration) * 60 * 60 * 1000).toISOString()
        : undefined;

      await apiService.blockIp(selectedIp.ipAddress, blockReason, expiresAt);

      toast.success(`IP ${selectedIp.ipAddress} bloqueado com sucesso`);
      setShowBlockDialog(false);
      setBlockReason('');
      setSelectedIp(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao bloquear IP:', error);
      toast.error(error.response?.data?.message || 'Erro ao bloquear IP');
    }
  };

  const handleUnblockIp = async (ipAddress: string) => {
    try {
      await apiService.unblockIp(ipAddress);
      toast.success(`IP ${ipAddress} desbloqueado com sucesso`);
      loadData();
    } catch (error: any) {
      console.error('Erro ao desbloquear IP:', error);
      toast.error(error.response?.data?.message || 'Erro ao desbloquear IP');
    }
  };

  const handleAutoBlock = async () => {
    try {
      const response = await apiService.autoBlockSuspiciousIps({
        failedAttemptsThreshold: 10,
        timeWindowMinutes: 30,
        blockDurationHours: 24,
      });

      if (response.success && response.data) {
        const count = response.data.length;
        if (count > 0) {
          toast.success(`${count} IP(s) bloqueado(s) automaticamente`);
        } else {
          toast.success('Nenhum IP suspeito detectado');
        }
        loadData();
      }
    } catch (error: any) {
      console.error('Erro no auto-bloqueio:', error);
      toast.error('Erro ao executar auto-bloqueio');
    }
  };

  const getThreatLevel = (stat: IpAccessStat): 'high' | 'medium' | 'low' => {
    const failureRate = stat.failedLogins / stat.totalAttempts;
    if (stat.failedLogins >= 5 || failureRate >= 0.5) return 'high';
    if (stat.failedLogins >= 3 || failureRate >= 0.3) return 'medium';
    return 'low';
  };

  const getThreatBadge = (level: 'high' | 'medium' | 'low') => {
    const variants = {
      high: { color: 'bg-red-100 text-red-800', label: 'Alto risco' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Risco médio' },
      low: { color: 'bg-green-100 text-green-800', label: 'Normal' },
    };

    const variant = variants[level];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Monitoramento de IPs
              </CardTitle>
              <CardDescription>
                Visualize e gerencie acessos por endereço IP
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Hoje</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={handleAutoBlock} variant="outline" size="sm">
                <Ban className="h-4 w-4 mr-2" />
                Auto-bloquear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{ipStats.length}</div>
                <div className="text-sm text-gray-500">IPs únicos</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {ipStats.filter((s) => getThreatLevel(s) === 'high').length}
                </div>
                <div className="text-sm text-gray-500">Alto risco</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{blockedIps.length}</div>
                <div className="text-sm text-gray-500">Bloqueados</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {ipStats.reduce((sum, s) => sum + s.successfulLogins, 0)}
                </div>
                <div className="text-sm text-gray-500">Logins bem-sucedidos</div>
              </div>
            </div>

            {/* Tabela de IPs */}
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endereço IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tentativas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucesso / Falha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último acesso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risco
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ipStats.slice(0, 20).map((stat) => (
                    <tr key={stat.ipAddress} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                        {stat.ipAddress}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {stat.totalAttempts}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="text-green-600 font-medium">
                          {stat.successfulLogins}
                        </span>
                        {' / '}
                        <span className="text-red-600 font-medium">
                          {stat.failedLogins}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(stat.lastAttempt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getThreatBadge(getThreatLevel(stat))}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {stat.isBlocked ? (
                          <Badge className="bg-red-100 text-red-800">
                            <Ban className="h-3 w-3 mr-1" />
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Permitido
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedIp(stat);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {stat.isBlocked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnblockIp(stat.ipAddress)}
                            >
                              <Unlock className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedIp(stat);
                                setShowBlockDialog(true);
                              }}
                            >
                              <Lock className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de bloqueio */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear endereço IP</DialogTitle>
            <DialogDescription>
              Bloqueie o acesso de <strong>{selectedIp?.ipAddress}</strong> ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do bloqueio</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo do bloqueio..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração do bloqueio</Label>
              <Select value={blockDuration} onValueChange={setBlockDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="168">7 dias</SelectItem>
                  <SelectItem value="720">30 dias</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockIp} className="bg-red-600 hover:bg-red-700">
              <Ban className="h-4 w-4 mr-2" />
              Bloquear IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes (simplificado - você pode expandir) */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do IP</DialogTitle>
            <DialogDescription>{selectedIp?.ipAddress}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Total de tentativas</Label>
                <div className="text-lg font-semibold">{selectedIp?.totalAttempts}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Taxa de falha</Label>
                <div className="text-lg font-semibold">
                  {selectedIp
                    ? ((selectedIp.failedLogins / selectedIp.totalAttempts) * 100).toFixed(1)
                    : 0}
                  %
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">User Agents</Label>
              <ul className="mt-2 space-y-1">
                {selectedIp?.userAgents.slice(0, 3).map((ua, i) => (
                  <li key={i} className="text-xs text-gray-600 truncate">
                    {ua}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
