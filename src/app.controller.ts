import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

import { AppService } from "./app.service";
import { RolesGuard } from "./modules/auth/guards/roles.guard";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { WebAuthGuard } from "./modules/auth/guards/web-auth.guard";
import { Roles } from "./common/decorators/roles.decorator";
import { User } from "./modules/users/entities/user.entity";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  private buildFrontendUrl(pathname = "/") {
    return new URL(
      pathname,
      this.configService.get<string>(
        "app.frontendUrl",
        "http://localhost:3001",
      ),
    ).toString();
  }

  @Get()
  @ApiOperation({ summary: "Rota raiz da API" })
  @ApiResponse({
    status: 200,
    description: "Informações da API retornadas com sucesso",
  })
  getRoot(@Res() res: Response) {
    return res.redirect(this.buildFrontendUrl("/"));
  }

  @Get("dashboard")
  @UseGuards(WebAuthGuard)
  @ApiOperation({ summary: "Dados do dashboard" })
  @ApiResponse({
    status: 200,
    description: "Dados do dashboard retornados com sucesso",
  })
  getDashboard(@Res() res: Response) {
    return res.redirect(this.buildFrontendUrl("/"));
  }

  @Get("sobre")
  @UseGuards(WebAuthGuard)
  @ApiOperation({ summary: "Informações sobre o sistema" })
  @ApiResponse({
    status: 200,
    description: "Informações sobre o sistema retornadas com sucesso",
  })
  getSobre(@Res() res: Response) {
    return res.redirect(this.buildFrontendUrl("/sobre"));
  }

  @Get("test-search")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Teste simples de busca" })
  async testSearch() {
    return {
      message: "Endpoint de busca está funcionando!",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("search")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "coordenador", "usuario")
  @ApiOperation({ summary: "Busca global no sistema" })
  @ApiQuery({
    name: "query",
    required: true,
    type: String,
    description: "Termo de busca",
  })
  @ApiQuery({
    name: "types",
    required: false,
    type: String,
    description:
      "Tipos separados por vírgula: desarquivamento,usuario,tarefa,projeto,pasta,vestigio,notificacao,planilha",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Limite de resultados",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "Offset para paginação",
  })
  @ApiResponse({
    status: 200,
    description: "Resultados da busca retornados com sucesso",
  })
  async search(
    @Query("query") query: string,
    @Query("types") types?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Req() req?: Request,
  ) {
    const currentUser = req?.user as User | undefined;
    if (!currentUser?.id) {
      throw new UnauthorizedException("Usuário autenticado não encontrado");
    }

    const searchTypes = types
      ? types.split(",").map((t) => t.trim())
      : undefined;
    const searchLimit = limit ? parseInt(limit, 10) : 10;
    const searchOffset = offset ? parseInt(offset, 10) : 0;

    const results = await this.appService.globalSearch({
      query,
      types: searchTypes,
      limit: searchLimit,
      offset: searchOffset,
      currentUser,
    });
    return results;
  }
}
