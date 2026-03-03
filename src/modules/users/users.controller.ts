import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ParseUserIdPipe } from "../../common/pipes/parse-user-id.pipe";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
} from "@nestjs/swagger";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  Express,
} from "express";

// Use Cases
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  GetUserByIdUseCase,
  GetUsersUseCase,
  RestoreUserUseCase,
  GetUserStatisticsUseCase,
  GetRolesUseCase,
} from "./application/use-cases";

// DTOs
import { CreateUserDto } from "./application/dto/create-user.dto";
import { UpdateUserDto } from "./application/dto/update-user.dto";
import { QueryUsersDto, UpdateUserSettingsDto } from "./application/dto";
import { UpdateUserPreferenceDto } from "./dto/user-preference.dto";

// Services
import { UserPreferencesService } from "./services/user-preferences.service";

// Guards and Decorators
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "./entities/user.entity";
import { Role as RoleEntity } from "./entities/role.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import { promises as fsPromises } from "fs";
import { extname, join, resolve } from "path";
import * as multer from "multer";
import { URL } from "url";

// Mappers
import { UserMapper } from "./infrastructure/mappers/user.mapper";
import { RoleMapper } from "./infrastructure/mappers/role.mapper";

// Utils
import { FileValidator } from "../../common/utils/file-validator";
import { AntivirusService } from "../security/antivirus.service";

