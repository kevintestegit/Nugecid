import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ProjetosService } from "../services";
import { MembroProjeto } from "../entities";

@ApiTags("Projetos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projetos/:projetoId/membros")
export class ProjetoMembrosController {
  constructor(private readonly projetosService: ProjetosService) {}

  @Get()
  @ApiOperation({ summary: "Listar membros do projeto" })
  @ApiParam({ name: "projetoId", type: Number })
  async list(
    @Param("projetoId", ParseIntPipe) projetoId: number,
    @Request() req: any,
  ): Promise<MembroProjeto[]> {
    return this.projetosService.listarMembros(projetoId, req.user.id);
  }

  @Get("lookup")
  @ApiOperation({ summary: "Buscar usuários para adicionar ao projeto" })
  @ApiParam({ name: "projetoId", type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  async lookup(
    @Param("projetoId", ParseIntPipe) projetoId: number,
    @Query("search") search: string,
    @Request() req: any,
  ): Promise<any[]> {
    return this.projetosService.buscarUsuariosParaProjeto(
      projetoId,
      req.user.id,
      search,
    );
  }
}
