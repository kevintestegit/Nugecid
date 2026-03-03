import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  Header,
  Footer,
  ImageRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
  TableLayoutType,
} from "docx";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "@nestjs/common";

export interface DesarquivamentoDocxItem {
  numeroSolicitacao?: number;
  tipoDocumento?: string;
  nomeCompleto?: string;
  numeroNicLaudoAuto?: string;
}

export interface DesarquivamentoDocxData {
  numeroProcesso: string;
  itens: DesarquivamentoDocxItem[];
  dataRetirada?: string;
  userName?: string;
  dataAssinatura?: string;
  horaAssinatura?: string;
}

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
};

const TABLE_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

const GRAY_SHADING = {
  type: ShadingType.SOLID,
  color: "BFBFBF",
  fill: "BFBFBF",
};

function createHeaderTable(
  rnLogoBuffer: Buffer | null,
  itepLogoBuffer: Buffer | null,
): Table {
  const logoRnCell = new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    children: rnLogoBuffer
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: rnLogoBuffer,
                transformation: { width: 70, height: 58 },
                type: "png",
              }),
            ],
          }),
        ]
      : [new Paragraph({ text: "" })],
  });

  const textCell = new TableCell({
    width: { size: 6000, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "GOVERNO DO ESTADO DO RIO GRANDE DO NORTE",
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "SECRETARIA DE SEGURANÇA PÚBLICA E DEFESA SOCIAL",
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE",
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID",
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120 },
        children: [
          new TextRun({ text: "ARQUIVO GERAL - PCIRN", bold: true, size: 20 }),
        ],
      }),
    ],
  });

  const logoItepCell = new TableCell({
    width: { size: 1500, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    children: itepLogoBuffer
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: itepLogoBuffer,
                transformation: { width: 62, height: 62 },
                type: "png",
              }),
            ],
          }),
        ]
      : [new Paragraph({ text: "" })],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [logoRnCell, textCell, logoItepCell],
      }),
    ],
  });
}

function createFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "000000",
            space: 5,
          },
        },
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: "Polícia Científica do Rio Grande do Norte - PCIRN",
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "Núcleo de Gestão do Conhecimento, Informação Documentação e Memória - NUGECID",
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928",
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Email: arquivogeral@pci.rn.gov.br", size: 20 }),
        ],
      }),
    ],
  });
}

function createDocumentItemsTable(data: DesarquivamentoDocxData): Table {
  const headerRow1 = new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        shading: GRAY_SHADING,
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Nº. DE PROCESSO ELETRÔNICO",
                bold: true,
                size: 24,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const headerRow2 = new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        shading: GRAY_SHADING,
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: data.numeroProcesso || "", size: 22 }),
            ],
          }),
        ],
      }),
    ],
  });

  const headerRow3 = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        width: { size: 2500, type: WidthType.DXA },
        shading: GRAY_SHADING,
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "TIPO DE DOCUMENTO", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Ex: Prontuário, Laudo, Parecer, Relatório.",
                size: 18,
                italics: true,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 3400, type: WidthType.DXA },
        shading: GRAY_SHADING,
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "NOME", bold: true, size: 24 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 3600, type: WidthType.DXA },
        shading: GRAY_SHADING,
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "NÚMERO", bold: true, size: 24 })],
          }),
        ],
      }),
    ],
  });

  const itemRows = data.itens.map((item, index) => {
    const numero = item.numeroNicLaudoAuto || "";
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 500, type: WidthType.DXA },
          borders: TABLE_BORDERS,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(index + 1), size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          borders: TABLE_BORDERS,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: item.tipoDocumento || "", size: 22 }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3400, type: WidthType.DXA },
          borders: TABLE_BORDERS,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: item.nomeCompleto || "", size: 22 }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3600, type: WidthType.DXA },
          borders: TABLE_BORDERS,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: numero, size: 22 })],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow1, headerRow2, headerRow3, ...itemRows],
  });
}

