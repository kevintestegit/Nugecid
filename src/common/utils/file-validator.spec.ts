import { BadRequestException } from "@nestjs/common";

jest.mock(
  "file-type",
  () => ({
    fileTypeFromBuffer: jest.fn(),
  }),
  { virtual: true },
);

import { FileValidator } from "./file-validator";

const { fileTypeFromBuffer } = jest.requireMock("file-type") as {
  fileTypeFromBuffer: jest.Mock;
};

describe("FileValidator", () => {
  afterEach(() => {
    fileTypeFromBuffer.mockReset();
  });

  it("aceita arquivos de texto puro quando o MIME declarado é text/plain", async () => {
    fileTypeFromBuffer.mockResolvedValue(undefined);
    const buffer = Buffer.from("arquivo de texto simples\nlinha 2", "utf8");

    await expect(
      FileValidator.validateImageOrDocument(buffer, "text/plain"),
    ).resolves.toBeUndefined();
  });

  it("aceita arquivos CSV quando o MIME declarado é text/csv", async () => {
    fileTypeFromBuffer.mockResolvedValue(undefined);
    const buffer = Buffer.from("coluna_a,coluna_b\n1,2\n3,4", "utf8");

    await expect(
      FileValidator.validateImageOrDocument(buffer, "text/csv"),
    ).resolves.toBeUndefined();
  });

  it("rejeita binário disfarçado de texto", async () => {
    fileTypeFromBuffer.mockResolvedValue(undefined);
    const buffer = Buffer.from([0x00, 0xff, 0x00, 0x10, 0x00]);

    await expect(
      FileValidator.validateImageOrDocument(buffer, "text/plain"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
