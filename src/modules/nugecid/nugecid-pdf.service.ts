import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as PdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
const PdfPrinter = require("pdfmake");
import { TDocumentDefinitions } from "pdfmake/interfaces";
import htmlToPdfmake from "html-to-pdfmake";
import { JSDOM } from "jsdom";

import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import {
  buildTermoTemplateHtml,
  loadTermoTemplateLogos,
} from "./templates/termo-desarquivamento-template";

export interface TermoDesarquivamentoOptions {
  header?: {
    titulo?: string;
    subtitulo?: string;
    informacoesAdicionais?: string[];
  };
  footer?: {
    linhas?: string[];
  };
}

@Injectable()
export class NugecidPdfService {
  private readonly logger = new Logger(NugecidPdfService.name);
  private readonly pdfPrinter: any;

  constructor(
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
  ) {
    const fontsPath = path.join(
      process.cwd(),
      "src",
      "assets",
      "fonts",
      "Roboto",
    );

    const missingFonts = [
      "Roboto-Regular.ttf",
      "Roboto-Medium.ttf",
      "Roboto-Italic.ttf",
      "Roboto-MediumItalic.ttf",
    ].filter((file) => !fs.existsSync(path.join(fontsPath, file)));

    if (missingFonts.length) {
      this.logger.warn(
        `Fontes necessárias para o PDF não foram encontradas (${missingFonts.join(
          ", ",
        )}). Verifique o diretório src/assets/fonts/Roboto.`,
      );
    }

    this.pdfPrinter = new PdfPrinter({
      Roboto: {
        normal: path.join(fontsPath, "Roboto-Regular.ttf"),
        bold: path.join(fontsPath, "Roboto-Medium.ttf"),
        italics: path.join(fontsPath, "Roboto-Italic.ttf"),
        bolditalics: path.join(fontsPath, "Roboto-MediumItalic.ttf"),
      },
    });
  }

  async generatePdf(
    desarquivamento: DesarquivamentoTypeOrmEntity,
  ): Promise<Buffer> {
    const baseEntity = await this.resolveBaseEntity(desarquivamento);
    const itensElegiveis = await this.findEligibleProcessItems(baseEntity);
    const somenteDesarquivados = this.filterDesarquivados(itensElegiveis);

    if (!somenteDesarquivados.length) {
      throw new BadRequestException(
        "Nao ha itens com status DESARQUIVADO para este processo.",
      );
    }

    const html = buildTermoTemplateHtml({
      base: baseEntity,
      itens: somenteDesarquivados,
      logos: await loadTermoTemplateLogos(this.logger),
    });

    try {
      return await this.renderPdfFromHtml(html);
    } catch (error) {
      this.logger.error(
        "Erro ao renderizar termo de desarquivamento em PDF via pdfmake.",
        error,
      );
      throw new InternalServerErrorException(
        "Não foi possível gerar o termo de desarquivamento em PDF. Tente novamente mais tarde.",
      );
    }
  }

  private async renderPdfFromHtml(html: string): Promise<Buffer> {
    const browserBuffer = await this.tryRenderWithPlaywright(html);
    if (browserBuffer) {
      return browserBuffer;
    }
    return this.renderPdfWithPdfmake(html);
  }

  private async tryRenderWithPlaywright(html: string): Promise<Buffer | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { chromium } = require("playwright");
      const browser = await chromium.launch({
        args: ["--no-sandbox", "--font-render-hinting=none"],
        headless: true,
      });
      const page = await browser.newPage({
        viewport: { width: 794, height: 1123 }, // A4 @ 96dpi
      });

      await page.setContent(html, { waitUntil: "load" });

