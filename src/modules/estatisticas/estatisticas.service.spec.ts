import type { Cache } from "cache-manager";
import type { Repository } from "typeorm";

import { EstatisticasService } from "./estatisticas.service";
import { DesarquivamentoTypeOrmEntity } from "../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";

jest.mock("playwright", () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

type CountQueryBuilderMock = {
  where: jest.Mock;
  andWhere: jest.Mock;
  getCount: jest.Mock;
};

type ListQueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getMany: jest.Mock;
};

const createCountQueryBuilder = (total: number): CountQueryBuilderMock => {
  const qb: CountQueryBuilderMock = {
    where: jest.fn(),
    andWhere: jest.fn(),
    getCount: jest.fn().mockResolvedValue(total),
  };
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  return qb;
};

const createListQueryBuilder = (rows: unknown[]): ListQueryBuilderMock => {
  const qb: ListQueryBuilderMock = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn().mockResolvedValue(rows),
  };
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.skip.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  return qb;
};

describe("EstatisticasService", () => {
  const repoMock = {
    createQueryBuilder: jest.fn(),
  };
  const cacheManagerMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockedPlaywright = jest.requireMock("playwright") as {
    chromium: { launch: jest.Mock };
  };

  let service: EstatisticasService;

  const buildHtmlMethod = (
    value = "<html><body>Relatorio</body></html>",
  ): jest.SpyInstance => {
    return jest
      .spyOn(
        service as unknown as {
          buildRelatorioMensalHTML: (...args: unknown[]) => Promise<string>;
        },
        "buildRelatorioMensalHTML",
      )
      .mockResolvedValue(value);
  };

  beforeEach(() => {
    repoMock.createQueryBuilder.mockReset();
    cacheManagerMock.get.mockReset();
    cacheManagerMock.set.mockReset();
    mockedPlaywright.chromium.launch.mockReset();

    service = new EstatisticasService(
      repoMock as unknown as Repository<DesarquivamentoTypeOrmEntity>,
      cacheManagerMock as unknown as Cache,
    );
  });

  const configurePlaywrightSuccess = (): {
    setContent: jest.Mock;
    pdf: jest.Mock;
    newPage: jest.Mock;
    close: jest.Mock;
  } => {
    const setContent = jest.fn().mockResolvedValue(undefined);
    const pdf = jest.fn().mockResolvedValue(Buffer.from("pdf"));
    const newPage = jest.fn().mockResolvedValue({ setContent, pdf });
    const close = jest.fn().mockResolvedValue(undefined);
    mockedPlaywright.chromium.launch.mockResolvedValue({
      newPage,
      close,
    });

    return { setContent, pdf, newPage, close };
  };

  it("deve exportar relatório mensal completo quando paginação não é informada", async () => {
    const countQb = createCountQueryBuilder(2);
    const listRows = [
      {
        criadoPor: { nome: "Alice" },
        dataSolicitacao: new Date("2026-02-01T00:00:00.000Z"),
        status: "SOLICITADO",
      },
      {
        criadoPor: { nome: "Bruno" },
        dataSolicitacao: new Date("2026-02-02T00:00:00.000Z"),
        status: "FINALIZADO",
      },
    ];
    const listQb = createListQueryBuilder(listRows);
    repoMock.createQueryBuilder
      .mockReturnValueOnce(countQb)
      .mockReturnValueOnce(listQb);

    const htmlSpy = buildHtmlMethod();
    configurePlaywrightSuccess();

    const result = await service.generateRelatorioMensalPdf(2026, 2);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(listQb.skip).not.toHaveBeenCalled();
    expect(listQb.take).not.toHaveBeenCalled();
    expect(htmlSpy).toHaveBeenCalled();
    expect(htmlSpy.mock.calls[0]?.[4]).toBeUndefined();
  });

  it("deve exportar relatório mensal paginado quando paginação é informada", async () => {
    const totalRegistros = 27;
    const registrosPagina = Array.from({ length: 10 }, (_, index) => ({
      criadoPor: { nome: index < 5 ? "Alice" : "Bruno" },
      dataSolicitacao: new Date("2026-02-01T00:00:00.000Z"),
      status: "SOLICITADO",
      numeroProcesso: `PROC-${index + 1}`,
      nomeCompleto: `Pessoa ${index + 1}`,
      tipoDocumento: "Laudo",
    }));
    const countQb = createCountQueryBuilder(totalRegistros);
    const listQb = createListQueryBuilder(registrosPagina);
    repoMock.createQueryBuilder
      .mockReturnValueOnce(countQb)
      .mockReturnValueOnce(listQb);

    const htmlSpy = buildHtmlMethod();
    configurePlaywrightSuccess();

    await service.generateRelatorioMensalPdf(2026, 2, {
      pagina: 2,
      limite: 10,
    });

    expect(listQb.skip).toHaveBeenCalledWith(10);
    expect(listQb.take).toHaveBeenCalledWith(10);
    expect(htmlSpy.mock.calls[0]?.[4]).toEqual({
      pagina: 2,
      limite: 10,
      total: totalRegistros,
      totalPaginas: 3,
      exibindo: 10,
    });
  });

  it("deve falhar para mês inválido", async () => {
    await expect(service.generateRelatorioMensalPdf(2026, 13)).rejects.toThrow(
      "Falha ao gerar relatório mensal PDF",
    );
    expect(repoMock.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("deve falhar para ano inválido", async () => {
    await expect(service.generateRelatorioMensalPdf(1999, 2)).rejects.toThrow(
      "Falha ao gerar relatório mensal PDF",
    );
    expect(repoMock.createQueryBuilder).not.toHaveBeenCalled();
  });
});
