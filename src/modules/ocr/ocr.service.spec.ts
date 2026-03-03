import { buildOcrStorageKeys, isSignedPdfOcrError } from "./ocr.service";

describe("OcrService helpers", () => {
  it("gera chaves sidecar a partir da chave original", () => {
    expect(buildOcrStorageKeys("desarquivamentos/abc123.pdf")).toEqual({
      searchablePdfKey: "desarquivamentos/ocr/abc123.searchable.pdf",
      textKey: "desarquivamentos/ocr/abc123.sidecar.txt",
    });
  });

  it("reconhece falhas de PDF assinado digitalmente", () => {
    expect(
      isSignedPdfOcrError(
        "Refusing to OCR a digitally signed PDF without invalidate-digital-signatures.",
      ),
    ).toBe(true);
  });

  it("não marca falhas genéricas como assinatura digital", () => {
    expect(
      isSignedPdfOcrError("Ghostscript rasterization failed for page 1."),
    ).toBe(false);
  });
});
