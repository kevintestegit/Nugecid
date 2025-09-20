import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { DesarquivamentoTypeOrmEntity } from './infrastructure/entities/desarquivamento.typeorm-entity';

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

  async generatePdf(
    desarquivamento: DesarquivamentoTypeOrmEntity,
  ): Promise<Buffer> {
    // Tenta usar Playwright (HTML -> PDF) para suportar o layout/CSS fornecido
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { chromium } = require('playwright');

      const browser = await chromium.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
      const page = await browser.newPage();
 
      const html = this.buildTermoHTML(desarquivamento);
      await page.setContent(html, { waitUntil: 'load' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      await browser.close();
      return Buffer.from(pdf);
    } catch (err) {
      this.logger.warn('Playwright indisponível ou falhou. Usando fallback PDFKit simplificado.', err);
      // Fallback: PDFKit com conteúdo mínimo (mantém compatibilidade)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PDFDocument: any = require('pdfkit');

      return await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
        const buffers: Buffer[] = [];
        doc.on('data', (d: Buffer) => buffers.push(d));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (e: any) => reject(e));

        doc.font('Helvetica-Bold').fontSize(14).text('TERMO DE DESARQUIVAMENTO DE DOCUMENTO', { align: 'center' });
        doc.moveDown();
        doc.font('Helvetica').fontSize(10).text(`Nº de Processo Eletrônico: ${desarquivamento.numeroProcesso || '__________'}`);
        doc.moveDown();
        doc.text(`Nome: ${desarquivamento.nomeCompleto || '__________'}`);
        doc.text(`Tipo de Documento: ${desarquivamento.tipoDocumento || '__________'}`);
        doc.text(`Número: ${desarquivamento.numeroNicLaudoAuto || '__________'}`);
        doc.moveDown();
        doc.text('Para obter o layout completo, habilite o Playwright no ambiente de execução.', { align: 'left' });
        doc.end();
      });
    }
  }

  // Gera o HTML completo do termo com o CSS fornecido
  private buildTermoHTML(d: DesarquivamentoTypeOrmEntity): string {
    // Carregar imagens informadas pelo usuário e embutir como Data URI (PNG)
    const rnLogo = this.getImageDataUri(
      path.join(process.cwd(), 'frontend', 'src', 'components', 'img', 'Brasão-RN.png'),
      'image/png',
    );
    const itepLogo = this.getImageDataUri(
      path.join(process.cwd(), 'frontend', 'src', 'components', 'img', 'Brasão-ITEP.png'),
      'image/png',
    );

    const processoEletronico = d.numeroProcesso || '';
    const tipoDocumentoGeral = d.tipoDocumento || '';
    const itens = [
      {
        item: 1,
        tipo: d.tipoDocumento || '',
        nome: d.nomeCompleto || '',
        numero: d.numeroNicLaudoAuto || '',
      },
    ];

    const setorSolicitante = d.setorDemandante || '';
    const servidorSolicitante = d.servidorResponsavel || '';
    const matricula = (d as any)?.matricula || '';

    const dataRetirada = this.formatDate(d.dataDesarquivamentoSAG || d.updatedAt);
    const dataDevolucao = this.formatDate(d.dataDevolucaoSetor as any);

    const css = this.getPrintCSS();

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Termo de Desarquivamento</title>
  <style>${css}</style>
</head>
<body>
  <div class="print-root">
    <!-- HEADER estilo imagem 2 -->
    <header class="print-header">
      <div class="header-line">
        <img src="${rnLogo || ''}" alt="Governo RN" class="logo" />
        <div class="header-text">
          <div>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</div>
          <div>SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</div>
          <div>INSTITUTO TÉCNICO-CIENTÍFICO DE PERÍCIA – ITEP</div>
          <div>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA – NUGECID</div>
          <div class="bold">ARQUIVO GERAL – ITEP</div>
        </div>
        <img src="${itepLogo || ''}" alt="ITEP" class="logo" />
      </div>
      <div class="title-bar">TERMO DE DESARQUIVAMENTO DE DOCUMENTO</div>
    </header>

    <!-- CORPO -->
    <main class="print-body">
      <table class="termo-table avoid-break">
        <tbody>
          <tr>
            <th style="width:32%">Nº DE PROCESSO ELETRÔNICO</th>
            <td>${this.escape(processoEletronico) || '__________'}</td>
          </tr>
          <tr>
            <th>TIPO DE DOCUMENTO<br/><small>${this.escape(tipoDocumentoGeral) || ''}</small></th>
            <td>
              <table class="termo-table inner" style="margin:0">
                <thead>
                  <tr>
                    <th style="width:48px; text-align:center">Item</th>
                    <th>Tipo de documento</th>
                    <th>Nome</th>
                    <th style="width:160px">Número</th>
                  </tr>
                </thead>
                <tbody>
                  ${itens
                    .map(
                      it => `
                    <tr>
                      <td style="text-align:center">${it.item}</td>
                      <td>${this.escape(it.tipo)}</td>
                      <td>${this.escape(it.nome)}</td>
                      <td>${this.escape(it.numero || '')}</td>
                    </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="assinaturas">
        <div class="assinatura-bloco">
          <div class="assinatura-titulo">SETOR DE ARQUIVO GERAL</div>
          <div class="assinatura-sub">Responsável pela ENTREGA</div>
          <div class="assinatura-linha"></div>
          <div class="assinatura-label">ASSINATURA</div>
        </div>

        <div class="assinatura-bloco destaque">
          <div class="assinatura-titulo">SETOR SOLICITANTE</div>
          <div class="assinatura-sub">Responsável pelo RECEBIMENTO</div>
          <div class="assinatura-campos">
            <div><span>SETOR:</span> ${this.escape(setorSolicitante) || '__________'}</div>
            <div><span>ASSINATURA DO SERVIDOR:</span> ${this.escape(servidorSolicitante) || '__________'}</div>
            <div><span>MATRÍCULA:</span> ${this.escape(matricula) || '__________'}</div>
            <div><span>DATA DA RETIRADA:</span> ${dataRetirada || '____/____/______'}</div>
            <div><span>DATA DE DEVOLUÇÃO:</span> ${dataDevolucao || '____/____/______'}</div>
          </div>
        </div>
      </div>

      <div class="nota">* Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023…</div>
    </main>

    <!-- FOOTER estilo imagem 2 -->
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

  private getPrintCSS(): string {
    return `
  @page { size: A4 portrait; margin: 16mm 14mm 20mm 14mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

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

  /* Tables */
  .termo-table { width:100%; border-collapse:collapse; font-size:12px; }
  .termo-table th, .termo-table td { border:1px solid #bdbdbd; padding:6px 8px; vertical-align:top; }
  .termo-table th { background:#efefef; font-weight:600; }
  .termo-table.inner th { background:#f6f6f6; }

  /* Assinaturas */
  .assinaturas { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:16px; }
  .assinatura-bloco { border:1px solid #bdbdbd; padding:10px 12px; min-height:140px; }
  .assinatura-titulo { font-size:12px; font-weight:700; margin:0; }
  .assinatura-sub { font-size:11px; color:#555; margin:4px 0 8px; }
  .assinatura-linha { margin:10px 0 6px; height:60px; border:1px dashed #bbb; }
  .assinatura-label { font-size:11px; color:#222; }
  .assinatura-bloco.destaque .assinatura-campos span { color:#b10000; font-weight:600; }
  .assinatura-campos > div { margin:3px 0; font-size:12px; }

  /* Nota e paginação */
  .nota { font-size:10px; margin-top:10px; color:#333; }
  .page-number::after { content: "Página " counter(page) " de " counter(pages); font-size:10px; }

  /* Avoid bad breaks */
  .avoid-break { page-break-inside: avoid; }
  `;
  }

  // Lê uma imagem e retorna em Data URI (retorna string vazia se não encontrar)
  private getImageDataUri(filePath: string, mime = 'image/png'): string {
    try {
      // Suporta caminho absoluto ou relativo ao root do projeto
      const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(abs)) {
        this.logger.warn(`Logo não encontrada em: ${abs}`);
        return '';
      }
      const buf = fs.readFileSync(abs);
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch (e) {
      this.logger.warn(`Falha ao carregar logo (${filePath}): ${(e as Error).message}`);
      return '';
    }
  }

  private formatDate(date?: Date | string | null): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  }

  private escape(value?: string): string {
    if (!value) return '';
    return String(value)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#39');
  }

  async generateBatchTermoPdf(
    desarquivamentos: DesarquivamentoTypeOrmEntity[],
    options?: TermoDesarquivamentoOptions,
  ): Promise<Buffer> {
    if (!Array.isArray(desarquivamentos) || desarquivamentos.length === 0) {
      throw new Error(
        'É necessário informar ao menos um desarquivamento para gerar o termo.',
      );
    }

    // Carregamento dinâmico do pdfkit, assim como na geração individual
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFDocument: any = require('pdfkit');

    this.logger.log(
      `Gerando termo de desarquivamento para ${desarquivamentos.length} item(ns).`,
    );

    const quantidadeItens = desarquivamentos.length;

    const formatDate = (date?: Date) => {
      if (!date) {
        return 'Não informado';
      }

      try {
        return new Date(date).toLocaleDateString('pt-BR');
      } catch (error) {
        this.logger.warn(
          `Não foi possível formatar a data "${date}": ${(error as Error).message}`,
        );
        return 'Não informado';
      }
    };

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 72, right: 72 },
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const tituloPrincipal =
        options?.header?.titulo ||
        'TERMO DE DESARQUIVAMENTO E RETIRADA DE DOCUMENTOS';
      const subtituloPrincipal =
        options?.header?.subtitulo ||
        'Registro de retirada de documentos físicos sob responsabilidade do solicitante';

      doc.font('Helvetica').fontSize(12);
      doc.text('GOVERNO DO ESTADO DO RIO GRANDE DO NORTE', { align: 'center' });
      doc.text('SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA E DA DEFESA SOCIAL', {
        align: 'center',
      });
      doc.text('INSTITUTO TÉCNICO-CIENTÍFICO DE PERÍCIA - ITEP/RN', {
        align: 'center',
      });
      doc.moveDown(1.5);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(tituloPrincipal, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(subtituloPrincipal, { align: 'center' });

      if (options?.header?.informacoesAdicionais?.length) {
        doc.moveDown(0.5);
        options.header.informacoesAdicionais.forEach(info => {
          doc.text(info, { align: 'center' });
        });
      }

      doc.moveDown(1.5);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(
          `Este termo certifica que o solicitante recebeu ${
            quantidadeItens === 1
              ? 'o item relacionado'
              : `${quantidadeItens} itens relacionados`
          } abaixo, comprometendo-se a mantê-los sob sua guarda e responsabilidade, bem como devolvê-los no prazo estabelecido pela unidade administrativa responsável.`,
          {
            align: 'justify',
          },
        );

      doc.moveDown(1.5);

      doc.font('Helvetica-Bold').fontSize(12).text('Resumo da Retirada');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(12);
      doc.text(`Quantidade de Itens: ${quantidadeItens}`);

      const dataRetirada = desarquivamentos
        .map(
          item =>
            item.dataDesarquivamentoSAG ||
            (item as any).dataDevolucaoSetor ||
            item.updatedAt,
        )
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b as Date).getTime() - new Date(a as Date).getTime(),
        )[0];

      doc.text(
        `Data da Retirada: ${formatDate(dataRetirada as Date | undefined)}`,
      );
      doc.moveDown(1.5);

      doc.font('Helvetica-Bold').fontSize(12).text('Itens Retirados');
      doc.moveDown(0.5);

      desarquivamentos.forEach((item, index) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text(`${index + 1}. ${item.nomeCompleto}`);
        doc.font('Helvetica').fontSize(12);
        doc.text(
          `Tipo de Documento: ${item.tipoDocumento || 'Não informado'}`,
          {
            indent: 20,
          },
        );
        doc.text(
          `Número NIC/Laudo/Auto: ${item.numeroNicLaudoAuto || 'Não informado'}`,
          {
            indent: 20,
          },
        );
      });

      doc.end();
    });
  }
}
