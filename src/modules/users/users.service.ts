import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Header,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Render,
  Request,
  Response,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
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
import { QueryUsersDto } from "./application/dto/query-users.dto";

// Guards and Decorators
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "./entities/user.entity";

// Mappers
import { UserMapper } from "./infrastructure/mappers/user.mapper";
import { RoleMapper } from "./infrastructure/mappers/role.mapper";

@ApiTags("Usuários")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly restoreUserUseCase: RestoreUserUseCase,
    private readonly getUserStatisticsUseCase: GetUserStatisticsUseCase,
    private readonly getRolesUseCase: GetRolesUseCase,
  ) {}

  @Get()
  @Roles("admin")
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
  @ApiResponse({
    status: 200,
    description: "Lista de usuários retornada com sucesso.",
  })
  async findAll(@Query() query: QueryUsersDto) {
    const result = await this.getUsersUseCase.execute(query as any);

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
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["nome", "usuario", "criadoEm", "ultimoLogin"],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiResponse({ status: 200, description: "Lista de usuários" })
  async findAllApi(@Query() query: QueryUsersDto) {
    const result = await this.getUsersUseCase.execute(query as any);

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

  @Get("novo")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @Render("usuarios/novo")
  @ApiOperation({ summary: "Renderiza página de criação de usuário" })
  async createPage() {
    const roles = await this.getRolesUseCase.execute();
    return {
      title: "Novo Usuário - SGC ITEP",
      roles: roles.map((role) => RoleMapper.toEntity(role)),
    };
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
      return res.redirect("/users?message=Usuário criado com sucesso");
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(
        `/users/novo?error=${encodeURIComponent(error.message)}`,
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
    @Param("id", ParseIntPipe) id: number,
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
  @Render("usuarios/detalhe")
  @ApiOperation({ summary: "Renderiza página de detalhes do usuário" })
  async detailPage(@Param("id", ParseIntPipe) id: number) {
    const user = await this.getUserByIdUseCase.execute(id);
    const userEntity = UserMapper.toEntity(user);
    return {
      title: `${userEntity.nome} - SGC ITEP`,
      user: userEntity,
    };
  }

  @Get(":id/editar")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @Render("usuarios/editar")
  @ApiOperation({ summary: "Renderiza página de edição do usuário" })
  async editPage(@Param("id", ParseIntPipe) id: number) {
    const user = await this.getUserByIdUseCase.execute(id);
    const roles = await this.getRolesUseCase.execute();
    const userEntity = UserMapper.toEntity(user);
    return {
      title: `Editar ${userEntity.nome} - SGC ITEP`,
      user: userEntity,
      roles: roles.map((role) => RoleMapper.toEntity(role)),
    };
  }

  @Patch(":id")
  @Roles("admin")
  @ApiOperation({ summary: "Atualiza usuário" })
  @ApiResponse({ status: 200, description: "Usuário atualizado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  async update(
    @Param("id", ParseIntPipe) id: number,
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
        return res.json(userEntity);
      }

      // Se for requisição web, redireciona
      return res.redirect(
        `/users/${id}?message=Usuário atualizado com sucesso`,
      );
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(
        `/users/${id}/editar?error=${encodeURIComponent(error.message)}`,
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
    @Param("id", ParseIntPipe) id: number,
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
      return res.redirect("/users?message=Usuário removido com sucesso");
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(`/users?error=${encodeURIComponent(error.message)}`);
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
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const user = await this.restoreUserUseCase.execute(id);
      const userEntity = UserMapper.toEntity(user);

      // Se for requisição AJAX/API, retorna JSON
      if (req.headers.accept?.includes("application/json")) {
        return res.json(userEntity);
      }

      // Se for requisição web, redireciona
      return res.redirect(`/users/${id}?message=Usuário reativado com sucesso`);
    } catch (error) {
      if (req.headers.accept?.includes("application/json")) {
        return res.status(400).json({ message: error.message });
      }

      return res.redirect(`/users?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Get("perfil/meu")
  @Render("usuarios/perfil")
  @ApiOperation({ summary: "Renderiza página do perfil do usuário logado" })
  async profilePage(@CurrentUser() currentUser: User) {
    const user = await this.getUserByIdUseCase.execute(currentUser.id);
    const userEntity = UserMapper.toEntity(user);
    return {
      title: "Meu Perfil - SGC ITEP",
      user: userEntity,
      isOwnProfile: true,
    };
  }
}
