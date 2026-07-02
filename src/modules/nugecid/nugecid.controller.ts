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
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Res,
  Req,
  Headers,
  Logger,
  BadRequestException,
  Header,
  NotFoundException,
  ForbiddenException,
  NotAcceptableException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { Response, Request } from "express";
import { URL } from "url";

// Use Cases
import {
  CreateDesarquivamentoUseCase,
  FindAllDesarquivamentosUseCase,
  FindDesarquivamentoByIdUseCase,
  UpdateDesarquivamentoUseCase,
  DeleteDesarquivamentoUseCase,
  RestoreDesarquivamentoUseCase,
} from "./application/use-cases";

// DTOs
import { CreateDesarquivamentoDto } from "./dto/create-desarquivamento.dto";
import { UpdateDesarquivamentoDto } from "./dto/update-desarquivamento.dto";
import { QueryDesarquivamentoDto } from "./dto/query-desarquivamento.dto";
import { CreateDesarquivamentoCommentDto } from "./dto/create-comment.dto";

// New Services
import { NugecidImportService } from "./nugecid-import.service";
import { NugecidStatsService } from "./nugecid-stats.service";
import { NugecidPdfService } from "./nugecid-pdf.service";
import { NugecidExportService } from "./nugecid-export.service";
import { NugecidDocxService } from "./nugecid-docx.service";
import { NugecidService } from "./nugecid.service";
import { NugecidAuditService } from "./nugecid-audit.service";
import { StatusDesarquivamentoEnum } from "./domain/enums/status-desarquivamento.enum";

// Guards and Decorators
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import { RoleType } from "../users/enums/role-type.enum";
import { AntivirusService } from "../security/antivirus.service";
import { ConfigService } from "@nestjs/config";

type AuditFieldType = "status" | "date" | "boolean" | "number" | "text";

type AuditTrackedField = {
  field: string;
  type: AuditFieldType;
};

const STATUS_ALIAS_MAP: Record<string, StatusDesarquivamentoEnum> = {
  REARQUIVADO: StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
  REARQUIVAMENTO: StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
};

const PRINTABLE_STATUS_LIST = [
  StatusDesarquivamentoEnum.DESARQUIVADO,
  StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
];

const UPDATE_AUDIT_FIELDS: ReadonlyArray<AuditTrackedField> = [
  { field: "status", type: "status" },
  { field: "dataSolicitacao", type: "date" },
  { field: "dataDesarquivamentoSAG", type: "date" },
  { field: "dataDevolucaoSetor", type: "date" },
  { field: "desarquivamentoFisicoDigital", type: "text" },
  { field: "tipoDesarquivamento", type: "text" },
  { field: "nomeCompleto", type: "text" },
  { field: "numeroNicLaudoAuto", type: "text" },
  { field: "numeroProcesso", type: "text" },
  { field: "tipoDocumento", type: "text" },
  { field: "setorDemandante", type: "text" },
  { field: "servidorResponsavel", type: "text" },
  { field: "finalidadeDesarquivamento", type: "text" },
  { field: "solicitacaoProrrogacao", type: "boolean" },
  { field: "solicitacaoProrrogacaoTexto", type: "text" },
  { field: "dadosAdicionais", type: "text" },
  { field: "numeroOficio", type: "text" },
  { field: "urgente", type: "boolean" },
  { field: "instituto", type: "text" },
  { field: "requerente", type: "text" },
  { field: "responsavelId", type: "number" },
];

const STATUSS_WITH_DESARQUIVAMENTO_DATE = new Set<StatusDesarquivamentoEnum>([
  StatusDesarquivamentoEnum.DESARQUIVADO,
  StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
  StatusDesarquivamentoEnum.FINALIZADO,
  StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR,
]);

const STATUSS_WITH_DEVOLUCAO_DATE = new Set<StatusDesarquivamentoEnum>([
  StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
  StatusDesarquivamentoEnum.FINALIZADO,
]);

