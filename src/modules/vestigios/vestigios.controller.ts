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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { VestigiosService } from "./vestigios.service";
import { CreateVestigioDto } from "./dto/create-vestigio.dto";
import { UpdateVestigioDto } from "./dto/update-vestigio.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("vestigios")
@Controller("vestigios")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class VestigiosController {
  constructor(private readonly vestigiosService: VestigiosService) {}

  @Post()
  @ApiOperation({ summary: "Criar novo vestígio no banco de dados" })
  @ApiResponse({ status: 201, description: "Vestígio criado com sucesso" })
  create(@Body() createVestigioDto: CreateVestigioDto, @Request() req) {
    return this.vestigiosService.create(createVestigioDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos os vestígios" })
  @ApiResponse({ status: 200, description: "Lista de vestígios" })
  findAll(
    @Query("status") status?: string,
    @Query("delegacia") delegacia?: string,
    @Query("categoria") categoria?: string,
    @Query("mesReferencia") mesReferencia?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.vestigiosService.findAll({
      status,
      delegacia,
      categoria,
      mesReferencia,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("statistics")
  @ApiOperation({ summary: "Obter estatísticas dos vestígios" })
  @ApiResponse({ status: 200, description: "Estatísticas dos vestígios" })
  getStatistics() {
    return this.vestigiosService.getStatistics();
  }

  @Get("search")
  @ApiOperation({ summary: "Buscar vestígios por código SCV" })
  @ApiResponse({ status: 200, description: "Vestígios encontrados" })
  search(@Query("codigo") codigo: string) {
    return this.vestigiosService.searchByCodigoScv(codigo);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar vestígio por ID" })
  @ApiResponse({ status: 200, description: "Vestígio encontrado" })
  @ApiResponse({ status: 404, description: "Vestígio não encontrado" })
  findOne(@Param("id") id: string) {
    return this.vestigiosService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar vestígio" })
  @ApiResponse({ status: 200, description: "Vestígio atualizado" })
  update(
    @Param("id") id: string,
    @Body() updateVestigioDto: UpdateVestigioDto,
  ) {
    return this.vestigiosService.update(id, updateVestigioDto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Atualizar status do vestígio" })
  @ApiResponse({ status: 200, description: "Status atualizado" })
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.vestigiosService.updateStatus(id, status);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover vestígio" })
  @ApiResponse({ status: 200, description: "Vestígio removido" })
  remove(@Param("id") id: string) {
    return this.vestigiosService.remove(id);
  }
}
