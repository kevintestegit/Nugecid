import { DesarquivamentoTypeOrmRepository } from "./desarquivamento.typeorm-repository";

describe("DesarquivamentoTypeOrmRepository normalization", () => {
  let repository: DesarquivamentoTypeOrmRepository;

  beforeEach(() => {
    repository = new DesarquivamentoTypeOrmRepository(
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it("normaliza termo de busca removendo acentos e padronizando para minúsculas", () => {
    const normalized = (repository as any).normalizeSearchText(
      "  APOIO à INVESTIGAÇÃO  ",
    );

    expect(normalized).toBe("apoio a investigacao");
  });

  it("gera expressão SQL acento-insensível para uma coluna", () => {
    const expression = (
      repository as any
    ).buildAccentInsensitiveColumnExpression("d.setorDemandante");

    expect(expression).toContain(
      "translate(lower(coalesce(d.setorDemandante, ''))",
    );
    expect(expression).toContain("ÁÀÂÃÄ");
    expect(expression).toContain("AAAAA");
  });
});
