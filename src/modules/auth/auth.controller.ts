import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Ip,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { URL } from "url";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { WebAuthGuard } from "./guards/web-auth.guard";
import { IpBlockerGuard } from "../security/guards/ip-blocker.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import {
  buildApiErrorResponse,
  buildApiSuccessResponse,
} from "../../common/http/api-response";
import {
  CSRF_COOKIE_NAME,
  csrfCookieOptions,
  ensureCsrfCookie,
} from "../../common/middleware/csrf.middleware";

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private static readonly SESSION_COOKIE_NAME = "connect.sid";
  private static readonly ACCESS_TOKEN_COOKIE_NAME = "access_token";
  private static readonly REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private shouldUseSecureCookie(req: ExpressRequest): boolean {
    const configuredSecure = this.configService.get<boolean | "auto">(
      "auth.session.secure",
      "auto",
    );
    if (configuredSecure === true) {
      return true;
    }
    if (configuredSecure === false) {
      return false;
    }

    const forwardedProtoHeader = req.headers["x-forwarded-proto"];
    const forwardedProto = Array.isArray(forwardedProtoHeader)
      ? forwardedProtoHeader[0]
      : forwardedProtoHeader;
    const proto = (forwardedProto ?? "").split(",")[0]?.trim().toLowerCase();

    return req.secure || proto === "https";
  }

  private getAccessTokenCookieOptions(req: ExpressRequest, maxAge: number) {
    return {
      httpOnly: true,
      secure: this.shouldUseSecureCookie(req),
      sameSite: "lax" as const,
      path: "/",
      maxAge,
    };
  }

  private parseDurationToMs(value: string, fallbackMs: number): number {
    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d+)(ms|s|m|h|d)$/);

    if (!match) {
      return fallbackMs;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * (multipliers[unit] ?? 1);
  }

  private getRefreshTokenCookieOptions(req: ExpressRequest) {
    const refreshExpiresIn = this.configService.get<string>(
      "auth.jwt.refreshExpiresIn",
      "7d",
    );

    return {
      httpOnly: true,
      secure: this.shouldUseSecureCookie(req),
      sameSite: "lax" as const,
      path: "/",
      maxAge: this.parseDurationToMs(refreshExpiresIn, 7 * 24 * 60 * 60 * 1000),
    };
  }

  private clearAuthCookies(req: ExpressRequest, res: ExpressResponse): void {
    const secure = this.shouldUseSecureCookie(req);

    res.clearCookie(AuthController.ACCESS_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie(AuthController.REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie(AuthController.SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
    });
    res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions(req));
  }

  private resolveAuthenticatedUserId(req: ExpressRequest): number | undefined {
    const sessionUserId = req.session?.user?.id;
    if (typeof sessionUserId === "number" && sessionUserId > 0) {
      return sessionUserId;
    }

    const accessToken = req.cookies?.[AuthController.ACCESS_TOKEN_COOKIE_NAME];
    const refreshToken =
      req.cookies?.[AuthController.REFRESH_TOKEN_COOKIE_NAME];
    const accessTokenSecret =
      this.configService.get<string>("auth.jwt.secret") ||
      this.configService.get<string>("JWT_SECRET");
    const refreshTokenSecret =
      this.configService.get<string>("auth.jwt.refreshSecret") ||
      this.configService.get<string>("JWT_REFRESH_SECRET") ||
      accessTokenSecret;

    const decodeSub = (token?: string, secret?: string): number | undefined => {
      if (!token || !secret) {
        return undefined;
      }

      try {
        const decoded = this.jwtService.verify<{ sub?: number; type?: string }>(
          token,
          {
            secret,
          },
        );

        if (
          typeof decoded?.sub === "number" &&
          (!decoded.type || decoded.type === "refresh")
        ) {
          return decoded.sub;
        }
      } catch {
        return undefined;
      }

      return undefined;
    };

    return (
      decodeSub(accessToken, accessTokenSecret) ??
      decodeSub(refreshToken, refreshTokenSecret)
    );
  }

  @Get("login")
  @IsPublic()
  @ApiOperation({ summary: "Renderiza página de login" })
  loginPage(@Request() req: ExpressRequest, @Response() res: ExpressResponse) {
    const frontendUrl = this.configService.get<string>(
      "app.frontendUrl",
      "http://localhost:3001",
    );
    const loginUrl = new URL("/login", frontendUrl);
    const error = req.query.error;
    const message = req.query.message;

    if (typeof error === "string" && error.length > 0) {
      loginUrl.searchParams.set("error", error);
    }

    if (typeof message === "string" && message.length > 0) {
      loginUrl.searchParams.set("message", message);
    }

    return res.redirect(loginUrl.toString());
  }

  @Post("login")
  @IsPublic()
  @UseGuards(IpBlockerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Realiza login do usuário" })
  @ApiResponse({
    status: 200,
    description: "Login realizado com sucesso",
    schema: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "number" },
            nome: { type: "string" },
            usuario: { type: "string" },
            role: { type: "object" },
          },
        },
        accessToken: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
  ) {
    try {
      const result = await this.authService.login(
        loginDto,
        ipAddress,
        userAgent || "Unknown",
      );

      // Define o cookie com o token de acesso
      res.cookie(
        AuthController.ACCESS_TOKEN_COOKIE_NAME,
        result.accessToken,
        this.getAccessTokenCookieOptions(req, 3600000),
      );
      res.cookie(
        AuthController.REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        this.getRefreshTokenCookieOptions(req),
      );
      ensureCsrfCookie(req, res);

      // Salva usuário na sessão (opcional, mas útil para renderização no lado do servidor)
      req.session.user = result.user;

      // Se for requisição AJAX/API, retorna JSON sem tokens; tokens ficam em cookies httpOnly.
      if (req.headers.accept?.includes("application/json")) {
        return res.json(
          buildApiSuccessResponse({
            data: {
              user: result.user,
              expiresIn: result.expiresIn,
            },
            statusCode: HttpStatus.OK,
            path: req.url,
            method: req.method,
          }),
        );
      }

      // Se for requisição web, redireciona
      return res.redirect("/");
    } catch (error) {
      this.logger.error(`Erro no login: ${error.message}`);

      if (req.headers.accept?.includes("application/json")) {
        return res.status(HttpStatus.UNAUTHORIZED).json(
          buildApiErrorResponse({
            statusCode: HttpStatus.UNAUTHORIZED,
            path: req.url,
            method: req.method,
            message: error.message,
          }),
        );
      }

      return res.redirect(
        `/auth/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Post("register")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Registra novo usuário (apenas admins)" })
  @ApiResponse({ status: 201, description: "Usuário criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async register(
    @Body() registerDto: RegisterDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.authService.register(registerDto, currentUser);
  }

  @Post("logout")
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Realiza logout do usuário" })
  @ApiResponse({ status: 200, description: "Logout realizado com sucesso" })
  async logout(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
  ) {
    try {
      const userId = this.resolveAuthenticatedUserId(req);
      if (userId) {
        // Extract refresh token for blacklisting
        const refreshToken =
          req.cookies?.[AuthController.REFRESH_TOKEN_COOKIE_NAME];
        await this.authService.logout(
          userId,
          ipAddress,
          userAgent || "Unknown",
          refreshToken,
        );
      }

      // Destroi a sessão
      req.session?.destroy((err) => {
        if (err) {
          this.logger.error(`Erro ao destruir sessão: ${err.message}`);
        }
      });
      this.clearAuthCookies(req, res);

      // Se for requisição AJAX/API, retorna JSON
      if (req.headers.accept?.includes("application/json")) {
        return res.json(
          buildApiSuccessResponse({
            data: null,
            message: "Logout realizado com sucesso",
            statusCode: HttpStatus.OK,
            path: req.url,
            method: req.method,
          }),
        );
      }

      // Se for requisição web, redireciona
      return res.redirect("/auth/login?message=Logout realizado com sucesso");
    } catch (error) {
      this.logger.error(`Erro no logout: ${error.message}`);

      if (req.headers.accept?.includes("application/json")) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
          buildApiErrorResponse({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            path: req.url,
            method: req.method,
            message: "Erro interno do servidor",
          }),
        );
      }

      return res.redirect("/auth/login?error=Erro ao realizar logout");
    }
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Obtém perfil do usuário logado" })
  @ApiResponse({ status: 200, description: "Perfil do usuário" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async getProfile(@CurrentUser() currentUser: User) {
    try {
      if (!currentUser) {
        this.logger.error(
          `[AuthController] CurrentUser é null/undefined no endpoint /auth/profile`,
        );
        throw new UnauthorizedException(
          "Usuário não encontrado no contexto da requisição",
        );
      }

      if (!currentUser.id) {
        this.logger.error(
          `[AuthController] CurrentUser não possui ID: ${JSON.stringify(currentUser)}`,
        );
        throw new UnauthorizedException("ID do usuário não encontrado");
      }

      // Busca uma instância completa do usuário para garantir que todas as relações estejam carregadas
      const user = await this.authService.findUserById(currentUser.id);

      const response = {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        avatarUrl: user.avatarUrl,
        settings: user.settings || {},
        role: user.role
          ? {
              id: user.role.id,
              name: user.role.name,
              description: user.role.description,
              permissions: user.role.permissions,
              settings: (user.role as any).settings || {},
            }
          : null,
        ultimoLogin: user.ultimoLogin,
        criadoEm: user.createdAt,
      };
      return response;
    } catch (error) {
      this.logger.error(
        `[AuthController] Erro no endpoint /auth/profile: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get("check")
  @UseGuards(WebAuthGuard)
  @ApiOperation({ summary: "Verifica se usuário está autenticado" })
  @ApiResponse({ status: 200, description: "Usuário autenticado" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async checkAuth(@CurrentUser() user: User) {
    return {
      authenticated: true,
      user: {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        role: user.role?.name,
      },
    };
  }

  @Post("refresh")
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Renovar token JWT usando refresh token" })
  @ApiResponse({
    status: 200,
    description: "Token renovado com sucesso",
    schema: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        expiresIn: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Refresh token inválido ou expirado",
  })
  async refreshToken(
    @Body() body: { refreshToken?: string },
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const refreshToken =
        req.cookies?.[AuthController.REFRESH_TOKEN_COOKIE_NAME] ??
        body.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedException("Refresh token ausente");
      }

      const result = await this.authService.refreshToken(refreshToken);
      this.logger.log("Token renovado com sucesso");

      // Atualiza o cookie httpOnly com o novo access token
      res.cookie(
        AuthController.ACCESS_TOKEN_COOKIE_NAME,
        result.accessToken,
        this.getAccessTokenCookieOptions(req, 50 * 60 * 1000),
      );
      ensureCsrfCookie(req, res);

      return res.json(
        buildApiSuccessResponse({
          data: {
            expiresIn: result.expiresIn,
          },
          statusCode: HttpStatus.OK,
          path: req.url,
          method: req.method,
        }),
      );
    } catch (error) {
      this.logger.error(`Erro ao renovar token: ${error.message}`);
      throw error;
    }
  }

  @Get("online-users")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Obtém lista de usuários online" })
  @ApiResponse({
    status: 200,
    description: "Lista de usuários online",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          nome: { type: "string" },
          usuario: { type: "string" },
          role: { type: "string" },
          avatarUrl: { type: "string", nullable: true },
          lastActivity: { type: "string", format: "date-time" },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  async getOnlineUsers(@Request() req: ExpressRequest) {
    try {
      const requestUser = req.user as
        | { id?: number; userId?: number }
        | undefined;
      const userId = requestUser?.id ?? requestUser?.userId;
      if (userId) {
        await this.authService.updateUserActivity(userId);
      }
      const onlineUsers = await this.authService.getOnlineUsers();
      return onlineUsers;
    } catch (error) {
      this.logger.error(
        `[ONLINE-USERS] Erro ao obter usuários online: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get("online-users/debug")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Debug - Informações detalhadas sobre usuários online",
  })
  @ApiResponse({
    status: 200,
    description: "Informações de debug sobre usuários online",
  })
  async getOnlineUsersDebug() {
    try {
      const onlineUsers = await this.authService.getOnlineUsers();
      const debugInfo = {
        totalUsers: onlineUsers.length,
        users: onlineUsers.map((u) => ({
          id: u.id,
          nome: u.nome,
          usuario: u.usuario,
          role: u.role,
          lastActivity: u.lastActivity,
          minutesSinceActivity: Math.floor(
            (Date.now() - u.lastActivity.getTime()) / (1000 * 60),
          ),
        })),
        serverTime: new Date().toISOString(),
        mapSize: (this.authService as any).onlineUsers?.size || 0,
      };

      return debugInfo;
    } catch (error) {
      this.logger.error(
        `[ONLINE-USERS/DEBUG] Erro no endpoint de debug: ${error.message}`,
      );
      throw error;
    }
  }
}

@ApiTags("Autenticação")
@Controller("v2/auth")
export class AuthV2Controller {
  private readonly logger = new Logger(AuthV2Controller.name);

  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @IsPublic()
  @UseGuards(IpBlockerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login API v2 - Retorna JWT com expiração de 50 minutos",
  })
  @ApiResponse({
    status: 200,
    description: "Login realizado com sucesso",
    schema: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            userId: { type: "number" },
            usuario: { type: "string" },
            role: { type: "string" },
          },
        },
        accessToken: { type: "string" },
        expiresIn: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
  ) {
    try {
      const result = await this.authService.loginV2(
        loginDto,
        ipAddress,
        userAgent || "Unknown",
      );

      this.logger.log(
        `Login API v2 bem-sucedido para usuário: ${loginDto.usuario}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Erro no login API v2: ${error.message}`);
      throw error;
    }
  }
}
