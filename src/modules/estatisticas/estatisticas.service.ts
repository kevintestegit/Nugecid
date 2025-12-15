import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "../nugecid/domain/enums/status-desarquivamento.enum";
import * as path from "path";
import { promises as fs } from "fs";
import { existsSync } from "fs";

export interface CardData {
  totalDesarquivamentos: number;
  requisicoesPendentes: number;
  requisicoesEsteMes: number;
  recentes: any[];
  pendentesAtrasados?: number;
}

export interface ChartData {
  name: string;
  total?: number;
  value?: number;
}

@Injectable()
export class EstatisticasService {
  private readonly logger = new Logger(EstatisticasService.name);

  constructor(
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepo: Repository<DesarquivamentoTypeOrmEntity>,
  ) {}

  async getCardData(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    userId?: number;
  }): Promise<CardData> {
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
        .where("d.status = :status", { status: StatusDesarquivamentoEnum.SOLICITADO });
      
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
        .where("d.status = :status", { status: StatusDesarquivamentoEnum.SOLICITADO })
        .andWhere("d.dataSolicitacao <= :limite", { limite: cincoDiasAtras });

      if (filtros?.userId) {
        pendentesAtrasadosQuery = pendentesAtrasadosQuery.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
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

      const [total, pendentes, pendentesAtrasados, esteMes, recentes] = await Promise.all([
        totalQuery.getCount(),
        pendentesQuery.getCount(),
        pendentesAtrasadosQuery.getCount(),
        esteMesQuery.getCount(),
        recentesQuery.getMany(),
      ]);

      return {
        totalDesarquivamentos: total,
        requisicoesPendentes: pendentes,
        pendentesAtrasados,
        requisicoesEsteMes: esteMes,
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
    try {
      const now = new Date();
      const start = filtros?.dataInicio || new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const end = filtros?.dataFim || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Buscar todos os desarquivamentos no período usando dataSolicitacao
      let query = this.desarquivamentoRepo
        .createQueryBuilder("d")
        .select("d.dataSolicitacao", "dataSolicitacao")
        .where("d.dataSolicitacao >= :start", { start })
        .andWhere("d.dataSolicitacao <= :end", { end });

      if (filtros?.userId) {
        query = query.andWhere("d.criadoPorId = :userId", {
          userId: filtros.userId,
        });
      }

      const desarquivamentos = await query.getRawMany();

      // Agrupar por mês usando JavaScript (agnóstico de banco)
      const contagemPorMes = new Map<string, number>();

      desarquivamentos.forEach((item) => {
        if (item.dataSolicitacao) {
          const data = new Date(item.dataSolicitacao);
          const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
          contagemPorMes.set(key, (contagemPorMes.get(key) || 0) + 1);
        }
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

      return rows.map((r) => ({
        name: mapNome[r.status] || r.status,
        value: Number(r.total),
      }));
    } catch (error) {
      this.logger.error("Erro ao buscar distribuição por status", error);
      throw new Error(
        "Falha ao carregar distribuição por status. Verifique os parâmetros de filtro.",
      );
    }
  }

  async generateRelatorioPdf(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    userId?: number;
  }): Promise<Buffer> {
    try {
      const [cardData, requisicoesPorMes, statusDistribuicao] =
        await Promise.all([
          this.getCardData(filtros),
          this.getRequisicoesPorMes(filtros),
          this.getStatusDistribuicao(filtros),
        ]);

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { chromium } = require("playwright");

        const browser = await chromium.launch({
          args: ["--no-sandbox", "--font-render-hinting=none"],
        });
        const page = await browser.newPage();

        const html = await this.buildRelatorioHTML(
          cardData,
          requisicoesPorMes,
          statusDistribuicao,
          filtros,
        );
        await page.setContent(html, { waitUntil: "load" });

        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
        });

        await browser.close();
        return Buffer.from(pdf);
      } catch (err) {
        this.logger.warn(
          "Playwright indisponível ou falhou. Usando fallback PDFKit simplificado.",
          err,
        );

        // Fallback: PDFKit com conteúdo mínimo
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PDFDocument: any = require("pdfkit");

        return await new Promise<Buffer>((resolve, reject) => {
          const doc = new PDFDocument({
            size: "A4",
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
          });
          const buffers: Buffer[] = [];
          doc.on("data", (d: Buffer) => buffers.push(d));
          doc.on("end", () => resolve(Buffer.concat(buffers)));
          doc.on("error", (e: any) => reject(e));

          doc
            .font("Helvetica-Bold")
            .fontSize(16)
            .text("RELATÓRIO DE ESTATÍSTICAS", { align: "center" });
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
          doc
            .fontSize(10)
            .text(
              "Para visualizar gráficos completos, habilite o Playwright no ambiente de execução.",
              { align: "center" },
            );

          doc.end();
        });
      }
    } catch (error) {
      this.logger.error("Erro ao gerar relatório PDF", error);
      throw new Error(
        "Falha ao gerar relatório PDF. Verifique os logs para mais detalhes.",
      );
    }
  }

  private async buildRelatorioHTML(
    cardData: CardData,
    requisicoesPorMes: ChartData[],
    statusDistribuicao: ChartData[],
    filtros?: { dataInicio?: Date; dataFim?: Date },
  ): Promise<string> {
    // Carregar logos
    const rnLogo = await this.getImageDataUri(
      path.join(
        process.cwd(),
        "frontend",
        "src",
        "components",
        "img",
        "Brasão-RN.png",
      ),
      "image/png",
    );
    const itepLogo = await this.getImageDataUri(
      path.join(
        process.cwd(),
        "frontend",
        "src",
        "components",
        "img",
        "Brasão-ITEP.png",
      ),
      "image/png",
    );

    const dataGeracao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const css = this.getRelatorioPrintCSS();

    // Informações sobre período do relatório
    const periodoInfo = filtros?.dataInicio || filtros?.dataFim
      ? `<div class="periodo-info">Período: ${filtros.dataInicio ? new Date(filtros.dataInicio).toLocaleDateString("pt-BR") : "Início"} até ${filtros.dataFim ? new Date(filtros.dataFim).toLocaleDateString("pt-BR") : "Hoje"}</div>`
      : "";

    // Criar dados para o gráfico de barras
    const maxValue = Math.max(...requisicoesPorMes.map((d) => d.total || 0));
    const barChartHTML = requisicoesPorMes
      .map((item) => {
        const percentage =
          maxValue > 0 ? ((item.total || 0) / maxValue) * 100 : 0;
        return `
        <div class="bar-item">
          <div class="bar-label">${item.name}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%"></div>
            <div class="bar-value">${item.total || 0}</div>
          </div>
        </div>`;
      })
      .join("");

    // Criar dados para o gráfico de pizza (simplified - text list)
    const totalStatus = statusDistribuicao.reduce(
      (sum, item) => sum + (item.value || 0),
      0,
    );
    const pieChartHTML = statusDistribuicao
      .map((item) => {
        const percentage =
          totalStatus > 0 ? ((item.value || 0) / totalStatus) * 100 : 0;
        return `
        <div class="status-item">
          <div class="status-name">${item.name}</div>
          <div class="status-values">
            <span class="status-count">${item.value || 0}</span>
            <span class="status-percent">(${percentage.toFixed(1)}%)</span>
          </div>
        </div>`;
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
  <div class="print-root">
    <!-- HEADER -->
    <header class="print-header">
      <div class="header-line">
        <img src="${rnLogo || ""}" alt="Governo RN" class="logo" />
        <div class="header-text">
          <div>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</div>
          <div>SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</div>
          <div>POLÍCIA CIENTÍFICA</div>
          <div>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA – NUGECID</div>
          <div class="bold">ARQUIVO GERAL – ITEP</div>
        </div>
        <img src="${itepLogo || ""}" alt="ITEP" class="logo" />
      </div>
      <div class="title-bar">RELATÓRIO DE ESTATÍSTICAS</div>
    </header>

    <!-- BODY -->
    <main class="print-body">
      <div class="data-geracao">Gerado em: ${dataGeracao}</div>
      ${periodoInfo}

      <!-- Cards -->
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

      <!-- Gráfico de Status -->
      <div class="chart-section">
        <h2 class="chart-title">Distribuição por Status</h2>
        <div class="status-list">
          ${pieChartHTML}
        </div>
      </div>
    </main>

    <!-- FOOTER -->
    <footer class="print-footer">
      <div class="footer-content">
        <div>
          <div class="footer-line">Instituto Técnico-Científico de Perícia – ITEP</div>
          <div class="footer-line">Núcleo de Gestão do Conhecimento, Informação, Documentação e Memória – NUGECID</div>
          <div class="footer-line">Av. Duque de Caxias, 97 – Ribeira – Natal/RN – CEP: 59012-200 – Tel.: (84) 3232-6528</div>
          <div class="footer-line">E-mail: arquivo@itep.rn.gov.br</div>
        </div>
        <div class="page-number"></div>
      </div>
    </footer>
  </div>
</body>
</html>`;
  }

  private getRelatorioPrintCSS(): string {
    return `
  @page { size: A4 portrait; margin: 16mm 14mm 20mm 14mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }

  /* Header / Footer */
  .print-header, .print-footer { position: fixed; left: 0; right: 0; }
  .print-header { top: 0; height: 115px; }
  .print-footer { bottom: 0; height: 74px; font-size: 11px; color: #222; }

  /* Body spacing respecting header/footer */
  .print-body { margin-top: 130px; margin-bottom: 90px; }

  /* Header content */
  .header-line { display:flex; align-items:center; justify-content:space-between; }
  .logo { height: 58px; }
  .header-text { text-align:center; font-size:12px; line-height:1.25; }
  .header-text .bold { font-weight:700; }
  .title-bar { background:#555; color:#fff; padding:8px 10px; font-weight:700; letter-spacing:.2px; border-radius:4px; margin:8px auto 12px; text-transform:uppercase; text-align:center; }

  /* Data de geração e período */
  .data-geracao { text-align: right; font-size: 11px; color: #666; margin-bottom: 8px; }
  .periodo-info { text-align: right; font-size: 11px; color: #2563eb; font-weight: 600; margin-bottom: 16px; }

  /* Cards Grid */
  .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { border: 1px solid #bdbdbd; padding: 16px; background: #f9f9f9; border-radius: 4px; }
  .card-title { font-size: 12px; color: #555; margin-bottom: 8px; }
  .card-value { font-size: 28px; font-weight: 700; color: #222; }

  /* Charts */
  .chart-section { margin-bottom: 24px; page-break-inside: avoid; }
  .chart-title { font-size: 14px; font-weight: 700; color: #222; margin-bottom: 12px; border-bottom: 2px solid #555; padding-bottom: 6px; }

  /* Bar Chart */
  .bar-chart { display: flex; flex-direction: column; gap: 8px; }
  .bar-item { display: flex; align-items: center; }
  .bar-label { width: 80px; font-size: 10px; color: #333; }
  .bar-container { flex: 1; display: flex; align-items: center; height: 24px; background: #f0f0f0; border-radius: 3px; position: relative; }
  .bar-fill { background: linear-gradient(to right, #4CAF50, #66BB6A); height: 100%; border-radius: 3px; min-width: 2px; }
  .bar-value { position: absolute; right: 8px; font-size: 10px; font-weight: 600; color: #222; }

  /* Status List */
  .status-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .status-item { display: flex; justify-content: space-between; padding: 8px 12px; border: 1px solid #e0e0e0; background: #fafafa; border-radius: 3px; }
  .status-name { font-size: 11px; color: #333; }
  .status-values { display: flex; gap: 6px; font-size: 11px; }
  .status-count { font-weight: 700; color: #222; }
  .status-percent { color: #666; }

  /* Footer */
  .footer-content { display: flex; justify-content: space-between; }
  .footer-line { font-size: 10px; line-height: 1.4; }
  .page-number::after { content: "Página " counter(page) " de " counter(pages); font-size:10px; }
  `;
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

  async generateRelatorioMensalPdf(
    ano: number,
    mes: number,
    paginacao?: { pagina?: number; limite?: number },
    userId?: number,
  ): Promise<Buffer> {
    try {
      // Calcular início e fim do mês
      const startOfMonth = new Date(ano, mes - 1, 1);
      const endOfMonth = new Date(ano, mes, 0, 23, 59, 59, 999);

      // Paginação
      const pagina = paginacao?.pagina || 1;
      const limite = paginacao?.limite || 50;
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
        .orderBy("d.dataSolicitacao", "ASC")
        .skip(skip)
        .take(limite);

      if (userId) {
        query = query.andWhere("d.criadoPorId = :userId", { userId });
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
      const totalPaginas = Math.ceil(total / limite);
      const paginacaoInfo = {
        pagina,
        limite,
        total,
        totalPaginas,
        exibindo: desarquivamentos.length,
      };

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { chromium } = require("playwright");

        const browser = await chromium.launch({
          args: ["--no-sandbox", "--font-render-hinting=none"],
        });
        const page = await browser.newPage();

        const html = await this.buildRelatorioMensalHTML(
          ano,
          mes,
          desarquivamentos,
          solicitantesMap,
          paginacaoInfo,
        );
        await page.setContent(html, { waitUntil: "load" });

        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
        });

        await browser.close();
        return Buffer.from(pdf);
      } catch (err) {
        this.logger.warn(
          "Playwright indisponível ou falhou. Usando fallback PDFKit simplificado.",
          err,
        );

        // Fallback: PDFKit com conteúdo mínimo
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PDFDocument: any = require("pdfkit");

        return await new Promise<Buffer>((resolve, reject) => {
          const doc = new PDFDocument({
            size: "A4",
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
          });
          const buffers: Buffer[] = [];
          doc.on("data", (d: Buffer) => buffers.push(d));
          doc.on("end", () => resolve(Buffer.concat(buffers)));
          doc.on("error", (e: any) => reject(e));

          const mesNome = new Date(ano, mes - 1, 1).toLocaleDateString(
            "pt-BR",
            {
              month: "long",
              year: "numeric",
            },
          );

          doc
            .font("Helvetica-Bold")
            .fontSize(16)
            .text(`RELATÓRIO MENSAL - ${mesNome.toUpperCase()}`, {
              align: "center",
            });
          doc.moveDown();

          doc.font("Helvetica-Bold").fontSize(14).text("Resumo");
          doc.font("Helvetica").fontSize(12);
          doc.text(`Total de Requisições: ${total}`);
          doc.text(
            `Exibindo: ${desarquivamentos.length} (Página ${pagina} de ${totalPaginas})`,
          );
          doc.moveDown();

          doc.font("Helvetica-Bold").fontSize(14).text("Por Solicitante");
          doc.font("Helvetica").fontSize(12);
          solicitantesMap.forEach((desarquivamentos, solicitante) => {
            doc.text(
              `${solicitante}: ${desarquivamentos.length} requisição(ões)`,
            );
          });

          doc.moveDown();
          doc
            .fontSize(10)
            .text(
              "Para visualizar relatório completo, habilite o Playwright no ambiente de execução.",
              { align: "center" },
            );

          doc.end();
        });
      }
    } catch (error) {
      this.logger.error("Erro ao gerar relatório mensal PDF", error);
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
    // Carregar logos
    const rnLogo = await this.getImageDataUri(
      path.join(
        process.cwd(),
        "frontend",
        "src",
        "components",
        "img",
        "Brasão-RN.png",
      ),
      "image/png",
    );
    const itepLogo = await this.getImageDataUri(
      path.join(
        process.cwd(),
        "frontend",
        "src",
        "components",
        "img",
        "Brasão-ITEP.png",
      ),
      "image/png",
    );

    const dataGeracao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const mesNome = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    const css = this.getRelatorioPrintCSS();

    // Informações de paginação
    const paginacaoHTML = paginacaoInfo
      ? `<div class="paginacao-info">Exibindo ${paginacaoInfo.exibindo} de ${paginacaoInfo.total} requisições (Página ${paginacaoInfo.pagina} de ${paginacaoInfo.totalPaginas})</div>`
      : "";

    // Criar seções por solicitante
    const solicitantesHTML = Array.from(solicitantesMap.entries())
      .map(([solicitante, desarquivamentos]) => {
        const desarquivamentosHTML = desarquivamentos
          .map((d) => {
            // Usar dataSolicitacao em vez de createdAt
            const dataSolicitacao = d.dataSolicitacao
              ? new Date(d.dataSolicitacao).toLocaleDateString("pt-BR")
              : "N/A";
            const status = this.mapStatusNome(d.status);
            return `
            <tr>
              <td>${d.numeroNicLaudoAuto || d.numeroProcesso || "N/A"}</td>
              <td>${d.nomeCompleto || "N/A"}</td>
              <td>${d.tipoDocumento || "N/A"}</td>
              <td>${status}</td>
              <td>${dataSolicitacao}</td>
            </tr>`;
          })
          .join("");

        return `
        <div class="solicitante-section">
          <h3 class="solicitante-title">${solicitante} (${desarquivamentos.length} requisição(ões))</h3>
          <table class="desarquivamentos-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Nome Completo</th>
                <th>Tipo Documento</th>
                <th>Status</th>
                <th>Data Solicitação</th>
              </tr>
            </thead>
            <tbody>
              ${desarquivamentosHTML}
            </tbody>
          </table>
        </div>`;
      })
      .join("");

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório Mensal - ${mesNome}</title>
  <style>${css}</style>
  <style>
    .paginacao-info { text-align: center; font-size: 12px; color: #2563eb; font-weight: 600; margin-bottom: 16px; padding: 8px; background: #eff6ff; border-radius: 4px; }
    .solicitante-section { margin-bottom: 24px; page-break-inside: avoid; }
    .solicitante-title { font-size: 14px; font-weight: 700; color: #222; margin-bottom: 12px; border-bottom: 1px solid #555; padding-bottom: 6px; }
    .desarquivamentos-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .desarquivamentos-table th, .desarquivamentos-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
    .desarquivamentos-table th { background-color: #f5f5f5; font-weight: 600; }
  </style>
</head>
<body>
  <div class="print-root">
    <!-- HEADER -->
    <header class="print-header">
      <div class="header-line">
        <img src="${rnLogo || ""}" alt="Governo RN" class="logo" />
        <div class="header-text">
          <div>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</div>
          <div>SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</div>
          <div>POLÍCIA CIENTÍFICA</div>
          <div>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA – NUGECID</div>
          <div class="bold">ARQUIVO GERAL – ITEP</div>
        </div>
        <img src="${itepLogo || ""}" alt="ITEP" class="logo" />
      </div>
      <div class="title-bar">RELATÓRIO MENSAL - ${mesNome.toUpperCase()}</div>
    </header>

    <!-- BODY -->
    <main class="print-body">
      <div class="data-geracao">Gerado em: ${dataGeracao}</div>
      ${paginacaoHTML}

      <!-- Resumo -->
      <div class="cards-grid">
        <div class="card">
          <div class="card-title">Total de Requisições${paginacaoInfo ? " (nesta página)" : ""}</div>
          <div class="card-value">${desarquivamentos.length}</div>
        </div>
        <div class="card">
          <div class="card-title">Solicitantes Diferentes</div>
          <div class="card-value">${solicitantesMap.size}</div>
        </div>
        ${paginacaoInfo ? `<div class="card">
          <div class="card-title">Total Geral no Mês</div>
          <div class="card-value">${paginacaoInfo.total}</div>
        </div>` : ""}
      </div>

      <!-- Detalhes por Solicitante -->
      <div class="chart-section">
        <h2 class="chart-title">Requisições por Solicitante</h2>
        ${solicitantesHTML}
      </div>
    </main>

    <!-- FOOTER -->
    <footer class="print-footer">
      <div class="footer-content">
        <div>
          <div class="footer-line">Instituto Técnico-Científico de Perícia – ITEP</div>
          <div class="footer-line">Núcleo de Gestão do Conhecimento, Informação, Documentação e Memória – NUGECID</div>
          <div class="footer-line">Av. Duque de Caxias, 97 – Ribeira – Natal/RN – CEP: 59012-200 – Tel.: (84) 3232-6528</div>
          <div class="footer-line">E-mail: arquivo@itep.rn.gov.br</div>
        </div>
        <div class="page-number"></div>
      </div>
    </footer>
  </div>
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
