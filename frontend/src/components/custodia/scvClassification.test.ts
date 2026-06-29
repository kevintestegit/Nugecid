import { describe, expect, it } from "vitest";

import { scvClasses } from "@/components/custodia/scvClassification";

describe("scvClasses", () => {
  it("segue a ordem macro definida no documento de classificação", () => {
    expect(scvClasses.map((item) => `${item.code} ${item.label}`)).toEqual([
      "1 Biológico",
      "2 Papiloscópico",
      "3 Químico-Toxicológico/Drogas",
      "4 Genética Forense",
      "5 Antropologia Forense",
      "6 Arqueologia Forense",
      "7 Odontologia Legal",
      "8 Medicina Legal",
      "800 Documental",
      "10 Perícia Merceológica",
      "11 Perícia em Eletro-eletrônico (Informática)",
      "900 Balística",
      "13 Geral",
    ]);
  });

  it("mantém os níveis de classificação na ordem do documento", () => {
    const groupsByClass = Object.fromEntries(
      scvClasses.map((item) => [
        item.code,
        item.groups.map((group) => `${group.code} ${group.label}`),
      ]),
    );

    expect(groupsByClass).toMatchObject({
      "1": [
        "101 Fluidos Corporais",
        "1.2 Tecidos Sólidos e Estruturas Celulares",
        "1.3 Materiais Biológicos Diversos (Animais e Vegetal)",
      ],
      "2": ["2.1 Papiloscopia"],
      "3": [
        "3.1 Tóxicos",
        "3.2 Farmacêuticos",
        "3.3 Estimulantes",
        "3.4 Alucinógenos",
        "3.5 Canabinoides",
        "3.6 Outras Drogas de Abuso e Acessórios",
      ],
      "4": [
        "4.1 Vestígios de Alto Teor de DNA",
        "4.2 Vestígios de Médio Teor de DNA",
        "4.3 Vestígios de Baixo Teor de DNA ou Degradado",
      ],
      "800": [
        "801 Documentos de Identificação",
        "9.2 Títulos Oficiais",
        "9.3 Cédulas e Moedas",
        "9.4 Documentos Manuscritos",
        "9.5 Documentos Datilografados e Impressos",
        "9.6 Documentos Eletrônicos e Digitais",
        "9.7 Documentos Contábeis e Financeiros",
        "9.8 Documentos Audiovisuais",
        "9.9 Registros Documentais em Outras Superfícies",
      ],
      "900": [
        "901 Quanto à Origem (Elementos Essenciais do Disparo)",
        "12.2 Quanto aos Resíduos do Disparo",
        "12.3 Quanto aos Efeitos do Disparo no Alvo",
        "12.4 Vestígios Associados",
      ],
    });
  });

  it("representa filhos de papiloscopia como nível 3", () => {
    const papiloscopico = scvClasses.find((item) => item.code === "2");
    const groups = papiloscopico?.groups ?? [];

    expect(groups.find((group) => group.code === "2.1")?.subdivisions).toEqual([
      { code: "2.1.1", label: "Dactiloscopia" },
      { code: "2.1.2", label: "Quiroscopia" },
      { code: "2.1.3", label: "Podoscopia" },
    ]);
  });

  it("preserva classificações de quarto nível da balística como subdivisões selecionáveis", () => {
    const balistica = scvClasses.find((item) => item.code === "900");
    const origem = balistica?.groups.find((group) => group.code === "901");

    expect(origem?.subdivisions).toEqual(
      expect.arrayContaining([
        {
          code: "901.211",
          label: "Elementos da Munição Deflagrada - Estojos",
        },
        {
          code: "901.212",
          label: "Elementos da Munição Deflagrada - Projéteis",
        },
      ]),
    );
  });
});
