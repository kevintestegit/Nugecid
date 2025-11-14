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
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AnnouncementsService } from '../services';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '../dto';

@ApiTags('announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Criar novo aviso do sistema (Admin)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Aviso criado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async create(@Body() createDto: CreateAnnouncementDto, @Request() req: any) {
    const announcement = await this.announcementsService.create(
      createDto,
      req.user.id,
    );

    return {
      success: true,
      data: announcement,
      message: 'Aviso criado com sucesso',
    };
  }

  @Get()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Listar todos os avisos (Admin/Coordenador)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir avisos inativos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de avisos retornada com sucesso',
  })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const announcements = await this.announcementsService.findAll(
      includeInactive === 'true',
    );

    return {
      success: true,
      data: announcements,
      total: announcements.length,
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Listar avisos ativos não visualizados para o usuário logado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avisos ativos retornados com sucesso',
  })
  async findActiveForUser(@Request() req: any) {
    const announcements = await this.announcementsService.findActiveForUser(
      req.user.id,
    );

    return {
      success: true,
      data: announcements,
      total: announcements.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar aviso por ID' })
  @ApiParam({ name: 'id', description: 'ID do aviso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aviso encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aviso não encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const announcement = await this.announcementsService.findOne(id);

    return {
      success: true,
      data: announcement,
    };
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Atualizar aviso (Admin)' })
  @ApiParam({ name: 'id', description: 'ID do aviso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aviso atualizado com sucesso',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAnnouncementDto,
  ) {
    const announcement = await this.announcementsService.update(id, updateDto);

    return {
      success: true,
      data: announcement,
      message: 'Aviso atualizado com sucesso',
    };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover aviso (Admin)' })
  @ApiParam({ name: 'id', description: 'ID do aviso' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Aviso removido com sucesso',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.announcementsService.remove(id);
  }

  @Post(':id/mark-viewed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar aviso como visualizado' })
  @ApiParam({ name: 'id', description: 'ID do aviso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aviso marcado como visualizado',
  })
  async markAsViewed(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const viewed = await this.announcementsService.markAsViewed(
      id,
      req.user.id,
    );

    return {
      success: true,
      data: viewed,
      message: 'Aviso marcado como visualizado',
    };
  }

  @Get(':id/stats')
  @Roles('admin', 'coordenador')
  @ApiOperation({
    summary: 'Obter estatísticas de visualização (Admin/Coordenador)',
  })
  @ApiParam({ name: 'id', description: 'ID do aviso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getStats(@Param('id', ParseIntPipe) id: number) {
    const stats = await this.announcementsService.getViewStats(id);

    return {
      success: true,
      data: stats,
    };
  }
}
