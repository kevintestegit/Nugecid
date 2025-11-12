import * as fs from "fs";
import * as path from "path";
import { Logger } from "@nestjs/common";

import { DesarquivamentoTypeOrmEntity } from "../infrastructure/entities/desarquivamento.typeorm-entity";

export interface TermoTemplateLogos {
  rnLogo?: string;
  itepLogo?: string;
}

export interface BuildTermoTemplateParams {
  base: DesarquivamentoTypeOrmEntity;
  itens: DesarquivamentoTypeOrmEntity[];
  logos?: TermoTemplateLogos;
  baseHref?: string;
}

const DEFAULT_BASE_HREF =
  process.env.APP_BASE_URL ||
  process.env.FRONTEND_URL ||
  process.env.PUBLIC_URL ||
  "http://localhost:3000/";

const RN_LOGO_PATH = path.join(
  process.cwd(),
  "frontend",
  "src",
  "components",
  "img",
  "Brasão-RN.png",
);

const ITEP_LOGO_PATH = path.join(
  process.cwd(),
  "frontend",
  "src",
  "components",
  "img",
  "Brasão-ITEP.png",
);

export const loadTermoTemplateLogos = (
  logger?: Logger,
): TermoTemplateLogos => ({
  rnLogo: readImageAsDataUri(RN_LOGO_PATH, "image/png", logger),
  itepLogo: readImageAsDataUri(ITEP_LOGO_PATH, "image/png", logger),
});