@ApiTags("NUGECID - Desarquivamentos")
@Controller("nugecid")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NugecidController {
  private readonly logger = new Logger(NugecidController.name);

  constructor(
    private readonly createDesarquivamentoUseCase: CreateDesarquivamentoUseCase,
    private readonly findAllDesarquivamentosUseCase: FindAllDesarquivamentosUseCase,
    private readonly findDesarquivamentoByIdUseCase: FindDesarquivamentoByIdUseCase,
    private readonly updateDesarquivamentoUseCase: UpdateDesarquivamentoUseCase,
    private readonly deleteDesarquivamentoUseCase: DeleteDesarquivamentoUseCase,
    private readonly restoreDesarquivamentoUseCase: RestoreDesarquivamentoUseCase,
    private readonly nugecidImportService: NugecidImportService,
    private readonly nugecidStatsService: NugecidStatsService,
    private readonly nugecidPdfService: NugecidPdfService,
    private readonly nugecidExportService: NugecidExportService,
    private readonly nugecidDocxService: NugecidDocxService,
    private readonly nugecidService: NugecidService,
    private readonly nugecidAuditService: NugecidAuditService,
    private readonly antivirusService: AntivirusService,
    private readonly configService: ConfigService,
  ) {}

  private buildFrontendUrl(pathname: string) {
    return new URL(
      pathname,
      this.configService.get<string>(
        "app.frontendUrl",
        "http://localhost:3001",
      ),
    ).toString();
  }

  private assertJsonCollectionRequest(acceptHeader?: string): void {
    const acceptsHtml = acceptHeader?.toLowerCase().includes("text/html");
    const acceptsJson = acceptHeader
      ?.toLowerCase()
      .includes("application/json");

    if (acceptsHtml && !acceptsJson) {
      throw new NotAcceptableException(
        "Endpoint disponível apenas para clientes JSON",
      );
    }
  }

  @Post()
  @ApiOperation({ summary: "Criar nova solicitação de desarquivamento" })
  @ApiResponse({
    status: 201,
    description: "Desarquivamento criado com sucesso",
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDesarquivamentoDto: CreateDesarquivamentoDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.createDesarquivamentoUseCase.execute({
      ...createDesarquivamentoDto,
      criadoPorId: currentUser.id,
    });

    await this.nugecidAuditService.saveDesarquivamentoAudit(
      currentUser.id,
      "CREATE",
      result as any,
      null,
      req.ip,
      req.get("user-agent"),
    );

    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Desarquivamento criado com sucesso",
      data: result,
    });
  }

  @Post("import")
  @ApiOperation({ summary: "Importar desarquivamentos de planilha Excel" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Arquivo Excel com desarquivamentos",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  async importDesarquivamentos(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException(
        "Arquivo não enviado. Por favor, envie um arquivo Excel.",
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        "O arquivo enviado está vazio. Verifique se o arquivo Excel tem dados.",
      );
    }

    this.logger.log(
      `[${new Date().toISOString()}] 📁 Importando arquivo: ${file.originalname} (${file.size} bytes)`,
    );

    await this.antivirusService.scanUploadedFile(file, {
      source: "nugecid.import-desarquivamentos",
    });

    const result = await this.nugecidImportService.importFromXLSX(
      file,
      currentUser,
    );

    // Se TODOS os registros falharam, retornar erro HTTP 400
    if (result.errorCount > 0 && result.successCount === 0) {
      // Pegar os primeiros 10 erros para mostrar ao usuário
      const primeirosErros = result.errors.slice(0, 10);
      const mensagensErro = primeirosErros.map(
        (erro) => `• Linha ${erro.row}: ${erro.details.message}`,
      );

      const mensagemResumo =
        result.errors.length > 10
          ? `\n\n... e mais ${result.errors.length - 10} erros.`
          : "";

      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: `Falha na importação: todos os ${result.totalRows} registros contêm erros de validação.`,
        error: {
          type: "VALIDATION_ERROR",
          totalErrors: result.errorCount,
          summary: `Nenhum registro foi importado. Corrija os erros abaixo na planilha e reimporte:\n\n${mensagensErro.join("\n")}${mensagemResumo}`,
          errors: result.errors, // Todos os erros detalhados
        },
        data: {
          totalRows: result.totalRows,
          successCount: 0,
          errorCount: result.errorCount,
        },
      });
    }

    // Se há erros parciais, retornar aviso mas com sucesso
    if (result.errorCount > 0) {
      const primeirosErros = result.errors.slice(0, 5);
      const mensagensErro = primeirosErros.map(
        (erro) => `• Linha ${erro.row}: ${erro.details.message}`,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: `Importação parcial: ${result.successCount} de ${result.totalRows} registros importados. ${result.errorCount} registros com erros.`,
        warning: {
          type: "PARTIAL_IMPORT",
          errorsFound: result.errorCount,
          summary: `Os seguintes registros não foram importados:\n\n${mensagensErro.join("\n")}`,
          errors: result.errors,
        },
        data: result,
      });
    }

    // Sucesso total
    return res.status(HttpStatus.OK).json({
      success: true,
      message: `Importação concluída com sucesso: ${result.successCount} registros importados.`,
      data: result,
    });
  }

  @Get("export")
  @ApiOperation({ summary: "Exportar desarquivamentos para planilha Excel" })
  @ApiQuery({ type: QueryDesarquivamentoDto })
  @Roles(RoleType.ADMIN, RoleType.USUARIO)
  @ApiBearerAuth()
  @Header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  @Header("Content-Disposition", "attachment; filename=desarquivamentos.xlsx")
  async exportDesarquivamentos(
    @Query() queryDto: QueryDesarquivamentoDto,
    @CurrentUser() currentUser: User,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[${new Date().toISOString()}] 📤 Exportando desarquivamentos - Usuário: ${currentUser.usuario}`,
    );

    const buffer = await this.nugecidExportService.exportToExcel(
      queryDto,
      currentUser,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=desarquivamentos_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    res.send(buffer);
  }

  // Alias de compatibilidade: alguns clientes chamam /api/nugecid/import-desarquivamentos
  @Post("import-desarquivamentos")
  @ApiOperation({
    summary: "Importar desarquivamentos (alias compatível com rotas legadas)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Arquivo Excel com desarquivamentos",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  async importDesarquivamentosAlias(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
    @Res() res: Response,
  ) {
    // Delega para o método principal, evitando duplicação de código
    return this.importDesarquivamentos(file, currentUser, res);
  }

  @Post("import-registros")
  @ApiOperation({ summary: "Importar registros de um arquivo .xlsx ou .csv" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description:
      "Arquivo (.xlsx ou .csv) contendo os registros para importação",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.CREATED)
  async importRegistros(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ) {
    if (!file) {
      throw new BadRequestException(
        "Nenhum arquivo enviado. Por favor, anexe um arquivo .xlsx ou .csv.",
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        "O arquivo enviado está vazio. Verifique se o arquivo Excel tem dados.",
      );
    }

    this.logger.log(
      `[${new Date().toISOString()}] 📁 Importando registros: ${file.originalname} (${file.size} bytes)`,
    );

    await this.antivirusService.scanUploadedFile(file, {
      source: "nugecid.import-registros",
    });

    const result = await this.nugecidImportService.importRegistrosFromXLSX(
      file,
      currentUser,
    );

    return {
      success: true,
      message: `Importação concluída: ${result.successCount} de ${result.totalRows} registros importados com sucesso.`,
      data: result,
    };
  }

  @Get(":id/termo")
  @ApiOperation({ summary: "Gerar termo de entrega de desarquivamento em PDF" })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "number",
  })
  @ApiBearerAuth()
  @Header("Content-Type", "application/pdf")
  @Header("Content-Disposition", "attachment; filename=termo_de_entrega.pdf")
  async getTermoDeEntrega(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() currentUser: User,
  ) {
    const desarquivamento = await this.findDesarquivamentoByIdUseCase.execute({
      id,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });
    const buffer = await this.nugecidPdfService.generatePdf(
      desarquivamento as any,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=termo_de_entrega_${id}.pdf`,
    );
    res.send(buffer);
  }

  @Get(":id/termo-docx")
  @ApiOperation({
    summary: "Gerar termo de entrega de desarquivamento em Word (DOCX)",
  })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "number",
  })
  @ApiBearerAuth()
  @Header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  )
  @Header("Content-Disposition", "attachment; filename=termo_de_entrega.docx")
  async getTermoDeEntregaDocx(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() currentUser: User,
  ) {
    const desarquivamento = await this.findDesarquivamentoByIdUseCase.execute({
      id,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });
    const buffer = await this.nugecidDocxService.generateTermoDocx(
      desarquivamento as any,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=termo_de_entrega_${id}.docx`,
    );
    res.send(buffer);
  }

  @Get(":id/termo-pdf")
  @ApiOperation({
    summary:
      "Gerar termo de entrega de desarquivamento em PDF com cabeçalho/rodapé fixos",
  })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "number",
  })
  @ApiBearerAuth()
  @Header("Content-Type", "application/pdf")
  async getTermoDeEntregaPdf(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() currentUser: User,
  ) {
    const desarquivamento = await this.findDesarquivamentoByIdUseCase.execute({
      id,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });
    const buffer =
      await this.nugecidPdfService.generatePdfWithFixedHeaderFooter(
        desarquivamento as any,
      );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=termo_de_entrega_${id}.pdf`,
    );
    res.send(buffer);
  }

  @Get(":id/termo-preview")
  @ApiOperation({
    summary: "Gerar HTML do termo de entrega para pré-visualização e impressão",
  })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "number",
  })
  @ApiBearerAuth()
  async getTermoDeEntregaPreview(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return res.redirect(
      this.buildFrontendUrl(`/desarquivamentos/${id}/termo/visualizar`),
    );
  }

  @Get("resumo-diario")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR, RoleType.USUARIO)
  @ApiOperation({
    summary:
      "Resumo diário de desarquivamentos pendentes (SOLICITADO e RETIRADO_PELO_SETOR)",
  })
  @ApiBearerAuth()
  async getResumoDiario(@CurrentUser() currentUser: User) {
    const result = await this.nugecidService.getResumoDiario(currentUser.id, [
      currentUser.role?.name || "USER",
    ]);
    return { success: true, ...result };
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR, RoleType.USUARIO)
  @ApiOperation({ summary: "Listar desarquivamentos com filtros e paginação" })
  @ApiQuery({ type: QueryDesarquivamentoDto })
  @ApiBearerAuth()
  async findAll(
    @Query() queryDto: QueryDesarquivamentoDto,
    @CurrentUser() currentUser: User,
    @Headers("accept") acceptHeader?: string,
  ) {
    this.assertJsonCollectionRequest(acceptHeader);

    const filters = this.buildListFilters(queryDto);

    const result = await this.findAllDesarquivamentosUseCase.execute({
      page: queryDto.page,
      limit: queryDto.limit,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
      filters,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });

    return {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get("impressao/candidatos")
  @Roles(RoleType.ADMIN, RoleType.COORDENADOR, RoleType.USUARIO)
  @ApiOperation({
    summary: "Listar candidatos elegíveis para impressão do termo de entrega",
  })
  @ApiQuery({ type: QueryDesarquivamentoDto })
  @ApiBearerAuth()
  async listPrintCandidates(
    @Query() queryDto: QueryDesarquivamentoDto,
    @CurrentUser() currentUser: User,
  ) {
    const filters = this.buildListFilters(queryDto, {
      incluirExcluidos: false,
      statusList: PRINTABLE_STATUS_LIST,
    });

    const result = await this.findAllDesarquivamentosUseCase.execute({
      page: queryDto.page,
      limit: queryDto.limit,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
      filters,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });

    return {
      success: true,
      data: result.data.map((item) => ({
        id: item.id,
        numeroProcesso: item.numeroProcesso,
        numeroNicLaudoAuto: item.numeroNicLaudoAuto,
        nomeCompleto: item.nomeCompleto,
        tipoDocumento: item.tipoDocumento,
        status: item.status,
        dataDesarquivamentoSAG: item.dataDesarquivamentoSAG,
        pdfUrl: `/api/nugecid/${item.id}/termo-pdf`,
        previewUrl: `/api/nugecid/${item.id}/termo-preview`,
        detailUrl: `/api/nugecid/${item.id}`,
      })),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get("lixeira")
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: "Listar desarquivamentos excluídos (lixeira)" })
  @ApiQuery({ type: QueryDesarquivamentoDto })
  @ApiBearerAuth()
  async findDeleted(
    @Query() queryDto: QueryDesarquivamentoDto,
    @CurrentUser() currentUser: User,
  ) {
    const filters = this.buildListFilters(queryDto, {
      incluirExcluidos: true,
    });

    const result = await this.findAllDesarquivamentosUseCase.execute({
      page: queryDto.page,
      limit: queryDto.limit,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
      filters,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });

    return {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Patch("lixeira/:id/restaurar")
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: "Restaurar desarquivamento da lixeira" })
  @ApiBearerAuth()
  async restore(@Param("id") id: string, @CurrentUser() currentUser: User) {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] 🔄 Iniciando restauração - ID: ${id}, Usuário: ${currentUser.usuario}`,
    );

    try {
      const result = await this.restoreDesarquivamentoUseCase.execute({
        id: Number(id),
        userId: currentUser.id,
        userRoles: [currentUser.role?.name || "USER"],
      });

      this.logger.log(
        `[${timestamp}] ✅ Desarquivamento restaurado com sucesso - ID: ${id}`,
      );

      return {
        success: true,
        message: "Desarquivamento restaurado com sucesso",
        data: result,
        restoredAt: timestamp,
        restoredBy: currentUser.usuario,
      };
    } catch (error) {
      this.logger.error(
        `[${timestamp}] ❌ Erro ao restaurar desarquivamento - ID: ${id}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Obter estatísticas do dashboard" })
  @Roles(RoleType.ADMIN, RoleType.USUARIO)
  @ApiBearerAuth()
  async getDashboard() {
    const stats = await this.nugecidStatsService.getDashboardStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Delete("lixeira/:id/permanente")
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary:
      "Excluir permanentemente desarquivamento da lixeira (IRREVERSÍVEL)",
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async hardDelete(
    @Param("id") idParam: string,
    @CurrentUser() currentUser: User,
  ) {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] 🔥 EXCLUSÃO PERMANENTE SOLICITADA - ID: ${idParam}, Usuário: ${currentUser.usuario}`,
    );

    // Reutilizar a mesma validação de ID do método remove
    let id: number;
    try {
      const cleanId = idParam.trim();
      if (!/^\d+$/.test(cleanId)) {
        throw new BadRequestException(
          "ID inválido. Deve ser um número inteiro.",
        );
      }
      id = parseInt(cleanId, 10);
    } catch {
      throw new BadRequestException(
        "ID inválido. Deve ser um número inteiro positivo.",
      );
    }

    try {
      const result = await this.deleteDesarquivamentoUseCase.execute({
        id,
        userId: currentUser.id,
        userRoles: [currentUser.role?.name || "USER"],
        permanent: true,
      });

      return {
        success: true,
        message: "Desarquivamento excluído permanentemente",
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `[${new Date().toISOString()}] ❌ Erro exclusão permanente - ID: ${id}`,
        error.stack,
      );
      throw new BadRequestException(
        error.message || "Erro ao excluir permanentemente",
      );
    }
  }

  @Get(":id/historico")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Buscar histórico de ações de um desarquivamento",
    description:
      "Retorna todas as ações (criação, atualização, exclusão, etc.) realizadas em um desarquivamento específico",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID do desarquivamento",
  })
  @ApiResponse({
    status: 200,
    description: "Histórico retornado com sucesso",
  })
  async getHistorico(@Param("id", ParseIntPipe) id: number) {
    return this.nugecidService.getHistorico(id);
  }

  @Get(":id/related")
  @ApiOperation({
    summary: "Buscar registros relacionados pelo mesmo número de processo",
  })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "integer",
  })
  @ApiBearerAuth()
  async findRelatedByProcess(@Param("id", ParseIntPipe) id: number) {
    const result = await this.nugecidService.findRelatedByProcess(id);

    return {
      success: true,
      data: result,
    };
  }

  @Get(":id/comments")
  @ApiOperation({ summary: "Lista comentários do desarquivamento" })
  @ApiResponse({
    status: 200,
    description: "Comentários retornados com sucesso",
  })
  async listComments(@Param("id", ParseIntPipe) id: number) {
    const comments = await this.nugecidService.listComments(id);
    return {
      success: true,
      data: comments.map((comment) => ({
        id: comment.id,
        comment: comment.comment,
        authorName: comment.authorName,
        userId: comment.userId,
        createdAt: comment.createdAt,
        user: comment.user
          ? {
              id: comment.user.id,
              nome: comment.user.nome,
              usuario: comment.user.usuario,
            }
          : null,
      })),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Obter desarquivamento por ID" })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "integer",
  })
  @ApiBearerAuth()
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @Req() request: any,
  ) {
    const result = await this.findDesarquivamentoByIdUseCase.execute({
      id,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });

    // Auditoria de visualização
    await this.nugecidAuditService.saveDesarquivamentoAudit(
      currentUser.id,
      "VIEW",
      result,
      null,
      request.ip,
      request.get("user-agent"),
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get("barcode/:codigo")
  @ApiOperation({ summary: "Obter desarquivamento por código de barras" })
  @ApiParam({
    name: "codigo",
    description: "Código de barras do desarquivamento",
  })
  @ApiBearerAuth()
  async findByBarcode(
    @Param("codigo") codigo: string,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.findAllDesarquivamentosUseCase.execute({
      filters: { codigoBarras: codigo },
      limit: 1,
      page: 1,
      userId: currentUser.id,
      userRoles: [currentUser.role?.name || "USER"],
    });

    if (result.data.length === 0) {
      throw new NotFoundException("Desarquivamento não encontrado");
    }

    return {
      success: true,
      data: result.data[0],
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualizar desarquivamento" })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "integer",
  })
  @ApiBearerAuth()
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDesarquivamentoDto: UpdateDesarquivamentoDto,
    @CurrentUser() currentUser: User,
    @Req() request: Request,
  ) {
    try {
      const userRoles = [currentUser.role?.name || "USER"];
      const beforeUpdate = await this.findDesarquivamentoByIdUseCase.execute({
        id,
        userId: currentUser.id,
        userRoles,
      });

      const enrichedUpdateDto = this.applyStatusDateDefaults(
        beforeUpdate as unknown as Record<string, unknown>,
        updateDesarquivamentoDto,
      );

      const result = await this.updateDesarquivamentoUseCase.execute({
        id,
        ...enrichedUpdateDto,
        // Garante que dataDevolucaoSetor seja passada explicitamente mesmo se for null/undefined
        dataDevolucaoSetor: enrichedUpdateDto.dataDevolucaoSetor,
        userId: currentUser.id,
        userRoles,
      });

      const changes = this.buildUpdateAuditChanges(
        beforeUpdate as unknown as Record<string, unknown>,
        result as unknown as Record<string, unknown>,
      );

      if (Object.keys(changes).length > 0) {
        await this.nugecidAuditService.saveDesarquivamentoAudit(
          currentUser.id,
          "UPDATE",
          result as any,
          changes,
          request.ip,
          request.get("user-agent"),
        );
      }

      return {
        success: true,
        message: "Desarquivamento atualizado com sucesso",
        data: result,
      };
    } catch (error) {
      // Normaliza erros conhecidos para não retornar 500 indevidamente
      const msg = (error?.message || "").toString();
      if (msg.includes("Acesso negado")) {
        throw new ForbiddenException(
          "Você não tem permissão para editar este desarquivamento",
        );
      }
      if (msg.includes("não encontrado") || msg.includes("no encontrado")) {
        throw new NotFoundException("Desarquivamento não encontrado");
      }
      if (
        msg.toLowerCase().includes("status inv") ||
        msg.toLowerCase().includes("id deve ser")
      ) {
        throw new BadRequestException(msg);
      }
      throw new BadRequestException(msg || "Erro ao atualizar desarquivamento");
    }
  }

  private buildUpdateAuditChanges(
    beforeUpdate: Record<string, unknown>,
    afterUpdate: Record<string, unknown>,
  ): Record<string, { from?: unknown; to?: unknown }> {
    return UPDATE_AUDIT_FIELDS.reduce<
      Record<string, { from?: unknown; to?: unknown }>
    >((acc, fieldConfig) => {
      const { field, type } = fieldConfig;
      const beforeValue = this.normalizeAuditFieldValue(
        type,
        beforeUpdate[field],
      );
      const afterValue = this.normalizeAuditFieldValue(
        type,
        afterUpdate[field],
      );

      if (beforeValue === afterValue) {
        return acc;
      }

      acc[field] = { from: beforeValue, to: afterValue };
      return acc;
    }, {});
  }

  private applyStatusDateDefaults(
    beforeUpdate: Record<string, unknown>,
    updateDto: UpdateDesarquivamentoDto,
  ): UpdateDesarquivamentoDto {
    const requestedStatus = this.normalizeAuditFieldValue(
      "status",
      updateDto.status,
    ) as StatusDesarquivamentoEnum | null;

    if (!requestedStatus) {
      return updateDto;
    }

    const previousStatus = this.normalizeAuditFieldValue(
      "status",
      beforeUpdate.status,
    ) as StatusDesarquivamentoEnum | null;

    if (previousStatus === requestedStatus) {
      return updateDto;
    }

    const enriched: UpdateDesarquivamentoDto = { ...updateDto };
    const now = new Date();

    const alreadyHasDataDesarquivamento = this.normalizeAuditFieldValue(
      "date",
      beforeUpdate.dataDesarquivamentoSAG,
    );
    const alreadyHasDataDevolucao = this.normalizeAuditFieldValue(
      "date",
      beforeUpdate.dataDevolucaoSetor,
    );

    if (
      enriched.dataDesarquivamentoSAG === undefined &&
      !alreadyHasDataDesarquivamento &&
      STATUSS_WITH_DESARQUIVAMENTO_DATE.has(requestedStatus)
    ) {
      enriched.dataDesarquivamentoSAG = now;
    }

    if (
      enriched.dataDevolucaoSetor === undefined &&
      !alreadyHasDataDevolucao &&
      STATUSS_WITH_DEVOLUCAO_DATE.has(requestedStatus)
    ) {
      enriched.dataDevolucaoSetor = now;
    }

    return enriched;
  }

  private buildListFilters(
    queryDto: QueryDesarquivamentoDto,
    options: {
      incluirExcluidos?: boolean;
      statusList?: string[];
    } = {},
  ) {
    const statusList = options.statusList
      ? options.statusList
      : Array.isArray(queryDto.status)
        ? queryDto.status
        : undefined;

    const status = options.statusList
      ? undefined
      : Array.isArray(queryDto.status)
        ? undefined
        : queryDto.status;

    return {
      search: queryDto.search,
      statusList,
      status,
      tipoDesarquivamento: Array.isArray(queryDto.tipoDesarquivamento)
        ? queryDto.tipoDesarquivamento[0]
        : undefined,
      criadoPorId: queryDto.usuarioId,
      responsavelId: queryDto.responsavelId,
      urgente: queryDto.urgente,
      instituto: queryDto.instituto,
      requerente: queryDto.requerente,
      dataInicio: queryDto.startDate || queryDto.dataInicio || undefined,
      dataFim: queryDto.endDate || queryDto.dataFim || undefined,
      incluirExcluidos:
        options.incluirExcluidos ?? queryDto.incluirExcluidos ?? false,
    };
  }

  private normalizeAuditFieldValue(
    type: AuditFieldType,
    value: unknown,
  ): unknown {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (type === "status") {
      const normalizedStatus = String(value)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

      if (!normalizedStatus) {
        return null;
      }

      return STATUS_ALIAS_MAP[normalizedStatus] ?? normalizedStatus;
    }

    if (type === "date") {
      const date = new Date(String(value));
      if (Number.isNaN(date.getTime())) {
        const fallback = String(value).trim();
        return fallback.length > 0 ? fallback : null;
      }
      return date.toISOString();
    }

    if (type === "boolean") {
      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "sim"].includes(normalized)) return true;
        if (["false", "0", "nao", "não"].includes(normalized)) return false;
      }

      return Boolean(value);
    }

    if (type === "number") {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === "string") {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
          return numeric;
        }
      }

      return String(value);
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    }

    return String(value);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover desarquivamento" })
  @ApiParam({
    name: "id",
    description: "ID do desarquivamento",
    type: "integer",
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id") idParam: string, @CurrentUser() currentUser: User) {
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] [NugecidController] EXCLUSÃO INICIADA - ID param: '${idParam}', Usuário: ${currentUser?.id} (${currentUser?.usuario}), Tipo: SOFT DELETE`,
    );

    // Validar se o ID é um número válido (não UUID)
    let id: number;
    try {
      const cleanId = idParam.trim();

      // Verificar se é um UUID (padrão: 8-4-4-4-12 caracteres hexadecimais)
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(cleanId)) {
        this.logger.error(
          `[${timestamp}] [NugecidController] ❌ UUID DETECTADO: '${idParam}' - Este endpoint espera um ID numérico`,
        );
        throw new BadRequestException(
          `ID inválido: '${idParam}'. ` +
            `Detectado UUID, mas este endpoint espera um ID numérico (ex: 1, 2, 3...). ` +
            `Verifique se você está usando o ID correto do desarquivamento.`,
        );
      }

      // Verificar se contém apenas dígitos
      if (!/^\d+$/.test(cleanId)) {
        this.logger.error(
          `[${timestamp}] [NugecidController] ❌ ID INVÁLIDO - contém caracteres não numéricos: '${idParam}'`,
        );
        throw new BadRequestException(
          `ID deve conter apenas números. Recebido: '${idParam}'. ` +
            `Formato esperado: número inteiro positivo (ex: 1, 2, 3...).`,
        );
      }

      id = parseInt(cleanId, 10);
      if (isNaN(id) || id <= 0) {
        this.logger.error(
          `[${timestamp}] [NugecidController] ❌ ID INVÁLIDO - não é um número positivo: '${idParam}'`,
        );
        throw new BadRequestException(
          `ID inválido: '${idParam}'. Deve ser um número inteiro positivo maior que zero.`,
        );
      }

      this.logger.log(
        `[${timestamp}] [NugecidController] ✅ ID validado com sucesso: ${id}`,
      );
    } catch (error) {
      // Se já é uma BadRequestException, re-throw
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Erro genérico de conversão
      this.logger.error(
        `[${timestamp}] [NugecidController] ❌ ERRO NA VALIDAÇÃO DO ID: '${idParam}' - ${error.message}`,
      );
      throw new BadRequestException(
        `ID inválido: '${idParam}'. Deve ser um número inteiro positivo. ` +
          `Se você está tentando usar um UUID, verifique se está usando o endpoint correto.`,
      );
    }

    try {
      await this.deleteDesarquivamentoUseCase.execute({
        id,
        userId: currentUser.id,
        userRoles: [currentUser.role?.name || "USER"],
        permanent: false,
      });

      const completedTimestamp = new Date().toISOString();
      this.logger.log(
        `[${completedTimestamp}] [NugecidController] ✅ EXCLUSÃO CONCLUÍDA COM SUCESSO - ID: ${id} foi EXCLUÍDO DO BANCO DE DADOS (soft delete), Usuário: ${currentUser?.id}`,
      );

      return {
        success: true,
        message: "Desarquivamento removido com sucesso",
        data: {
          id,
          deletedAt: completedTimestamp,
          deletedBy: currentUser.id,
          type: "soft_delete",
        },
      };
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      this.logger.error(
        `[${errorTimestamp}] [NugecidController] ❌ ERRO NA EXCLUSÃO - ID: ${id}, Usuário: ${currentUser?.id}, Erro: ${error.message}`,
      );

      // Melhorar mensagens de erro para o usuário
      if (error.message.includes("Acesso negado")) {
        throw new ForbiddenException(
          "Você não tem permissão para excluir este desarquivamento",
        );
      }

      if (
        error.message.includes("ID") &&
        error.message.includes("não encontrado")
      ) {
        throw new NotFoundException("Desarquivamento não encontrado");
      }

      if (error.message.includes("em andamento")) {
        throw new BadRequestException(
          "Não é possível excluir desarquivamento em andamento",
        );
      }

      if (error.message.includes("concluídos")) {
        throw new ForbiddenException(
          "Apenas administradores podem excluir desarquivamentos concluídos",
        );
      }

      // Erro genérico
      throw new BadRequestException(
        error.message || "Erro ao excluir desarquivamento",
      );
    }
  }

  @Post(":id/comments")
  @ApiOperation({ summary: "Adiciona um comentário ao desarquivamento" })
  @ApiResponse({ status: 201, description: "Comentário criado com sucesso" })
  async addComment(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: CreateDesarquivamentoCommentDto,
    @CurrentUser() currentUser: User,
  ) {
    const saved = await this.nugecidService.addComment(
      id,
      currentUser,
      body.comment,
    );
    return {
      success: true,
      data: {
        id: saved.id,
        comment: saved.comment,
        authorName: saved.authorName,
        userId: saved.userId,
        createdAt: saved.createdAt,
        user: saved.user
          ? {
              id: saved.user.id,
              nome: saved.user.nome,
              usuario: saved.user.usuario,
            }
          : null,
      },
    };
  }
}