      // Aguarda o script de ajuste de quebra de página executar
      await page.waitForTimeout(100);

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "10mm",
          bottom: "10mm",
          left: "10mm",
          right: "10mm",
        },
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.warn(
        "Playwright indisponível para gerar termo PDF. Aplicando fallback via pdfmake.",
        error,
      );
      return null;
    }
  }

  /**
   * Gera PDF com cabeçalho e rodapé fixos em todas as páginas
   */
  async generatePdfWithFixedHeaderFooter(
    desarquivamento: DesarquivamentoTypeOrmEntity,
  ): Promise<Buffer> {
    const baseEntity = await this.resolveBaseEntity(desarquivamento);
    const itensElegiveis = await this.findEligibleProcessItems(baseEntity);
    const somenteDesarquivados = this.filterDesarquivados(itensElegiveis);

    if (!somenteDesarquivados.length) {
      throw new BadRequestException(
        "Não há itens com status DESARQUIVADO para este processo.",
      );
    }

    // Carregar logos em base64
    const logos = await loadTermoTemplateLogos(this.logger);

    // Data atual para assinatura
    const now = new Date();
    const dataAssinatura = now.toLocaleDateString("pt-BR");
    const horaAssinatura = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Gerar linhas da tabela de documentos
    const rowsHtml = somenteDesarquivados
      .map((item, index) => {
        const numero = item.numeroNicLaudoAuto || "";
        return `
          <tr>
            <td class="col-idx">${index + 1}</td>
            <td class="col-type">${item.tipoDocumento || ""}</td>
            <td class="col-name">${item.nomeCompleto || ""}</td>
            <td class="col-num">${numero}</td>
          </tr>
        `;
      })
      .join("");

    // HTML do conteúdo (sem cabeçalho e rodapé - serão adicionados via displayHeaderFooter)
    const contentHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 10pt;
      color: #000;
      padding: 0 10mm;
    }
    .center { text-align: center; }
    h1 { font-size: 14pt; text-align: center; margin: 10pt 0; }
    table.borda { width: 100%; border: 0.75pt solid #000; border-collapse: collapse; margin-top: 10pt; }
    table.borda td, table.borda th { border: 0.75pt solid #000; padding: 3pt 5pt; }
    .faixa { background: #bfbfbf; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .col-idx { width: 30pt; text-align: center; }
    .col-type { width: 100pt; text-align: center; }
    .col-name { width: 170pt; text-align: center; }
    .col-num { width: 180pt; text-align: center; }
    .fs10 { font-size: 10pt; }
    .fs11 { font-size: 11pt; }
    .fs12 { font-size: 12pt; }
    .vermelho { color: red; }
    .ass-linha { border-bottom: 1.5pt solid #000; height: 16pt; margin-bottom: 2pt; }
    .signature-block { page-break-inside: avoid; margin-top: 15pt; }
    .intro { text-align: justify; text-indent: 35.4pt; margin-bottom: 10pt; }
    .nota { margin-top: 15pt; font-weight: bold; }
    .autenticacao { margin-top: 20pt; font-style: italic; }
  </style>
</head>
<body>
  <h1><strong>TERMO DE DESARQUIVAMENTO DE DOCUMENTO</strong></h1>

  <p class="center fs10" style="margin-bottom: 7pt;">Ao servidor responsável pelo desarquivamento compete ter ciência que esta solicitação de desarquivamento de documento deve estar vinculada a uma demanda da Polícia Científica do Rio Grande do Norte, ou jurisdição de órgão público através de autoridade competente.</p>
  
  <p class="fs10 intro">
    Estar ciente quanto às orientações e normativas descritas na portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe sobre o acesso e o fluxo de desarquivamento de documentos no âmbito do Setor de Arquivo Geral da Polícia Científica do Rio Grande do Norte.
  </p>

  <table class="borda">
    <tbody>
      <tr>
        <td colspan="4" class="faixa center fs12"><strong>Nº. DE PROCESSO ELETRÔNICO</strong></td>
      </tr>
      <tr>
        <td colspan="4" class="faixa center fs11">${baseEntity.numeroProcesso || ""}</td>
      </tr>
      <tr class="faixa">
        <td class="center fs12" colspan="2" style="width: 130pt;">
          <strong>TIPO DE DOCUMENTO</strong><br/>
          <span style="font-size: 9pt;">Ex: Prontuário, Laudo, Parecer, Relatório.</span>
        </td>
        <td class="center fs12" style="width: 170pt;"><strong>NOME</strong></td>
        <td class="center fs12" style="width: 180pt;"><strong>NÚMERO</strong></td>
      </tr>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signature-block">
    <table class="borda">
      <tbody>
        <tr class="faixa">
          <td style="width: 200pt;">
            <p class="center fs11"><strong>SETOR DE ARQUIVO GERAL</strong></p>
            <p class="center" style="font-size: 9pt;">Responsável pela ENTREGA</p>
          </td>
          <td colspan="2">
            <p class="center fs11"><strong>SETOR SOLICITANTE</strong></p>
            <p class="center" style="font-size: 9pt;">Responsável pelo RECEBIMENTO</p>
          </td>
        </tr>
        <tr>
          <td rowspan="5" style="vertical-align: middle; text-align: center;">
            <div class="ass-linha"></div>
            <p class="center fs11"><strong>ASSINATURA</strong></p>
          </td>
          <td class="fs11 vermelho" style="width: 103pt;"><strong>SETOR</strong></td>
          <td class="fs11" style="width: 145pt;">&nbsp;</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>ASSINATURA DO SERVIDOR</strong></td>
          <td class="fs11">&nbsp;</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>MATRÍCULA</strong></td>
          <td class="fs11">&nbsp;</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>DATA DE RETIRADA</strong></td>
          <td class="fs11">${dataAssinatura}</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>DATA DE DEVOLUÇÃO</strong></td>
          <td class="fs11">&nbsp;</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="center fs10 nota">* Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe quanto aos prazos e instruções normativas.</p>

  <p class="center fs10 autenticacao">Documento assinado digitalmente por Servidor NUGECID às ${horaAssinatura} - ${dataAssinatura}.</p>
</body>
</html>`;

    // HTML do cabeçalho (será renderizado em cada página)
    const headerTemplate = `
      <div style="width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 8pt; padding: 5mm 10mm; border-bottom: 0.5pt solid #000;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 15%; text-align: center; vertical-align: middle;">
              ${logos.rnLogo ? `<img src="${logos.rnLogo}" style="height: 45px;" />` : ""}
            </td>
            <td style="width: 70%; text-align: center; vertical-align: middle; line-height: 1.2;">
              <strong>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</strong><br/>
              <strong>SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</strong><br/>
              <strong>POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE</strong><br/>
              <strong>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID</strong><br/>
              <strong style="margin-top: 5px; display: block;">ARQUIVO GERAL - PCIRN</strong>
            </td>
            <td style="width: 15%; text-align: center; vertical-align: middle;">
              ${logos.itepLogo ? `<img src="${logos.itepLogo}" style="height: 50px;" />` : ""}
            </td>
          </tr>
        </table>
      </div>
    `;

    // HTML do rodapé (será renderizado em cada página)
    const footerTemplate = `
      <div style="width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 8pt; padding: 5mm 10mm; border-top: 0.5pt solid #000; text-align: center; line-height: 1.3;">
        <p>Polícia Científica do Rio Grande do Norte - PCIRN</p>
        <p>Núcleo de Gestão do Conhecimento, Informação Documentação e Memória - NUGECID</p>
        <p>Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928</p>
        <p>Email: arquivogeral@pci.rn.gov.br</p>
      </div>
    `;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { chromium } = require("playwright");
      const browser = await chromium.launch({
        args: ["--no-sandbox", "--font-render-hinting=none"],
        headless: true,
      });
      const page = await browser.newPage({
        viewport: { width: 794, height: 1123 },
      });

      await page.setContent(contentHtml, { waitUntil: "load" });
      await page.waitForTimeout(100);

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        margin: {
          top: "35mm",
          bottom: "30mm",
          left: "10mm",
          right: "10mm",
        },
      });

      await browser.close();

      this.logger.log(
        `Gerado PDF com cabeçalho/rodapé fixos para processo ${baseEntity.numeroProcesso} com ${somenteDesarquivados.length} item(s).`,
      );

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error("Erro ao gerar PDF com cabeçalho/rodapé fixos.", error);
      throw new InternalServerErrorException(
        "Não foi possível gerar o termo de desarquivamento em PDF. Tente novamente mais tarde.",
      );
    }
  }

  private async renderPdfWithPdfmake(html: string): Promise<Buffer> {
    const dom = new JSDOM("<!DOCTYPE html><body></body>");
    const pdfContent = htmlToPdfmake(html, { window: dom.window });

    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [28, 36, 28, 36],
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
        lineHeight: 1.25,
      },
      content: Array.isArray(pdfContent) ? pdfContent : [pdfContent],
    };

    return await new Promise<Buffer>((resolve, reject) => {
      const pdfDoc = this.pdfPrinter.createPdfKitDocument(docDefinition);
      const buffers: Buffer[] = [];
      pdfDoc.on("data", (chunk) => buffers.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(buffers)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });
  }

  async generateBatchTermoPdf(
    desarquivamentos: DesarquivamentoTypeOrmEntity[],
    _options?: TermoDesarquivamentoOptions,
  ): Promise<Buffer> {
    if (!Array.isArray(desarquivamentos) || desarquivamentos.length === 0) {
      throw new Error(
        "É necessário informar ao menos um desarquivamento para gerar o termo.",
      );
    }

    const logos = await loadTermoTemplateLogos(this.logger);
    const documentosHtml: { head: string; body: string }[] = [];

    for (const item of desarquivamentos) {
      const baseEntity = await this.resolveBaseEntity(item);
      const itensElegiveis = await this.findEligibleProcessItems(baseEntity);
      const somenteDesarquivados = this.filterDesarquivados(itensElegiveis);

      if (!somenteDesarquivados.length) {
        this.logger.warn(
          `Ignorando processo ${baseEntity.id} no lote: sem itens DESARQUIVADOS.`,
        );
        continue;
      }

      const html = buildTermoTemplateHtml({
        base: baseEntity,
        itens: somenteDesarquivados,
        logos,
      });

      documentosHtml.push({
        head: this.extractTagContent(html, "head"),
        body: this.extractTagContent(html, "body"),
      });
    }

    if (!documentosHtml.length) {
      throw new BadRequestException(
        "Nao ha itens com status DESARQUIVADO para gerar termos no lote informado.",
      );
    }

    const headContent =
      documentosHtml[0].head ||
      `<meta charset="utf-8" /><style>body{font-family:Calibri,"Segoe UI",Arial,sans-serif}</style>`;

    const sections = documentosHtml
      .map(
        (doc, index) => `
        <section class="termo-lote" style="page-break-after:${
          index === documentosHtml.length - 1 ? "auto" : "always"
        }">
          ${doc.body}
        </section>`,
      )
      .join("\n");

    const mergedHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
${headContent}
</head>
<body>
${sections}
</body>
</html>`;

    return this.renderPdfFromHtml(mergedHtml);
  }

  private async resolveBaseEntity(
    desarquivamento: DesarquivamentoTypeOrmEntity,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    if (desarquivamento?.id) {
      const entity = await this.desarquivamentoRepository.findOne({
        where: { id: desarquivamento.id },
      });
      if (entity) {
        return entity;
      }
    }
    return desarquivamento;
  }

  private async findEligibleProcessItems(
    base: DesarquivamentoTypeOrmEntity,
  ): Promise<DesarquivamentoTypeOrmEntity[]> {
    if (!base.numeroProcesso) {
      return base.status?.toUpperCase().trim() === "DESARQUIVADO" ? [base] : [];
    }

    const numeroProcessoNormalizado = (base.numeroProcesso || "").trim();

    const query = this.desarquivamentoRepository
      .createQueryBuilder("d")
      .where("TRIM(d.numeroProcesso) = :numeroProcesso", {
        numeroProcesso: numeroProcessoNormalizado,
      })
      .andWhere("TRIM(UPPER(d.status::text)) = :status", {
        status: "DESARQUIVADO",
      })
      .orderBy("d.numeroSolicitacao", "ASC")
      .addOrderBy("d.createdAt", "ASC")
      .addOrderBy("d.id", "ASC");

    const results = await query.getMany();
    const filtered = results.filter(
      (item) => item.status?.toUpperCase().trim() === "DESARQUIVADO",
    );

    const byId = new Map<number, DesarquivamentoTypeOrmEntity>();
    for (const item of filtered) {
      byId.set(item.id, item);
    }

    if (
      base.id &&
      base.status?.toUpperCase().trim() === "DESARQUIVADO" &&
      !byId.has(base.id)
    ) {
      byId.set(base.id, base);
    }

    return Array.from(byId.values()).sort((a, b) => {
      const ordemA = a.numeroSolicitacao ?? 0;
      const ordemB = b.numeroSolicitacao ?? 0;
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      const createdA =
        (a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : new Date(a.createdAt).getTime()) || 0;
      const createdB =
        (b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : new Date(b.createdAt).getTime()) || 0;
      if (createdA !== createdB) {
        return createdA - createdB;
      }
      return (a.id || 0) - (b.id || 0);
    });
  }

  private filterDesarquivados(
    itens: DesarquivamentoTypeOrmEntity[],
  ): DesarquivamentoTypeOrmEntity[] {
    const filtrados = itens.filter(
      (item) => item.status?.toUpperCase().trim() === "DESARQUIVADO",
    );
    if (itens.length && filtrados.length !== itens.length) {
      this.logger.debug(
        `Filtrados ${itens.length - filtrados.length} item(ns) que não estavam com status DESARQUIVADO.`,
      );
    }
    return filtrados;
  }

  private extractTagContent(html: string, tagName: string): string {
    const regex = new RegExp(
      `<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
      "i",
    );
    const match = html.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
    return html;
  }
}
