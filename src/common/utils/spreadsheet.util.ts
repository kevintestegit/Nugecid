import { Workbook } from "exceljs";
import type { CellValue } from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import { extname } from "path";

export type SpreadsheetRowObject = Record<string, string>;
export type SpreadsheetExportValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export interface SpreadsheetMatrixResult {
  sheetName: string;
  rows: string[][];
}

export interface SpreadsheetObjectResult {
  sheetName: string;
  rows: SpreadsheetRowObject[];
}

const STRUCTURED_SPREADSHEET_EXTENSIONS = new Set([".xlsx", ".csv"]);
const LEGACY_SPREADSHEET_EXTENSION = ".xls";

export function getStructuredSpreadsheetExtension(filename: string): string {
  return extname(filename || "").toLowerCase();
}

export function assertStructuredSpreadsheetSupported(filename: string): void {
  const extension = getStructuredSpreadsheetExtension(filename);

  if (STRUCTURED_SPREADSHEET_EXTENSIONS.has(extension)) {
    return;
  }

  if (extension === LEGACY_SPREADSHEET_EXTENSION) {
    throw new Error(
      "Arquivos .xls não são mais suportados por segurança. Converta a planilha para .xlsx ou .csv.",
    );
  }

  throw new Error("Formato de planilha inválido. Use .xlsx ou .csv.");
}

export async function readSpreadsheetMatrix(
  buffer: Buffer,
  filename: string,
): Promise<SpreadsheetMatrixResult> {
  assertStructuredSpreadsheetSupported(filename);

  const extension = getStructuredSpreadsheetExtension(filename);

  if (extension === ".csv") {
    return readCsvMatrix(buffer);
  }

  return readXlsxMatrix(buffer);
}

export async function readSpreadsheetObjects(
  buffer: Buffer,
  filename: string,
): Promise<SpreadsheetObjectResult> {
  const { sheetName, rows } = await readSpreadsheetMatrix(buffer, filename);

  if (!rows.length) {
    return { sheetName, rows: [] };
  }

  const [rawHeaderRow, ...rawDataRows] = rows;
  const headers = normalizeHeaderRow(rawHeaderRow);
  const dataRows = rawDataRows.filter(hasNonEmptyCell);

  if (!headers.length || !dataRows.length) {
    return { sheetName, rows: [] };
  }

  return {
    sheetName,
    rows: dataRows.map((row) => {
      const mappedRow: SpreadsheetRowObject = {};

      headers.forEach((header, index) => {
        mappedRow[header] = row[index] ?? "";
      });

      return mappedRow;
    }),
  };
}

export async function writeSpreadsheetBuffer(params: {
  sheetName: string;
  rows: Array<Record<string, SpreadsheetExportValue>>;
}): Promise<Buffer> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(
    sanitizeWorksheetName(params.sheetName || "Planilha"),
  );
  const headers = collectHeaders(params.rows);

  if (headers.length) {
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(Math.max(header.length + 2, 14), 40),
    }));

    params.rows.forEach((row) => {
      const values = headers.map((header) => normalizeExportValue(row[header]));
      worksheet.addRow(values);
    });
  }

  const workbookBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(workbookBuffer)
    ? workbookBuffer
    : Buffer.from(workbookBuffer);
}

async function readXlsxMatrix(
  buffer: Buffer,
): Promise<SpreadsheetMatrixResult> {
  const workbook = new Workbook();
  const workbookInput = Buffer.from(buffer) as unknown as Parameters<
    Workbook["xlsx"]["load"]
  >[0];
  await workbook.xlsx.load(workbookInput);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return { sheetName: "Planilha", rows: [] };
  }

  const maxColumnCount = Math.max(
    worksheet.actualColumnCount,
    worksheet.columnCount,
  );
  const rows: string[][] = [];

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const currentRow: string[] = [];

    for (let columnIndex = 1; columnIndex <= maxColumnCount; columnIndex += 1) {
      currentRow.push(normalizeCellValue(row.getCell(columnIndex).value));
    }

    rows.push(currentRow);
  });

  return {
    sheetName: worksheet.name || "Planilha",
    rows: rows.filter(hasNonEmptyCell),
  };
}

function readCsvMatrix(buffer: Buffer): SpreadsheetMatrixResult {
  const records = parseCsv(buffer.toString("utf8"), {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: false,
  }) as string[][];

  return {
    sheetName: "CSV",
    rows: records
      .map((row) =>
        Array.isArray(row) ? row.map((value) => String(value ?? "")) : [],
      )
      .filter(hasNonEmptyCell),
  };
}

function normalizeHeaderRow(headerRow: string[]): string[] {
  const usage = new Map<string, number>();

  return headerRow.map((value, index) => {
    const baseHeader = (value ?? "").trim() || `Coluna ${index + 1}`;
    const count = usage.get(baseHeader) ?? 0;
    usage.set(baseHeader, count + 1);
    return count === 0 ? baseHeader : `${baseHeader} ${count + 1}`;
  });
}

function collectHeaders(
  rows: Array<Record<string, SpreadsheetExportValue>>,
): string[] {
  const headers: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    });
  });

  return headers;
}

function sanitizeWorksheetName(sheetName: string): string {
  const normalized = sheetName.replace(/[\\/*?:[\]]/g, " ").trim();
  return (normalized || "Planilha").slice(0, 31);
}

function normalizeExportValue(value: SpreadsheetExportValue) {
  if (value instanceof Date) {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return value;
}

function hasNonEmptyCell(row: string[]): boolean {
  return row.some((cell) => String(cell ?? "").trim().length > 0);
}

function normalizeCellValue(value: CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeCellValue(entry)).join("");
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }

    if ("result" in value) {
      return normalizeCellValue(value.result as CellValue);
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((entry) => entry.text).join("");
    }

    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return value.hyperlink;
    }
  }

  return String(value);
}
