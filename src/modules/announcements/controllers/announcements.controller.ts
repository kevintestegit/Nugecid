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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { randomUUID } from "crypto";
import { extname } from "path";
import { promises as fs } from "fs";
import * as path from "path";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AnnouncementsService } from "../services";
import { CreateAnnouncementDto, UpdateAnnouncementDto } from "../dto";
import { FileValidator } from "../../../common/utils/file-validator";

@ApiTags("announcements")
@Controller("announcements")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles("admin")
  @ApiOperation({ summary: "Criar novo aviso do sistema (Admin)" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Aviso criado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos",
  })
  async create(@Body() createDto: CreateAnnouncementDto, @Request() req: any) {
    const announcement = await this.announcementsService.create(
      createDto,
      req.user.id,
    );

    return {
      success: true,
      data: announcement,
      message: "Aviso criado com sucesso",
    };
  }

  @Get()
  @Roles("admin", "coordenador")
  @ApiOperation({ summary: "Listar todos os avisos (Admin/Coordenador)" })
  @ApiQuery({
    name: "includeInactive",
    required: false,
    type: Boolean,
    description: "Incluir avisos inativos",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de avisos retornada com sucesso",
  })
  async findAll(@Query("includeInactive") includeInactive?: string) {
    const announcements = await this.announcementsService.findAll(
      includeInactive === "true",
    );

    return {
      success: true,
      data: announcements,
      total: announcements.length,
    };
  }

  @Get("active")
  @ApiOperation({
    summary: "Listar avisos ativos não visualizados para o usuário logado",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Avisos ativos retornados com sucesso",
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

  @Post("upload-image")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: "Upload de imagem para aviso (Admin)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Imagem enviada com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Arquivo inválido",
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo enviado");
    }

    // Validar conteúdo real do arquivo por magic bytes
    await FileValidator.validateImage(file.buffer);

    // Criar diretório se não existir
    const uploadPath = path.join(process.cwd(), "uploads", "announcements");
    await fs.mkdir(uploadPath, { recursive: true });

    // Gerar nome único usando crypto (mais seguro que Math.random)
    const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    const ext = extname(file.originalname);
    const filename = `announcement-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadPath, filename);

    // Salvar arquivo
    await fs.writeFile(filePath, file.buffer);

    const imageUrl = `/uploads/announcements/${filename}`;

    return {
      success: true,
      data: {
        filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: imageUrl,
      },
      message: "Imagem enviada com sucesso",
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar aviso por ID" })
  @ApiParam({ name: "id", description: "ID do aviso" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Aviso encontrado",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Aviso não encontrado",
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const announcement = await this.announcementsService.findOne(id);

    return {
      success: true,
      data: announcement,
    };
  }

  @Patch(":id")
  @Roles("admin")
  @ApiOperation({ summary: "Atualizar aviso (Admin)" })
  @ApiParam({ name: "id", description: "ID do aviso" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Aviso atualizado com sucesso",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateAnnouncementDto,
  ) {
    const announcement = await this.announcementsService.update(id, updateDto);

    return {
      success: true,
      data: announcement,
      message: "Aviso atualizado com sucesso",
    };
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remover aviso (Admin)" })
  @ApiParam({ name: "id", description: "ID do aviso" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Aviso removido com sucesso",
  })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.announcementsService.remove(id);
  }

  @Post(":id/mark-viewed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Marcar aviso como visualizado" })
  @ApiParam({ name: "id", description: "ID do aviso" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Aviso marcado como visualizado",
  })
  async markAsViewed(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const viewed = await this.announcementsService.markAsViewed(
      id,
      req.user.id,
    );

    return {
      success: true,
      data: viewed,
      message: "Aviso marcado como visualizado",
    };
  }

  @Get(":id/stats")
  @Roles("admin", "coordenador")
  @ApiOperation({
    summary: "Obter estatísticas de visualização (Admin/Coordenador)",
  })
  @ApiParam({ name: "id", description: "ID do aviso" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Estatísticas retornadas com sucesso",
  })
  async getStats(@Param("id", ParseIntPipe) id: number) {
    const stats = await this.announcementsService.getViewStats(id);

    return {
      success: true,
      data: stats,
    };
  }
}
