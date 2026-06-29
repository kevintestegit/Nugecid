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
  it("mantem schemas para as tipologias do documento de classificacao", () => {
    expect(
      new Set(catalogacaoSchemas.map((schema) => schema.classCode)),
    ).toEqual(
      new Set([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "800",
        "10",
        "11",
        "900",
        "13",
      ]),
    );
  });

  it("cada schema possui as quatro categorias operacionais da ficha", () => {
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
      categorias.forEach((categoria) => {
        expect(schema.categories[categoria].length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  it("preserva os nomes canonicos nos campos-chave de identificacao", () => {
    const schema = findCatalogacaoSchema({
      classeCatalogacao: "900",
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

  it("exibe a definicao do campo como helpText", () => {
    const schema = findCatalogacaoSchema({ classeCatalogacao: "1" });
    const comHelp = schema?.categories.identificacao.find(
      (field) => field.helpText,
    );
    expect(comHelp).toBeDefined();
    expect(comHelp?.helpText?.length).toBeGreaterThan(0);
  });

  it("resolve schema por classe quando subclasse/tipo nao casam", () => {
    const schema = findCatalogacaoSchema({ classeCatalogacao: "11" });
    expect(schema?.classCode).toBe("11");
    expect(getCatalogacaoOptionLabel(schema)).toContain("Eletro-eletrônico");
  });

  it("alinha papiloscopico ao codigo 2 do documento novo", () => {
    const schema = findCatalogacaoSchema({ classeCatalogacao: "2" });
    expect(schema?.classLabel).toBe("Papiloscópico");
    expect(schema?.categories.tecnicas.map((field) => field.name)).toContain(
      "detalhesTecnicosDaClassificacao",
    );
  });

  describe("buildMetadataFromCategories / splitMetadataByCategories", () => {
    it("serializa e reconstrui valores preservando as categorias", () => {
      const schema = findCatalogacaoSchema({
        classeCatalogacao: "1",
        tipoCatalogacao: "Geral",
      })!;

      const original = {
        identificacao: { codigoVestigio: "VG-1234" },
        tecnicas: { detalhesTecnicosDaClassificacao: "Material biológico" },
        periciais: {},
        controle: {},
      };

      const persisted = buildMetadataFromCategories(schema, original);
      // Identificacao -> metadadosGerais; Tecnicas -> metadadosEspecificos.
      expect(persisted.metadadosGerais.codigoVestigio).toBe("VG-1234");
      expect(
        persisted.metadadosEspecificos.detalhesTecnicosDaClassificacao,
      ).toBe("Material biológico");

      const restored = splitMetadataByCategories(
        schema,
        persisted.metadadosGerais,
        persisted.metadadosEspecificos,
      );
      expect(restored.identificacao.codigoVestigio).toBe("VG-1234");
      expect(restored.tecnicas.detalhesTecnicosDaClassificacao).toBe(
        "Material biológico",
      );
    });
  });

  it("CATEGORIA_LABELS cobre as quatro categorias", () => {
    expect(Object.keys(CATEGORIA_LABELS)).toHaveLength(4);
    expect(CATEGORIA_LABELS.identificacao).toBe("Identificação do Objeto");
    expect(CATEGORIA_LABELS.controle).toBe("Controle e Rastreabilidade");
  });
});
