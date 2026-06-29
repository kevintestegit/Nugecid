// Gerado a partir do documento
// "1.1.1 Classificação dos vestígios (planilha da custódia) [Quadros] 29-05-25.docx".
// O documento define a classificação hierárquica dos vestígios. Como ele não
// traz uma ficha de metadados por tipologia, a catalogação usa campos
// operacionais comuns e mantém os nomes canônicos já persistidos no backend.

export type CatalogacaoFieldType = "text" | "date" | "number" | "textarea";

export type CatalogacaoField = {
  name: string;
  label: string;
  type: CatalogacaoFieldType;
  required?: boolean;
  helpText?: string;
};

export type CatalogacaoCategoria =
  | "identificacao"
  | "tecnicas"
  | "periciais"
  | "controle";

export const CATEGORIA_LABELS: Record<CatalogacaoCategoria, string> = {
  identificacao: "Identificação do Objeto",
  tecnicas: "Características Técnicas",
  periciais: "Características Periciais",
  controle: "Controle e Rastreabilidade",
};

// Map de categoria -> campo de armazenamento backend (JSONB).
// Identificação e Controle vão para metadadosGerais; Técnicas e Periciais, metadadosEspecificos.
export const CATEGORIA_STORAGE: Record<
  CatalogacaoCategoria,
  "metadadosGerais" | "metadadosEspecificos"
> = {
  identificacao: "metadadosGerais",
  controle: "metadadosGerais",
  tecnicas: "metadadosEspecificos",
  periciais: "metadadosEspecificos",
};

export type CatalogacaoSchema = {
  id: string;
  version: string;
  classCode: string;
  classLabel: string;
  subclassCode?: string;
  subclassLabel: string;
  typeLabel: string;
  categories: Record<CatalogacaoCategoria, CatalogacaoField[]>;
};

export type CatalogacaoSchemaLookup = {
  classeCatalogacao?: string | null;
  subclasseCatalogacao?: string | null;
  tipoCatalogacao?: string | null;
};

const SCHEMA_VERSION = "ccvc-2026-06";

type CatalogacaoSchemaDefinition = {
  id: string;
  classCode: string;
  classLabel: string;
};

const schemaDefinitions: CatalogacaoSchemaDefinition[] = [
  { id: "1-biologico-geral", classCode: "1", classLabel: "Biológico" },
  { id: "2-papiloscopico-geral", classCode: "2", classLabel: "Papiloscópico" },
  {
    id: "3-quimico-toxicologico-drogas-geral",
    classCode: "3",
    classLabel: "Químico-Toxicológico/Drogas",
  },
  {
    id: "4-genetica-forense-geral",
    classCode: "4",
    classLabel: "Genética Forense",
  },
  {
    id: "5-antropologia-forense-geral",
    classCode: "5",
    classLabel: "Antropologia Forense",
  },
  {
    id: "6-arqueologia-forense-geral",
    classCode: "6",
    classLabel: "Arqueologia Forense",
  },
  {
    id: "7-odontologia-legal-geral",
    classCode: "7",
    classLabel: "Odontologia Legal",
  },
  {
    id: "8-medicina-legal-geral",
    classCode: "8",
    classLabel: "Medicina Legal",
  },
  { id: "800-documental-geral", classCode: "800", classLabel: "Documental" },
  {
    id: "10-pericia-merceologica-geral",
    classCode: "10",
    classLabel: "Perícia Merceológica",
  },
  {
    id: "11-eletro-eletronico-informatica-geral",
    classCode: "11",
    classLabel: "Perícia em Eletro-eletrônico (Informática)",
  },
  { id: "900-balistica-geral", classCode: "900", classLabel: "Balística" },
  { id: "13-geral", classCode: "13", classLabel: "Geral" },
];

