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
import { ComentariosService } from "../services";
import { CreateComentarioDto, UpdateComentarioDto } from "../dto";
import { Comentario } from "../entities";

@ApiTags("Comentários")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("comentarios")
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo comentário" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Comentário criado com sucesso",
    type: Comentario,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Tarefa não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para comentar nesta tarefa",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async create(
    @Body() createComentarioDto: CreateComentarioDto,
    @Request() req: any,
  ): Promise<Comentario> {
    return this.comentariosService.create(createComentarioDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Listar comentários de uma tarefa" })
  @ApiQuery({ name: "tarefaId", description: "ID da tarefa", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de comentários retornada com sucesso",
    type: [Comentario],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Tarefa não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Acesso negado à tarefa",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async findAll(
    @Query("tarefaId", ParseIntPipe) tarefaId: number,
    @Request() req: any,
  ): Promise<Comentario[]> {
    return this.comentariosService.findAll(tarefaId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um comentário específico" })
  @ApiParam({ name: "id", description: "ID do comentário", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Comentário encontrado com sucesso",
    type: Comentario,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Comentário não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Acesso negado ao comentário",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Comentario> {
    return this.comentariosService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar um comentário" })
  @ApiParam({ name: "id", description: "ID do comentário", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Comentário atualizado com sucesso",
    type: Comentario,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Comentário não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para editar o comentário",
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
    @Body() updateComentarioDto: UpdateComentarioDto,
    @Request() req: any,
  ): Promise<Comentario> {
    return this.comentariosService.update(id, updateComentarioDto, req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletar um comentário" })
  @ApiParam({ name: "id", description: "ID do comentário", type: "number" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Comentário deletado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Comentário não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para deletar o comentário",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    return this.comentariosService.remove(id, req.user.id);
  }

  @Get("tarefa/:tarefaId/estatisticas")
  @ApiOperation({ summary: "Obter estatísticas de comentários de uma tarefa" })
  @ApiParam({ name: "tarefaId", description: "ID da tarefa", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Estatísticas de comentários retornadas com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Tarefa não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Acesso negado à tarefa",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async getEstatisticas(
    @Param("tarefaId", ParseIntPipe) tarefaId: number,
    @Request() req: any,
  ) {
    return this.comentariosService.getEstatisticasComentarios(
      tarefaId,
      req.user.id,
    );
  }

  @Get("periodo")
  @ApiOperation({ summary: "Obter comentários por período" })
  @ApiQuery({ name: "tarefaId", description: "ID da tarefa", type: "number" })
  @ApiQuery({
    name: "dataInicio",
    description: "Data de início (YYYY-MM-DD)",
    type: "string",
  })
  @ApiQuery({
    name: "dataFim",
    description: "Data de fim (YYYY-MM-DD)",
    type: "string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Comentários do período retornados com sucesso",
    type: [Comentario],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Tarefa não encontrada",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Acesso negado à tarefa",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Datas inválidas",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async getComentariosPorPeriodo(
    @Query("tarefaId", ParseIntPipe) tarefaId: number,
    @Query("dataInicio") dataInicio: string,
    @Query("dataFim") dataFim: string,
    @Request() req: any,
  ): Promise<Comentario[]> {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    return this.comentariosService.getComentariosPorPeriodo(
      tarefaId,
      inicio,
      fim,
      req.user.id,
    );
  }
}
