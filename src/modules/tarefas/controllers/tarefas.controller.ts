import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TarefasService } from '../services';
import {
  CreateTarefaDto,
  UpdateTarefaDto,
  MoveTarefaDto,
  QueryTarefaDto,
} from '../dto';
import { Tarefa } from '../entities';

@ApiTags('tarefas')
@Controller('tarefas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova tarefa' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tarefa criada com sucesso',
    type: Tarefa,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Projeto ou coluna não encontrados',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sem permissão para criar tarefas neste projeto',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acesso inválido',
  })
  async create(
    @Body() createTarefaDto: CreateTarefaDto,
    @Request() req: any,
  ): Promise<Tarefa> {
    return this.tarefasService.create(createTarefaDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas retornada com sucesso',
    type: [Tarefa],
  })
  async findAll(
    @Query() queryDto: QueryTarefaDto,
    @Request() req: any,
  ): Promise<{
    data: Tarefa[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    return this.tarefasService.findWithFilters(queryDto, req.user.id);
  }

  @Get('estatisticas/:projetoId')
  @ApiOperation({ summary: 'Obter estatísticas de tarefas do projeto' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getEstatisticas(
    @Param('projetoId', ParseIntPipe) projetoId: number,
    @Request() req: any,
  ) {
    return this.tarefasService.getEstatisticasProjeto(projetoId, req.user.id);
  }

  @Get('usuario')
  @ApiOperation({ summary: 'Listar tarefas do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Tarefas do usuário retornadas com sucesso',
    type: [Tarefa],
  })
  async getTarefasUsuario(
    @Query() queryDto: QueryTarefaDto,
    @Request() req: any,
  ): Promise<Tarefa[]> {
    return this.tarefasService.getTarefasUsuario(req.user.id, queryDto);
  }

  @Get('atrasadas/:projetoId')
  @ApiOperation({ summary: 'Listar tarefas atrasadas por projeto' })
  @ApiParam({ name: 'projetoId', description: 'ID do projeto', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas atrasadas retornada com sucesso',
    type: [Tarefa],
  })
  async getTarefasAtrasadas(
    @Param('projetoId', ParseIntPipe) projetoId: number,
    @Request() req: any,
  ): Promise<Tarefa[]> {
    return this.tarefasService.getTarefasAtrasadas(projetoId, req.user.id);
  }

@Get(':id')
  @ApiOperation({ summary: 'Buscar uma tarefa específica' })
  @ApiParam({ name: 'id', description: 'ID da tarefa', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarefa encontrada com sucesso',
    type: Tarefa,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarefa não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado à tarefa',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acesso inválido',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Tarefa> {
    return this.tarefasService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  @ApiResponse({
    status: 200,
    description: 'Tarefa atualizada com sucesso',
    type: Tarefa,
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar esta tarefa',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTarefaDto: UpdateTarefaDto,
    @Request() req: any,
  ): Promise<Tarefa> {
    return this.tarefasService.update(id, updateTarefaDto, req.user.id);
  }

  @Patch(':id/mover')
  @ApiOperation({ summary: 'Mover tarefa para outra coluna' })
  @ApiResponse({
    status: 200,
    description: 'Tarefa movida com sucesso',
    type: Tarefa,
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para mover esta tarefa',
  })
  async moveTarefa(
    @Param('id', ParseIntPipe) id: number,
    @Body() moveTarefaDto: MoveTarefaDto,
    @Request() req: any,
  ): Promise<Tarefa> {
    return this.tarefasService.moveTarefa(id, moveTarefaDto, req.user.id);
  }

  @Post(':id/duplicar')
  @ApiOperation({ summary: 'Duplicar tarefa' })
  @ApiResponse({
    status: 201,
    description: 'Tarefa duplicada com sucesso',
    type: Tarefa,
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para duplicar esta tarefa',
  })
  async duplicarTarefa(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Tarefa> {
    return this.tarefasService.duplicarTarefa(id, req.user.id);
  }

  @Patch(':id/arquivar')
  @ApiOperation({ summary: 'Arquivar/desarquivar tarefa' })
  @ApiResponse({
    status: 200,
    description: 'Status de arquivo da tarefa alterado com sucesso',
    type: Tarefa,
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para arquivar esta tarefa',
  })
  async arquivarTarefa(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Tarefa> {
    return this.tarefasService.arquivarTarefa(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir tarefa' })
  @ApiResponse({ status: 204, description: 'Tarefa excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para excluir esta tarefa',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    return this.tarefasService.remove(id, req.user.id);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Obter histórico de alterações da tarefa' })
  @ApiResponse({
    status: 200,
    description: 'Histórico retornado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar o histórico desta tarefa',
  })
  async getHistorico(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.tarefasService.getHistorico(id, req.user.id);
  }
}
