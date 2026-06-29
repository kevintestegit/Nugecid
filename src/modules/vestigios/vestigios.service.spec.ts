import { ForbiddenException, BadRequestException } from "@nestjs/common";
import { VestigiosService } from "./vestigios.service";
import { CreateVestigioDto } from "./dto/create-vestigio.dto";

const baseCreateDto: CreateVestigioDto = {
  codigoScv: "011",
  classePrincipal: "0",
  grupoCodigo: "01",
  subdivisaoCodigo: "011",
  categoria: "Papiloscopia - Iris",
  etiquetaCompleta: "011\nVG-123-0626\nPapiloscopia - Iris",
};

const createRepositoryMock = () => {
  const repository = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({
      id: payload.id ?? "vestigio-1",
      ...payload,
    })),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  return repository;
};

describe("VestigiosService", () => {
  it("cria etiqueta com status inicial de catalogacao pendente quando o status nao e informado", async () => {
    const repository = createRepositoryMock();
    const service = new VestigiosService(repository as never);

    const result = await service.create(baseCreateDto, 7);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "catalogacao_pendente",
        criadoPorId: 7,
      }),
    );
    expect(result.status).toBe("catalogacao_pendente");
  });

  it("marca o vestigio como catalogado quando metadados de catalogacao sao salvos", async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({
      id: "vestigio-1",
      ...baseCreateDto,
      status: "catalogacao_pendente",
      metadadosGerais: {},
      metadadosEspecificos: {},
      criadoPorId: 7,
    });
    const service = new VestigiosService(repository as never);

    const result = await service.update(
      "vestigio-1",
      {
        metadadosGerais: {
          codigoVestigio: "VG-123-0626",
          peritoResponsavel: "Perito ITEP",
        },
        metadadosEspecificos: {
          tipoVestigio: "Iris",
          naturezaImagem: "Imagem digital",
        },
      } as never,
      7,
    );

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "catalogado",
        metadadosGerais: expect.objectContaining({
          codigoVestigio: "VG-123-0626",
        }),
        metadadosEspecificos: expect.objectContaining({
          tipoVestigio: "Iris",
        }),
      }),
    );
    expect(result.status).toBe("catalogado");
  });

  it("lança ForbiddenException quando usuário tenta acessar vestígio de outro usuário", async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({
      id: "vestigio-1",
      ...baseCreateDto,
      status: "catalogacao_pendente",
      criadoPorId: 1,
    });
    const service = new VestigiosService(repository as never);

    await expect(service.findOne("vestigio-1", 2)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("lança ForbiddenException ao atualizar vestígio de outro usuário", async () => {
    const repository = createRepositoryMock();
    repository.findOne.mockResolvedValue({
      id: "vestigio-1",
      ...baseCreateDto,
      status: "catalogacao_pendente",
      criadoPorId: 1,
    });
    const service = new VestigiosService(repository as never);

    await expect(
      service.update("vestigio-1", { metadadosGerais: {} } as never, 2),
    ).rejects.toThrow(ForbiddenException);
  });

  it("lança BadRequestException para status inválido", async () => {
    const repository = createRepositoryMock();
    const service = new VestigiosService(repository as never);

    await expect(
      service.updateStatus("vestigio-1", "status_invalido", 1),
    ).rejects.toThrow(BadRequestException);
  });

  it("remove somente vestigios pendentes de catalogacao ao limpar a fila", async () => {
    const repository = createRepositoryMock();
    repository.delete.mockResolvedValue({ affected: 7 });
    const service = new VestigiosService(repository as never);

    const result = await service.clearCatalogacaoPendente();

    expect(repository.delete).toHaveBeenCalledWith({
      status: "catalogacao_pendente",
    });
    expect(result).toEqual({ deletedCount: 7 });
  });
});
