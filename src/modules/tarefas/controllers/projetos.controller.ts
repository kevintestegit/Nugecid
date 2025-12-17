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
import { ProjetosService } from "../services";
import {
  CreateProjetoDto,
  UpdateProjetoDto,
  AddMembroProjetoDto,
  UpdateMembroProjetoDto,
} from "../dto";
import { Projeto, MembroProjeto } from "../entities";

@ApiTags("Projetos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projetos")
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo projeto" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Projeto criado com sucesso",
    type: Projeto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async create(
    @Body() createProjetoDto: CreateProjetoDto,
    @Request() req: any,
  ): Promise<Projeto> {
    return this.projetosService.create(createProjetoDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos os projetos do usuário" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de projetos retornada com sucesso",
    type: [Projeto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async findAll(@Request() req: any): Promise<Projeto[]> {
    return this.projetosService.findAll(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar um projeto específico" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Projeto encontrado com sucesso",
    type: Projeto,
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
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Projeto> {
    return this.projetosService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar um projeto" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Projeto atualizado com sucesso",
    type: Projeto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Projeto não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para editar o projeto",
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
    @Body() updateProjetoDto: UpdateProjetoDto,
    @Request() req: any,
  ): Promise<Projeto> {
    return this.projetosService.update(id, updateProjetoDto, req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletar um projeto" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Projeto deletado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Projeto não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Apenas o criador pode deletar o projeto",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    return this.projetosService.remove(id, req.user.id);
  }

  @Get(":id/membros")
  @ApiOperation({ summary: "Listar membros do projeto" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de membros retornada com sucesso",
    type: [MembroProjeto],
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
  async getMembros(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<MembroProjeto[]> {
    return this.projetosService.listarMembros(id, req.user.id);
  }

  @Post(":id/membros")
  @ApiOperation({ summary: "Adicionar membro ao projeto" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Membro adicionado com sucesso",
    type: MembroProjeto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Projeto ou usuário não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para adicionar membros",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Usuário já é membro do projeto",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async addMembro(
    @Param("id", ParseIntPipe) id: number,
    @Body() addMembroDto: AddMembroProjetoDto,
    @Request() req: any,
  ): Promise<MembroProjeto> {
    return this.projetosService.addMembro(id, addMembroDto, req.user.id);
  }

  @Patch(":id/membros/:membroId")
  @ApiOperation({ summary: "Atualizar papel de um membro do projeto" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiParam({ name: "membroId", description: "ID do membro", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Papel do membro atualizado com sucesso",
    type: MembroProjeto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Projeto ou membro não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para alterar membros",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Deve haver pelo menos um administrador",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async updateMembro(
    @Param("id", ParseIntPipe) id: number,
    @Param("membroId", ParseIntPipe) membroId: number,
    @Body() updateMembroDto: UpdateMembroProjetoDto,
    @Request() req: any,
  ): Promise<MembroProjeto> {
    return this.projetosService.updateMembro(
      id,
      membroId,
      updateMembroDto,
      req.user.id,
    );
  }

  @Delete(":id/membros/:membroId")
  @ApiOperation({ summary: "Remover membro do projeto" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiParam({ name: "membroId", description: "ID do membro", type: "number" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Membro removido com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Projeto ou membro não encontrado",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Sem permissão para remover membros",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Token de acesso inválido",
  })
  async removeMembro(
    @Param("id", ParseIntPipe) id: number,
    @Param("membroId", ParseIntPipe) membroId: number,
    @Request() req: any,
  ): Promise<void> {
    return this.projetosService.removeMembro(id, membroId, req.user.id);
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Obter estatísticas do projeto" })
  @ApiParam({ name: "id", description: "ID do projeto", type: "number" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Estatísticas do projeto retornadas com sucesso",
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
  async getStats(@Param("id", ParseIntPipe) id: number, @Request() req: any) {
    return this.projetosService.getProjetoStats(id, req.user.id);
  }
}