const buildFields = (
  classLabel: string,
): Record<CatalogacaoCategoria, CatalogacaoField[]> => ({
  identificacao: [
    {
      name: "codigoVestigio",
      label: "Código do Vestígio",
      type: "text",
      required: true,
      helpText: "Identificador único do vestígio.",
    },
    {
      name: "numeroCatalogacao",
      label: "Número de Catalogação",
      type: "text",
      required: true,
      helpText: "Número de registro usado na catalogação.",
    },
    {
      name: "tipologiaDoDocumento",
      label: "Tipologia do Documento",
      type: "text",
      helpText: classLabel,
    },
    {
      name: "nivelClassificacao",
      label: "Nível da Classificação",
      type: "text",
      helpText:
        "Código selecionado na custódia, incluindo nível 2 ou 3 quando aplicável.",
    },
    {
      name: "tipoVestigio",
      label: "Tipo de Vestígio",
      type: "text",
      helpText: "Denominação do vestígio conforme o quadro de classificação.",
    },
    {
      name: "localOrigem",
      label: "Local de Origem",
      type: "text",
      helpText: "Local de coleta ou origem informada na custódia.",
    },
    {
      name: "dataColeta",
      label: "Data da Coleta",
      type: "date",
      helpText: "Data de localização ou coleta do vestígio.",
    },
    {
      name: "peritoResponsavel",
      label: "Perito Responsável",
      type: "text",
      helpText: "Responsável técnico pela coleta ou catalogação.",
    },
  ],
  tecnicas: [
    {
      name: "detalhesTecnicosDaClassificacao",
      label: "Detalhes Técnicos da Classificação",
      type: "textarea",
      helpText:
        "Características descritas no quadro do documento para a tipologia selecionada.",
    },
    {
      name: "estadoDeConservacao",
      label: "Estado de Conservação",
      type: "text",
      helpText: "Condição observada no momento da catalogação.",
    },
    {
      name: "quantidadeDeVestigios",
      label: "Quantidade de Vestígios",
      type: "number",
      helpText: "Número de itens ou amostras catalogadas.",
    },
    {
      name: "objetoSuporte",
      label: "Objeto/Suporte",
      type: "text",
      helpText:
        "Objeto, superfície, mídia, corpo ou material associado ao vestígio.",
    },
    {
      name: "metodoDeColeta",
      label: "Método de Coleta",
      type: "text",
      helpText: "Técnica ou procedimento usado para coletar o vestígio.",
    },
  ],
  periciais: [
    {
      name: "examePericialIndicado",
      label: "Exame Pericial Indicado",
      type: "text",
      helpText: "Exame ou setor pericial sugerido para a tipologia.",
    },
    {
      name: "resultadoPreliminar",
      label: "Resultado Preliminar",
      type: "textarea",
      helpText: "Achados preliminares, quando houver.",
    },
    {
      name: "compatibilidadeComEventoInvestigado",
      label: "Compatibilidade com Evento Investigado",
      type: "text",
      helpText:
        "Indique se o vestígio é compatível com a dinâmica investigada.",
    },
    {
      name: "laudoVinculado",
      label: "Laudo Vinculado",
      type: "textarea",
      helpText: "Número ou referência de laudo relacionado.",
    },
    {
      name: "observacoesPericiais",
      label: "Observações Periciais",
      type: "textarea",
      helpText: "Informações técnicas relevantes ao exame.",
    },
  ],
  controle: [
    {
      name: "numeroDoProcedimento",
      label: "Número do Procedimento",
      type: "textarea",
      helpText: "BO, Inquérito Policial, Processo Judicial ou Requisição.",
    },
    {
      name: "codigoDaCadeiaDeCustodia",
      label: "Código da Cadeia de Custódia",
      type: "text",
      helpText: "Identificador de rastreabilidade da custódia.",
    },
    {
      name: "numeroDoLacre",
      label: "Número do Lacre",
      type: "text",
      helpText: "Lacre físico ou eletrônico associado.",
    },
    {
      name: "formaDeAcondicionamento",
      label: "Forma de Acondicionamento",
      type: "text",
      helpText:
        "Envelope, caixa, frasco, mídia, suporte ou outro acondicionamento.",
    },
    {
      name: "localizacaoFisicaAtual",
      label: "Localização Física Atual",
      type: "text",
      helpText: "Local em que o vestígio está armazenado.",
    },
    {
      name: "situacaoAtual",
      label: "Situação Atual",
      type: "text",
      helpText: "Em análise, armazenado, devolvido, arquivado ou descartado.",
    },
  ],
});

