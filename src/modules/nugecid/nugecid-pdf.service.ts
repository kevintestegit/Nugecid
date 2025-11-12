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
import PdfPrinter from "pdfmake";
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
  private readonly pdfPrinter: PdfPrinter;

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
      logos: loadTermoTemplateLogos(this.logger),
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

    const logos = loadTermoTemplateLogos(this.logger);
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