export const buildTermoTemplateHtml = ({
  base,
  itens,
  logos,
  baseHref,
}: BuildTermoTemplateParams): string => {
  const processoEletronico = escapeHtml(
    base.numeroProcesso || String(base.id) || "",
  );
  const setorSolicitante = escapeHtml(base.setorDemandante || "");
  const servidorSolicitante = escapeHtml(base.servidorResponsavel || "");
  const matricula = escapeHtml((base as any)?.matricula || "");

  const itensElegiveis = Array.isArray(itens) ? itens : [];

  const dataRetiradaFonte = itensElegiveis
    .map(
      (item) =>
        item.dataDesarquivamentoSAG ||
        (item as any).dataDevolucaoSetor ||
        item.updatedAt,
    )
    .filter(Boolean)
    .sort(
      (a, b) => new Date(b as Date).getTime() - new Date(a as Date).getTime(),
    )[0];

  const dataRetirada = formatDate(dataRetiradaFonte as Date | string);
  const dataAssinatura = new Date();
  const dataAssinaturaStr = dataAssinatura.toLocaleDateString("pt-BR");
  const horaAssinatura = dataAssinatura.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const flattenedRows = itensElegiveis
    .map((record) => {
      const identifiers = (record.numeroNicLaudoAuto || "")
        .split(/[\n;,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

      const fallbackIdentifiers =
        identifiers.length > 0
          ? identifiers
          : [record.numeroNicLaudoAuto || ""];

      return fallbackIdentifiers.map((identifier) => ({
        type:
          record.tipoDocumento ||
          record.tipoDesarquivamento ||
          base.tipoDocumento ||
          "",
        name: record.nomeCompleto || base.nomeCompleto || "",
        code: identifier || "",
      }));
    })
    .flat();

  const rowsSource =
    flattenedRows.length > 0
      ? flattenedRows
      : [
          {
            type: base.tipoDocumento || "",
            name: base.nomeCompleto || "",
            code: base.numeroNicLaudoAuto || "",
          },
        ];

  const rowsWithIndex = rowsSource.map((row, index) => ({
    ...row,
    index: index + 1,
  }));

  const rowsHtml = rowsWithIndex
    .map(
      (row) => `
        <tr>
          <td class="col-idx">${row.index}</td>
          <td class="col-type">${
            row.type ? escapeHtml(row.type) : "&nbsp;"
          }</td>
          <td class="col-name">${
            row.name ? escapeHtml(row.name) : "&nbsp;"
          }</td>
          <td class="col-num">${
            row.code ? escapeHtml(row.code) : "&nbsp;"
          }</td>
        </tr>`,
    )
    .join("");

  const baseHrefValue = baseHref || DEFAULT_BASE_HREF;
  const placeholderTemplate = {
    processoEletronico,
  };
  const userName =
    servidorSolicitante || "Responsável não informado";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title> </title>
  <base href="${baseHrefValue}">
  <style>
    :root {
      --page-padding-x: 10mm;
      --header-height: 115px;
      --footer-height: 80px;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      margin: 0;
      color: #000;
    }
    p { margin: 0; }
    .center { text-align: center; }
    .mt-8 { margin-top: 6pt; }
    .mt-12 { margin-top: 8pt; }
    .mb-7 { margin-bottom: 5pt; }
    .mb-0 { margin-bottom: 0; }

    /* Tabela do cabeçalho com logos e textos institucionais */
    .hdr { width: 100%; border-collapse: collapse; }
    .hdr td { vertical-align: top; }
    .hdr .logo { width: 95.25pt; text-align: center; }
    .hdr .miolo { width: 341.25pt; }
    .hdr .logo-dir { width: 83.25pt; text-align: left; }

    /* Título */
    h1 { margin: 6pt 0 5pt 0; font-size: 14pt; text-align: center; text-transform: none; }

    /* Tabelas principais com borda preta 0.75pt e faixas cinza */
    table.borda { width: 100%; border: 0.75pt solid #000; border-collapse: collapse; }
    table.borda td, table.borda th { border: 0.75pt solid #000; padding: 3pt 5pt; }
    .faixa { background: #bfbfbf; }
    .fs10 { font-size: 10pt; }
    .fs11 { font-size: 11pt; }
    .fs12 { font-size: 12pt; }
    .sub { font-size: 9pt; }
    .right { text-align: right; }
    .center { text-align: center; }
    .vermelho { color: red; }

    /* Larguras do bloco "TIPO DE DOCUMENTO" (2 células no corpo) */
    .col-idx { width: 19.2pt; text-align: center; }
    .col-type { width: 75.45pt; }
    .col-name { width: 169.9pt; text-align: center; }
    .col-num { width: 181.2pt; text-align: center; }

    /* Linhas de assinatura (grossas) */
    .ass-linha { border-bottom: 1.5pt solid #000; height: 16pt; margin-bottom: 2pt; }

    /* Rodapé com linha superior */
    .rodape { border-top: 0.75pt solid #000; padding-top: 2pt; margin-top: 5pt; }
    .autenticacao { margin-top: 20pt; font-size: 10pt; text-align: center; }

    /* Layout padrão - sem fixed positioning */
    header.print-header,
    footer.print-footer {
      padding: 0 var(--page-padding-x);
      background: #fff;
    }

    main.print-body {
      padding: 0 var(--page-padding-x);
    }

    /* Layout para múltiplas páginas - com fixed positioning */
    body.multipage header.print-header,
    body.multipage footer.print-footer {
      position: fixed;
      left: 0;
      right: 0;
      z-index: 10;
    }
    body.multipage header.print-header { top: 0; height: var(--header-height); }
    body.multipage footer.print-footer { bottom: 0; min-height: var(--footer-height); }
    body.multipage main.print-body {
      margin-top: calc(var(--header-height) + 10px);
      margin-bottom: calc(var(--footer-height) + 10px);
    }

    @page {
      margin: 10mm;
    }
    /* Impressão */
    @media print {
      body { margin: 0; }
      body.multipage main.print-body {
        margin-top: calc(var(--header-height) + 10px);
        margin-bottom: calc(var(--footer-height) + 10px);
      }
      .faixa {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      td[style*="background-color"] {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      header.print-header,
      footer.print-footer {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .autenticacao { margin-top: 20pt; page-break-inside: avoid; text-align: center; }
    }
  </style>
  <script>
    // Detecta se o conteúdo precisa de múltiplas páginas
    window.addEventListener('load', function() {
      // Aguarda um frame para garantir que o layout está completo
      requestAnimationFrame(function() {
        const body = document.body;
        const main = document.querySelector('main.print-body');

        if (!main) return;

        // Altura de uma página A4 em pixels (aproximadamente 297mm - margens)
        // 297mm - 20mm (10mm top + 10mm bottom) = 277mm ≈ 1047px @ 96dpi
        const pageHeightMm = 297;
        const marginTopBottomMm = 20; // 10mm top + 10mm bottom
        const usablePageHeightMm = pageHeightMm - marginTopBottomMm;
        const dpi = 96;
        const mmToPx = dpi / 25.4;
        const pageHeight = usablePageHeightMm * mmToPx;

        // Altura do cabeçalho e rodapé quando fixos
        const headerHeight = 115; // var(--header-height)
        const footerHeight = 80; // var(--footer-height)

        // Calcula a altura total do conteúdo
        const contentHeight = main.scrollHeight;

        const totalHeight = contentHeight + headerHeight + footerHeight;

        if (totalHeight > pageHeight) {
          body.classList.add('multipage');
          console.log('Modo multipágina ativado - Altura total:', totalHeight, 'Altura de página:', pageHeight);
        } else {
          console.log('Modo página única - Altura total:', totalHeight, 'Altura de página:', pageHeight);
        }
      });
    });
  </script>
</head>
<body>
  <header class="print-header">
    <!-- Cabeçalho com 3 colunas (logo, textos, logo) -->
    <table class="hdr">
      <tr style="height:75pt;">
        <td class="logo">
          ${
            logos?.rnLogo
              ? `<img src="${logos.rnLogo}" alt="Brasão RN" width="90" height="75" />`
              : "&nbsp;"
          }
        </td>
        <td class="miolo" style="line-height: 1.2;">
          <p class="center fs10"><strong>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</strong><br/>
          <strong>SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</strong><br/>
          <strong>POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE</strong><br/>
          <strong>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID</strong></p>
          <p class="center fs10 mt-8"><strong>ARQUIVO GERAL - PCIRN</strong></p>
        </td>
        <td class="logo-dir">
          ${
            logos?.itepLogo
              ? `<img src="${logos.itepLogo}" alt="Brasão ITEP" width="80" height="80" />`
              : "&nbsp;"
          }
        </td>
      </tr>
    </table>
  </header>

  <main class="print-body">
    <!-- Título -->
    <h1><strong>TERMO DE DESARQUIVAMENTO DE DOCUMENTO</strong></h1>

    <!-- Intro -->
    <p class="center mb-7 fs10">Ao servidor responsável pelo desarquivamento compete ter ciência que esta solicitação de desarquivamento de documento deve estar vinculada a uma demanda da Polícia Científica do Rio Grande do Norte, ou jurisdição de órgão público através de autoridade competente.</p>
    <p class="fs10" style="text-indent:35.4pt; text-align:justify;">
      Estar ciente quanto às orientações e normativas descritas na portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe sobre o acesso e o fluxo de desarquivamento de documentos no âmbito do Setor de Arquivo Geral da Polícia Científica do Rio Grande do Norte.
    </p>

    <!-- Nº Processo Eletrônico -->
    <table class="borda mt-12">
      <tbody>
        <tr>
          <td colspan="4" class="faixa center fs12" style="background-color: #bfbfbf !important;"><strong>Nº. DE PROCESSO ELETRÔNICO</strong></td>
        </tr>
        <tr>
          <td colspan="4" class="faixa center fs11">
            ${placeholderTemplate.processoEletronico || ""}
          </td>
        </tr>

        <!-- Cabeçalho de itens -->
        <tr class="faixa">
          <td class="center fs12" colspan="2" style="width: 124.65pt;">
            <strong>TIPO DE DOCUMENTO</strong><br/>
            <span class="sub">Ex: Prontuário, Laudo, Parecer, Relatório.</span>
          </td>
          <td class="center fs12" style="width: 169.9pt;"><strong>NOME</strong></td>
          <td class="center fs12" style="width: 181.2pt;"><strong>NÚMERO</strong></td>
        </tr>

        <!-- Linhas geradas -->
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Espaço -->
    <p class="mb-0" style="line-height:100%; margin-top: 6pt;">&nbsp;</p>

    <!-- Assinaturas -->
    <table class="borda">
      <tbody>
        <tr class="faixa">
          <td style="width: 201.6pt;">
            <p class="center fs11"><strong>SETOR DE ARQUIVO GERAL</strong></p>
            <p class="center sub">Responsável pela ENTREGA</p>
          </td>
          <td colspan="2">
            <p class="center fs11"><strong>SETOR SOLICITANTE</strong></p>
            <p class="center sub">Responsável pelo RECEBIMENTO</p>
          </td>
        </tr>
        <tr>
          <td rowspan="5" style="vertical-align:middle; text-align:center;">
            <div class="ass-linha"></div>
            <p class="center fs11"><strong>ASSINATURA</strong></p>
          </td>
          <td class="fs11 vermelho" style="width:103.2pt;"><strong>SETOR</strong></td>
          <td class="fs11" style="width:144.5pt;">${setorSolicitante || "&nbsp;"}</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>ASSINATURA DO SERVIDOR</strong></td>
          <td class="fs11">${servidorSolicitante || "&nbsp;"}</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>MATRÍCULA</strong></td>
          <td class="fs11">${matricula || "&nbsp;"}</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>DATA DE RETIRADA</strong></td>
          <td class="fs11">${dataRetirada || "&nbsp;"}</td>
        </tr>
        <tr>
          <td class="fs11 vermelho"><strong>DATA DE DEVOLUÇÃO</strong></td>
          <td class="fs11">&nbsp;</td>
        </tr>
      </tbody>
    </table>

    <!-- Nota -->
    <p class="center fs10 mt-8"><strong>* Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe quanto aos prazos e instruções normativas.</strong></p>

    <div class="autenticacao fs10 center">
      <p><em>Documento assinado digitalmente por ${userName} - ${matricula ||
        "Matrícula não informada"} às ${horaAssinatura} - ${dataAssinaturaStr}.</em></p>
    </div>
  </main>

  <footer class="print-footer fs10 center">
    <!-- Rodapé -->
    <div class="rodape fs10 center" style="line-height: 1.3;">
      <p>Polícia Científica do Rio Grande do Norte - PCIRN</p>
      <p>Núcleo de Gestão do Conhecimento, Informação Documentação e Memória - NUGECID</p>
      <p>Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928</p>
      <p>Email: arquivogeral@pci.rn.gov.br</p>
    </div>
  </footer>
</body>
</html>`;
};

const escapeHtml = (value?: string): string =>
  value
    ? String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
    : "";

const formatDate = (date?: Date | string | null): string => {
  if (!date) return "";
  try {
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    return parsed.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
};

const readImageAsDataUri = (
  filePath: string,
  mime = "image/png",
  logger?: Logger,
): string => {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      logger?.warn?.(`Logo não encontrada em: ${absolutePath}`);
      return "";
    }
    const buffer = fs.readFileSync(absolutePath);
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (error) {
    logger?.warn?.(
      `Falha ao carregar logo (${filePath}): ${(error as Error).message}`,
    );
    return "";
  }
};
