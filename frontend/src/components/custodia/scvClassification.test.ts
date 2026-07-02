import { describe, expect, it } from "vitest";

import { scvClasses } from "@/components/custodia/scvClassification";

describe("scvClasses", () => {
  const criminalistica = () => scvClasses.find((item) => item.code === "100");

  it("contém os 3 institutos do documento de classificação", () => {
    expect(scvClasses.map((item) => `${item.code} ${item.label}`)).toEqual([
      "000 Identificação",
      "100 Criminalística",
      "200 Medicina Legal",
    ]);
  });

  it("Instituto 100 Criminalística possui 9 grupos (disciplinas)", () => {
    const criminalistica = scvClasses.find((item) => item.code === "100");
    const groups = criminalistica?.groups ?? [];
    expect(groups).toHaveLength(9);
    expect(groups.map((g) => g.code)).toEqual([
      "101",
      "102",
      "103",
      "104",
      "105",
      "106",
      "107",
      "108",
      "109",
    ]);
  });

  it("Instituto 200 Medicina Legal possui 7 grupos (disciplinas)", () => {
    const medLegal = scvClasses.find((item) => item.code === "200");
    const groups = medLegal?.groups ?? [];
    expect(groups).toHaveLength(7);
    expect(groups.map((g) => g.code)).toEqual([
      "201",
      "202",
      "203",
      "204",
      "205",
      "206",
      "207",
    ]);
  });

  it("Instituto 000 Identificação possui 1 grupo", () => {
    const identificacao = scvClasses.find((item) => item.code === "000");
    expect(identificacao?.groups).toHaveLength(1);
    expect(identificacao?.groups[0].code).toBe("001");
  });

  it("mantém apenas os códigos biológicos definidos no documento", () => {
    const biologia = criminalistica()?.groups.find((g) => g.code === "101");

    expect(biologia?.subdivisions?.map(({ code }) => code)).toEqual([
      "101.1",
      "101.2",
      "101.3",
      "101.4",
      "101.5",
      "101.6",
    ]);
    expect(biologia?.subdivisions?.[0]).toMatchObject({
      code: "101.1",
      label: "Humana",
      subdivisions: [{ code: "101.11", label: "Vestígio Hematológico" }],
    });
    expect(biologia?.subdivisions?.[5]).toMatchObject({
      code: "101.6",
      label: "Vestígio Genético",
      subdivisions: [
        { code: "101.61", label: "DNA Humano" },
        { code: "101.62", label: "DNA Animal" },
        { code: "101.63", label: "DNA Vegetal" },
        { code: "101.66", label: "Perfil Genético Misto" },
      ],
    });
  });

  it("corrige o prefixo e preserva os níveis da Toxicologia", () => {
    const toxicologia = criminalistica()?.groups.find((g) => g.code === "103");
    const entorpecentes = toxicologia?.subdivisions?.[0];

    expect(entorpecentes?.subdivisions?.map(({ code }) => code)).toEqual([
      "103.11",
      "103.12",
      "103.13",
      "103.14",
      "103.15",
    ]);
    expect(entorpecentes?.subdivisions?.[3]).toMatchObject({
      code: "103.14",
      label: "Canabinoides",
      subdivisions: [{ code: "103.141", label: "Benzodiazepínicos" }],
    });
    expect(entorpecentes?.subdivisions?.[4].subdivisions?.at(-1)?.code).toBe(
      "103.154",
    );
  });

  it("remove duplicações e corrige prefixos evidentes do documento", () => {
    const meioAmbiente = criminalistica()?.groups.find(
      (group) => group.code === "104",
    );
    expect(meioAmbiente?.subdivisions?.map(({ code }) => code)).toEqual([
      "104.1",
      "104.2",
      "104.3",
      "104.4",
      "104.5",
      "104.6",
      "104.7",
      "104.8",
      "104.9",
      "104.10",
    ]);

    const medicinaLegal = scvClasses.find(({ code }) => code === "200");
    const psiquiatria = medicinaLegal?.groups.find(
      ({ code }) => code === "201",
    );
    const psicologia = medicinaLegal?.groups.find(({ code }) => code === "202");
    expect(psiquiatria?.subdivisions?.map(({ code }) => code)).toEqual([
      "201.1",
      "201.2",
      "201.3",
      "201.4",
      "201.5",
      "201.6",
      "201.7",
      "201.8",
      "201.9",
      "201.10",
    ]);
    expect(psicologia?.subdivisions?.at(-1)?.code).toBe("202.10");
  });

  it("109 Armamentos possui 6 grupos com subdivisions", () => {
    const armamentos = criminalistica()?.groups.find((g) => g.code === "109");
    expect(armamentos?.subdivisions).toHaveLength(6);

    const armas = armamentos?.subdivisions?.find((s) => s.code === "109.1");
    expect(armas?.subdivisions).toEqual([
      { code: "109.11", label: "Arma Curta" },
      { code: "109.12", label: "Arma Longa" },
    ]);

    const projeteis = armamentos?.subdivisions?.find((s) => s.code === "109.2");
    expect(projeteis?.subdivisions).toHaveLength(8);
  });
});
