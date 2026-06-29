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
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RoleType } from "../users/enums/role-type.enum";
import { User } from "../users/entities/user.entity";

@ApiTags("vestigios")
@Controller("vestigios")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles(RoleType.ADMIN, RoleType.COORDENADOR, RoleType.NUGECID_OPERATOR)
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
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  update(
    @Param("id") id: string,
    @Body() updateVestigioDto: UpdateVestigioDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.vestigiosService.update(id, updateVestigioDto, currentUser.id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Atualizar status do vestígio" })
  @ApiResponse({ status: 200, description: "Status atualizado" })
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.vestigiosService.updateStatus(id, status, currentUser.id);
  }

  @Delete("catalogacao/pendentes")
  @ApiOperation({
    summary: "Esvaziar fila de vestígios pendentes de catalogação",
  })
  @ApiResponse({
    status: 200,
    description: "Vestígios pendentes de catalogação removidos",
  })
  @Roles(RoleType.ADMIN)
  clearCatalogacaoPendente() {
    return this.vestigiosService.clearCatalogacaoPendente();
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover vestígio" })
  @ApiResponse({ status: 200, description: "Vestígio removido" })
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR)
  remove(@Param("id") id: string, @CurrentUser() currentUser: User) {
    return this.vestigiosService.remove(id, currentUser.id);
  }
}
