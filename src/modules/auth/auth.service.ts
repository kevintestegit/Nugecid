import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import * as bcrypt from "bcryptjs";

import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { Auditoria, AuditAction } from "../audit/entities/auditoria.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface JwtPayload {
  sub: number;
  usuario: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  user: Omit<User, "senha">;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginV2Response {
  user: {
    userId: number;
    usuario: string;
    role: string;
  };
  accessToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private onlineUsers = new Map<number, { lastActivity: Date }>();
  private accessTokenExpiresIn: string;
  private refreshTokenExpiresIn: string;
  private refreshTokenSecret: string;
  private accessTokenSecret: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    // Cache secrets/expirações para evitar lookups repetidos
    this.accessTokenExpiresIn =
      this.configService.get<string>("auth.jwt.expiresIn") ||
      this.configService.get<string>("JWT_EXPIRES_IN", "50m");

    this.refreshTokenExpiresIn =
      this.configService.get<string>("auth.jwt.refreshExpiresIn") ||
      this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "7d");

    this.refreshTokenSecret =
      this.configService.get<string>("auth.jwt.refreshSecret") ||
      this.configService.get<string>("JWT_REFRESH_SECRET");

    this.accessTokenSecret =
      this.configService.get<string>("auth.jwt.secret") ||
      this.configService.get<string>(
        "JWT_SECRET",
        "sgc-itep-secret-key-change-in-production",
      );
  }

  /**
   * Valida as credenciais do usuário
   */
  async validateUser(usuario: string, password: string): Promise<User | null> {
    this.logger.debug(
      `[AuthService] Iniciando validação para o usuário: "${usuario}"`,
    );
    try {
      // Busca por usuario (aceita tanto nome de usuário quanto email)
      // Se o input contém @, tenta buscar por usuários que tenham email como nome de usuário
      let user = await this.userRepository.findOne({
        where: { usuario: usuario },
        relations: ["role"],
      });

      // Se não encontrou e o input parece ser um email, tenta buscar pelo nome base
      if (!user && usuario.includes("@")) {
        const baseUsername = usuario.split("@")[0];
        user = await this.userRepository.findOne({
          where: { usuario: baseUsername },
          relations: ["role"],
        });
        this.logger.debug(
          `[AuthService] Tentativa de busca alternativa com nome base: "${baseUsername}"`,
        );
      }

      if (!user) {
        this.logger.warn(
          `[AuthService] Tentativa de login com usuário inexistente: "${usuario}"`,
        );
        return null;
      }
      this.logger.debug(
        `[AuthService] Usuário encontrado: ${user.usuario} (ID: ${user.id})`,
      );

      // DEBUG: log full user object to inspect 'ativo' value
      this.logger.debug(
        `[AuthService] Usuário object: ${JSON.stringify({ id: user.id, usuario: user.usuario, ativo: user.ativo, role: user.role ? user.role.name : null })}`,
      );

      if (!user.ativo) {
        this.logger.warn(
          `[AuthService] Tentativa de login com usuário inativo: "${usuario}"`,
        );
        throw new UnauthorizedException("Usuário inativo");
      }

      if (user.isBlocked()) {
        this.logger.warn(
          `[AuthService] Tentativa de login com usuário bloqueado: "${usuario}"`,
        );
        throw new UnauthorizedException(
          `Usuário bloqueado até ${user.bloqueadoAte.toLocaleString()}`,
        );
      }

      this.logger.debug(
        `[AuthService] Verificando a senha para o usuário: "${usuario}"`,
      );
      const isPasswordValid = await user.validatePassword(password);

      if (!isPasswordValid) {
        this.logger.warn(
          `[AuthService] Senha inválida para o usuário: "${usuario}"`,
        );
        await this.handleFailedLogin(user);
        return null;
      }

      this.logger.debug(
        `[AuthService] Senha válida para o usuário: "${usuario}".`,
      );
      // Reset tentativas de login em caso de sucesso
      await this.handleSuccessfulLogin(user);
      return user;
    } catch (error) {
      this.logger.error(
        `[AuthService] Erro na validação do usuário "${usuario}": ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Realiza o login do usuário
   */
  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.usuario, loginDto.senha);

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const payload: JwtPayload = {
      sub: user.id,
      usuario: user.usuario,
      role: user.role?.name || "user",
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn || "50m",
      secret: this.accessTokenSecret,
    });

    // Gera refresh token com expiração maior
    const refreshPayload = {
      sub: user.id,
      usuario: user.usuario,
      type: "refresh",
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.refreshTokenExpiresIn || "7d",
      secret: this.refreshTokenSecret || this.accessTokenSecret,
    });

    // Salva auditoria de login bem-sucedido
    await this.saveLoginAudit(user.id, ipAddress, userAgent, true);

    // Adiciona usuário à lista de online
    this.onlineUsers.set(user.id, { lastActivity: new Date() });

    this.logger.log(`Login bem-sucedido para usuário: ${user.usuario}`);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn: "50m",
    };
  }

  /**
   * Realiza o login do usuário para API v2
   */
  async loginV2(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginV2Response> {
    const user = await this.validateUser(loginDto.usuario, loginDto.senha);

    if (!user) {
      // Salva auditoria de tentativa de login falhada
      await this.saveLoginAudit(
        null,
        ipAddress,
        userAgent,
        false,
        "Credenciais inválidas",
      );
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const payload: JwtPayload = {
      sub: user.id,
      usuario: user.usuario,
      role: user.role?.name || "user",
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn || "50m",
      secret: this.accessTokenSecret,
    });

    // Salva auditoria de login bem-sucedido
    await this.saveLoginAudit(user.id, ipAddress, userAgent, true);

    // Adiciona usuário à lista de online
    this.onlineUsers.set(user.id, { lastActivity: new Date() });

    this.logger.log(`Login API v2 bem-sucedido para usuário: ${user.usuario}`);

    return {
      user: {
        userId: user.id,
        usuario: user.usuario,
        role: user.role?.name || "user",
      },
      accessToken,
      expiresIn: "50m",
    };
  }

  /**
   * Renovar token JWT usando refresh token
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: string }> {
    try {
      // Verifica se o refresh token é válido
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.refreshTokenSecret || this.accessTokenSecret,
      }) as any;

      if (decoded.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token type");
      }

      // Busca o usuário
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
        relations: ["role"],
      });

      if (!user || !user.ativo) {
        throw new UnauthorizedException("Usuário não encontrado ou inativo");
      }

      // Gera novo access token
      const payload: JwtPayload = {
        sub: user.id,
        usuario: user.usuario,
        role: user.role?.name || "user",
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.accessTokenExpiresIn || "50m",
        secret: this.accessTokenSecret,
      });

      this.logger.log(`Token renovado para usuário: ${user.usuario}`);

      return {
        accessToken,
        expiresIn: this.accessTokenExpiresIn || "50m",
      };
    } catch (error) {
      this.logger.warn(
        `Falha ao renovar token: ${error.name || "Error"} - ${error.message}`,
      );
      if (error?.message?.includes("expired")) {
        throw new UnauthorizedException("Refresh token expirado");
      }
      throw new UnauthorizedException("Token de refresh inválido ou expirado");
    }
  }

  /**
   * Valida o payload do JWT e retorna o usuário com suas permissões
   */
  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ["role"], // Garante que a role seja carregada
    });

    if (user && user.ativo) {
      return user;
    }

    return null;
  }

  async register(registerDto: RegisterDto, currentUser: User): Promise<User> {
    if (!currentUser.isAdmin()) {
      throw new UnauthorizedException(
        "Apenas administradores podem criar usuários",
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { usuario: registerDto.usuario },
    });

    if (existingUser) {
      throw new BadRequestException("Usuário já está em uso");
    }

    const role = await this.roleRepository.findOne({
      where: { id: registerDto.roleId },
    });

    if (!role) {
      throw new BadRequestException("Role inválida");
    }

    const user = this.userRepository.create({
      nome: registerDto.nome,
      usuario: registerDto.usuario,
      senha: registerDto.senha, // Será hasheada automaticamente pelo hook
      roleId: registerDto.roleId,
    });

    const savedUser = await this.userRepository.save(user);

    this.logger.log(
      `Novo usuário criado: ${savedUser.usuario} por ${currentUser.usuario}`,
    );

    return this.sanitizeUser(savedUser);
  }

  /**
   * Logout do usuário
   */
  async logout(
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    await this.saveLogoutAudit(userId, ipAddress, userAgent);
    // Remove usuário da lista de online
    this.onlineUsers.delete(userId);
    this.logger.log(`Logout realizado para usuário ID: ${userId}`);
  }

  /**
   * Obtém usuário por ID
   */
  async findUserById(id: number): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .where("user.id = :id", { id })
      .select([
        "user.id",
        "user.nome",
        "user.usuario",
        "user.avatarUrl",
        "user.ultimoLogin",
        "user.createdAt",
        "user.settings",
        "role.id",
        "role.name",
        "role.description",
        "role.permissions",
      ])
      .addSelect("role.settings")
      .getOne();

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    return user;
  }

  /**
   * Manipula login falhado
   */
  private async handleFailedLogin(user: User): Promise<void> {
    user.tentativasLogin += 1;

    // Bloqueia usuário após 5 tentativas falhadas
    if (user.tentativasLogin >= 5) {
      user.bloqueadoAte = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      this.logger.warn(
        `Usuário ${user.usuario} foi bloqueado por excesso de tentativas`,
      );
    }

    await this.userRepository.save(user);
  }

  /**
   * Manipula login bem-sucedido
   */
  private async handleSuccessfulLogin(user: User): Promise<void> {
    user.tentativasLogin = 0;
    user.bloqueadoAte = null;
    user.ultimoLogin = new Date();
    await this.userRepository.save(user);
  }

  /**
   * Salva auditoria de login
   */
  private async saveLoginAudit(
    userId: number | null,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    try {
      const auditData = Auditoria.createLoginAudit(
        userId,
        ipAddress,
        userAgent,
        success,
        error,
      );
      const audit = this.auditoriaRepository.create(auditData);
      await this.auditoriaRepository.save(audit);
    } catch (auditError) {
      this.logger.error(
        `Erro ao salvar auditoria de login: ${auditError.message}`,
      );
    }
  }

  /**
   * Salva auditoria de logout
   */
  private async saveLogoutAudit(
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    try {
      const auditData = Auditoria.createLogoutAudit(
        userId,
        ipAddress,
        userAgent,
      );
      const audit = this.auditoriaRepository.create(auditData);
      await this.auditoriaRepository.save(audit);
    } catch (auditError) {
      this.logger.error(
        `Erro ao salvar auditoria de logout: ${auditError.message}`,
      );
    }
  }

  /**
   * Obtém lista de usuários online
   */
  async getOnlineUsers(): Promise<
    {
      id: number;
      nome: string;
      usuario: string;
      role: string;
      lastActivity: Date;
    }[]
  > {
    // Limpa usuários inativos antes de retornar
    await this.cleanupInactiveUsers();

    const onlineUserIds = Array.from(this.onlineUsers.keys());
    if (onlineUserIds.length === 0) {
      this.logger.debug("Nenhum usuário online encontrado");
      return [];
    }

    this.logger.debug(
      `Encontrados ${onlineUserIds.length} usuários online: ${onlineUserIds.join(", ")}`,
    );

    const users = await this.userRepository.find({
      where: { id: In(onlineUserIds) },
      relations: ["role"],
      select: ["id", "nome", "usuario"],
    });

    const result = users.map((user) => ({
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      role: user.role?.name || "user",
      lastActivity: this.onlineUsers.get(user.id)?.lastActivity || new Date(),
    }));

    this.logger.debug(`Retornando ${result.length} usuários online`);
    return result;
  }

  /**
   * Atualiza a atividade do usuário
   */
  async updateUserActivity(userId: number): Promise<void> {
    if (this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, { lastActivity: new Date() });
      this.logger.debug(`Atividade atualizada para usuário ${userId}`);
    }
  }

  /**
   * Limpa usuários inativos (mais de 5 minutos sem atividade)
   */
  async cleanupInactiveUsers(): Promise<void> {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutos
    const inactiveUsers: number[] = [];

    for (const [userId, data] of this.onlineUsers.entries()) {
      const timeDiff = now.getTime() - data.lastActivity.getTime();
      if (timeDiff > inactiveThreshold) {
        inactiveUsers.push(userId);
      }
    }

    if (inactiveUsers.length > 0) {
      inactiveUsers.forEach((userId) => {
        this.onlineUsers.delete(userId);
      });
      this.logger.log(
        `Removidos ${inactiveUsers.length} usuários inativos: ${inactiveUsers.join(", ")}`,
      );
    }
  }

  /**
   * Remove campos sensíveis do usuário
   */
  private sanitizeUser(user: User): any {
    const { senha, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
