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

    try {
      // Usar geração nativa com pdfmake (sem Playwright/html-to-pdfmake)
      return await this.renderPdfNative(baseEntity, somenteDesarquivados);
    } catch (error) {
      this.logger.error(
        "Erro ao renderizar termo de desarquivamento em PDF.",
        error,
      );
      throw new InternalServerErrorException(
        "Não foi possível gerar o termo de desarquivamento em PDF. Tente novamente mais tarde.",
      );
    }
  }

  /**
   * Gera PDF nativamente com pdfmake, sem dependências externas (Playwright/html-to-pdfmake)
   */
  private async renderPdfNative(
    base: DesarquivamentoTypeOrmEntity,
    itens: DesarquivamentoTypeOrmEntity[],
  ): Promise<Buffer> {
    const logos = await loadTermoTemplateLogos(this.logger);
    const now = new Date();
    const dataAssinatura = now.toLocaleDateString("pt-BR");
    const horaAssinatura = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Construir linhas da tabela de documentos
    const documentRows = itens.map((item, index) => [
      { text: String(index + 1), alignment: "center" as const },
      { text: item.tipoDocumento || "", alignment: "center" as const },
      { text: item.nomeCompleto || "", alignment: "center" as const },
      { text: item.numeroNicLaudoAuto || "", alignment: "center" as const },
    ]);

    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [28, 28, 28, 28],
      defaultStyle: {
        font: "Roboto",
        fontSize: 9,
        lineHeight: 1.2,
      },
      content: [
        // Cabeçalho
        {
          columns: [
            logos.rnLogo
              ? { image: logos.rnLogo, width: 50, alignment: "center" as const }
              : { text: "", width: 50 },
            {
              stack: [
                { text: "GOVERNO DO ESTADO DO RIO GRANDE DO NORTE", alignment: "center" as const, bold: true, fontSize: 8 },
                { text: "SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL", alignment: "center" as const, bold: true, fontSize: 8 },
                { text: "POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE", alignment: "center" as const, bold: true, fontSize: 8 },
                { text: "NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID", alignment: "center" as const, bold: true, fontSize: 7 },
                { text: "ARQUIVO GERAL - PCIRN", alignment: "center" as const, bold: true, fontSize: 8, margin: [0, 3, 0, 0] },
              ],
              width: "*",
            },
            logos.itepLogo
              ? { image: logos.itepLogo, width: 55, alignment: "center" as const }
              : { text: "", width: 55 },
          ],
          margin: [0, 0, 0, 15],
        },

        // Título
        {
          text: "TERMO DE DESARQUIVAMENTO DE DOCUMENTO",
          alignment: "center" as const,
          bold: true,
          fontSize: 12,
          margin: [0, 0, 0, 10],
        },

        // Texto introdutório
        {
          text: "Ao servidor responsável pelo desarquivamento compete ter ciência que esta solicitação de desarquivamento de documento deve estar vinculada a uma demanda da Polícia Científica do Rio Grande do Norte, ou jurisdição de órgão público através de autoridade competente.",
          alignment: "center" as const,
          fontSize: 8,
          margin: [0, 0, 0, 8],
        },

        {
          text: "Estar ciente quanto às orientações e normativas descritas na portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe sobre o acesso e o fluxo de desarquivamento de documentos no âmbito do Setor de Arquivo Geral da Polícia Científica do Rio Grande do Norte.",
          alignment: "justify" as const,
          fontSize: 8,
          margin: [30, 0, 0, 10],
        },

        // Tabela de Processo e Documentos
        {
          table: {
            headerRows: 0,
            widths: ["*"],
            body: [
              [{ text: "Nº. DE PROCESSO ELETRÔNICO", alignment: "center" as const, bold: true, fillColor: "#bfbfbf", fontSize: 10 }],
              [{ text: base.numeroProcesso || "", alignment: "center" as const, fillColor: "#bfbfbf", fontSize: 9 }],
            ],
          },
          margin: [0, 0, 0, 0],
        },

        // Tabela de documentos
        {
          table: {
            headerRows: 1,
            widths: [25, 90, 170, "*"],
            body: [
              [
                { text: "Nº", alignment: "center" as const, bold: true, fillColor: "#bfbfbf", fontSize: 9 },
                { text: "TIPO DE DOCUMENTO", alignment: "center" as const, bold: true, fillColor: "#bfbfbf", fontSize: 9 },
                { text: "NOME", alignment: "center" as const, bold: true, fillColor: "#bfbfbf", fontSize: 9 },
                { text: "NÚMERO", alignment: "center" as const, bold: true, fillColor: "#bfbfbf", fontSize: 9 },
              ],
              ...documentRows,
            ],
          },
          margin: [0, 0, 0, 15],
        },

        // Tabela de Assinaturas
        {
          table: {
            headerRows: 1,
            widths: [180, 80, "*"],
            body: [
              [
                { text: "SETOR DE ARQUIVO GERAL\nResponsável pela ENTREGA", alignment: "center" as const, bold: true, fillColor: "#bfbfbf", fontSize: 9 },
                { text: "SETOR SOLICITANTE\nResponsável pelo RECEBIMENTO", alignment: "center" as const, bold: true, fillColor: "#bfbfbf", fontSize: 9, colSpan: 2 },
                {},
              ],
              [
                { text: "\n\n\n________________________\nASSINATURA", alignment: "center" as const, rowSpan: 5, fontSize: 9 },
                { text: "SETOR", bold: true, color: "red", fontSize: 9 },
                { text: "", fontSize: 9 },
              ],
              [
                {},
                { text: "ASSINATURA DO SERVIDOR", bold: true, color: "red", fontSize: 9 },
                { text: "", fontSize: 9 },
              ],
              [
                {},
                { text: "MATRÍCULA", bold: true, color: "red", fontSize: 9 },
                { text: "", fontSize: 9 },
              ],
              [
                {},
                { text: "DATA DE RETIRADA", bold: true, color: "red", fontSize: 9 },
                { text: dataAssinatura, fontSize: 9 },
              ],
              [
                {},
                { text: "DATA DE DEVOLUÇÃO", bold: true, color: "red", fontSize: 9 },
                { text: "", fontSize: 9 },
              ],
            ],
          },
          margin: [0, 0, 0, 15],
        },

        // Nota
        {
          text: "* Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe quanto aos prazos e instruções normativas.",
          alignment: "center" as const,
          bold: true,
          fontSize: 8,
          margin: [0, 0, 0, 10],
        },

        // Autenticação
        {
          text: `Documento assinado digitalmente por Servidor NUGECID às ${horaAssinatura} - ${dataAssinatura}.`,
          alignment: "center" as const,
          italics: true,
          fontSize: 8,
          margin: [0, 10, 0, 0],
        },
      ],

      // Rodapé
      footer: {
        stack: [
          { canvas: [{ type: "line", x1: 28, y1: 0, x2: 567, y2: 0, lineWidth: 0.5 }] },
          { text: "Polícia Científica do Rio Grande do Norte - PCIRN", alignment: "center" as const, fontSize: 7, margin: [0, 5, 0, 0] },
          { text: "Núcleo de Gestão do Conhecimento, Informação Documentação e Memória - NUGECID", alignment: "center" as const, fontSize: 7 },
          { text: "Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928", alignment: "center" as const, fontSize: 7 },
          { text: "Email: arquivogeral@pci.rn.gov.br", alignment: "center" as const, fontSize: 7 },
        ],
        margin: [28, 0, 28, 10],
      },
    };

    return await new Promise<Buffer>((resolve, reject) => {
      const pdfDoc = this.pdfPrinter.createPdfKitDocument(docDefinition);
      const buffers: Buffer[] = [];
      pdfDoc.on("data", (chunk: Buffer) => buffers.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(buffers)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });
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

    // Para evitar dependência do Playwright, reutilizamos o renderizador nativo (pdfmake)
    // que já inclui cabeçalho/rodapé no docDefinition.
    return this.renderPdfNative(baseEntity, somenteDesarquivados);
  }

  private async renderPdfWithPdfmake(html: string): Promise<Buffer> {
    const dom = new JSDOM("<!DOCTYPE html><body></body>");
    const htmlToPdfMakeFn =
      typeof htmlToPdfmake === "function"
        ? htmlToPdfmake
        : (htmlToPdfmake as any)?.default;

    if (typeof htmlToPdfMakeFn !== "function") {
      throw new InternalServerErrorException(
        "Conversor HTML para PDF indisponível.",
      );
    }

    const pdfContent = htmlToPdfMakeFn(html, { window: dom.window });

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
