import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";

import { BlockedIp } from "./entities/blocked-ip.entity";
import { Auditoria, AuditAction } from "../audit/entities/auditoria.entity";
import { User } from "../users/entities/user.entity";

export interface IpAccessStats {
  ipAddress: string;
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  lastAttempt: Date;
  firstAttempt: Date;
  userAgents: string[];
  isBlocked: boolean;
  blockedReason?: string;
}

export interface BlockIpDto {
  ipAddress: string;
  reason?: string;
  expiresAt?: Date;
  blockedBy: number;
}

export interface BlockedUserInfo {
  id: number;
  usuario: string;
  nome: string;
  bloqueadoAte: Date;
  tentativasLogin: number;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectRepository(BlockedIp)
    private readonly blockedIpRepository: Repository<BlockedIp>,
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Verifica se um IP está bloqueado
   */
  async isIpBlocked(ipAddress: string): Promise<boolean> {
    const blockedIp = await this.blockedIpRepository.findOne({
      where: { ipAddress, isActive: true },
    });

    if (!blockedIp) return false;

    // Verifica se expirou
    if (blockedIp.isExpired()) {
      // Desativa bloqueio expirado
      blockedIp.isActive = false;
      await this.blockedIpRepository.save(blockedIp);
      return false;
    }

    // Incrementa contador de tentativas
    blockedIp.attemptsCount += 1;
    blockedIp.lastAttemptAt = new Date();
    await this.blockedIpRepository.save(blockedIp);

    return true;
  }

  /**
   * Bloqueia um IP
   */
  async blockIp(dto: BlockIpDto): Promise<BlockedIp> {
    // Verifica se já está bloqueado
    const existing = await this.blockedIpRepository.findOne({
      where: { ipAddress: dto.ipAddress },
    });

    if (existing && existing.isActive) {
      throw new BadRequestException(`IP ${dto.ipAddress} já está bloqueado`);
    }

    let blocked: BlockedIp;

    if (existing) {
      // Reativa bloqueio existente
      existing.isActive = true;
      existing.reason = dto.reason || existing.reason;
      existing.blockedBy = dto.blockedBy;
      existing.blockedAt = new Date();
      existing.expiresAt = dto.expiresAt || null;
      existing.attemptsCount = 0;
      existing.lastAttemptAt = null;
      blocked = await this.blockedIpRepository.save(existing);
    } else {
      // Cria novo bloqueio
      blocked = this.blockedIpRepository.create({
        ipAddress: dto.ipAddress,
        reason: dto.reason,
        blockedBy: dto.blockedBy,
        blockedAt: new Date(),
        expiresAt: dto.expiresAt || null,
        isActive: true,
      });
      blocked = await this.blockedIpRepository.save(blocked);
    }

    this.logger.warn(
      `IP ${dto.ipAddress} bloqueado por usuário ${dto.blockedBy}. Razão: ${dto.reason || "Não especificada"}`,
    );

    return blocked;
  }

  /**
   * Desbloqueia um IP
   */
  async unblockIp(ipAddress: string): Promise<BlockedIp> {
    const blocked = await this.blockedIpRepository.findOne({
      where: { ipAddress },
    });

    if (!blocked) {
      throw new NotFoundException(`IP ${ipAddress} não está bloqueado`);
    }

    blocked.isActive = false;
    const updated = await this.blockedIpRepository.save(blocked);

    this.logger.log(`IP ${ipAddress} desbloqueado`);

    return updated;
  }

  /**
   * Lista todos os IPs bloqueados
   */
  async listBlockedIps(includeInactive: boolean = false): Promise<BlockedIp[]> {
    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.blockedIpRepository.find({
      where,
      relations: ["blockedByUser"],
      order: { blockedAt: "DESC" },
    });
  }

