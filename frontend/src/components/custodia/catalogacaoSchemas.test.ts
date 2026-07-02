import { describe, expect, it } from "vitest";

import {
  buildMetadataFromCategories,
  type CatalogacaoCategoria,
  catalogacaoSchemas,
  CATEGORIA_LABELS,
  findCatalogacaoSchema,
  getCatalogacaoOptionLabel,
  splitMetadataByCategories,
} from "@/components/custodia/catalogacaoSchemas";

describe("catalogacaoSchemas", () => {
  it("mantém schemas para as 17 classes do documento", () => {
    const classCodes = new Set(
      catalogacaoSchemas.filter((s) => !s.subclassCode).map((s) => s.classCode),
    );
    expect(classCodes).toEqual(
      new Set([
        "001",
        "101",
        "102",
        "103",
        "104",
        "105",
        "106",
        "107",
        "108",
        "109",
        "201",
        "202",
        "203",
        "204",
        "205",
        "206",
        "207",
      ]),
    );
  });

  it("109 possui 6 schemas específicos por grupo", () => {
    const schemas109 = catalogacaoSchemas.filter(
      (s) => s.classCode === "109" && s.subclassCode,
    );
    expect(schemas109.map((s) => s.subclassCode)).toEqual([
      "109.1",
      "109.2",
      "109.3",
      "109.4",
      "109.5",
      "109.6",
    ]);
  });

  it("cada schema possui as quatro categorias", () => {
    catalogacaoSchemas.forEach((schema) => {
      const categorias = Object.keys(
        schema.categories,
      ) as CatalogacaoCategoria[];
      expect(categorias).toEqual(
        expect.arrayContaining([
          "identificacao",
          "tecnicas",
          "periciais",
          "controle",
        ]),
      );
    });
  });

  it("schema 101 Biologia tem 5 critérios periciais do doc", () => {
    const schema = findCatalogacaoSchema({ classeCatalogacao: "101" });
    const periciais = schema?.categories.periciais ?? [];
    expect(periciais.length).toBe(5);
    expect(periciais[0].label).toBe("Quanto à natureza biológica");
    expect(periciais[0].type).toBe("select");
    expect(periciais[0].options).toEqual([
      "Humana",
      "Animal",
      "Vegetal",
      "Microbiana",
      "Mista",
    ]);
  });

  it("schema 102 Química tem 8 critérios periciais do doc", () => {
    const schema = findCatalogacaoSchema({ classeCatalogacao: "102" });
    const periciais = schema?.categories.periciais ?? [];
    expect(periciais.length).toBe(8);
    expect(periciais[0].label).toBe("Quanto à natureza química");
  });

  it("não inventa os critérios 1 a 3 ausentes de Toxicologia", () => {
    expect(
      findCatalogacaoSchema({
        classeCatalogacao: "103",
      })?.categories.periciais.map((field) => field.label),
    ).toEqual([
      "Quanto à origem",
      "Quanto à periculosidade",
      "Quanto ao estado de conservação",
      "Quanto à finalidade pericial",
      "Quanto ao valor probatório",
    ]);
  });

  it("schema 108 Merceologia tem 14 critérios periciais do doc", () => {
    const schema = findCatalogacaoSchema({ classeCatalogacao: "108" });
    const periciais = schema?.categories.periciais ?? [];
    expect(periciais.length).toBe(14);
  });

  it("schema 109.4 Munições-Estojos tem 10 critérios periciais do doc", () => {
    const schema = findCatalogacaoSchema({
      classeCatalogacao: "109",
      subclasseCatalogacao: "109.4",
    });
    expect(schema?.subclassCode).toBe("109.4");
    const periciais = schema?.categories.periciais ?? [];
    expect(periciais.length).toBe(10);
  });

  it("preserva os nomes canônicos nos campos-chave de identificacao", () => {
    const schema = findCatalogacaoSchema({
      classeCatalogacao: "101",
      tipoCatalogacao: "Geral",
    });
    const identificacao = schema?.categories.identificacao ?? [];
    const names = identificacao.map((field) => field.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "codigoVestigio",
        "numeroCatalogacao",
        "localOrigem",
        "dataColeta",
        "peritoResponsavel",
      ]),
    );
  });

  it("resolve schema por classe quando subclasse/tipo não casam", () => {
    const schema = findCatalogacaoSchema({ classeCatalogacao: "107" });
    expect(schema?.classCode).toBe("107");
    expect(getCatalogacaoOptionLabel(schema)).toContain("Tecnologia");
  });

  it("mantém uma única definição de schema para Tecnologia", () => {
    expect(
      catalogacaoSchemas.filter((schema) => schema.id === "107-tecnologia"),
    ).toHaveLength(1);
  });

  it("usa somente os critérios fornecidos para Traumatologia", () => {
    expect(
      findCatalogacaoSchema({
        classeCatalogacao: "206",
      })?.categories.periciais.map((field) => field.label),
    ).toEqual([
      "Quanto ao instrumento causador",
      "Quanto ao mecanismo de produção",
      "Quanto à região anatômica",
      "Quanto à gravidade",
    ]);
  });

  it("usa somente os critérios fornecidos para Odontologia Legal", () => {
    expect(
      findCatalogacaoSchema({
        classeCatalogacao: "207",
      })?.categories.periciais.map((field) => field.label),
    ).toEqual([
      "Quanto ao elemento dentário",
      "Quanto ao método de identificação",
      "Quanto ao estado de conservação",
      "Quanto à finalidade pericial",
    ]);
  });

  it("resolve schema por grupo quando subclassCode casar", () => {
    const schema = findCatalogacaoSchema({
      classeCatalogacao: "109",
      subclasseCatalogacao: "Armas",
    });
    expect(schema?.subclassCode).toBe("109.1");
    expect(getCatalogacaoOptionLabel(schema)).toBe("Armas");
  });

  it("resolve schema por grupo quando classLabel casar", () => {
    const schema = findCatalogacaoSchema({
      classeCatalogacao: "109",
      subclasseCatalogacao: "Projéteis",
    });
    expect(schema?.subclassCode).toBe("109.2");
  });

  describe("buildMetadataFromCategories / splitMetadataByCategories", () => {
    it("serializa e reconstrói valores preservando as categorias", () => {
      const schema = findCatalogacaoSchema({
        classeCatalogacao: "101",
        tipoCatalogacao: "Geral",
      })!;

      const original = {
        identificacao: { codigoVestigio: "VG-1234" },
        tecnicas: { detalhesTecnicosDaClassificacao: "Material biológico" },
        periciais: { naturezabiologica: "Humana" },
        controle: {},
      };

      const persisted = buildMetadataFromCategories(schema, original);
      expect(persisted.metadadosGerais.codigoVestigio).toBe("VG-1234");
      expect(
        persisted.metadadosEspecificos.detalhesTecnicosDaClassificacao,
      ).toBe("Material biológico");
      expect(persisted.metadadosEspecificos.naturezabiologica).toBe("Humana");

      const restored = splitMetadataByCategories(
        schema,
        persisted.metadadosGerais,
        persisted.metadadosEspecificos,
      );
      expect(restored.identificacao.codigoVestigio).toBe("VG-1234");
      expect(restored.tecnicas.detalhesTecnicosDaClassificacao).toBe(
        "Material biológico",
      );
      expect(restored.periciais.naturezabiologica).toBe("Humana");
    });
  });

  it("CATEGORIA_LABELS cobre as quatro categorias", () => {
    expect(Object.keys(CATEGORIA_LABELS)).toHaveLength(4);
    expect(CATEGORIA_LABELS.identificacao).toBe("Identificação do Objeto");
    expect(CATEGORIA_LABELS.controle).toBe("Controle e Rastreabilidade");
    expect(CATEGORIA_LABELS.periciais).toBe("Critérios de Classificação");
  });
});
