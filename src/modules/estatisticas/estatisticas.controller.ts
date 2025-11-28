import {
  Controller,
  Get,
  UseGuards,
  Res,
  Param,
  UseInterceptors,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { Response } from "express";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleType } from "../users/enums/role-type.enum";
import { EstatisticasService } from "./estatisticas.service";
import { FiltrosEstatisticasDto, PaginacaoDto } from "./dto/filtros-estatisticas.dto";

@ApiTags("Estatísticas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.USUARIO)
@Controller("estatisticas")
export class EstatisticasController {
  constructor(private readonly estatisticasService: EstatisticasService) {}

  @Get("cards")
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: "Obtém dados para os cards de estatísticas" })
  @ApiResponse({
    status: 200,
    description: "Dados dos cards retornados com sucesso.",
  })
  async getCardData(@Query() filtros: FiltrosEstatisticasDto) {
    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
    };
    const data = await this.estatisticasService.getCardData(filtrosFormatados);
    return { success: true, data };
  }

  @Get("requisicoes-por-mes")
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: "Obtém o número de requisições por mês",
  })
  @ApiResponse({
    status: 200,
    description: "Dados do gráfico de barras retornados com sucesso.",
  })
  async getRequisicoesPorMes(@Query() filtros: FiltrosEstatisticasDto) {
    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
    };
    const data = await this.estatisticasService.getRequisicoesPorMes(
      filtrosFormatados,
    );
    return { success: true, data };
  }

  @Get("status-distribuicao")
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: "Obtém a distribuição de requisições por status" })
  @ApiResponse({
    status: 200,
    description: "Dados do gráfico de pizza retornados com sucesso.",
  })
  async getStatusDistribuicao(@Query() filtros: FiltrosEstatisticasDto) {
    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
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
  ) {
    const filtrosFormatados = {
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
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
    @Param("ano") ano: string,
    @Param("mes") mes: string,
    @Query() paginacao: PaginacaoDto,
    @Res() res: Response,
  ) {
    const pdfBuffer =
      await this.estatisticasService.generateRelatorioMensalPdf(
        parseInt(ano),
        parseInt(mes),
        {
          pagina: paginacao.pagina,
          limite: paginacao.limite,
        },
      );
    const fileName = `relatorio-mensal-${ano}-${mes.padStart(2, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  }
}
