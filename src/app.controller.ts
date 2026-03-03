import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

import { AppService } from "./app.service";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { SessionAuthGuard } from "./modules/auth/guards/session-auth.guard";
import { User } from "./modules/users/entities/user.entity";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Rota raiz da API" })
  @ApiResponse({
    status: 200,
    description: "Informações da API retornadas com sucesso",
  })
  getRoot(@Res() res: Response) {
    // Redireciona para o frontend
    return res.redirect("http://localhost:3001");
  }

  @Get("dashboard")
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: "Dados do dashboard" })
  @ApiResponse({
    status: 200,
    description: "Dados do dashboard retornados com sucesso",
  })
  async getDashboard(@Req() req: Request) {
    const user = req.user;
    const dashboardData = await this.appService.getDashboardData(user);

    return {
      title: "Dashboard - SGC-ITEP",
      user,
      ...dashboardData,
    };
  }

  @Get("sobre")
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: "Informações sobre o sistema" })
  @ApiResponse({
    status: 200,
    description: "Informações sobre o sistema retornadas com sucesso",
  })
  getSobre(@Req() req: Request) {
    return {
      title: "Sobre - SGC-ITEP",
      version: "1.0",
      description: "Sistema de Gestão de Conteúdo do ITEP",
      user: req.user,
    };
  }

  @Get("test-search")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Teste simples de busca" })
  async testSearch() {
    return {
      message: "Endpoint de busca está funcionando!",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("search")
  @UseGuards(JwtAuthGuard)
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
