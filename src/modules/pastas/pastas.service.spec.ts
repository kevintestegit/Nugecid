import { NotFoundException, ForbiddenException } from "@nestjs/common";

jest.mock(
  "file-type",
  () => ({
    fileTypeFromBuffer: jest.fn(),
  }),
  { virtual: true },
);

import { PastasService } from "./pastas.service";
import { PastaArquivoTipo } from "./entities/pasta-arquivo.entity";

const createQueryRunnerMock = () => ({
  connect: jest.fn(async () => undefined),
  hasTable: jest.fn(async () => true),
  release: jest.fn(async () => undefined),
  query: jest.fn(async () => undefined),
});

const createDataSourceMock = () => ({
  createQueryRunner: jest.fn(() => createQueryRunnerMock()),
});

const createQueryBuilderMock = (result: {
  getMany?: unknown;
  getManyAndCount?: [unknown[], number];
}) => {
  const qb = {
    orderBy: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(async () => result.getMany ?? []),
    getManyAndCount: jest.fn(async () => result.getManyAndCount ?? [[], 0]),
  };
  return jest.fn(() => qb);
};

const buildService = (
  overrides: {
    pastasRepository?: any;
    dataSource?: any;
  } = {},
) => {
  const pastasRepository = overrides.pastasRepository ?? {
    createQueryBuilder: createQueryBuilderMock({ getMany: [] }),
    findOne: jest.fn(async () => null),
  };
  const dataSource = overrides.dataSource ?? createDataSourceMock();
  const service = new PastasService(
    pastasRepository,
    {} as never,
    dataSource,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    undefined,
    undefined,
    undefined,
  );
  return { service, pastasRepository };
};

describe("PastasService", () => {
  describe("findOne", () => {
    it("lanca NotFoundException quando a pasta nao existe", async () => {
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({ getMany: [] }),
        findOne: jest.fn(async () => null),
      };
      const { service } = buildService({ pastasRepository });

      await expect(service.findOne("pasta-inexistente")).rejects.toThrow(
        NotFoundException,
      );
      expect(pastasRepository.findOne).toHaveBeenCalledWith({
        where: { id: "pasta-inexistente" },
        relations: ["arquivos"],
      });
    });

    it("lanca ForbiddenException quando o usuario nao e o dono", async () => {
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({ getMany: [] }),
        findOne: jest.fn(async () => ({
          id: "pasta-1",
          criadoPorId: 10,
          arquivos: [],
        })),
      };
      const { service } = buildService({ pastasRepository });

      await expect(service.findOne("pasta-1", 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("retorna a pasta mapeada com contagens quando o dono acessa", async () => {
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({ getMany: [] }),
        findOne: jest.fn(async () => ({
          id: "pasta-1",
          criadoPorId: 10,
          nome: "Pasta Teste",
          arquivos: [
            { id: "a1", tipo: PastaArquivoTipo.IMAGEM, nomeOriginal: "f.png" },
            {
              id: "a2",
              tipo: PastaArquivoTipo.PLANILHA,
              nomeOriginal: "s.xlsx",
            },
          ],
        })),
      };
      const { service } = buildService({ pastasRepository });

      const result: any = await service.findOne("pasta-1", 10);

      expect(result.id).toBe("pasta-1");
      expect(result.imagens).toBe(1);
      expect(result.planilhas).toBe(1);
      expect(result.arquivos).toHaveLength(2);
      expect(result.arquivos[0].url).toContain(
        "/api/pastas/pasta-1/arquivos/a1/download",
      );
    });

    it("permite acesso quando userId nao e informado (admin)", async () => {
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({ getMany: [] }),
        findOne: jest.fn(async () => ({
          id: "pasta-1",
          criadoPorId: 10,
          arquivos: [],
        })),
      };
      const { service } = buildService({ pastasRepository });

      const result: any = await service.findOne("pasta-1");
      expect(result.id).toBe("pasta-1");
      expect(result.imagens).toBe(0);
    });
  });

  describe("findAll", () => {
    it("retorna array quando pagination nao e informado (compat retroativa)", async () => {
      const pastas = [
        { id: "p1", nome: "Pasta 1" },
        { id: "p2", nome: "Pasta 2" },
      ];
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({ getMany: pastas }),
        findOne: jest.fn(),
      };
      const { service } = buildService({ pastasRepository });

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it("filtra por criadoPorId quando userId e informado", async () => {
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({ getMany: [] }),
        findOne: jest.fn(),
      };
      const { service } = buildService({ pastasRepository });

      await service.findAll(42);

      const qb = pastasRepository.createQueryBuilder();
      expect(qb.andWhere).toHaveBeenCalledWith("pasta.criadoPorId = :userId", {
        userId: 42,
      });
    });

    it("retorna envelope paginado quando pagination e informado", async () => {
      const items = [{ id: "p1" }, { id: "p2" }];
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({
          getManyAndCount: [items, 25],
        }),
        findOne: jest.fn(),
      };
      const { service } = buildService({ pastasRepository });

      const result: any = await service.findAll(undefined, {
        page: 2,
        limit: 10,
      });

      expect(result).not.toBeInstanceOf(Array);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      const qb = pastasRepository.createQueryBuilder();
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it("calcula totalPages como 1 quando total e zero", async () => {
      const pastasRepository = {
        createQueryBuilder: createQueryBuilderMock({
          getManyAndCount: [[], 0],
        }),
        findOne: jest.fn(),
      };
      const { service } = buildService({ pastasRepository });

      const result: any = await service.findAll(undefined, {
        page: 1,
        limit: 20,
      });

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });
  });
});