const buildCatalogacaoSchema = (
  definition: CatalogacaoSchemaDefinition,
): CatalogacaoSchema => ({
  ...definition,
  version: SCHEMA_VERSION,
  subclassLabel: definition.classLabel,
  typeLabel: "Geral",
  categories: buildFields(definition.classLabel),
});

export const catalogacaoSchemas: CatalogacaoSchema[] = schemaDefinitions.map(
  buildCatalogacaoSchema,
);

const normalize = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^reconhecimento de\s+/, "")
    .trim();

export const findCatalogacaoSchema = ({
  classeCatalogacao,
  subclasseCatalogacao,
  tipoCatalogacao,
}: CatalogacaoSchemaLookup): CatalogacaoSchema | undefined => {
  const normalizedSubclass = normalize(subclasseCatalogacao);
  const normalizedType = normalize(tipoCatalogacao);

  return (
    catalogacaoSchemas.find((schema) => {
      if (schema.classCode !== classeCatalogacao) return false;

      const subclassMatches =
        !normalizedSubclass ||
        normalize(schema.subclassCode) === normalizedSubclass ||
        normalize(schema.subclassLabel) === normalizedSubclass;
      const typeMatches =
        !normalizedType || normalize(schema.typeLabel) === normalizedType;

      return subclassMatches && typeMatches;
    }) ??
    catalogacaoSchemas.find((schema) => schema.classCode === classeCatalogacao)
  );
};

export const getCatalogacaoOptionLabel = (
  schema: CatalogacaoSchema | undefined,
): string => {
  if (!schema) return "";
  return `${schema.classLabel} - ${schema.typeLabel}`;
};

// Helpers de armazenamento: agregam valores das categorias nos 2 JSONB do backend.
export const buildMetadataFromCategories = (
  schema: CatalogacaoSchema,
  values: Record<CatalogacaoCategoria, Record<string, string>>,
): {
  metadadosGerais: Record<string, string>;
  metadadosEspecificos: Record<string, string>;
} => {
  const metadadosGerais: Record<string, string> = {};
  const metadadosEspecificos: Record<string, string> = {};
  (Object.keys(schema.categories) as CatalogacaoCategoria[]).forEach(
    (categoria) => {
      const target =
        CATEGORIA_STORAGE[categoria] === "metadadosGerais"
          ? metadadosGerais
          : metadadosEspecificos;
      const catValues = values[categoria] ?? {};
      schema.categories[categoria].forEach((field) => {
        const value = catValues[field.name];
        if (value !== undefined) {
          target[field.name] = value;
        }
      });
    },
  );
  return { metadadosGerais, metadadosEspecificos };
};

// Inverso: a partir dos JSONB persistidos, reconstrói valores por categoria.
export const splitMetadataByCategories = (
  schema: CatalogacaoSchema,
  metadadosGerais: Record<string, string> | undefined,
  metadadosEspecificos: Record<string, string> | undefined,
): Record<CatalogacaoCategoria, Record<string, string>> => {
  const result = {
    identificacao: {},
    tecnicas: {},
    periciais: {},
    controle: {},
  } as Record<CatalogacaoCategoria, Record<string, string>>;
  (Object.keys(schema.categories) as CatalogacaoCategoria[]).forEach(
    (categoria) => {
      const source =
        CATEGORIA_STORAGE[categoria] === "metadadosGerais"
          ? metadadosGerais
          : metadadosEspecificos;
      result[categoria] = {};
      schema.categories[categoria].forEach((field) => {
        const value = source?.[field.name];
        if (value !== undefined) {
          result[categoria][field.name] = value;
        }
      });
    },
  );
  return result;
};