  /**
   * Obtém estatísticas de acesso por IP
   */
  async getIpAccessStats(
    days: number = 7,
    limit: number = 100,
  ): Promise<IpAccessStats[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Busca todos os acessos desde a data especificada
    const audits = await this.auditoriaRepository.find({
      where: {
        action: AuditAction.LOGIN,
        timestamp: MoreThan(since),
      },
      order: { timestamp: "DESC" },
    });

    // Busca IPs bloqueados
    const blockedIps = await this.listBlockedIps(false);
    const blockedIpsMap = new Map(
      blockedIps.map((b) => [b.ipAddress, b.reason || "Não especificado"]),
    );

    // Agrupa por IP
    const ipMap = new Map<string, IpAccessStats>();

    for (const audit of audits) {
      if (!audit.ipAddress) continue;

      if (!ipMap.has(audit.ipAddress)) {
        ipMap.set(audit.ipAddress, {
          ipAddress: audit.ipAddress,
          totalAttempts: 0,
          successfulLogins: 0,
          failedLogins: 0,
          lastAttempt: audit.timestamp,
          firstAttempt: audit.timestamp,
          userAgents: [],
          isBlocked: blockedIpsMap.has(audit.ipAddress),
          blockedReason: blockedIpsMap.get(audit.ipAddress),
        });
      }

      const stats = ipMap.get(audit.ipAddress)!;
      stats.totalAttempts++;

      if (audit.success) {
        stats.successfulLogins++;
      } else {
        stats.failedLogins++;
      }

      if (audit.timestamp > stats.lastAttempt) {
        stats.lastAttempt = audit.timestamp;
      }

      if (audit.timestamp < stats.firstAttempt) {
        stats.firstAttempt = audit.timestamp;
      }

      if (audit.userAgent && !stats.userAgents.includes(audit.userAgent)) {
        stats.userAgents.push(audit.userAgent);
      }
    }

    // Converte para array e ordena por total de tentativas
    const result = Array.from(ipMap.values())
      .sort((a, b) => b.totalAttempts - a.totalAttempts)
      .slice(0, limit);

    return result;
  }

  /**
   * Obtém detalhes de acessos de um IP específico
   */
  async getIpAccessDetails(
    ipAddress: string,
    days: number = 30,
  ): Promise<Auditoria[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.auditoriaRepository.find({
      where: {
        ipAddress,
        action: AuditAction.LOGIN,
        timestamp: MoreThan(since),
      },
      relations: ["user"],
      order: { timestamp: "DESC" },
    });
  }

  /**
   * Auto-bloqueia IPs com muitas tentativas falhadas
   */
  async autoBlockSuspiciousIps(
    failedAttemptsThreshold: number = 10,
    timeWindowMinutes: number = 30,
    blockDurationHours: number = 24,
  ): Promise<BlockedIp[]> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - timeWindowMinutes);

    const failedLogins = await this.auditoriaRepository.find({
      where: {
        action: AuditAction.LOGIN,
        success: false,
        timestamp: MoreThan(since),
      },
    });

    // Agrupa por IP
    const ipFailuresMap = new Map<string, number>();

    for (const audit of failedLogins) {
      if (!audit.ipAddress) continue;
      ipFailuresMap.set(
        audit.ipAddress,
        (ipFailuresMap.get(audit.ipAddress) || 0) + 1,
      );
    }

    // Bloqueia IPs suspeitos
    const blockedIps: BlockedIp[] = [];

    for (const [ipAddress, failures] of ipFailuresMap.entries()) {
      if (failures >= failedAttemptsThreshold) {
        // Verifica se já está bloqueado
        const alreadyBlocked = await this.isIpBlocked(ipAddress);
        if (alreadyBlocked) continue;

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + blockDurationHours);

        try {
          const blocked = await this.blockIp({
            ipAddress,
            reason: `Auto-bloqueio: ${failures} tentativas falhadas em ${timeWindowMinutes} minutos`,
            expiresAt,
            blockedBy: null, // Sistema
          });

          blockedIps.push(blocked);
        } catch (error) {
          this.logger.error(
            `Erro ao auto-bloquear IP ${ipAddress}: ${error.message}`,
          );
        }
      }
    }

    if (blockedIps.length > 0) {
      this.logger.warn(
        `Auto-bloqueio ativado: ${blockedIps.length} IPs bloqueados`,
      );
    }

    return blockedIps;
  }

  /**
   * Lista usuários bloqueados (bloqueadoAte > now)
   */
  async listBlockedUsers(): Promise<BlockedUserInfo[]> {
    const now = new Date();

    const users = await this.userRepository.find({
      where: {
        bloqueadoAte: MoreThan(now),
      },
      select: ["id", "usuario", "nome", "bloqueadoAte", "tentativasLogin"],
      order: { bloqueadoAte: "DESC" },
    });

    return users.map((user) => ({
      id: user.id,
      usuario: user.usuario,
      nome: user.nome,
      bloqueadoAte: user.bloqueadoAte,
      tentativasLogin: user.tentativasLogin,
    }));
  }

  /**
   * Desbloqueia um usuário
   */
  async unblockUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    if (!user.bloqueadoAte || user.bloqueadoAte <= new Date()) {
      throw new BadRequestException(
        `Usuário ${user.usuario} não está bloqueado`,
      );
    }

    user.bloqueadoAte = null;
    user.tentativasLogin = 0;

    const updated = await this.userRepository.save(user);

    this.logger.log(`Usuário ${user.usuario} (ID: ${userId}) desbloqueado`);

    return updated;
  }
}