@ApiTags("Usuários")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  private readonly uploadRoot: string;
  private readonly avatarFolder = "avatars";
  private readonly frontendUrl: string;

  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly restoreUserUseCase: RestoreUserUseCase,
    private readonly getUserStatisticsUseCase: GetUserStatisticsUseCase,
    private readonly getRolesUseCase: GetRolesUseCase,
    @InjectRepository(RoleEntity)
    private readonly rolesRepo: Repository<RoleEntity>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly antivirusService: AntivirusService,
  ) {
    this.uploadRoot = this.configService.get<string>(
      "UPLOAD_PATH",
      resolve(process.cwd(), "uploads"),
    );
    this.frontendUrl = this.configService.get<string>(
      "app.frontendUrl",
      "http://localhost:3001",
    );
  }

  private buildFrontendUrl(pathname: string, params?: Record<string, string>) {
    const url = new URL(pathname, this.frontendUrl);

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  @Get()
  @Roles("admin", "coordenador")
  // Ensure API responses are not cached by browsers/proxies
  // This prevents browsers from returning 304 Not Modified for the users list
  // which was causing the frontend to mis-handle the response.
  // Using no-store and no-cache guarantees fresh data.
  @Header(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
  @ApiOperation({ summary: "Lista todos os usuários" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "role", required: false, type: String })
  @ApiQuery({ name: "ativo", required: false, type: Boolean })
  @ApiQuery({ name: "active", required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: "Lista de usuários retornada com sucesso.",
  })
  async findAll(@Query() query: QueryUsersDto & { active?: string }) {
    // Mapear parâmetro 'active' do frontend para 'ativo' do backend
    const mappedQuery = {
      ...query,
      ativo: query.active !== undefined ? query.active === "true" : query.ativo,
    };

    const result = await this.getUsersUseCase.execute(mappedQuery as any);

    // Caso paginado (objeto com users + meta)
    if (Array.isArray((result as any).users)) {
      const pag = result as any;
      const items = pag.users.map((u: any) => UserMapper.toEntity(u));
      return {
        success: true,
        data: items,
        meta: {
          total: pag.total || items.length,
          page: pag.page || query.page || 1,
          limit: pag.limit || query.limit || items.length,
          totalPages: pag.totalPages || 1,
          hasNext: (pag.page || 1) < (pag.totalPages || 1),
          hasPrev: (pag.page || 1) > 1,
        },
      };
    }

    // Caso não paginado (array simples)
    const users = result as any[];
    return {
      success: true,
      data: users.map((user) => UserMapper.toEntity(user)),
      meta: {
        total: users.length,
        page: 1,
        limit: users.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  @Get("api")
  @Roles("admin", "coordenador")
  @Header(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
  @ApiOperation({ summary: "Lista usuários com paginação e filtros" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "roleId", required: false, type: Number })
  @ApiQuery({ name: "ativo", required: false, type: Boolean })
  @ApiQuery({ name: "active", required: false, type: Boolean })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["nome", "usuario", "criadoEm", "ultimoLogin"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "Lista de usuários" })
  async findAllApi(@Query() query: QueryUsersDto & { active?: string }) {
    // Mapear parâmetro 'active' do frontend para 'ativo' do backend
    const mappedQuery = {
      ...query,
      ativo: query.active !== undefined ? query.active === "true" : query.ativo,
    };

    const result = await this.getUsersUseCase.execute(mappedQuery as any);

    // Caso paginado (objeto com users + meta)
    if (Array.isArray((result as any).users)) {
      const pag = result as any;
      const items = pag.users.map((u: any) => UserMapper.toEntity(u));
      return {
        success: true,
        data: items,
        meta: {
          total: pag.total || items.length,
          page: pag.page || query.page || 1,
          limit: pag.limit || query.limit || items.length,
          totalPages: pag.totalPages || 1,
          hasNext: (pag.page || 1) < (pag.totalPages || 1),
          hasPrev: (pag.page || 1) > 1,
        },
      };
    }

    // Caso não paginado (array simples)
    const users = result as any[];
    return {
      success: true,
      data: users.map((user) => UserMapper.toEntity(user)),
      meta: {
        total: users.length,
        page: 1,
        limit: users.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  @Get("me/settings")
  @ApiOperation({ summary: "Obtém configurações do usuário logado" })
  @ApiResponse({
    status: 200,
    description: "Configurações do usuário retornadas",
  })
  async getMySettings(@CurrentUser() currentUser: User) {
    const user = await this.usersRepo.findOne({
      where: { id: currentUser.id },
    });
    if (!user) {
      throw new BadRequestException("Usuário não encontrado");
    }

    const settings = this.sanitizeSettings(user.settings || {});

    return {
      success: true,
      data: settings,
    };
  }

  @Patch("me/settings")
  @ApiOperation({ summary: "Atualiza configurações do usuário logado" })
  @ApiResponse({
    status: 200,
    description: "Configurações do usuário atualizadas",
  })
  async updateMySettings(
    @Body() body: UpdateUserSettingsDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersRepo.findOne({
      where: { id: currentUser.id },
    });
    if (!user) {
      throw new BadRequestException("Usuário não encontrado");
    }

    const mergedSettings = {
      ...(user.settings || {}),
      ...(body || {}),
    };

    const sanitized = this.sanitizeSettings(mergedSettings);

    user.settings = sanitized;
    await this.usersRepo.save(user);

    return {
      success: true,
      data: sanitized,
      message: "Configurações do usuário atualizadas com sucesso",
    };
  }

  @Post("me/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Atualiza a foto de perfil do usuário logado" })
  @ApiResponse({
    status: 200,
    description: "Avatar atualizado com sucesso",
  })
  async uploadMyAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ) {
    if (!file) {
      throw new BadRequestException("Arquivo de imagem é obrigatório");
    }

    const user = await this.usersRepo.findOne({
      where: { id: currentUser.id },
    });
    if (!user) {
      throw new BadRequestException("Usuário não encontrado");
    }

    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("O arquivo enviado deve ser uma imagem");
    }

    const extension = (
      extname(file.originalname || "") || ".png"
    ).toLowerCase();
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        "Formato de imagem não suportado. Use PNG, JPG, JPEG, GIF ou WEBP",
      );
    }

    // Validar conteúdo real do arquivo por magic bytes
    await FileValidator.validateImage(file.buffer);
    await this.antivirusService.scanBuffer(file.buffer, {
      fileName: file.originalname,
      source: "users.avatar",
    });

    const avatarDir = this.getAvatarDirectory();
    await this.ensureDirectoryExists(avatarDir);

    const fileName = `user-${user.id}-${Date.now()}${extension}`;
    const filePath = join(avatarDir, fileName);

    await fsPromises.writeFile(filePath, file.buffer);

    await this.deleteAvatarFile(user.avatarUrl);

    user.avatarUrl = this.buildAvatarUrl(fileName);
    await this.usersRepo.save(user);

    return {
      success: true,
      data: {
        avatarUrl: user.avatarUrl,
      },
      message: "Avatar atualizado com sucesso",
    };
  }

  @Delete("me/avatar")
  @ApiOperation({ summary: "Remove a foto de perfil do usuário logado" })
  @ApiResponse({
    status: 200,
    description: "Avatar removido com sucesso",
  })
  async deleteMyAvatar(@CurrentUser() currentUser: User) {
    const user = await this.usersRepo.findOne({
      where: { id: currentUser.id },
    });
    if (!user) {
      throw new BadRequestException("Usuário não encontrado");
    }

    await this.deleteAvatarFile(user.avatarUrl);
    user.avatarUrl = null;
    await this.usersRepo.save(user);

    return {
      success: true,
      data: {
        avatarUrl: user.avatarUrl,
      },
      message: "Avatar removido com sucesso",
    };
  }

  @Get("roles/:id/settings")
  @Roles("admin")
  @ApiOperation({ summary: "Obtém configurações do perfil (role)" })
  @ApiResponse({
    status: 200,
    description: "Configurações do perfil retornadas",
  })
  async getRoleSettings(@Param("id", ParseIntPipe) id: number) {
    const role = await this.rolesRepo.findOne({ where: { id } });
    if (!role) {
      throw new BadRequestException("Perfil (role) não encontrado");
    }
    return {
      success: true,
      data: role.settings || {},
    };
  }

  @Patch("roles/:id/settings")
  @Roles("admin")
  @ApiOperation({ summary: "Atualiza configurações do perfil (role)" })
  @ApiResponse({ status: 200, description: "Configurações atualizadas" })
  async updateRoleSettings(
    @Param("id", ParseIntPipe) id: number,
    @Body()
    body: {
      theme?: "light" | "dark";
      notifications?: {
        email?: boolean;
        push?: boolean;
        desktop?: boolean;
        sound?: boolean;
      };
    },
  ) {
    const role = await this.rolesRepo.findOne({ where: { id } });
    if (!role) {
      throw new BadRequestException("Perfil (role) não encontrado");
    }

    const nextSettings = {
      ...(role.settings || {}),
      ...(body || {}),
    } as RoleEntity["settings"];
    // sanitize theme
    if (
      nextSettings?.theme &&
      !["light", "dark"].includes(nextSettings.theme)
    ) {
      delete (nextSettings as any).theme;
    }
    role.settings = nextSettings;
    const saved = await this.rolesRepo.save(role);
    return {
      success: true,
      data: saved.settings || {},
      message: "Configurações do perfil atualizadas com sucesso",
    };
  }

  @Get("novo")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Renderiza página de criação de usuário" })
  async createPage(@Response() res: ExpressResponse) {
    return res.redirect(this.buildFrontendUrl("/usuarios/novo"));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Cria novo usuário" })
  @ApiResponse({ status: 201, description: "Usuário criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const user = await this.createUserUseCase.execute(createUserDto);
      const userEntity = UserMapper.toEntity(user);

      // Se for requisição AJAX/API, retorna JSON
      if (req.headers.accept?.includes("application/json")) {
        return res.status(201).json(userEntity);
      }

      // Se for requisição web, redireciona
      return res.redirect(
        this.buildFrontendUrl("/usuarios", {
          message: "Usuário criado com sucesso",
        }),
      );
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(
        this.buildFrontendUrl("/usuarios/novo", {
          error: error.message,
        }),
      );
    }
  }

  @Get("stats")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Obtém estatísticas dos usuários" })
  @ApiResponse({ status: 200, description: "Estatísticas dos usuários" })
  async getStats() {
    return this.getUserStatisticsUseCase.execute();
  }

  @Get("roles")
  @ApiOperation({ summary: "Lista todas as roles disponíveis" })
  @ApiResponse({ status: 200, description: "Lista de roles" })
  async findAllRoles() {
    const roles = await this.getRolesUseCase.execute();
    return roles.map((role) => RoleMapper.toEntity(role));
  }

  @Get(":id")
  @ApiOperation({ summary: "Busca usuário por ID" })
  @ApiResponse({ status: 200, description: "Dados do usuário" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  async findOne(
    @Param("id", ParseUserIdPipe) id: number,
    @Request() req: ExpressRequest,
  ) {
    const user = await this.getUserByIdUseCase.execute(id);
    const userEntity = UserMapper.toEntity(user);

    // Se for requisição AJAX/API, retorna JSON
    if (req.headers.accept?.includes("application/json")) {
      return userEntity;
    }

    // Se for requisição web, renderiza página de detalhes
    return {
      title: `${userEntity.nome} - SGC ITEP`,
      user: userEntity,
    };
  }

  @Get(":id/detalhe")
  @ApiOperation({ summary: "Renderiza página de detalhes do usuário" })
  async detailPage(
    @Param("id", ParseUserIdPipe) id: number,
    @Response() res: ExpressResponse,
  ) {
    return res.redirect(this.buildFrontendUrl(`/usuarios/${id}`));
  }

  @Get(":id/editar")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Renderiza página de edição do usuário" })
  async editPage(
    @Param("id", ParseUserIdPipe) id: number,
    @Response() res: ExpressResponse,
  ) {
    return res.redirect(this.buildFrontendUrl(`/usuarios/${id}/editar`));
  }

  @Patch(":id")
  @Roles("admin")
  @ApiOperation({ summary: "Atualiza usuário" })
  @ApiResponse({ status: 200, description: "Usuário atualizado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  async update(
    @Param("id", ParseUserIdPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const user = await this.updateUserUseCase.execute(id, updateUserDto);
      const userEntity = UserMapper.toEntity(user);

      // Se for requisição AJAX/API, retorna JSON
      if (req.headers.accept?.includes("application/json")) {
        return res.json({
          success: true,
          data: userEntity,
          message: "Usuário reativado com sucesso",
        });
      }

      // Se for requisição web, redireciona
      return res.redirect(
        this.buildFrontendUrl(`/usuarios/${id}/editar`, {
          message: "Usuário atualizado com sucesso",
        }),
      );
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(
        this.buildFrontendUrl(`/usuarios/${id}/editar`, {
          error: error.message,
        }),
      );
    }
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove usuário (soft delete)" })
  @ApiResponse({ status: 204, description: "Usuário removido com sucesso" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  async remove(
    @Param("id", ParseUserIdPipe) id: number,
    @CurrentUser() currentUser: User,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      await this.deleteUserUseCase.execute(id);

      // Se for requisição AJAX/API, retorna status 204
      if (req.headers.accept?.includes("application/json")) {
        return res.status(204).send();
      }

      // Se for requisição web, redireciona
      return res.redirect(
        this.buildFrontendUrl("/usuarios", {
          message: "Usuário removido com sucesso",
        }),
      );
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(
        this.buildFrontendUrl("/usuarios", {
          error: error.message,
        }),
      );
    }
  }

  @Patch(":id/reativar")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Reativa usuário" })
  @ApiResponse({ status: 200, description: "Usuário reativado com sucesso" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  async reactivate(
    @Param("id", ParseUserIdPipe) id: number,
    @CurrentUser() currentUser: User,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const user = await this.restoreUserUseCase.execute(id);
      const userEntity = UserMapper.toEntity(user);

      // Se for requisição AJAX/API, retorna JSON
      if (req.headers.accept?.includes("application/json")) {
        return res.json({
          success: true,
          data: userEntity,
          message: "Usuário atualizado com sucesso",
        });
      }

      // Se for requisição web, redireciona
      return res.redirect(
        this.buildFrontendUrl("/usuarios", {
          message: "Usuário reativado com sucesso",
        }),
      );
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(
        this.buildFrontendUrl("/usuarios", {
          error: error.message,
        }),
      );
    }
  }

  @Get("perfil/meu")
  @ApiOperation({ summary: "Renderiza página do perfil do usuário logado" })
  async profilePage(@Response() res: ExpressResponse) {
    return res.redirect(this.buildFrontendUrl("/configuracoes"));
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    await fsPromises.mkdir(dir, { recursive: true });
  }

  private getAvatarDirectory(): string {
    return join(this.uploadRoot, this.avatarFolder);
  }

  private buildAvatarUrl(fileName: string): string {
    const normalized = fileName.replace(/\\/g, "/");
    if (normalized.startsWith("/uploads/")) {
      return normalized;
    }
    if (normalized.startsWith("uploads/")) {
      return `/${normalized}`;
    }
    return `/uploads/${this.avatarFolder}/${normalized}`;
  }

  private async deleteAvatarFile(avatarUrl?: string | null): Promise<void> {
    if (!avatarUrl) {
      return;
    }

    const relativePath = avatarUrl.replace(/^\/?uploads\//, "");
    const absolutePath = join(this.uploadRoot, relativePath);

    try {
      await fsPromises.unlink(absolutePath);
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        this.logger.warn(
          `Falha ao remover avatar antigo em ${absolutePath}: ${error?.message}`,
        );
      }
    }
  }

  private sanitizeSettings(settings: Record<string, any>): User["settings"] {
    const sanitized: User["settings"] = {};
    if (!settings) {
      return sanitized;
    }

    if (settings.theme === "light" || settings.theme === "dark") {
      sanitized.theme = settings.theme;
    }

    if (typeof settings.showEmail === "boolean") {
      sanitized.showEmail = settings.showEmail;
    }

    if (typeof settings.showPhone === "boolean") {
      sanitized.showPhone = settings.showPhone;
    }

    if (typeof settings.autoSave === "boolean") {
      sanitized.autoSave = settings.autoSave;
    }

    if (typeof settings.compactView === "boolean") {
      sanitized.compactView = settings.compactView;
    }

    const rawItemsPerPage = settings.itemsPerPage;
    const parsedItemsPerPage =
      typeof rawItemsPerPage === "number"
        ? rawItemsPerPage
        : typeof rawItemsPerPage === "string"
          ? Number(rawItemsPerPage)
          : undefined;

    if (
      typeof parsedItemsPerPage === "number" &&
      Number.isFinite(parsedItemsPerPage)
    ) {
      const clamped = Math.min(
        100,
        Math.max(5, Math.round(parsedItemsPerPage)),
      );
      sanitized.itemsPerPage = clamped;
    }

    const knownKeys = new Set([
      "theme",
      "showEmail",
      "showPhone",
      "autoSave",
      "compactView",
      "itemsPerPage",
    ]);

    for (const [key, value] of Object.entries(settings)) {
      if (!knownKeys.has(key) && value !== undefined) {
        sanitized[key] = value as unknown;
      }
    }

    return sanitized;
  }

  // ============= USER PREFERENCES ENDPOINTS =============

  @Get("me/preferences")
  @ApiOperation({ summary: "Get all preferences of current user" })
  @ApiResponse({
    status: 200,
    description: "User preferences retrieved successfully",
  })
  async getMyPreferences(@CurrentUser() user: User) {
    return this.userPreferencesService.getAllPreferences(user.id);
  }

  @Get("me/preferences/:key")
  @ApiOperation({ summary: "Get specific preference of current user" })
  @ApiResponse({
    status: 200,
    description: "Preference retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Preference not found" })
  async getMyPreference(@CurrentUser() user: User, @Param("key") key: string) {
    const value = await this.userPreferencesService.getPreference(user.id, key);
    return { key, value };
  }

  @Post("me/preferences")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set preference for current user" })
  @ApiResponse({ status: 200, description: "Preference saved successfully" })
  async setMyPreference(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserPreferenceDto,
  ) {
    const preference = await this.userPreferencesService.setPreference(
      user.id,
      dto.key,
      dto.value,
    );
    return {
      message: "Preference saved successfully",
      preference: {
        key: preference.preferenceKey,
        value: preference.preferenceValue,
        updatedAt: preference.updatedAt,
      },
    };
  }

  @Delete("me/preferences/:key")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete specific preference of current user" })
  @ApiResponse({ status: 204, description: "Preference deleted successfully" })
  @ApiResponse({ status: 404, description: "Preference not found" })
  async deleteMyPreference(
    @CurrentUser() user: User,
    @Param("key") key: string,
  ) {
    await this.userPreferencesService.deletePreference(user.id, key);
  }

  @Delete("me/preferences")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete all preferences of current user" })
  @ApiResponse({
    status: 204,
    description: "All preferences deleted successfully",
  })
  async deleteAllMyPreferences(@CurrentUser() user: User) {
    await this.userPreferencesService.deleteAllPreferences(user.id);
  }
}