function createSignatureTable(data: DesarquivamentoDocxData): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 4000, type: WidthType.DXA },
        shading: GRAY_SHADING,
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "SETOR DE ARQUIVO GERAL",
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Responsável pela ENTREGA", size: 18 }),
            ],
          }),
        ],
      }),
      new TableCell({
        columnSpan: 2,
        shading: GRAY_SHADING,
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "SETOR SOLICITANTE", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Responsável pelo RECEBIMENTO", size: 18 }),
            ],
          }),
        ],
      }),
    ],
  });

  const createLabelValueRow = (
    label: string,
    value: string,
    isFirstRow: boolean = false,
  ) => {
    const cells = [
      ...(isFirstRow
        ? [
            new TableCell({
              rowSpan: 5,
              width: { size: 4000, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              borders: TABLE_BORDERS,
              children: [
                new Paragraph({ text: "" }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  border: {
                    bottom: {
                      style: BorderStyle.SINGLE,
                      size: 2,
                      color: "000000",
                    },
                  },
                  children: [
                    new TextRun({
                      text: "                                        ",
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "ASSINATURA", bold: true, size: 22 }),
                  ],
                }),
              ],
            }),
          ]
        : []),
      new TableCell({
        width: { size: 2500, type: WidthType.DXA },
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 22,
                color: "FF0000",
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 3000, type: WidthType.DXA },
        borders: TABLE_BORDERS,
        children: [
          new Paragraph({
            children: [new TextRun({ text: value, size: 22 })],
          }),
        ],
      }),
    ];

    return new TableRow({ children: cells });
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      headerRow,
      createLabelValueRow("SETOR", "", true),
      createLabelValueRow("ASSINATURA DO SERVIDOR", ""),
      createLabelValueRow("MATRÍCULA", ""),
      createLabelValueRow("DATA DE RETIRADA", data.dataRetirada || ""),
      createLabelValueRow("DATA DE DEVOLUÇÃO", ""),
    ],
  });
}

export async function generateDesarquivamentoDocx(
  data: DesarquivamentoDocxData,
  logger: Logger,
): Promise<Buffer> {
  // Carregar logos
  let rnLogoBuffer: Buffer | null = null;
  let itepLogoBuffer: Buffer | null = null;

  // Tentar múltiplos caminhos para os logos
  const possibleRnPaths = [
    path.resolve(process.cwd(), "src/assets/images/Brasão-RN.png"),
    path.resolve(process.cwd(), "frontend/src/components/img/Brasão-RN.png"),
  ];

  const possibleItepPaths = [
    path.resolve(process.cwd(), "src/assets/images/Brasão-ITEP.png"),
    path.resolve(process.cwd(), "frontend/src/components/img/Brasão-ITEP.png"),
  ];

  for (const logoPath of possibleRnPaths) {
    try {
      if (fs.existsSync(logoPath)) {
        rnLogoBuffer = fs.readFileSync(logoPath);
        logger.log(`Logo RN carregada de: ${logoPath}`);
        break;
      }
    } catch {
      // Tentar próximo caminho
    }
  }

  if (!rnLogoBuffer) {
    logger.warn("Logo RN não encontrada em nenhum dos caminhos esperados");
  }

  for (const logoPath of possibleItepPaths) {
    try {
      if (fs.existsSync(logoPath)) {
        itepLogoBuffer = fs.readFileSync(logoPath);
        logger.log(`Logo ITEP carregada de: ${logoPath}`);
        break;
      }
    } catch {
      // Tentar próximo caminho
    }
  }

  if (!itepLogoBuffer) {
    logger.warn("Logo ITEP não encontrada em nenhum dos caminhos esperados");
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              createHeaderTable(rnLogoBuffer, itepLogoBuffer),
              new Paragraph({ text: "" }),
            ],
          }),
        },
        footers: {
          default: createFooter(),
        },
        children: [
          // Título
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: "TERMO DE DESARQUIVAMENTO DE DOCUMENTO",
                bold: true,
                size: 28,
              }),
            ],
          }),

          // Texto introdutório
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Ao servidor responsável pelo desarquivamento compete ter ciência que esta solicitação de desarquivamento de documento deve estar vinculada a uma demanda da Polícia Científica do Rio Grande do Norte, ou jurisdição de órgão público através de autoridade competente.",
                size: 20,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 720 },
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Estar ciente quanto às orientações e normativas descritas na portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe sobre o acesso e o fluxo de desarquivamento de documentos no âmbito do Setor de Arquivo Geral da Polícia Científica do Rio Grande do Norte.",
                size: 20,
              }),
            ],
          }),

          // Tabela de documentos
          createDocumentItemsTable(data),

          // Espaço
          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Tabela de assinaturas
          createSignatureTable(data),

          // Nota
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: "* Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe quanto aos prazos e instruções normativas.",
                bold: true,
                size: 20,
              }),
            ],
          }),

          // Assinatura digital
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300 },
            children: [
              new TextRun({
                text: `Documento assinado digitalmente por ${data.userName || ""} às ${data.horaAssinatura || ""} - ${data.dataAssinatura || ""}.`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const { Packer } = await import("docx");
  return await Packer.toBuffer(doc);
}
