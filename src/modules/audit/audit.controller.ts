import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { QueryAuditDto } from "./dto/query-audit.dto";
import { AuditService } from "./audit.service";

@ApiTags("Auditoria")
@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles("admin", "coordenador")
  @ApiOperation({ summary: "Lista eventos de auditoria do sistema" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "action", required: false, type: String })
  @ApiQuery({ name: "entityName", required: false, type: String })
  @ApiQuery({ name: "userId", required: false, type: Number })
  @ApiQuery({ name: "success", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, description: "Auditoria listada com sucesso" })
  @ApiResponse({ status: 403, description: "Acesso negado" })
  async findAll(@Query() query: QueryAuditDto) {
    const result = await this.auditService.findAll(query);

    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}
