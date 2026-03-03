jest.mock(
  "file-type",
  () => ({
    fileTypeFromBuffer: jest.fn(),
  }),
  { virtual: true },
);

import { NotFoundException } from "@nestjs/common";
import { analyzeOcrTextForSignatures } from "./ocr-signature-analysis";
import { NugecidAnexosService } from "./nugecid-anexos.service";
import { FileValidator } from "../../common/utils/file-validator";

describe("analyzeOcrTextForSignatures", () => {
  it("identifica nomes prováveis próximos a blocos de assinatura", () => {
    const analysis = analyzeOcrTextForSignatures(`
      PROTOCOLO DE ENTREGA
      Assinatura do servidor:
      ANTONIO MARCONE MONTEIRO SOBRINHO
      Matrícula: 12345
      Recebido por:
      JOSE DA SILVA
    `);

    expect(analysis.possibleNames).toContain(
      "ANTONIO MARCONE MONTEIRO SOBRINHO",
    );
    expect(analysis.signatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Assinatura",
          signerName: "ANTONIO MARCONE MONTEIRO SOBRINHO",
        }),
        expect.objectContaining({
          label: "Recebido por",
          signerName: "JOSE DA SILVA",
        }),
      ]),
    );
  });
});

describe("NugecidAnexosService", () => {
  const createService = () =>
    new NugecidAnexosService(
      {
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      } as any,
      {
        findOne: jest.fn(),
      } as any,
      {
        scanBuffer: jest.fn(),
      } as any,
      {
        getObject: jest.fn(),
        deleteObject: jest.fn(),
        putObject: jest.fn(),
      } as any,
      {} as any,
      {
        requestSyncDesarquivamentoTargets: jest.fn(),
      } as any,
    );

  it("aceita MIME permitido pela política compartilhada", () => {
    expect(FileValidator.isAllowedImageOrDocumentMimeType("text/plain")).toBe(
      true,
    );
    expect(FileValidator.isAllowedImageOrDocumentMimeType("text/csv")).toBe(
      true,
    );
    expect(
      FileValidator.isAllowedImageOrDocumentMimeType("application/pdf"),
    ).toBe(true);
  });

  it("bloqueia acesso a anexo quando o vínculo com desarquivamento não confere", async () => {
    const service = createService();

    jest.spyOn(service as any, "findAnexoById").mockResolvedValue({
      id: 12,
      desarquivamentoId: 99,
    });

    await expect(
      service.downloadAnexoByDesarquivamento(12, 100),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
