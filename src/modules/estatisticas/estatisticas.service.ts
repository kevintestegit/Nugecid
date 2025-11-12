import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "../nugecid/domain/enums/status-desarquivamento.enum";
import * as path from "path";
import * as fs from "fs";

export interface CardData {
  totalDesarquivamentos: number;
  atendimentosPendentes: number;
  atendimentosEsteMes: number;
  recentes: any[];
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

  async getCardData(): Promise<CardData> {
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

    const [total, pendentes, esteMes, recentes] = await Promise.all([
      this.desarquivamentoRepo.count(),
      this.desarquivamentoRepo.count({
        where: { status: StatusDesarquivamentoEnum.SOLICITADO },
      }),
      this.desarquivamentoRepo
        .createQueryBuilder("d")
        .where("d.createdAt BETWEEN :start AND :end", {
          start: startOfMonth,
          end: endOfMonth,
        })
        .getCount(),
      // Buscar últimas 10 atividades recentes
      this.desarquivamentoRepo
        .createQueryBuilder("d")
        .leftJoinAndSelect("d.criadoPor", "criadoPor")
        .leftJoinAndSelect("d.responsavel", "responsavel")
        .orderBy("d.createdAt", "DESC")
        .take(10)
        .getMany(),
    ]);

    return {
      totalDesarquivamentos: total,
      atendimentosPendentes: pendentes,
      atendimentosEsteMes: esteMes,
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
  }

  async getAtendimentosPorMes(): Promise<ChartData[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Obter contagens por mês (últimos 12 meses)
    const rows: Array<{ mes: string; total: number }> =
      await this.desarquivamentoRepo
        .createQueryBuilder("d")
        .select("TO_CHAR(d.createdAt, 'YYYY-MM')", "mes")
        .addSelect("COUNT(d.id)", "total")
        .where("d.createdAt >= :start", { start })
        .groupBy("TO_CHAR(d.createdAt, 'YYYY-MM')")
        .orderBy("TO_CHAR(d.createdAt, 'YYYY-MM')", "ASC")
        .getRawMany();

    // Normalizar para incluir meses sem registros
    const result: ChartData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const found = rows.find((r) => r.mes === key);
      const label = d.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });
      result.push({ name: label, total: Number(found?.total || 0) });
    }

    return result;
  }

  async getStatusDistribuicao(): Promise<ChartData[]> {
    const rows: Array<{ status: string; total: number }> =
      await this.desarquivamentoRepo
        .createQueryBuilder("d")
        .select("d.status", "status")
        .addSelect("COUNT(d.id)", "total")
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
  }

  async generateRelatorioPdf(): Promise<Buffer> {
    const [cardData, atendimentosPorMes, statusDistribuicao] =
      await Promise.all([
        this.getCardData(),
        this.getAtendimentosPorMes(),
        this.getStatusDistribuicao(),
      ]);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { chromium } = require("playwright");

      const browser = await chromium.launch({
        args: ["--no-sandbox", "--font-render-hinting=none"],
      });
      const page = await browser.newPage();

      const html = this.buildRelatorioHTML(
        cardData,
        atendimentosPorMes,
        statusDistribuicao,
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
        doc.text(`Atendimentos Pendentes: ${cardData.atendimentosPendentes}`);
        doc.text(`Atendimentos Este Mês: ${cardData.atendimentosEsteMes}`);
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
  }

  private buildRelatorioHTML(
    cardData: CardData,
    atendimentosPorMes: ChartData[],
    statusDistribuicao: ChartData[],
  ): string {
    // Carregar logos
    const rnLogo = this.getImageDataUri(
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
    const itepLogo = this.getImageDataUri(
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

    // Criar dados para o gráfico de barras
    const maxValue = Math.max(...atendimentosPorMes.map((d) => d.total || 0));
    const barChartHTML = atendimentosPorMes
      .map((item) => {
        const percentage = maxValue > 0 ? ((item.total || 0) / maxValue) * 100 : 0;
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

      <!-- Cards -->
      <div class="cards-grid">
        <div class="card">
          <div class="card-title">Total de Desarquivamentos</div>
          <div class="card-value">${cardData.totalDesarquivamentos}</div>
        </div>
        <div class="card">
          <div class="card-title">Atendimentos Pendentes</div>
          <div class="card-value">${cardData.atendimentosPendentes}</div>
        </div>
        <div class="card">
          <div class="card-title">Atendimentos Este Mês</div>
          <div class="card-value">${cardData.atendimentosEsteMes}</div>
        </div>
      </div>

      <!-- Gráfico de Barras -->
      <div class="chart-section">
        <h2 class="chart-title">Atendimentos por Mês (Último Ano)</h2>
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

  /* Data de geração */
  .data-geracao { text-align: right; font-size: 11px; color: #666; margin-bottom: 16px; }

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

  private getImageDataUri(filePath: string, mime = "image/png"): string {
    try {
      const abs = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(abs)) {
        this.logger.warn(`Logo não encontrada em: ${abs}`);
        return "";
      }
      const buf = fs.readFileSync(abs);
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (e) {
      this.logger.warn(
        `Falha ao carregar logo (${filePath}): ${(e as Error).message}`,
      );
      return "";
    }
  }

  async generateRelatorioMensalPdf(ano: number, mes: number): Promise<Buffer> {
    // Calcular início e fim do mês
    const startOfMonth = new Date(ano, mes - 1, 1);
    const endOfMonth = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Buscar desarquivamentos do mês com informações do solicitante
    const desarquivamentos = await this.desarquivamentoRepo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.criadoPor", "criadoPor")
      .leftJoinAndSelect("d.responsavel", "responsavel")
      .where("d.createdAt BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      })
      .orderBy("d.createdAt", "ASC")
      .getMany();

    // Agrupar por solicitante
    const solicitantesMap = new Map<string, any[]>();
    desarquivamentos.forEach((desarquivamento) => {
      const solicitanteNome = (desarquivamento.criadoPor as any)?.nome || "Não informado";
      if (!solicitantesMap.has(solicitanteNome)) {
        solicitantesMap.set(solicitanteNome, []);
      }
      solicitantesMap.get(solicitanteNome)!.push(desarquivamento);
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { chromium } = require("playwright");

      const browser = await chromium.launch({
        args: ["--no-sandbox", "--font-render-hinting=none"],
      });
      const page = await browser.newPage();

      const html = this.buildRelatorioMensalHTML(
        ano,
        mes,
        desarquivamentos,
        solicitantesMap
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

        const mesNome = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(16)
          .text(`RELATÓRIO MENSAL - ${mesNome.toUpperCase()}`, { align: "center" });
        doc.moveDown();

        doc.font("Helvetica-Bold").fontSize(14).text("Resumo");
        doc.font("Helvetica").fontSize(12);
        doc.text(`Total de Desarquivamentos: ${desarquivamentos.length}`);
        doc.moveDown();

        doc.font("Helvetica-Bold").fontSize(14).text("Por Solicitante");
        doc.font("Helvetica").fontSize(12);
        solicitantesMap.forEach((desarquivamentos, solicitante) => {
          doc.text(`${solicitante}: ${desarquivamentos.length} desarquivamento(s)`);
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
  }

  private buildRelatorioMensalHTML(
    ano: number,
    mes: number,
    desarquivamentos: any[],
    solicitantesMap: Map<string, any[]>
  ): string {
    // Carregar logos
    const rnLogo = this.getImageDataUri(
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
    const itepLogo = this.getImageDataUri(
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

    // Criar seções por solicitante
    const solicitantesHTML = Array.from(solicitantesMap.entries())
      .map(([solicitante, desarquivamentos]) => {
        const desarquivamentosHTML = desarquivamentos
          .map((d) => {
            const dataSolicitacao = new Date(d.createdAt).toLocaleDateString("pt-BR");
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
          <h3 class="solicitante-title">${solicitante} (${desarquivamentos.length} desarquivamento(s))</h3>
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

      <!-- Resumo -->
      <div class="cards-grid">
        <div class="card">
          <div class="card-title">Total de Desarquivamentos</div>
          <div class="card-value">${desarquivamentos.length}</div>
        </div>
        <div class="card">
          <div class="card-title">Solicitantes Diferentes</div>
          <div class="card-value">${solicitantesMap.size}</div>
        </div>
      </div>

      <!-- Detalhes por Solicitante -->
      <div class="chart-section">
        <h2 class="chart-title">Desarquivamentos por Solicitante</h2>
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
