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
import { User } from "../users/entities/user.entity";

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
  const createService = () => {
    const anexoRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    const desarquivamentoRepository = {
      findOne: jest.fn(),
    };
    const storageService = {
      getObject: jest.fn(),
      getObjectStream: jest.fn(),
      deleteObject: jest.fn(),
      putObject: jest.fn(),
    };

    const service = new NugecidAnexosService(
      anexoRepository as any,
      desarquivamentoRepository as any,
      {
        scanBuffer: jest.fn(),
      } as any,
      storageService as any,
      {} as any,
      {
        requestSyncDesarquivamentoTargets: jest.fn(),
      } as any,
    );

    return {
      service,
      anexoRepository,
      desarquivamentoRepository,
      storageService,
    };
  };

  const user = (id: number, roleName = "usuario"): User =>
    Object.assign(new User(), {
      id,
      nome: `User ${id}`,
      usuario: `user-${id}`,
      senha: "hashed-password",
      roleId: 1,
      role: { name: roleName },
      ultimoLogin: null,
      ativo: true,
      tentativasLogin: 0,
      bloqueadoAte: null,
      tokenReset: null,
      tokenResetExpira: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

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
    const { service, desarquivamentoRepository } = createService();

    desarquivamentoRepository.findOne.mockResolvedValue({
      id: 100,
      numeroProcesso: "PROC-1",
      criadoPorId: 1,
      responsavelId: null,
    });

    jest.spyOn(service as any, "findAnexoById").mockResolvedValue({
      id: 12,
      desarquivamentoId: 99,
    });

    await expect(
      service.downloadAnexoByDesarquivamento(12, 100, user(1)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("bloqueia listagem de anexos quando usuário não pode acessar o desarquivamento", async () => {
    const { service, anexoRepository, desarquivamentoRepository } =
      createService();

    desarquivamentoRepository.findOne.mockResolvedValue({
      id: 10,
      numeroProcesso: "PROC-1",
      criadoPorId: 1,
      responsavelId: null,
    });
    anexoRepository.find.mockResolvedValue([]);

    await expect(
      (service as any).findAnexosByDesarquivamento(10, user(2), undefined),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(anexoRepository.find).not.toHaveBeenCalled();
  });

  it("bloqueia listagem de anexos por processo quando usuário não acessa nenhuma solicitação do processo", async () => {
    const { service, anexoRepository, desarquivamentoRepository } =
      createService();

    desarquivamentoRepository.findOne.mockResolvedValue(null);
    anexoRepository.find.mockResolvedValue([]);

    await expect(
      (service as any).findAnexosByProcesso("PROC-1", user(2), undefined),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(anexoRepository.find).not.toHaveBeenCalled();
  });

  it("não abre stream de anexo quando usuário não pode acessar o desarquivamento", async () => {
    const {
      service,
      anexoRepository,
      desarquivamentoRepository,
      storageService,
    } = createService();

    desarquivamentoRepository.findOne.mockResolvedValue({
      id: 10,
      numeroProcesso: "PROC-1",
      criadoPorId: 1,
      responsavelId: null,
    });
    anexoRepository.findOne.mockResolvedValue({
      id: 12,
      desarquivamentoId: 10,
      caminhoArquivo: "desarquivamentos/a.pdf",
      tipoMime: "application/pdf",
    });
    storageService.getObjectStream.mockResolvedValue({
      stream: { pipe: jest.fn(), destroy: jest.fn() },
      size: 123,
      contentType: "application/pdf",
    });

    await expect(
      (service as any).streamAnexoByDesarquivamento(12, 10, user(2)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storageService.getObjectStream).not.toHaveBeenCalled();
  });
});
