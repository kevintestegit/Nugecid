import {
  Controller,
  Get,
  UseGuards,
  Res,
  Param,
  Query,
  Request,
  BadRequestException,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Response, Request as ExpressRequest } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleType } from "../users/enums/role-type.enum";
import { EstatisticasService } from "./estatisticas.service";
import {
  FiltrosEstatisticasDto,
  PaginacaoDto,
} from "./dto/filtros-estatisticas.dto";

@ApiTags("Estatísticas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.COORDENADOR, RoleType.USUARIO)
@Controller("estatisticas")
export class EstatisticasController {
  constructor(private readonly estatisticasService: EstatisticasService) {}

  @Get("cards")
  @ApiOperation({ summary: "Obtém dados para os cards de estatísticas" })
  @ApiResponse({
    status: 200,
    description: "Dados dos cards retornados com sucesso.",
  })
  async getCardData(
    @Query() filtros: FiltrosEstatisticasDto,
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as any;
    const isAdmin =
      user?.role?.name === "admin" || user?.role?.name === "coordenador";

    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
      userId: isAdmin ? undefined : user?.id, // Filtrar por usuário se não for admin/coordenador
    };

    const data = await this.estatisticasService.getCardData(filtrosFormatados);

    return { success: true, data };
  }

  @Get("requisicoes-por-mes")
  @ApiOperation({
    summary: "Obtém o número de requisições por mês",
  })
  @ApiResponse({
    status: 200,
    description: "Dados do gráfico de barras retornados com sucesso.",
  })
  async getRequisicoesPorMes(
    @Query() filtros: FiltrosEstatisticasDto,
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as any;
    const isAdmin =
      user?.role?.name === "admin" || user?.role?.name === "coordenador";

    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
      userId: isAdmin ? undefined : user?.id,
    };
    const data =
      await this.estatisticasService.getRequisicoesPorMes(filtrosFormatados);
    return { success: true, data };
  }

  @Get("status-distribuicao")
  @ApiOperation({ summary: "Obtém a distribuição de requisições por status" })
  @ApiResponse({
    status: 200,
    description: "Dados do gráfico de pizza retornados com sucesso.",
  })
  async getStatusDistribuicao(
    @Query() filtros: FiltrosEstatisticasDto,
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as any;
    const isAdmin =
      user?.role?.name === "admin" || user?.role?.name === "coordenador";

    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
      userId: isAdmin ? undefined : user?.id,
    };
    const data =
      await this.estatisticasService.getStatusDistribuicao(filtrosFormatados);
    return { success: true, data };
  }

  @Get("pdf")
  @ApiOperation({ summary: "Exporta relatório de estatísticas em PDF" })
  @ApiResponse({
    status: 200,
    description: "PDF gerado com sucesso.",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async exportPdf(
    @Query() filtros: FiltrosEstatisticasDto,
    @Res() res: Response,
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as any;
    const isAdmin =
      user?.role?.name === "admin" || user?.role?.name === "coordenador";

    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
      userId: isAdmin ? undefined : user?.id,
    };
    const pdfBuffer =
      await this.estatisticasService.generateRelatorioPdf(filtrosFormatados);
    const fileName = `relatorio-estatisticas-${new Date().toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  }

  @Get("pdf-mensal/:ano/:mes")
  @ApiOperation({ summary: "Exporta relatório mensal detalhado em PDF" })
  @ApiResponse({
    status: 200,
    description: "PDF mensal gerado com sucesso.",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async exportPdfMensal(
    @Param("ano", ParseIntPipe) ano: number,
    @Param("mes", ParseIntPipe) mes: number,
    @Query() paginacao: PaginacaoDto,
    @Res() res: Response,
    @Request() req: ExpressRequest,
  ) {
    const maxAnoPermitido = new Date().getFullYear() + 1;
    if (ano < 2000 || ano > maxAnoPermitido) {
      throw new BadRequestException(
        `Parâmetro "ano" inválido. Use um valor entre 2000 e ${maxAnoPermitido}.`,
      );
    }
    if (mes < 1 || mes > 12) {
      throw new BadRequestException(
        'Parâmetro "mes" inválido. Use um valor entre 1 e 12.',
      );
    }

    const user = req.user as any;
    const isAdmin =
      user?.role?.name === "admin" || user?.role?.name === "coordenador";

    const pdfBuffer = await this.estatisticasService.generateRelatorioMensalPdf(
      ano,
      mes,
      {
        pagina: paginacao.pagina,
        limite: paginacao.limite,
      },
      isAdmin ? undefined : user?.id,
    );
    const fileName = `relatorio-mensal-${ano}-${String(mes).padStart(2, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  }
}
