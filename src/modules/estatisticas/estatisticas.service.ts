import { Injectable, Logger, Inject, Optional } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "../nugecid/domain/enums/status-desarquivamento.enum";
import * as path from "path";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import type { Browser } from "playwright";
import * as Sentry from "@sentry/nestjs";
import {
  CACHE_VERSION_INITIAL,
  CACHE_VERSION_KEYS,
} from "../../common/constants/cache-version.constants";
import { RuntimeMetricsService } from "../observability/runtime-metrics.service";

export interface CardData {
  totalDesarquivamentos: number;
  requisicoesPendentes: number;
  requisicoesEsteMes: number;
  recentes: any[];
  pendentesAtrasados?: number;
  totalMesAnterior?: number;
  pendentesMesAnterior?: number;
}

export interface ChartData {
  name: string;
  total?: number;
  value?: number;
}

@Injectable()
export class EstatisticasService {
  private readonly logger = new Logger(EstatisticasService.name);
  private static readonly CARD_CACHE_TTL_SECONDS = 30;
  private static readonly CHART_CACHE_TTL_SECONDS = 60;

  constructor(
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepo: Repository<DesarquivamentoTypeOrmEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Optional()
    private readonly runtimeMetricsService?: RuntimeMetricsService,
  ) {}

  async getCardData(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    userId?: number;
  }): Promise<CardData> {
    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.ESTATISTICAS,
    );
    const cacheKey = this.buildCacheKey("cards", filtros, cacheVersion);
    const cached = await this.getFromCache<CardData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      // Query builder para total com filtros opcionais
      let totalQuery = this.desarquivamentoRepo.createQueryBuilder("d");

      // Filtro por usuário (para usuários comuns, mostrar apenas os próprios registros)
      if (filtros?.userId) {
        totalQuery = totalQuery.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
      }

      if (filtros?.dataInicio || filtros?.dataFim) {
        if (filtros.dataInicio) {
          totalQuery = totalQuery.andWhere("d.dataSolicitacao >= :dataInicio", {
            dataInicio: filtros.dataInicio,
          });
        }
        if (filtros.dataFim) {
          totalQuery = totalQuery.andWhere("d.dataSolicitacao <= :dataFim", {
            dataFim: filtros.dataFim,
          });
        }
      }

      // Query para requisições do mês atual usando dataSolicitacao
      let esteMesQuery = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .where("d.dataSolicitacao >= :start", { start: startOfMonth })
        .andWhere("d.dataSolicitacao <= :end", { end: endOfMonth });

      // Filtro por usuário para requisições do mês
      if (filtros?.userId) {
        esteMesQuery = esteMesQuery.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
      }

      // Query para pendentes com filtro de usuário
      let pendentesQuery = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .where("d.status = :status", {
          status: StatusDesarquivamentoEnum.SOLICITADO,
        });

      if (filtros?.userId) {
        pendentesQuery = pendentesQuery.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
      }

      // Pendentes há mais de 5 dias (atenção necessária)
      const cincoDiasAtras = new Date();
      cincoDiasAtras.setHours(0, 0, 0, 0); // início do dia local (UTC-3)
      cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);
      let pendentesAtrasadosQuery = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .where("d.status = :status", {
          status: StatusDesarquivamentoEnum.SOLICITADO,
        })
        .andWhere("d.dataSolicitacao <= :limite", { limite: cincoDiasAtras });

      if (filtros?.userId) {
        pendentesAtrasadosQuery = pendentesAtrasadosQuery.andWhere(
          "d.criadoPorId = :userId",
          {
            userId: filtros.userId,
          },
        );
      }

      // Query para recentes com filtro de usuário
      let recentesQuery = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .leftJoinAndSelect("d.criadoPor", "criadoPor")
        .leftJoinAndSelect("d.responsavel", "responsavel")
        .orderBy("d.dataSolicitacao", "DESC")
        .take(10);

      if (filtros?.userId) {
        recentesQuery = recentesQuery.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
      }

      // Cálculo do Mês Anterior
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );

      // Total Mês Anterior
      let totalMesAnteriorQuery = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .where("d.dataSolicitacao >= :start", { start: startOfLastMonth })
        .andWhere("d.dataSolicitacao <= :end", { end: endOfLastMonth });

      if (filtros?.userId) {
        totalMesAnteriorQuery = totalMesAnteriorQuery.andWhere(
          "d.criadoPorId = :userId",
          {
            userId: filtros.userId,
          },
        );
      }

      // Pendentes Mês Anterior (considerando status SOLICITADO e dataSolicitacao no mês passado)
      // Nota: Isso conta quantas solicitações feitas no mês passado ainda estão pendentes hoje,
      // ou quantas ESTAVAM pendentes no final do mês passado?
      // Para tendência estatística simples, vamos comparar o volume de solicitações do mês passado vs este mês (total)
      // E para pendentes, talvez seja melhor comparar o "backlog" gerado naquele mês.
      // Mas para manter simples e comparável com "pendentes atuais", vamos contar quantas solicitações do mês passado foram feitas
      // que ainda estão pendentes (ou seja, backlog gerado no mês anterior).

      let pendentesMesAnteriorQuery = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .where("d.status = :status", {
          status: StatusDesarquivamentoEnum.SOLICITADO,
        })
        .andWhere("d.dataSolicitacao >= :start", { start: startOfLastMonth })
        .andWhere("d.dataSolicitacao <= :end", { end: endOfLastMonth });

      if (filtros?.userId) {
        pendentesMesAnteriorQuery = pendentesMesAnteriorQuery.andWhere(
          "d.criadoPorId = :userId",
          {
            userId: filtros.userId,
          },
        );
      }

      const [
        total,
        pendentes,
        pendentesAtrasados,
        esteMes,
        recentes,
        totalMesAnterior,
        pendentesMesAnterior,
      ] = await Promise.all([
        totalQuery.getCount(),
        pendentesQuery.getCount(),
        pendentesAtrasadosQuery.getCount(),
        esteMesQuery.getCount(),
        recentesQuery.getMany(),
        totalMesAnteriorQuery.getCount(),
        pendentesMesAnteriorQuery.getCount(),
      ]);

      const result = {
        totalDesarquivamentos: total,
        requisicoesPendentes: pendentes,
        pendentesAtrasados,
        requisicoesEsteMes: esteMes,
        totalMesAnterior,
        pendentesMesAnterior,
        recentes: recentes.map((item) => ({
          id: item.id,
          nomeCompleto: item.nomeCompleto,
          numeroNicLaudoAuto: item.numeroNicLaudoAuto,
          numeroProcesso: item.numeroProcesso,
          tipoDocumento: item.tipoDocumento,
          status: item.status,
          tipoDesarquivamento: item.tipoDesarquivamento,
          dataSolicitacao: item.dataSolicitacao,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          setorDemandante: item.setorDemandante,
          servidorResponsavel: item.servidorResponsavel,
          finalidadeDesarquivamento: item.finalidadeDesarquivamento,
          solicitacaoProrrogacao: item.solicitacaoProrrogacao,
          urgente: item.urgente,
          criadoPorId: item.criadoPorId,
          responsavelId: item.responsavelId,
          usuario: item.criadoPor
            ? {
                id: (item.criadoPor as any).id,
                nome: (item.criadoPor as any).nome,
                usuario: (item.criadoPor as any).usuario,
              }
            : null,
          responsavel: item.responsavel
            ? {
                id: (item.responsavel as any).id,
                nome: (item.responsavel as any).nome,
                usuario: (item.responsavel as any).usuario,
              }
            : null,
        })),
      };
      await this.setInCache(
        cacheKey,
        result,
        EstatisticasService.CARD_CACHE_TTL_SECONDS,
      );
      return result;
    } catch (error) {
      this.logger.error("Erro ao buscar dados dos cards", error);
      throw new Error(
        "Falha ao carregar dados dos cards de estatísticas. Verifique se as datas estão no formato correto.",
      );
    }
  }

  async getRequisicoesPorMes(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    userId?: number;
  }): Promise<ChartData[]> {
    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.ESTATISTICAS,
    );
    const cacheKey = this.buildCacheKey(
      "requisicoes-por-mes",
      filtros,
      cacheVersion,
    );
    const cached = await this.getFromCache<ChartData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const now = new Date();
      const start =
        filtros?.dataInicio ||
        new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const end =
        filtros?.dataFim ||
        new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Agregar em SQL para evitar carregar todos os registros em memória.
      let query = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .select(
          `TO_CHAR(DATE_TRUNC('month', d.dataSolicitacao), 'YYYY-MM')`,
          "mes",
        )
        .addSelect("COUNT(d.id)", "total")
        .where("d.dataSolicitacao >= :start", { start })
        .andWhere("d.dataSolicitacao <= :end", { end });

      if (filtros?.userId) {
        query = query.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
      }

      const desarquivamentos = await query
        .groupBy(`DATE_TRUNC('month', d.dataSolicitacao)`)
        .orderBy(`DATE_TRUNC('month', d.dataSolicitacao)`, "ASC")
        .getRawMany<{ mes: string; total: string | number }>();

      // Agrupar por mês usando JavaScript (agnóstico de banco)
      const contagemPorMes = new Map<string, number>();

      desarquivamentos.forEach((item) => {
        if (!item.mes) {
          return;
        }
        contagemPorMes.set(item.mes, Number(item.total) || 0);
      });

      // Normalizar para incluir meses sem registros
      const result: ChartData[] = [];
      const mesesDiferenca = this.calcularMesesEntre(start, end);

      for (let i = mesesDiferenca; i >= 0; i--) {
        const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const total = contagemPorMes.get(key) || 0;
        const label = d.toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        });
        result.push({ name: label, total });
      }

      await this.setInCache(
        cacheKey,
        result,
        EstatisticasService.CHART_CACHE_TTL_SECONDS,
      );
      return result;
    } catch (error) {
      this.logger.error("Erro ao buscar requisições por mês", error);
      throw new Error(
        "Falha ao carregar dados de requisições por mês. Verifique os parâmetros de filtro.",
      );
    }
  }

  private calcularMesesEntre(dataInicio: Date, dataFim: Date): number {
    const anos = dataFim.getFullYear() - dataInicio.getFullYear();
    const meses = dataFim.getMonth() - dataInicio.getMonth();
    return Math.max(0, Math.min(anos * 12 + meses, 11)); // Máximo 12 meses
  }

  async getStatusDistribuicao(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    userId?: number;
  }): Promise<ChartData[]> {
    const cacheVersion = await this.getCacheVersion(
      CACHE_VERSION_KEYS.ESTATISTICAS,
    );
    const cacheKey = this.buildCacheKey(
      "status-distribuicao",
      filtros,
      cacheVersion,
    );
    const cached = await this.getFromCache<ChartData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let query = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .select("d.status", "status")
        .addSelect("COUNT(d.id)", "total");

      if (filtros?.userId) {
        query = query.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
      }

      // Aplicar filtros de data se fornecidos
      if (filtros?.dataInicio) {
        query = query.andWhere("d.dataSolicitacao >= :dataInicio", {
          dataInicio: filtros.dataInicio,
        });
      }
      if (filtros?.dataFim) {
        query = query.andWhere("d.dataSolicitacao <= :dataFim", {
          dataFim: filtros.dataFim,
        });
      }

      const rows: Array<{ status: string; total: number }> = await query
        .groupBy("d.status")
        .getRawMany();

      const mapNome: Record<string, string> = {
        ["SOLICITADO"]: "Solicitado",
        ["DESARQUIVADO"]: "Desarquivado",
        ["FINALIZADO"]: "Finalizado",
        ["NAO_LOCALIZADO"]: "Não Localizado",
        ["NAO_COLETADO"]: "Não Coletado",
        ["RETIRADO_PELO_SETOR"]: "Retirado pelo Setor",
        ["REARQUIVAMENTO_SOLICITADO"]: "Rearquivamento Solicitado",
      };

      const result = rows.map((r) => ({
        name: mapNome[r.status] || r.status,
        value: Number(r.total),
      }));
      await this.setInCache(
        cacheKey,
        result,
        EstatisticasService.CHART_CACHE_TTL_SECONDS,
      );
      return result;
    } catch (error) {
      this.logger.error("Erro ao buscar distribuição por status", error);
      throw new Error(
        "Falha ao carregar distribuição por status. Verifique os parâmetros de filtro.",
      );
    }
  }

  private async getAllDesarquivamentos(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    userId?: number;
  }): Promise<any[]> {
    let query = this.desarquivamentoRepo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.criadoPor", "criadoPor")
      .leftJoinAndSelect("d.responsavel", "responsavel")
      .orderBy("d.dataSolicitacao", "DESC");

    if (filtros?.userId) {
      query = query.andWhere("d.criadoPorId = :userId", {
        userId: filtros.userId,
      });
    }
    if (filtros?.dataInicio) {
      query = query.andWhere("d.dataSolicitacao >= :dataInicio", {
        dataInicio: filtros.dataInicio,
      });
    }
    if (filtros?.dataFim) {
      query = query.andWhere("d.dataSolicitacao <= :dataFim", {
        dataFim: filtros.dataFim,
      });
    }

    return query.take(5000).getMany();
  }

  async generateRelatorioPdf(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    userId?: number;
  }): Promise<Buffer> {
    try {
      Sentry.addBreadcrumb({
        category: "pdf",
        message: "Iniciando geração de PDF Geral de Estatísticas",
        level: "info",
        data: { filtros },
      });

      const [
        cardData,
        requisicoesPorMes,
        statusDistribuicao,
        todasRequisicoes,
      ] = await Promise.all([
        this.getCardData(filtros),
        this.getRequisicoesPorMes(filtros),
        this.getStatusDistribuicao(filtros),
        this.getAllDesarquivamentos(filtros),
      ]);

      Sentry.addBreadcrumb({
        category: "pdf",
        message: `Dados carregados: ${todasRequisicoes.length} requisições`,
        level: "info",
      });

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { chromium } = require("playwright");
        let browser: Browser | null = null;

        try {
          browser = await chromium.launch({
            args: ["--no-sandbox", "--font-render-hinting=none"],
            timeout: 30_000,
          });
          const page = await browser.newPage();

          const html = await this.buildRelatorioHTML(
            cardData,
            requisicoesPorMes,
            statusDistribuicao,
            todasRequisicoes,
            filtros,
          );
          await page.setContent(html, { waitUntil: "load", timeout: 30_000 });

          const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false,
          });

          return Buffer.from(pdf);
        } finally {
          if (browser) {
            await browser.close().catch(() => undefined);
          }
        }
      } catch (err) {
        this.logger.warn(
          "Playwright indisponível ou falhou. Usando fallback PDFKit simplificado.",
          err,
        );
        Sentry.addBreadcrumb({
          category: "pdf",
          message: "Playwright fallback ativado para PDF Geral",
          level: "warning",
          data: { error: (err as Error).message },
        });

        // Fallback: PDFKit
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PDFDocument: any = require("pdfkit");

        return await new Promise<Buffer>((resolve, reject) => {
          const doc = new PDFDocument({
            size: "A4",
            margins: { top: 50, bottom: 80, left: 50, right: 50 },
          });
          const buffers: Buffer[] = [];
          doc.on("data", (d: Buffer) => buffers.push(d));
          doc.on("end", () => resolve(Buffer.concat(buffers)));
          doc.on("error", (e: any) => reject(e));

          // Rodapé automático em cada nova página
          doc.on("pageAdded", () => this.drawPdfKitFooter(doc));

          this.drawBrasoesHeader(doc, "RELATÓRIO DE ESTATÍSTICAS");
          doc.moveDown();

          doc.font("Helvetica-Bold").fontSize(14).text("Resumo Geral");
          doc.font("Helvetica").fontSize(12);
          doc.text(
            `Total de Desarquivamentos: ${cardData.totalDesarquivamentos}`,
          );
          doc.text(`Requisições Pendentes: ${cardData.requisicoesPendentes}`);
          doc.text(`Requisições Este Mês: ${cardData.requisicoesEsteMes}`);
          doc.moveDown();

          doc.font("Helvetica-Bold").fontSize(14).text("Status Distribuição");
          doc.font("Helvetica").fontSize(12);
          statusDistribuicao.forEach((item) => {
            doc.text(`${item.name}: ${item.value}`);
          });

          doc.moveDown();

          // Tabela com TODAS as requisições
          if (todasRequisicoes.length > 0) {
            doc
              .font("Helvetica-Bold")
              .fontSize(13)
              .text(`Todas as Solicitações (${todasRequisicoes.length})`);
            doc.moveDown(0.4);

            const columns = [
              { label: "Nº", width: 28 },
              { label: "Nome Completo", width: 115 },
              { label: "Número", width: 90 },
              { label: "Tipo Doc.", width: 70 },
              { label: "Serv. Resp.", width: 120 },
              { label: "Data", width: 72 },
            ];
            const rowHeight = 18;
            const tableStartX = doc.page.margins.left;
            const pageBottomLimit = () =>
              doc.page.height - doc.page.margins.bottom - 60;
            const normalizeCell = (value: unknown, max = 30): string => {
              const raw = String(value ?? "N/A")
                .replace(/\s+/g, " ")
                .trim();
              if (!raw) return "N/A";
              return raw.length > max ? `${raw.slice(0, max - 2)}..` : raw;
            };

            const drawTableHeader = () => {
              const y = doc.y;
              let x = tableStartX;
              doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827");
              columns.forEach((column) => {
                doc
                  .rect(x, y, column.width, rowHeight)
                  .fillColor("#bfbfbf")
                  .fill()
                  .strokeColor("#9ca3af")
                  .stroke();
                doc.fillColor("#000").text(column.label, x + 2, y + 5, {
                  width: column.width - 4,
                  align: "left",
                });
                x += column.width;
              });
              doc.y = y + rowHeight;
            };

            const drawRow = (values: string[]) => {
              const y = doc.y;
              let x = tableStartX;
              doc.font("Helvetica").fontSize(8).fillColor("#111827");
              values.forEach((value, index) => {
                const width = columns[index].width;
                doc
                  .rect(x, y, width, rowHeight)
                  .strokeColor("#d1d5db")
                  .stroke();
                doc.text(value, x + 2, y + 4, {
                  width: width - 4,
                  align: "left",
                  ellipsis: true,
                  lineBreak: false,
                });
                x += width;
              });
              doc.y = y + rowHeight;
            };

            const ensureSpaceForRow = () => {
              if (doc.y + rowHeight <= pageBottomLimit()) return;
              doc.addPage();
              this.drawBrasoesHeader(doc, "RELATÓRIO DE ESTATÍSTICAS");
              doc.moveDown(0.4);
              doc
                .font("Helvetica-Bold")
                .fontSize(13)
                .text("Todas as Solicitações (continuação)");
              doc.moveDown(0.4);
              drawTableHeader();
            };

            drawTableHeader();
            todasRequisicoes.forEach((item, idx) => {
              ensureSpaceForRow();
              drawRow([
                String(idx + 1),
                normalizeCell(item.nomeCompleto, 25),
                normalizeCell(
                  item.numeroNicLaudoAuto || item.numeroProcesso,
                  18,
                ),
                normalizeCell(item.tipoDocumento, 14),
                normalizeCell(item.servidorResponsavel, 25),
                item.dataSolicitacao
                  ? new Date(item.dataSolicitacao).toLocaleDateString("pt-BR")
                  : "N/A",
              ]);
            });
          }

          this.drawPdfKitFooter(doc);
          doc.end();
        });
      }
    } catch (error) {
      this.logger.error("Erro ao gerar relatório PDF", error);
      Sentry.captureException(error, {
        tags: { pdf_type: "relatorio_geral" },
        extra: { filtros },
      });
      throw new Error(
        "Falha ao gerar relatório PDF. Verifique os logs para mais detalhes.",
      );
    }
  }

  private async loadReportLogos(): Promise<{
    rnLogo: string;
    itepLogo: string;
  }> {
    const logoPaths = [
      {
        rn: path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          "Brasão-RN.png",
        ),
        itep: path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          "Brasão-ITEP.png",
        ),
      },
      {
        rn: path.join(
          process.cwd(),
          "frontend",
          "src",
          "components",
          "img",
          "Brasão-RN.png",
        ),
        itep: path.join(
          process.cwd(),
          "frontend",
          "src",
          "components",
          "img",
          "Brasão-ITEP.png",
        ),
      },
    ];

    let rnLogo = "";
    let itepLogo = "";
    for (const paths of logoPaths) {
      if (!rnLogo) {
        rnLogo = await this.getImageDataUri(paths.rn, "image/png");
      }
      if (!itepLogo) {
        itepLogo = await this.getImageDataUri(paths.itep, "image/png");
      }
      if (rnLogo && itepLogo) break;
    }
    return { rnLogo, itepLogo };
  }

  private getReportHeaderHTML(rnLogo: string, itepLogo: string): string {
    return `
          <table class="hdr">
            <tr style="height:75pt;">
              <td class="logo-cell">
                ${rnLogo ? `<img src="${rnLogo}" alt="Brasão RN" width="90" height="75" />` : "&nbsp;"}
              </td>
              <td class="miolo" style="line-height: 1.2;">
                <p class="center fs10"><strong>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</strong><br/>
                <strong>SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</strong><br/>
                <strong>POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE</strong><br/>
                <strong>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID</strong></p>
                <p class="center fs10 mt-8"><strong>ARQUIVO GERAL - PCIRN</strong></p>
              </td>
              <td class="logo-cell-dir">
                ${itepLogo ? `<img src="${itepLogo}" alt="Brasão ITEP" width="80" height="80" />` : "&nbsp;"}
              </td>
            </tr>
          </table>`;
  }

  private getReportFooterHTML(): string {
    return `
          <div class="rodape fs10 center" style="line-height: 1.3; border-top: 0.75pt solid #000; padding-top: 5pt; margin-top: 10pt;">
            <p>Polícia Científica do Rio Grande do Norte - PCIRN</p>
            <p>Núcleo de Gestão do Conhecimento, Informação, Documentação e Memória - NUGECID</p>
            <p>Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928</p>
            <p>Email: arquivogeral@pci.rn.gov.br</p>
          </div>`;
  }

  private getReportBaseCSS(): string {
    return `
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
      @bottom-center {
        content: "Página " counter(page) " de " counter(pages);
        font-family: Calibri, "Segoe UI", Arial, sans-serif;
        font-size: 8pt;
        color: #555;
      }
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
      table.documento-completo thead { display: table-header-group; }
      table.documento-completo tfoot { display: table-footer-group; }
      .faixa, td[style*="background-color"] {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      table.borda tr { page-break-inside: avoid; break-inside: avoid; }
    }

    * { box-sizing: border-box; }
    body { font-family: Calibri, "Segoe UI", Arial, sans-serif; margin: 0; padding: 0; color: #000; }
    p { margin: 0; }
    .center { text-align: center; }
    .mt-8 { margin-top: 6pt; }
    .fs10 { font-size: 10pt; }
    .fs11 { font-size: 11pt; }
    .fs12 { font-size: 12pt; }

    /* Documento completo com cabeçalho e rodapé repetíveis */
    table.documento-completo { width: 100%; border-collapse: collapse; }
    table.documento-completo thead { display: table-header-group; }
    table.documento-completo tfoot { display: table-footer-group; }
    table.documento-completo thead td,
    table.documento-completo tfoot td { border: none; padding: 0; }

    /* Cabeçalho institucional */
    .hdr { width: 100%; border-collapse: collapse; }
    .hdr td { vertical-align: top; }
    .hdr .logo-cell { width: 95.25pt; text-align: center; }
    .hdr .miolo { width: 341.25pt; }
    .hdr .logo-cell-dir { width: 83.25pt; text-align: left; }

    /* Rodapé */
    .rodape { border-top: 0.75pt solid #000; padding-top: 2pt; margin-top: 5pt; }

    /* Título principal */
    h1.titulo-relatorio {
      margin: 8pt 0 6pt 0;
      font-size: 14pt;
      text-align: center;
      text-transform: uppercase;
      background: #bfbfbf;
      padding: 6pt 10pt;
      border: 0.75pt solid #000;
    }

    /* Tabelas com borda */
    table.borda { width: 100%; border: 0.75pt solid #000; border-collapse: collapse; }
    table.borda td, table.borda th { border: 0.75pt solid #000; padding: 3pt 5pt; }
    .faixa { background: #bfbfbf; }

    /* Cards resumo */
    .cards-grid { display: flex; gap: 8pt; margin-bottom: 12pt; }
    .card { flex: 1; border: 0.75pt solid #000; padding: 8pt; text-align: center; }
    .card-title { font-size: 9pt; color: #333; margin-bottom: 4pt; }
    .card-value { font-size: 20pt; font-weight: 700; color: #000; }

    /* Gráfico de barras */
    .chart-section { margin-bottom: 16pt; page-break-inside: avoid; }
    .chart-title { font-size: 12pt; font-weight: 700; margin-bottom: 8pt; border-bottom: 1.5pt solid #000; padding-bottom: 4pt; }
    .bar-chart { display: flex; flex-direction: column; gap: 5pt; }
    .bar-item { display: flex; align-items: center; }
    .bar-label { width: 80pt; font-size: 9pt; color: #333; }
    .bar-container { flex: 1; display: flex; align-items: center; height: 18pt; background: #f0f0f0; border: 0.5pt solid #ccc; position: relative; }
    .bar-fill { background: #4472C4; height: 100%; min-width: 2px; }
    .bar-value { position: absolute; right: 6pt; font-size: 9pt; font-weight: 600; color: #222; }

    /* Status list */
    .status-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6pt; }
    .status-item { display: flex; justify-content: space-between; padding: 5pt 8pt; border: 0.75pt solid #ccc; }
    .status-name { font-size: 10pt; color: #333; }
    .status-values { display: flex; gap: 6pt; font-size: 10pt; }
    .status-count { font-weight: 700; color: #222; }
    .status-percent { color: #666; }

    /* Tabela de solicitações */
    .solicitacoes-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
      table-layout: fixed;
    }
    .solicitacoes-table th,
    .solicitacoes-table td {
      border: 0.75pt solid #000;
      padding: 4pt 5pt;
      font-size: 8pt;
      line-height: 1.4;
      vertical-align: middle;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .solicitacoes-table thead { display: table-header-group; }
    .solicitacoes-table th {
      background: #bfbfbf;
      font-weight: 700;
      text-align: center;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .solicitacoes-table td { text-align: left; }
    .solicitacoes-table td.center { text-align: center; }
    .solicitacoes-table td.wrap {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      height: auto;
    }
    .solicitacoes-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
      height: auto;
    }

    /* Seções por solicitante */
    .solicitante-section { margin-bottom: 14pt; page-break-inside: avoid; }
    .solicitante-title { font-size: 11pt; font-weight: 700; margin-bottom: 4pt; border-bottom: 0.75pt solid #555; padding-bottom: 3pt; }

    /* Info geração */
    .data-geracao { text-align: right; font-size: 9pt; color: #666; margin-bottom: 6pt; }
    .periodo-info { text-align: right; font-size: 10pt; color: #2563eb; font-weight: 600; margin-bottom: 10pt; }
    .paginacao-info { text-align: center; font-size: 10pt; color: #2563eb; font-weight: 600; margin-bottom: 10pt; padding: 5pt; background: #eff6ff; border: 0.75pt solid #2563eb; }
    `;
  }

  private async buildRelatorioHTML(
    cardData: CardData,
    requisicoesPorMes: ChartData[],
    statusDistribuicao: ChartData[],
    todasRequisicoes: any[],
    filtros?: { dataInicio?: Date; dataFim?: Date },
  ): Promise<string> {
    const { rnLogo, itepLogo } = await this.loadReportLogos();

    const dataGeracao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const safeDataGeracao = this.escapeHtml(dataGeracao);

    const css = this.getReportBaseCSS();
    const headerHTML = this.getReportHeaderHTML(rnLogo, itepLogo);
    const footerHTML = this.getReportFooterHTML();

    // Informações sobre período do relatório
    const periodoInfo =
      filtros?.dataInicio || filtros?.dataFim
        ? `<div class="periodo-info">Período: ${filtros.dataInicio ? new Date(filtros.dataInicio).toLocaleDateString("pt-BR") : "Início"} até ${filtros.dataFim ? new Date(filtros.dataFim).toLocaleDateString("pt-BR") : "Hoje"}</div>`
        : "";

    // Criar dados para o gráfico de barras
    const maxValue = Math.max(0, ...requisicoesPorMes.map((d) => d.total || 0));
    const barChartHTML = requisicoesPorMes
      .map((item) => {
        const safeName = this.escapeHtml(item.name);
        const total = Number(item.total) || 0;
        const percentage = maxValue > 0 ? (total / maxValue) * 100 : 0;
        return `
        <div class="bar-item">
          <div class="bar-label">${safeName}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%"></div>
            <div class="bar-value">${total}</div>
          </div>
        </div>`;
      })
      .join("");

    // Criar dados para distribuição por status
    const totalStatus = statusDistribuicao.reduce(
      (sum, item) => sum + (item.value || 0),
      0,
    );
    const pieChartHTML = statusDistribuicao
      .map((item) => {
        const safeName = this.escapeHtml(item.name);
        const value = Number(item.value) || 0;
        const percentage = totalStatus > 0 ? (value / totalStatus) * 100 : 0;
        return `
        <div class="status-item">
          <div class="status-name">${safeName}</div>
          <div class="status-values">
            <span class="status-count">${value}</span>
            <span class="status-percent">(${percentage.toFixed(1)}%)</span>
          </div>
        </div>`;
      })
      .join("");

    // Gerar linhas da tabela com TODAS as requisições
    let rowIndex = 0;
    const allItemsHTML = todasRequisicoes
      .map((item) => {
        rowIndex++;
        const dataSolicitacao = item.dataSolicitacao
          ? new Date(item.dataSolicitacao).toLocaleDateString("pt-BR")
          : "N/A";
        return `
              <tr>
                <td class="center">${rowIndex}</td>
                <td class="wrap">${this.escapeHtml(item.nomeCompleto || "N/A")}</td>
                <td>${this.escapeHtml(item.numeroNicLaudoAuto || item.numeroProcesso || "N/A")}</td>
                <td>${this.escapeHtml(item.tipoDocumento || "N/A")}</td>
                <td class="wrap">${this.escapeHtml(item.servidorResponsavel || "N/A")}</td>
                <td class="center">${this.escapeHtml(dataSolicitacao)}</td>
              </tr>`;
      })
      .join("");

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório de Estatísticas</title>
  <style>${css}</style>
</head>
<body>
  <table class="documento-completo">
    <thead>
      <tr><td>${headerHTML}</td></tr>
    </thead>
    <tfoot>
      <tr><td>${footerHTML}</td></tr>
    </tfoot>
    <tbody>
      <tr>
        <td>
          <h1 class="titulo-relatorio"><strong>RELATÓRIO DE ESTATÍSTICAS</strong></h1>

          <div class="data-geracao">Gerado em: ${safeDataGeracao}</div>
          ${periodoInfo}

          <!-- Cards Resumo -->
          <div class="cards-grid">
            <div class="card">
              <div class="card-title">Total de Desarquivamentos</div>
              <div class="card-value">${cardData.totalDesarquivamentos}</div>
            </div>
            <div class="card">
              <div class="card-title">Requisições Pendentes</div>
              <div class="card-value">${cardData.requisicoesPendentes}</div>
            </div>
            <div class="card">
              <div class="card-title">Requisições Este Mês</div>
              <div class="card-value">${cardData.requisicoesEsteMes}</div>
            </div>
          </div>

          <!-- Gráfico de Barras -->
          <div class="chart-section">
            <h2 class="chart-title">Requisições por Mês</h2>
            <div class="bar-chart">
              ${barChartHTML}
            </div>
          </div>

          <!-- Distribuição por Status -->
          <div class="chart-section">
            <h2 class="chart-title">Distribuição por Status</h2>
            <div class="status-list">
              ${pieChartHTML}
            </div>
          </div>

          <!-- Tabela Completa de Solicitações -->
          ${
            allItemsHTML
              ? `
          <div class="chart-section">
            <h2 class="chart-title">Todas as Solicitações (${todasRequisicoes.length})</h2>
            <table class="solicitacoes-table">
              <colgroup>
                <col style="width:5%;" />
                <col style="width:20%;" />
                <col style="width:18%;" />
                <col style="width:15%;" />
                <col style="width:27%;" />
                <col style="width:15%;" />
              </colgroup>
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Nome Completo</th>
                  <th>Número</th>
                  <th>Tipo Documento</th>
                  <th>Servidor Responsável</th>
                  <th>Data Solicitação</th>
                </tr>
              </thead>
              <tbody>
                ${allItemsHTML}
              </tbody>
            </table>
          </div>`
              : ""
          }
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }

  /** @deprecated Use getReportBaseCSS() instead */
  private getRelatorioPrintCSS(): string {
    return this.getReportBaseCSS();
  }

  private async getImageDataUri(
    filePath: string,
    mime = "image/png",
  ): Promise<string> {
    try {
      const abs = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      if (!existsSync(abs)) {
        this.logger.warn(`Logo não encontrada em: ${abs}`);
        return "";
      }
      const buf = await fs.readFile(abs);
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (e) {
      this.logger.warn(
        `Falha ao carregar logo (${filePath}): ${(e as Error).message}`,
      );
      return "";
    }
  }

  private getRelatorioLogoPath(fileName: string): string | null {
    const paths = [
      path.join(process.cwd(), "src", "assets", "images", fileName),
      path.join(
        process.cwd(),
        "frontend",
        "src",
        "components",
        "img",
        fileName,
      ),
    ];
    for (const logoPath of paths) {
      if (existsSync(logoPath)) return logoPath;
    }
    return null;
  }

  private drawBrasoesHeader(doc: any, reportTitle: string): void {
    const rnLogoPath = this.getRelatorioLogoPath("Brasão-RN.png");
    const itepLogoPath = this.getRelatorioLogoPath("Brasão-ITEP.png");
    const logoWidth = 50;
    const logoHeight = 42;
    const top = 36;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right - logoWidth;
    const centerX = left + logoWidth + 10;
    const centerWidth = right - centerX - 10;

    if (rnLogoPath) {
      try {
        doc.image(rnLogoPath, left, top, { fit: [logoWidth, logoHeight] });
      } catch {
        this.logger.warn("Falha ao renderizar brasão do RN no PDF fallback.");
      }
    }

    if (itepLogoPath) {
      try {
        doc.image(itepLogoPath, right, top, { fit: [logoWidth, logoHeight] });
      } catch {
        this.logger.warn("Falha ao renderizar brasão do ITEP no PDF fallback.");
      }
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("GOVERNO DO ESTADO DO RIO GRANDE DO NORTE", centerX, top, {
        width: centerWidth,
        align: "center",
      })
      .text("SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", {
        width: centerWidth,
        align: "center",
      })
      .text("POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE", {
        width: centerWidth,
        align: "center",
      })
      .text(
        "NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID",
        {
          width: centerWidth,
          align: "center",
        },
      )
      .text("ARQUIVO GERAL - PCIRN", {
        width: centerWidth,
        align: "center",
      });

    doc.y = Math.max(doc.y, top + logoHeight + 16);

    // Título com fundo cinza (simulando a faixa do HTML)
    const titleY = doc.y;
    const titleWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc
      .rect(doc.page.margins.left, titleY, titleWidth, 22)
      .fillColor("#bfbfbf")
      .fill();
    doc
      .fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(reportTitle, doc.page.margins.left, titleY + 5, {
        width: titleWidth,
        align: "center",
      });
    doc.y = titleY + 28;
    doc.moveDown(0.5);
  }

  private drawPdfKitFooter(doc: any): void {
    const savedY = doc.y;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const footerY = pageBottom - 50;
    const left = doc.page.margins.left;
    const width =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Linha separadora
    doc
      .moveTo(left, footerY)
      .lineTo(left + width, footerY)
      .strokeColor("#000")
      .lineWidth(0.75)
      .stroke();

    doc.font("Helvetica").fontSize(7).fillColor("#000");
    const lineHeight = 10;
    let y = footerY + 4;

    const lines = [
      "Polícia Científica do Rio Grande do Norte - PCIRN",
      "Núcleo de Gestão do Conhecimento, Informação, Documentação e Memória - NUGECID",
      "Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928",
      "Email: arquivogeral@pci.rn.gov.br",
    ];

    lines.forEach((line) => {
      doc.text(line, left, y, { width, align: "center" });
      y += lineHeight;
    });

    // Restaurar cursor para não interferir no conteúdo principal
    doc.y = savedY;
  }

  private escapeHtml(value: unknown): string {
    const raw = String(value ?? "");
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private buildCacheKey(
    scope: string,
    filtros?: { dataInicio?: Date; dataFim?: Date; userId?: number },
    version = CACHE_VERSION_INITIAL,
  ): string {
    const dataInicio = filtros?.dataInicio
      ? new Date(filtros.dataInicio).toISOString()
      : "none";
    const dataFim = filtros?.dataFim
      ? new Date(filtros.dataFim).toISOString()
      : "none";
    const userId = filtros?.userId ?? "all";
    return `estatisticas:${scope}:v:${version}:u:${userId}:di:${dataInicio}:df:${dataFim}`;
  }

  private async getCacheVersion(versionKey: string): Promise<number> {
    try {
      const raw = await this.cacheManager.get<number | string>(versionKey);
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
      return CACHE_VERSION_INITIAL;
    } catch (error) {
      this.logger.warn(
        `Falha ao obter versão de cache (${versionKey}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return CACHE_VERSION_INITIAL;
    }
  }

  private async getFromCache<T>(key: string): Promise<T | undefined> {
    const namespace = "estatisticas";
    try {
      const cached = await this.cacheManager.get<T>(key);
      if (cached === undefined || cached === null) {
        this.runtimeMetricsService?.recordCacheMiss(namespace);
      } else {
        this.runtimeMetricsService?.recordCacheHit(namespace);
      }
      return cached ?? undefined;
    } catch (error) {
      this.runtimeMetricsService?.recordCacheError(namespace);
      this.logger.warn(
        `Falha ao ler cache (${key}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return undefined;
    }
  }

  private async setInCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    const namespace = "estatisticas";
    try {
      await this.cacheManager.set(key, value, ttlSeconds);
      this.runtimeMetricsService?.recordCacheSet(namespace);
    } catch (error) {
      this.runtimeMetricsService?.recordCacheError(namespace);
      this.logger.warn(
        `Falha ao gravar cache (${key}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async generateRelatorioMensalPdf(
    ano: number,
    mes: number,
    paginacao?: { pagina?: number; limite?: number },
    userId?: number,
  ): Promise<Buffer> {
    try {
      Sentry.addBreadcrumb({
        category: "pdf",
        message: `Iniciando geração de PDF Mensal: ${mes}/${ano}`,
        level: "info",
        data: { ano, mes, paginacao, userId },
      });

      if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
        throw new Error("Ano inválido para geração do relatório mensal.");
      }
      if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
        throw new Error("Mês inválido para geração do relatório mensal.");
      }

      // Calcular início e fim do mês
      const startOfMonth = new Date(ano, mes - 1, 1);
      const endOfMonth = new Date(ano, mes, 0, 23, 59, 59, 999);

      // Paginação é opcional: sem parâmetros, exporta o mês completo.
      const solicitouPaginacao =
        paginacao?.pagina !== undefined || paginacao?.limite !== undefined;
      const pagina = paginacao?.pagina ?? 1;
      const limite = paginacao?.limite ?? 50;
      const skip = (pagina - 1) * limite;

      // Buscar total de registros
      let totalQuery = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .where("d.dataSolicitacao >= :start", { start: startOfMonth })
        .andWhere("d.dataSolicitacao <= :end", { end: endOfMonth });

      if (userId) {
        totalQuery = totalQuery.andWhere("d.criadoPorId = :userId", {
          userId,
        });
      }

      const total = await totalQuery.getCount();

      // Buscar desarquivamentos do mês com informações do solicitante usando dataSolicitacao
      let query = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .leftJoinAndSelect("d.criadoPor", "criadoPor")
        .leftJoinAndSelect("d.responsavel", "responsavel")
        .where("d.dataSolicitacao >= :start", { start: startOfMonth })
        .andWhere("d.dataSolicitacao <= :end", { end: endOfMonth })
        .orderBy("d.dataSolicitacao", "ASC");

      if (userId) {
        query = query.andWhere("d.criadoPorId = :userId", { userId });
      }
      if (solicitouPaginacao) {
        query = query.skip(skip).take(limite);
      }

      const desarquivamentos = await query.getMany();

      // Agrupar por solicitante
      const solicitantesMap = new Map<string, any[]>();
      desarquivamentos.forEach((desarquivamento) => {
        const solicitanteNome =
          (desarquivamento.criadoPor as any)?.nome || "Não informado";
        if (!solicitantesMap.has(solicitanteNome)) {
          solicitantesMap.set(solicitanteNome, []);
        }
        solicitantesMap.get(solicitanteNome)!.push(desarquivamento);
      });

      // Calcular informações de paginação
      const totalPaginas = Math.max(1, Math.ceil(total / limite));
      const paginacaoInfo = solicitouPaginacao
        ? {
            pagina,
            limite,
            total,
            totalPaginas,
            exibindo: desarquivamentos.length,
          }
        : undefined;

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { chromium } = require("playwright");
        let browser: Browser | null = null;

        try {
          browser = await chromium.launch({
            args: ["--no-sandbox", "--font-render-hinting=none"],
            timeout: 30_000,
          });
          const page = await browser.newPage();

          const html = await this.buildRelatorioMensalHTML(
            ano,
            mes,
            desarquivamentos,
            solicitantesMap,
            paginacaoInfo,
          );
          await page.setContent(html, { waitUntil: "load", timeout: 30_000 });

          const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false,
          });

          return Buffer.from(pdf);
        } finally {
          if (browser) {
            await browser.close().catch(() => undefined);
          }
        }
      } catch (err) {
        this.logger.warn(
          "Playwright indisponível ou falhou. Usando fallback PDFKit simplificado.",
          err,
        );
        Sentry.addBreadcrumb({
          category: "pdf",
          message: "Playwright fallback ativado para PDF Mensal",
          level: "warning",
          data: { error: (err as Error).message, ano, mes },
        });

        // Fallback: PDFKit com conteúdo mínimo
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PDFDocument: any = require("pdfkit");

        return await new Promise<Buffer>((resolve, reject) => {
          const doc = new PDFDocument({
            size: "A4",
            margins: { top: 50, bottom: 80, left: 50, right: 50 },
          });
          const buffers: Buffer[] = [];
          doc.on("data", (d: Buffer) => buffers.push(d));
          doc.on("end", () => resolve(Buffer.concat(buffers)));
          doc.on("error", (e: any) => reject(e));

          // Rodapé automático em cada nova página
          doc.on("pageAdded", () => this.drawPdfKitFooter(doc));

          const mesNome = new Date(ano, mes - 1, 1).toLocaleDateString(
            "pt-BR",
            {
              month: "long",
              year: "numeric",
            },
          );

          this.drawBrasoesHeader(
            doc,
            `RELATÓRIO MENSAL - ${mesNome.toUpperCase()}`,
          );
          doc.moveDown();

          doc.font("Helvetica-Bold").fontSize(14).text("Resumo");
          doc.font("Helvetica").fontSize(12);
          doc.text(`Total de requisições: ${total}`);
          if (solicitouPaginacao) {
            doc.text(
              `Exibindo: ${desarquivamentos.length} (Página ${pagina} de ${totalPaginas})`,
            );
          } else {
            doc.text(`Exibindo no relatório: ${desarquivamentos.length}`);
          }
          doc.moveDown();

          doc.font("Helvetica-Bold").fontSize(14).text("Por Solicitante");
          doc.font("Helvetica").fontSize(11);
          solicitantesMap.forEach((itens, solicitante) => {
            doc.text(`${solicitante}: ${itens.length} requisições`);
          });
          doc.moveDown();

          doc
            .font("Helvetica-Bold")
            .fontSize(13)
            .text("Detalhes dos Desarquivamentos");
          doc.moveDown(0.4);

          const pageBottomLimit = () =>
            doc.page.height - doc.page.margins.bottom - 60;
          const normalizeCell = (value: unknown, max = 30): string => {
            const raw = String(value ?? "N/A")
              .replace(/\s+/g, " ")
              .trim();
            if (!raw) return "N/A";
            return raw.length > max ? `${raw.slice(0, max - 2)}..` : raw;
          };
          const formatDate = (value: unknown): string => {
            if (!value) return "N/A";
            const parsed = new Date(String(value));
            if (Number.isNaN(parsed.getTime())) return "N/A";
            return parsed.toLocaleDateString("pt-BR");
          };

          const columns = [
            { label: "Número", width: 100 },
            { label: "Nome Completo", width: 140 },
            { label: "Tipo Doc.", width: 70 },
            { label: "Serv. Resp.", width: 115 },
            { label: "Data Solic.", width: 60 },
          ];
          const rowHeight = 20;
          const tableStartX = doc.page.margins.left;

          const drawTableHeader = () => {
            const y = doc.y;
            let x = tableStartX;
            doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827");
            columns.forEach((column) => {
              doc
                .rect(x, y, column.width, rowHeight)
                .fillColor("#bfbfbf")
                .fill()
                .strokeColor("#9ca3af")
                .stroke();
              doc.fillColor("#000").text(column.label, x + 3, y + 5, {
                width: column.width - 6,
                align: "left",
              });
              x += column.width;
            });
            doc.y = y + rowHeight;
          };

          const drawRow = (values: string[]) => {
            const y = doc.y;
            let x = tableStartX;
            doc.font("Helvetica").fontSize(8).fillColor("#111827");
            values.forEach((value, index) => {
              const width = columns[index].width;
              doc.rect(x, y, width, rowHeight).strokeColor("#d1d5db").stroke();
              doc.text(value, x + 3, y + 4, {
                width: width - 6,
                align: "left",
                ellipsis: true,
                lineBreak: false,
              });
              x += width;
            });
            doc.y = y + rowHeight;
          };

          const ensureSpaceForRow = () => {
            if (doc.y + rowHeight <= pageBottomLimit()) return;
            doc.addPage();
            this.drawBrasoesHeader(
              doc,
              `RELATÓRIO MENSAL - ${mesNome.toUpperCase()}`,
            );
            doc.moveDown(0.4);
            doc
              .font("Helvetica-Bold")
              .fontSize(13)
              .text("Detalhes dos Desarquivamentos (continuação)");
            doc.moveDown(0.4);
            drawTableHeader();
          };

          if (desarquivamentos.length === 0) {
            doc
              .font("Helvetica")
              .fontSize(11)
              .text(
                "Nenhum desarquivamento encontrado para os filtros informados.",
              );
          } else {
            drawTableHeader();
            desarquivamentos.forEach((item) => {
              ensureSpaceForRow();
              drawRow([
                normalizeCell(
                  item.numeroNicLaudoAuto || item.numeroProcesso,
                  22,
                ),
                normalizeCell(item.nomeCompleto, 28),
                normalizeCell(item.tipoDocumento, 16),
                normalizeCell(item.servidorResponsavel, 25),
                formatDate(item.dataSolicitacao),
              ]);
            });
          }

          this.drawPdfKitFooter(doc);
          doc.end();
        });
      }
    } catch (error) {
      this.logger.error("Erro ao gerar relatório mensal PDF", error);
      Sentry.captureException(error, {
        tags: { pdf_type: "relatorio_mensal" },
        extra: { ano, mes },
      });
      throw new Error(
        "Falha ao gerar relatório mensal PDF. Verifique os parâmetros fornecidos.",
      );
    }
  }

  private async buildRelatorioMensalHTML(
    ano: number,
    mes: number,
    desarquivamentos: any[],
    solicitantesMap: Map<string, any[]>,
    paginacaoInfo?: {
      pagina: number;
      limite: number;
      total: number;
      totalPaginas: number;
      exibindo: number;
    },
  ): Promise<string> {
    const { rnLogo, itepLogo } = await this.loadReportLogos();

    const dataGeracao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const safeDataGeracao = this.escapeHtml(dataGeracao);

    const mesNome = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const safeMesNomeUpper = this.escapeHtml(mesNome.toUpperCase());

    const css = this.getReportBaseCSS();
    const headerHTML = this.getReportHeaderHTML(rnLogo, itepLogo);
    const footerHTML = this.getReportFooterHTML();

    // Informações de paginação
    const paginacaoHTML = paginacaoInfo
      ? `<div class="paginacao-info">Exibindo ${paginacaoInfo.exibindo} de ${paginacaoInfo.total} requisições (Página ${paginacaoInfo.pagina} de ${paginacaoInfo.totalPaginas})</div>`
      : "";

    // Tabela consolidada de todas as solicitações do mês
    let rowIndex = 0;
    const allItemsTableRows = desarquivamentos
      .map((d) => {
        rowIndex++;
        const dataSolicitacao = d.dataSolicitacao
          ? new Date(d.dataSolicitacao).toLocaleDateString("pt-BR")
          : "N/A";
        return `
              <tr>
                <td class="center">${rowIndex}</td>
                <td class="wrap">${this.escapeHtml(d.nomeCompleto || "N/A")}</td>
                <td>${this.escapeHtml(d.numeroNicLaudoAuto || d.numeroProcesso || "N/A")}</td>
                <td>${this.escapeHtml(d.tipoDocumento || "N/A")}</td>
                <td class="wrap">${this.escapeHtml(d.servidorResponsavel || "N/A")}</td>
                <td class="center">${this.escapeHtml(dataSolicitacao)}</td>
              </tr>`;
      })
      .join("");

    // Resumo por solicitante
    const solicitantesResumoHTML = Array.from(solicitantesMap.entries())
      .map(([solicitante, itens]) => {
        return `
              <tr>
                <td>${this.escapeHtml(solicitante)}</td>
                <td class="center">${itens.length}</td>
              </tr>`;
      })
      .join("");

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório Mensal - ${this.escapeHtml(mesNome)}</title>
  <style>${css}</style>
</head>
<body>
  <table class="documento-completo">
    <thead>
      <tr><td>${headerHTML}</td></tr>
    </thead>
    <tfoot>
      <tr><td>${footerHTML}</td></tr>
    </tfoot>
    <tbody>
      <tr>
        <td>
          <h1 class="titulo-relatorio"><strong>RELATÓRIO MENSAL - ${safeMesNomeUpper}</strong></h1>

          <div class="data-geracao">Gerado em: ${safeDataGeracao}</div>
          ${paginacaoHTML}

          <!-- Cards Resumo -->
          <div class="cards-grid">
            <div class="card">
              <div class="card-title">Total de Requisições${paginacaoInfo ? " (nesta página)" : ""}</div>
              <div class="card-value">${desarquivamentos.length}</div>
            </div>
            <div class="card">
              <div class="card-title">Solicitantes Diferentes</div>
              <div class="card-value">${solicitantesMap.size}</div>
            </div>
            ${
              paginacaoInfo
                ? `<div class="card">
              <div class="card-title">Total Geral no Mês</div>
              <div class="card-value">${paginacaoInfo.total}</div>
            </div>`
                : ""
            }
          </div>

          <!-- Resumo por Solicitante -->
          <div class="chart-section">
            <h2 class="chart-title">Resumo por Solicitante</h2>
            <table class="solicitacoes-table">
              <colgroup>
                <col style="width:75%;" />
                <col style="width:25%;" />
              </colgroup>
              <thead>
                <tr>
                  <th>Solicitante</th>
                  <th>Qtd. Requisições</th>
                </tr>
              </thead>
              <tbody>
                ${solicitantesResumoHTML}
              </tbody>
            </table>
          </div>

          <!-- Tabela Completa de Solicitações -->
          <div class="chart-section">
            <h2 class="chart-title">Detalhamento das Solicitações</h2>
            ${
              desarquivamentos.length === 0
                ? '<p class="fs10">Nenhum desarquivamento encontrado para o período informado.</p>'
                : `
            <table class="solicitacoes-table">
              <colgroup>
                <col style="width:5%;" />
                <col style="width:20%;" />
                <col style="width:18%;" />
                <col style="width:15%;" />
                <col style="width:28%;" />
                <col style="width:14%;" />
              </colgroup>
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Nome Completo</th>
                  <th>Nº NIC/Laudo/Auto</th>
                  <th>Tipo Documento</th>
                  <th>Servidor Responsável</th>
                  <th>Data Solic.</th>
                </tr>
              </thead>
              <tbody>
                ${allItemsTableRows}
              </tbody>
            </table>`
            }
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }

  private mapStatusNome(status: string): string {
    const mapNome: Record<string, string> = {
      ["SOLICITADO"]: "Solicitado",
      ["DESARQUIVADO"]: "Desarquivado",
      ["FINALIZADO"]: "Finalizado",
      ["NAO_LOCALIZADO"]: "Não Localizado",
      ["NAO_COLETADO"]: "Não Coletado",
      ["RETIRADO_PELO_SETOR"]: "Retirado pelo Setor",
      ["REARQUIVAMENTO_SOLICITADO"]: "Rearquivamento Solicitado",
    };
    return mapNome[status] || status;
  }
}
