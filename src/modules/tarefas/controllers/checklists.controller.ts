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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ChecklistsService } from "../services/checklists.service";
import { CreateChecklistDto, CreateItemChecklistDto, UpdateItemChecklistDto } from "../dto";

@ApiTags("checklists")
@Controller("")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post("tarefas/:tarefaId/checklists")
  @ApiOperation({ summary: "Criar um novo checklist na tarefa" })
  async createChecklist(
    @Param("tarefaId", ParseIntPipe) tarefaId: number,
    @Body() createDto: CreateChecklistDto
  ) {
    return this.checklistsService.create(tarefaId, createDto);
  }

  @Get("tarefas/:tarefaId/checklists")
  @ApiOperation({ summary: "Listar checklists da tarefa" })
  async getChecklists(@Param("tarefaId", ParseIntPipe) tarefaId: number) {
    return this.checklistsService.findAllByTask(tarefaId);
  }

  @Delete("checklists/:id")
  @ApiOperation({ summary: "Excluir checklist" })
  async removeChecklist(@Param("id", ParseIntPipe) id: number) {
    return this.checklistsService.remove(id);
  }

  @Post("checklists/:checklistId/itens")
  @ApiOperation({ summary: "Adicionar item ao checklist" })
  async addItem(
    @Param("checklistId", ParseIntPipe) checklistId: number,
    @Body() createDto: CreateItemChecklistDto
  ) {
    return this.checklistsService.addItem(checklistId, createDto);
  }

  @Patch("checklists/itens/:itemId")
  @ApiOperation({ summary: "Atualizar item do checklist (texto ou status)" })
  async updateItem(
    @Param("itemId", ParseIntPipe) itemId: number,
    @Body() updateDto: UpdateItemChecklistDto,
    @Request() req: any
  ) {
    return this.checklistsService.updateItem(itemId, updateDto, req.user.id);
  }

  @Delete("checklists/itens/:itemId")
  @ApiOperation({ summary: "Excluir item do checklist" })
  async removeItem(@Param("itemId", ParseIntPipe) itemId: number) {
    return this.checklistsService.removeItem(itemId);
  }
}
