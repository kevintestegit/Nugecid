import React, { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui";
import {
  Shield,
  Ban,
  CheckCircle,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  User,
} from "lucide-react";
import { apiService } from "@/services/api";
import axios from "axios";
import { toast } from "sonner";
import type { IpAccessStat, BlockedIp } from "@/types";

export const IpMonitoring: React.FC = () => {
  const [ipStats, setIpStats] = useState<IpAccessStat[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(7);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedIp, setSelectedIp] = useState<IpAccessStat | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState<string>("24");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = useCallback(async () => {
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
    } catch (error: unknown) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar estatísticas de IPs");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBlockIp = async () => {
    if (!selectedIp) return;

    try {
      const expiresAt =
        blockDuration !== "permanent"
          ? new Date(
              Date.now() + parseInt(blockDuration) * 60 * 60 * 1000,
            ).toISOString()
          : undefined;

      await apiService.blockIp(selectedIp.ipAddress, blockReason, expiresAt);

      toast.success(`IP ${selectedIp.ipAddress} bloqueado com sucesso`);
      setShowBlockDialog(false);
      setBlockReason("");
      setSelectedIp(null);
      loadData();
    } catch (error: unknown) {
      console.error("Erro ao bloquear IP:", error);
      const message = axios.isAxiosError(error)
        ? (((error.response?.data as Record<string, unknown>)
            ?.message as string) ?? "Erro ao bloquear IP")
        : "Erro ao bloquear IP";
      toast.error(message);
    }
  };

  const handleUnblockIp = async (ipAddress: string) => {
    try {
      await apiService.unblockIp(ipAddress);
      toast.success(`IP ${ipAddress} desbloqueado com sucesso`);
      loadData();
    } catch (error: unknown) {
      console.error("Erro ao desbloquear IP:", error);
      const message = axios.isAxiosError(error)
        ? (((error.response?.data as Record<string, unknown>)
            ?.message as string) ?? "Erro ao desbloquear IP")
        : "Erro ao desbloquear IP";
      toast.error(message);
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
          toast.success("Nenhum IP suspeito detectado");
        }
        loadData();
      }
    } catch (error: unknown) {
      console.error("Erro no auto-bloqueio:", error);
      toast.error("Erro ao executar auto-bloqueio");
    }
  };

  const handleSortByLastAccess = () => {
    setSortOrder((prevOrder) => (prevOrder === "desc" ? "asc" : "desc"));
  };

  const sortedIpStats = React.useMemo(() => {
    const sorted = [...ipStats].sort((a, b) => {
      const dateA = new Date(a.lastAttempt).getTime();
      const dateB = new Date(b.lastAttempt).getTime();

      if (sortOrder === "desc") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return sorted;
  }, [ipStats, sortOrder]);

  const getThreatLevel = (stat: IpAccessStat): "high" | "medium" | "low" => {
    const failureRate = stat.failedLogins / stat.totalAttempts;
    if (stat.failedLogins >= 5 || failureRate >= 0.5) return "high";
    if (stat.failedLogins >= 3 || failureRate >= 0.3) return "medium";
    return "low";
  };

  const getThreatBadge = (level: "high" | "medium" | "low") => {
    const variants = {
      high: {
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        label: "Alto risco",
      },
      medium: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        label: "Risco médio",
      },
      low: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        label: "Normal",
      },
    };

    const variant = variants[level];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando...</span>
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
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={days.toString()}
                onValueChange={(v) => setDays(parseInt(v))}
              >
                <SelectTrigger className="w-32 border-border/80 bg-background/70 text-foreground">
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
            <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-lg border border-border/70 bg-card/60 p-4">
                <div className="text-2xl font-bold text-foreground">
                  {ipStats.length}
                </div>
                <div className="text-sm text-muted-foreground">IPs únicos</div>
              </div>
              <div className="rounded-lg border border-purple-200/70 bg-purple-50/70 p-4 dark:border-purple-500/25 dark:bg-purple-950/30">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                  {
                    new Set(
                      ipStats.flatMap((s) => (s.users || []).map((u) => u.id)),
                    ).size
                  }
                </div>
                <div className="text-sm text-purple-700/90 dark:text-purple-200/80">
                  Usuários únicos
                </div>
              </div>
              <div className="rounded-lg border border-red-200/70 bg-red-50/70 p-4 dark:border-red-500/25 dark:bg-red-950/30">
                <div className="text-2xl font-bold text-red-600 dark:text-red-300">
                  {ipStats.filter((s) => getThreatLevel(s) === "high").length}
                </div>
                <div className="text-sm text-red-700/90 dark:text-red-200/80">
                  Alto risco
                </div>
              </div>
              <div className="rounded-lg border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-500/25 dark:bg-blue-950/30">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {blockedIps.length}
                </div>
                <div className="text-sm text-blue-700/90 dark:text-blue-200/80">
                  Bloqueados
                </div>
              </div>
              <div className="rounded-lg border border-green-200/70 bg-green-50/70 p-4 dark:border-green-500/25 dark:bg-green-950/30">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {ipStats.reduce((sum, s) => sum + s.successfulLogins, 0)}
                </div>
                <div className="text-sm text-green-700/90 dark:text-green-200/80">
                  Logins bem-sucedidos
                </div>
              </div>
            </div>

            {/* Tabela de IPs */}
            <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/50">
              <table className="min-w-full divide-y divide-border/60">
                <thead className="bg-muted/35">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Endereço IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Usuários
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tentativas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Sucesso / Falha
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/60"
                      onClick={handleSortByLastAccess}
                    >
                      <div className="flex items-center gap-2">
                        Último acesso
                        {sortOrder === "desc" ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Risco
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card/35">
                  {sortedIpStats.slice(0, 20).map((stat) => (
                    <tr
                      key={stat.ipAddress}
                      className="transition-colors hover:bg-muted/35"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-foreground">
                        {stat.ipAddress}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {stat.users && stat.users.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {stat.users.slice(0, 2).map((u) => (
                              <span
                                key={u.id}
                                className="inline-flex items-center gap-1 text-xs text-foreground"
                                title={`${u.nome} (@${u.usuario}) — ${u.successfulLogins} ok / ${u.failedLogins} falha`}
                              >
                                <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="max-w-[120px] truncate">
                                  {u.nome}
                                </span>
                              </span>
                            ))}
                            {stat.users.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{stat.users.length - 2} mais
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                        {stat.totalAttempts}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="text-green-600 font-medium">
                          {stat.successfulLogins}
                        </span>
                        {" / "}
                        <span className="text-red-600 font-medium">
                          {stat.failedLogins}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {new Date(stat.lastAttempt).toLocaleString("pt-BR")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {getThreatBadge(getThreatLevel(stat))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {stat.isBlocked ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <Ban className="h-3 w-3 mr-1" />
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Permitido
                          </Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
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
              Bloqueie o acesso de <strong>{selectedIp?.ipAddress}</strong> ao
              sistema
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
            <Button
              onClick={handleBlockIp}
              className="bg-red-600 hover:bg-red-700"
            >
              <Ban className="h-4 w-4 mr-2" />
              Bloquear IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg border-border/60 bg-card/95 backdrop-blur sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Eye className="h-5 w-5 text-primary" />
              Detalhes do IP
            </DialogTitle>
            <DialogDescription className="font-mono text-sm">
              {selectedIp?.ipAddress}
            </DialogDescription>
            {selectedIp && (
              <div className="mt-1">
                {selectedIp.isBlocked ? (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <Ban className="h-3 w-3 mr-1" />
                    Bloqueado
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Permitido
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>

          {selectedIp && (
            <div className="min-w-0 space-y-4 overflow-x-hidden py-2">
              {/* Threat level banner */}
              {(() => {
                const level = getThreatLevel(selectedIp);
                const config = {
                  high: {
                    bg: "border-red-200/70 bg-red-50/70 dark:border-red-500/25 dark:bg-red-950/30",
                    icon: (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    ),
                    text: "text-red-700 dark:text-red-300",
                    label: "Alto Risco",
                    desc: "Este IP apresenta comportamento suspeito com alta taxa de falhas.",
                  },
                  medium: {
                    bg: "border-yellow-200/70 bg-yellow-50/70 dark:border-yellow-500/25 dark:bg-yellow-950/30",
                    icon: (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                    ),
                    text: "text-yellow-700 dark:text-yellow-300",
                    label: "Risco Médio",
                    desc: "Este IP apresenta algumas tentativas de acesso falhadas.",
                  },
                  low: {
                    bg: "border-green-200/70 bg-green-50/70 dark:border-green-500/25 dark:bg-green-950/30",
                    icon: (
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    ),
                    text: "text-green-700 dark:text-green-300",
                    label: "Normal",
                    desc: "Este IP não apresenta comportamento suspeito.",
                  },
                };
                const c = config[level];
                return (
                  <div
                    className={`flex items-start gap-3 rounded-lg border p-3 ${c.bg}`}
                  >
                    {c.icon}
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${c.text}`}>
                        {c.label}
                      </p>
                      <p className={`text-xs ${c.text} opacity-80`}>{c.desc}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/60 bg-muted/50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Total de tentativas
                  </div>
                  <div className="mt-1 text-xl font-bold text-foreground">
                    {selectedIp.totalAttempts}
                  </div>
                </div>
                <div className="rounded-lg border border-green-200/70 bg-green-50/50 p-3 dark:border-green-500/20 dark:bg-green-950/20">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700/80 dark:text-green-300/80">
                    Logins com sucesso
                  </div>
                  <div className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                    {selectedIp.successfulLogins}
                  </div>
                </div>
                <div className="rounded-lg border border-red-200/70 bg-red-50/50 p-3 dark:border-red-500/20 dark:bg-red-950/20">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700/80 dark:text-red-300/80">
                    Logins falhados
                  </div>
                  <div className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                    {selectedIp.failedLogins}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Taxa de falha
                  </div>
                  <div className="mt-1 text-xl font-bold text-foreground">
                    {(
                      (selectedIp.failedLogins / selectedIp.totalAttempts) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/60 bg-muted/50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Primeiro acesso
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {new Date(selectedIp.firstAttempt).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/50 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Último acesso
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {new Date(selectedIp.lastAttempt).toLocaleString("pt-BR")}
                  </div>
                </div>
              </div>

              {/* Blocked reason (if blocked) */}
              {selectedIp.isBlocked && selectedIp.blockedReason && (
                <div className="rounded-lg border border-red-200/70 bg-red-50/50 p-3 dark:border-red-500/20 dark:bg-red-950/20">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700/80 dark:text-red-300/80">
                    Motivo do bloqueio
                  </div>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {selectedIp.blockedReason}
                  </div>
                </div>
              )}

              {/* Usuários associados */}
              {selectedIp.users && selectedIp.users.length > 0 && (
                <div className="min-w-0 rounded-lg border border-border/60 bg-muted/50 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Usuários associados ({selectedIp.users.length})
                  </div>
                  <div className="space-y-2">
                    {selectedIp.users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 rounded border border-border/40 bg-background/60 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="truncate text-sm font-medium text-foreground">
                              {u.nome}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            @{u.usuario}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs">
                          <span
                            className="text-green-600 dark:text-green-400"
                            title="Logins com sucesso"
                          >
                            {u.successfulLogins} ok
                          </span>
                          <span
                            className="text-red-600 dark:text-red-400"
                            title="Logins falhados"
                          >
                            {u.failedLogins} falha
                          </span>
                          <span
                            className="text-muted-foreground"
                            title="Último acesso"
                          >
                            {new Date(u.lastAttempt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Agents */}
              {selectedIp.userAgents.length > 0 && (
                <div className="min-w-0 rounded-lg border border-border/60 bg-muted/50 p-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    User Agents ({selectedIp.userAgents.length})
                  </div>
                  <ul className="min-w-0 space-y-1.5">
                    {selectedIp.userAgents.map((ua, i) => (
                      <li
                        key={i}
                        className="min-w-0 overflow-hidden truncate rounded border border-border/40 bg-background/60 px-2 py-1 font-mono text-xs text-muted-foreground"
                        title={ua}
                      >
                        {ua}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedIp && !selectedIp.isBlocked && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setShowBlockDialog(true);
                }}
              >
                <Lock className="h-4 w-4 mr-2" />
                Bloquear IP
              </Button>
            )}
            {selectedIp && selectedIp.isBlocked && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-500/30 dark:text-green-400 dark:hover:bg-green-950/30"
                onClick={() => {
                  handleUnblockIp(selectedIp.ipAddress);
                  setShowDetailsDialog(false);
                }}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Desbloquear IP
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
