import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ColunasService } from "../services";
import { CreateColunaDto, UpdateColunaDto } from "../dto";
import { Coluna } from "../entities";

@ApiTags("Colunas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("colunas")
export class ColunasController {
  constructor(private readonly colunasService: ColunasService) {}

  @Post()
  @ApiOperation({ summary: "Criar uma nova coluna" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Coluna criada com sucesso",
    type: Coluna,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Projeto não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para criar colunas neste projeto",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async create(
    @Body() createColunaDto: CreateColunaDto,
    @Request() req: any,
  ): Promise<Coluna> {
    return this.colunasService.create(createColunaDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Listar colunas de um projeto" })
  @ApiQuery({ name: "projetoId", description: "ID do projeto", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de colunas retornada com sucesso",
    type: [Coluna],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Projeto não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Acesso negado ao projeto",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async findAll(
    @Query("projetoId", ParseIntPipe) projetoId: number,
    @Request() req: any,
  ): Promise<Coluna[]> {
    return this.colunasService.findAll(projetoId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar uma coluna específica" })
  @ApiParam({ name: "id", description: "ID da coluna", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Coluna encontrada com sucesso",
    type: Coluna,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Coluna não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Acesso negado à coluna",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Coluna> {
    return this.colunasService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar uma coluna" })
  @ApiParam({ name: "id", description: "ID da coluna", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Coluna atualizada com sucesso",
    type: Coluna,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Coluna não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para editar a coluna",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateColunaDto: UpdateColunaDto,
    @Request() req: any,
  ): Promise<Coluna> {
    return this.colunasService.update(id, updateColunaDto, req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletar uma coluna" })
  @ApiParam({ name: "id", description: "ID da coluna", type: "number" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Coluna deletada com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Coluna não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para deletar a coluna",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Não é possível deletar coluna com tarefas",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    return this.colunasService.remove(id, req.user.id);
  }

  @Patch(":id/move")
  @ApiOperation({ summary: "Mover coluna para nova posição" })
  @ApiParam({ name: "id", description: "ID da coluna", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Coluna movida com sucesso",
    type: Coluna,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Coluna não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para reordenar colunas",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Ordem inválida",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async moveColumn(
    @Param("id", ParseIntPipe) id: number,
    @Body("newOrder", ParseIntPipe) newOrder: number,
    @Request() req: any,
  ): Promise<Coluna> {
    return this.colunasService.moveColumn(id, newOrder, req.user.id);
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Obter estatísticas da coluna" })
  @ApiParam({ name: "id", description: "ID da coluna", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Estatísticas da coluna retornadas com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Coluna não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Acesso negado à coluna",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async getStats(@Param("id", ParseIntPipe) id: number, @Request() req: any) {
    return this.colunasService.getColunaStats(id, req.user.id);
  }
}
