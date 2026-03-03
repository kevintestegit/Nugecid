import { Workbook } from "exceljs";
import { readSpreadsheetMatrix } from "./spreadsheet.util";

describe("readSpreadsheetMatrix", () => {
  it("deve processar arquivos .xlsx válidos", async () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("PlanilhaTeste");
    worksheet.addRow(["Item", "Quantidade"]);
    worksheet.addRow(["Envelope", 3]);

    const workbookBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(workbookBuffer)
      ? workbookBuffer
      : Buffer.from(workbookBuffer);

    const parsed = await readSpreadsheetMatrix(buffer, "catalogo.xlsx");

    expect(parsed.sheetName).toBe("PlanilhaTeste");
    expect(parsed.rows).toEqual([
      ["Item", "Quantidade"],
      ["Envelope", "3"],
    ]);
  });
});
