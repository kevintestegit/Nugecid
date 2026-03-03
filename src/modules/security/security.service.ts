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

export interface IpUserInfo {
  id: number;
  usuario: string;
  nome: string;
  successfulLogins: number;
  failedLogins: number;
  lastAttempt: Date;
}

export interface IpAccessStats {
  ipAddress: string;
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  lastAttempt: Date;
  firstAttempt: Date;
  userAgents: string[];
  users: IpUserInfo[];
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
   * Obtém estatísticas de acesso por IP.
   *
   * PERFORMANCE: uses SQL GROUP BY to aggregate at the database level instead
   * of loading all audit rows into application memory.
   */
  async getIpAccessStats(
    days: number = 7,
    limit: number = 100,
  ): Promise<IpAccessStats[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Aggregate IP-level stats in the database
    const ipAggregates: Array<{
      ip_address: string;
      total_attempts: string;
      successful_logins: string;
      failed_logins: string;
      last_attempt: string;
      first_attempt: string;
    }> = await this.auditoriaRepository
      .createQueryBuilder("a")
      .select("a.ipAddress", "ip_address")
      .addSelect("COUNT(*)", "total_attempts")
      .addSelect(
        "SUM(CASE WHEN a.success = true THEN 1 ELSE 0 END)",
        "successful_logins",
      )
      .addSelect(
        "SUM(CASE WHEN a.success = false THEN 1 ELSE 0 END)",
        "failed_logins",
      )
      .addSelect("MAX(a.timestamp)", "last_attempt")
      .addSelect("MIN(a.timestamp)", "first_attempt")
      .where("a.action = :action", { action: AuditAction.LOGIN })
      .andWhere("a.timestamp > :since", { since })
      .andWhere("a.ipAddress IS NOT NULL")
      .groupBy("a.ipAddress")
      .orderBy("total_attempts", "DESC")
      .limit(limit)
      .getRawMany();

    if (ipAggregates.length === 0) return [];

    // Busca IPs bloqueados
    const blockedIps = await this.listBlockedIps(false);
    const blockedIpsMap = new Map(
      blockedIps.map((b) => [b.ipAddress, b.reason || "Não especificado"]),
    );

    // Fetch user-level details only for the top IPs (bounded query)
    const topIpAddresses = ipAggregates.map((r) => r.ip_address);
    const userDetails = await this.auditoriaRepository
      .createQueryBuilder("a")
      .innerJoin("a.user", "u")
      .select("a.ipAddress", "ip_address")
      .addSelect("a.userId", "user_id")
      .addSelect("u.usuario", "usuario")
      .addSelect("u.nome", "nome")
      .addSelect(
        "SUM(CASE WHEN a.success = true THEN 1 ELSE 0 END)",
        "successful_logins",
      )
      .addSelect(
        "SUM(CASE WHEN a.success = false THEN 1 ELSE 0 END)",
        "failed_logins",
      )
      .addSelect("MAX(a.timestamp)", "last_attempt")
      .where("a.action = :action", { action: AuditAction.LOGIN })
      .andWhere("a.timestamp > :since", { since })
      .andWhere("a.ipAddress IN (:...ips)", { ips: topIpAddresses })
      .andWhere("a.userId IS NOT NULL")
      .groupBy("a.ipAddress")
      .addGroupBy("a.userId")
      .addGroupBy("u.usuario")
      .addGroupBy("u.nome")
      .getRawMany();

    // Build user map per IP
    const ipUsersMap = new Map<string, IpUserInfo[]>();
    for (const row of userDetails) {
      const users = ipUsersMap.get(row.ip_address) ?? [];
      users.push({
        id: parseInt(row.user_id, 10),
        usuario: row.usuario,
        nome: row.nome,
        successfulLogins: parseInt(row.successful_logins, 10) || 0,
        failedLogins: parseInt(row.failed_logins, 10) || 0,
        lastAttempt: new Date(row.last_attempt),
      });
      ipUsersMap.set(row.ip_address, users);
    }

    // Fetch distinct user agents per IP (lightweight query)
    const userAgentRows: Array<{ ip_address: string; user_agent: string }> =
      await this.auditoriaRepository
        .createQueryBuilder("a")
        .select("DISTINCT a.ipAddress", "ip_address")
        .addSelect("a.userAgent", "user_agent")
        .where("a.action = :action", { action: AuditAction.LOGIN })
        .andWhere("a.timestamp > :since", { since })
        .andWhere("a.ipAddress IN (:...ips)", { ips: topIpAddresses })
        .andWhere("a.userAgent IS NOT NULL")
        .getRawMany();

    const ipAgentsMap = new Map<string, string[]>();
    for (const row of userAgentRows) {
      const agents = ipAgentsMap.get(row.ip_address) ?? [];
      if (!agents.includes(row.user_agent)) {
        agents.push(row.user_agent);
      }
      ipAgentsMap.set(row.ip_address, agents);
    }

    // Assemble results
    return ipAggregates.map((row) => ({
      ipAddress: row.ip_address,
      totalAttempts: parseInt(row.total_attempts, 10) || 0,
      successfulLogins: parseInt(row.successful_logins, 10) || 0,
      failedLogins: parseInt(row.failed_logins, 10) || 0,
      lastAttempt: new Date(row.last_attempt),
      firstAttempt: new Date(row.first_attempt),
      userAgents: ipAgentsMap.get(row.ip_address) ?? [],
      users: (ipUsersMap.get(row.ip_address) ?? []).sort(
        (a, b) => b.lastAttempt.getTime() - a.lastAttempt.getTime(),
      ),
      isBlocked: blockedIpsMap.has(row.ip_address),
      blockedReason: blockedIpsMap.get(row.ip_address),
    }));
  }

  /**
   * Obtém detalhes de acessos de um IP específico (com paginação).
   */
  async getIpAccessDetails(
    ipAddress: string,
    days: number = 30,
    skip: number = 0,
    take: number = 100,
  ): Promise<{ data: Auditoria[]; total: number }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [data, total] = await this.auditoriaRepository.findAndCount({
      where: {
        ipAddress,
        action: AuditAction.LOGIN,
        timestamp: MoreThan(since),
      },
      relations: ["user"],
      order: { timestamp: "DESC" },
      skip,
      take,
    });

    return { data, total };
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
