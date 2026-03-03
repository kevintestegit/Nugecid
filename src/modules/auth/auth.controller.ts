import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  Get,
  Render,
  HttpCode,
  HttpStatus,
  Logger,
  Ip,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
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

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  private shouldUseSecureCookie(req: ExpressRequest): boolean {
    const forwardedProtoHeader = req.headers["x-forwarded-proto"];
    const forwardedProto = Array.isArray(forwardedProtoHeader)
      ? forwardedProtoHeader[0]
      : forwardedProtoHeader;
    const proto = (forwardedProto ?? "").split(",")[0]?.trim().toLowerCase();

    const forwardedHostHeader = req.headers["x-forwarded-host"];
    const forwardedHost = Array.isArray(forwardedHostHeader)
      ? forwardedHostHeader[0]
      : forwardedHostHeader;
    const host = (forwardedHost ?? req.headers.host ?? "").toString();
    const hostname = host.split(":")[0]?.toLowerCase();

    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";
    const isHttps = req.secure || proto === "https";

    if (isHttps) {
      return true;
    }

    if (isLocalHost) {
      return false;
    }

    return process.env.NODE_ENV === "production";
  }

  @Get("login")
  @IsPublic()
  @ApiOperation({ summary: "Renderiza página de login" })
  @Render("login")
  loginPage(@Request() req: ExpressRequest) {
    // Se já estiver logado, redireciona para página principal
    if (req.user) {
      return { redirect: "/" };
    }

    return {
      title: "Login - SGC ITEP",
      error: req.query.error || null,
      message: req.query.message || null,
    };
  }

  @Post("login")
  @IsPublic()
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
      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        secure: this.shouldUseSecureCookie(req),
        sameSite: "lax",
        path: "/",
        maxAge: 3600000, // 1 hora
      });

      // Salva usuário na sessão (opcional, mas útil para renderização no lado do servidor)
      req.session.user = result.user;

      // Se for requisição AJAX/API, retorna JSON com tokens
      if (req.headers.accept?.includes("application/json")) {
        return res.json({
          success: true,
          data: result,
        });
      }

      // Se for requisição web, redireciona
      return res.redirect("/");
    } catch (error) {
      this.logger.error(`Erro no login: ${error.message}`);

      if (req.headers.accept?.includes("application/json")) {
        return res.status(401).json({ message: error.message });
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
  @UseGuards(SessionAuthGuard)
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
      if (req.session.user) {
        await this.authService.logout(
          req.session.user.id,
          ipAddress,
          userAgent || "Unknown",
        );
      }

      // Destroi a sessão
      req.session.destroy((err) => {
        if (err) {
          this.logger.error(`Erro ao destruir sessão: ${err.message}`);
        }
      });

      // Se for requisição AJAX/API, retorna JSON
      if (req.headers.accept?.includes("application/json")) {
        return res.json({ message: "Logout realizado com sucesso" });
      }

      // Se for requisição web, redireciona
      return res.redirect("/auth/login?message=Logout realizado com sucesso");
    } catch (error) {
      this.logger.error(`Erro no logout: ${error.message}`);

      if (req.headers.accept?.includes("application/json")) {
        return res.status(500).json({ message: "Erro interno do servidor" });
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
  @UseGuards(SessionAuthGuard)
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

  @Post("/api/v2/auth/login")
  @IsPublic()
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
  async loginV2(
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
    @Body() body: { refreshToken: string },
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const result = await this.authService.refreshToken(body.refreshToken);
      this.logger.log("Token renovado com sucesso");

      // Atualiza o cookie httpOnly com o novo access token
      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        secure: this.shouldUseSecureCookie(req),
        sameSite: "lax",
        path: "/",
        maxAge: 50 * 60 * 1000, // 50 minutos
      });

      return res.json(result);
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
  @UseGuards(JwtAuthGuard)
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
