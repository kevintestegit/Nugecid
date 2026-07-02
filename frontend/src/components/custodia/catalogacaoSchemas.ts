// Gerado a partir do documento "1. Classificação - OFICIAL.docx".
// Define schemas de catalogação por classe SCV. Critérios numerados do doc → campos periciais.
// identificacao + tecnicas + controle = campos operacionais (mantidos do schema anterior).
// periciais = substituídos pelos critérios do doc (substituição total).
// Lacunas do documento permanecem ausentes; nenhum critério é inferido.

export type CatalogacaoFieldType =
  | "text"
  | "date"
  | "number"
  | "textarea"
  | "select";

export type CatalogacaoField = {
  name: string;
  label: string;
  type: CatalogacaoFieldType;
  required?: boolean;
  helpText?: string;
  options?: string[];
};

export type CatalogacaoCategoria =
  | "identificacao"
  | "tecnicas"
  | "periciais"
  | "controle";

export const CATEGORIA_LABELS: Record<CatalogacaoCategoria, string> = {
  identificacao: "Identificação do Objeto",
  tecnicas: "Características Técnicas",
  periciais: "Critérios de Classificação",
  controle: "Controle e Rastreabilidade",
};

// Map de categoria → bucket backend (JSONB).
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

const SCHEMA_VERSION = "ccvc-2026-07";

// ─── CAMPOS OPERACIONAIS (mantidos do schema anterior) ───────────────────

const IDENTIFICACAO_FIELDS: CatalogacaoField[] = [
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
    helpText: "Classe SCV do vestígio.",
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
    name: "denominacaoVestigio",
    label: "Denominação do Vestígio",
    type: "text",
    helpText: "Descrição do vestígio (compatibilidade legado).",
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
];

const TECNICAS_FIELDS: CatalogacaoField[] = [
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
];

const CONTROLE_FIELDS: CatalogacaoField[] = [
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
];

// ─── CRITÉRIOS POR CLASSE (CRITÉRIO DE CLASSIFICAÇÃO do doc) ─────────────

const sel = (
  label: string,
  opts: string[],
  help?: string,
): CatalogacaoField => ({
  name: label
    .replace(/^Quanto ao tipo de /, "tipo")
    .replace(/^Quanto à /, "")
    .replace(/^Quanto ao /, "")
    .replace(/^Quanto às /, "")
    .replace(/^Quanto ao estado de /, "estado")
    .replace(/^Quanto a /, "")
    .replace(/^Quanto a /, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^(\d)/, "c$1"),
  label,
  type: "select" as const,
  options: opts,
  helpText: help,
});

const txt = (label: string, help?: string): CatalogacaoField => ({
  name: label
    .replace(/^Quanto ao tipo de /, "tipo")
    .replace(/^Quanto à /, "")
    .replace(/^Quanto ao /, "")
    .replace(/^Quanto às /, "")
    .replace(/^Quanto a /, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^(\d)/, "c$1"),
  label,
  type: "text" as const,
  helpText: help,
});

// 001 — IDENTIFICAÇÃO HUMANA (10 critérios do doc)
const CRITERIOS_001: CatalogacaoField[] = [
  sel("Quanto ao tipo de impressão", [
    "Impressão visível",
    "Impressão latente",
  ]),
  sel("Quanto ao tipo de documento", [
    "Documentos de identidade",
    "Contratos",
    "Procurações",
    "Cheques",
    "Bilhetes",
    "Envelopes",
    "Cédulas de dinheiro",
    "Livros e cadernos",
  ]),
  sel("Quanto ao tipo de arma ou artefato", [
    "Armas de fogo",
    "Munições",
    "Estojos de munição",
    "Carregadores",
    "Artefatos explosivos",
    "Componentes de bombas",
    "Facas",
    "Instrumentos contundentes",
  ]),
  sel("Quanto ao tipo de objeto pessoal", [
    "Telefones celulares",
    "Tablets",
    "Computadores",
    "Pen drives",
    "Relógios",
    "Óculos",
    "Chaves",
    "Carteiras",
  ]),
  sel("Quanto ao tipo de embalagem ou recipiente", [
    "Garrafas",
    "Copos",
    "Latas",
    "Frascos",
    "Embalagens plásticas",
    "Sacolas",
    "Caixas",
  ]),
  sel("Quanto ao tipo de superfície", [
    "Vidro",
    "Metal",
    "Plástico",
    "Madeira envernizada",
    "Cerâmica",
    "Azulejo",
    "Superfícies pintadas",
  ]),
  sel("Quanto ao tipo de veículo", [
    "Volante",
    "Maçanetas",
    "Retrovisores",
    "Painéis",
    "Vidros automotivos",
    "Motocicletas",
    "Bicicletas",
  ]),
  sel("Quanto ao tipo de ferramenta", [
    "Martelos",
    "Alicates",
    "Chaves de fenda",
    "Pés de cabra",
    "Furadeiras",
    "Serras",
  ]),
  sel("Quanto ao tipo de vestígio biológico associado", [
    "Frascos contendo sangue",
    "Recipientes contendo urina",
    "Recipientes contendo saliva",
    "Objetos contendo material genético",
  ]),
  sel("Quanto ao tipo de mobiliário ou ambiente", [
    "Mesas",
    "Cadeiras",
    "Portas",
    "Janelas",
    "Cofres",
    "Gavetas",
    "Interruptores",
  ]),
  sel("Quanto ao tipo de objeto relacionado ao crime", [
    "Objetos furtados",
    "Objetos abandonados",
    "Instrumentos utilizados no crime",
    "Objetos manipulados pelo autor",
    "Objetos manipulados pela vítima",
  ]),
];

// 101 — BIOLOGIA (5 critérios)
const CRITERIOS_101: CatalogacaoField[] = [
  sel("Quanto à natureza biológica", [
    "Humana",
    "Animal",
    "Vegetal",
    "Microbiana",
    "Mista",
  ]),
  sel("Quanto ao estado físico", [
    "Líquido",
    "Semilíquido",
    "Pastoso",
    "Sólido",
    "Fragmentado",
    "Pulverizado",
  ]),
  sel("Quanto ao estado de conservação", [
    "Íntegro",
    "Degradado",
    "Putrefeito",
    "Mumificado",
    "Carbonizado",
    "Contaminado",
  ]),
  sel("Quanto à origem da coleta", [
    "Local de crime",
    "Corpo humano",
    "Animal",
    "Objeto",
    "Solo",
    "Vegetação",
  ]),
  sel("Quanto ao potencial identificativo", [
    "Alto",
    "Médio",
    "Baixo",
    "Não identificável",
  ]),
];

// 102 — QUÍMICA (8 critérios)
const CRITERIOS_102: CatalogacaoField[] = [
  sel("Quanto à natureza química", [
    "Orgânica",
    "Inorgânica",
    "Organometálica",
    "Polimérica",
    "Mista",
  ]),
  sel("Quanto ao estado físico", [
    "Sólido",
    "Líquido",
    "Gasoso",
    "Gel",
    "Pastoso",
    "Pulverulento",
  ]),
  sel("Quanto à composição", [
    "Substância pura",
    "Mistura homogênea",
    "Mistura heterogênea",
    "Formulação comercial",
    "Resíduo químico",
  ]),
  sel("Quanto à origem", [
    "Industrial",
    "Laboratorial",
    "Doméstica",
    "Ambiental",
    "Farmacêutica",
    "Agrícola",
  ]),
  sel("Quanto à periculosidade", [
    "Inflamável",
    "Corrosiva",
    "Tóxica",
    "Explosiva",
    "Oxidante",
    "Não perigosa",
  ]),
  sel("Quanto ao estado de conservação", [
    "Íntegro",
    "Degradado",
    "Contaminado",
    "Alterado",
    "Carbonizado",
  ]),
  sel("Quanto à finalidade pericial", [
    "Identificação química",
    "Determinação de pureza",
    "Comparação de amostras",
    "Determinação de origem",
    "Investigação toxicológica",
    "Investigação ambiental",
  ]),
  sel("Quanto ao valor probatório", [
    "Alto",
    "Médio",
    "Baixo",
    "Não conclusivo",
  ]),
];

// 103 — TOXICOLOGIA (o documento fornece somente os critérios 4 a 8)
const CRITERIOS_103: CatalogacaoField[] = CRITERIOS_102.slice(3);

// 104 — MEIO AMBIENTE (7 critérios)
const CRITERIOS_104: CatalogacaoField[] = [
  sel("Quanto ao tipo de matriz ambiental", [
    "Solo",
    "Sedimento",
    "Água",
    "Ar",
    "Flora",
    "Fauna",
    "Resíduo",
    "Material geológico",
  ]),
  sel("Quanto à origem", [
    "Natural",
    "Antrópica",
    "Industrial",
    "Agrícola",
    "Urbana",
    "Minerária",
  ]),
  sel("Quanto ao estado físico", [
    "Sólido",
    "Líquido",
    "Gasoso",
    "Semissólido",
    "Particulado",
  ]),
  sel("Quanto ao estado de conservação", [
    "Íntegro",
    "Alterado",
    "Degradado",
    "Contaminado",
    "Carbonizado",
  ]),
  sel("Quanto ao tipo de impacto ambiental", [
    "Poluição hídrica",
    "Poluição atmosférica",
    "Poluição do solo",
    "Desmatamento",
    "Queimada",
    "Mineração irregular",
    "Tráfico de fauna",
    "Degradação de ecossistemas",
  ]),
  sel("Quanto à finalidade pericial", [
    "Caracterização ambiental",
    "Determinação de contaminação",
    "Determinação de origem",
    "Avaliação de dano ambiental",
    "Comparação de amostras",
    "Monitoramento ambiental",
  ]),
  sel("Quanto ao valor probatório", [
    "Alto",
    "Médio",
    "Baixo",
    "Não conclusivo",
  ]),
];

// 105 — ENGENHARIA E MATERIAIS (7 critérios)
const CRITERIOS_105: CatalogacaoField[] = [
  sel("Quanto ao tipo de material", [
    "Metálico",
    "Polimérico",
    "Cerâmico",
    "Vítreo",
    "Compósito",
    "Orgânico (madeira estrutural)",
    "Misto",
  ]),
  sel("Quanto à origem", [
    "Civil",
    "Mecânica",
    "Elétrica",
    "Industrial",
    "Estrutural",
    "Acidental",
    "Ambiental",
  ]),
  sel("Quanto ao estado físico", [
    "Íntegro",
    "Deformado",
    "Fraturado",
    "Corroído",
    "Queimado",
    "Fragmentado",
  ]),
  sel("Quanto ao tipo de falha", [
    "Falha mecânica",
    "Falha estrutural",
    "Falha elétrica",
    "Falha térmica",
    "Falha por fadiga",
    "Falha por sobrecarga",
    "Colapso",
  ]),
  sel("Quanto à finalidade pericial", [
    "Análise de acidentes",
    "Análise de desabamento",
    "Investigação de incêndios estruturais",
    "Análise de falhas de engenharia",
    "Avaliação de integridade estrutural",
    "Determinação de causa de colapso",
  ]),
  sel("Quanto ao local de ocorrência", [
    "Edificações",
    "Vias públicas",
    "Indústrias",
    "Veículos",
    "Sistemas elétricos",
    "Obras civis",
  ]),
  sel("Quanto ao valor probatório", [
    "Alto",
    "Médio",
    "Baixo",
    "Não conclusivo",
  ]),
];

// 106 — DOCUMENTOSCOPIA (8 critérios)
const CRITERIOS_106: CatalogacaoField[] = [
  sel("Quanto ao tipo de documento", [
    "Documento de identificação",
    "Documento financeiro",
    "Documento contratual",
    "Documento manuscrito",
    "Documento impresso",
    "Documento digital",
    "Documento de valor",
  ]),
  sel("Quanto ao suporte documental", [
    "Papel",
    "Papel-moeda",
    "Polímero",
    "Material sintético",
    "Meio eletrônico",
    "Suporte misto",
  ]),
  sel("Quanto à forma de produção", [
    "Manuscrito",
    "Datilografado",
    "Impresso",
    "Fotocopiado",
    "Digital",
    "Híbrido",
  ]),
  sel("Quanto ao estado de conservação", [
    "Íntegro",
    "Rasurado",
    "Alterado",
    "Fragmentado",
    "Queimado",
    "Molhado",
    "Degradado",
  ]),
  sel("Quanto à autenticidade", [
    "Autêntico",
    "Adulterado",
    "Falsificado",
    "Contrafeito",
    "Indeterminado",
  ]),
  sel("Quanto aos elementos de segurança", [
    "Com elementos de segurança",
    "Sem elementos de segurança",
    "Elementos íntegros",
    "Elementos adulterados",
  ]),
  sel("Quanto à finalidade pericial", [
    "Verificação de autenticidade",
    "Identificação de autoria gráfica",
    "Identificação de falsificação",
    "Análise de alterações",
    "Comparação documental",
    "Exame de assinaturas",
  ]),
  sel("Quanto ao valor probatório", [
    "Alto",
    "Médio",
    "Baixo",
    "Não conclusivo",
  ]),
];

// 107 — TECNOLOGIA (7 critérios)
const CRITERIOS_107: CatalogacaoField[] = [
  sel("Quanto ao tipo de tecnologia", [
    "Computacional",
    "Móvel",
    "Rede",
    "Telecomunicação",
    "Multimídia",
    "IoT",
    "Nuvem",
    "Sistema embarcado",
  ]),
  sel("Quanto ao tipo de vestígio", [
    "Hardware",
    "Software",
    "Arquivo digital",
    "Log",
    "Metadado",
    "Comunicação eletrônica",
    "Registro de sistema",
  ]),
  sel("Quanto ao formato dos dados", [
    "Texto",
    "Imagem",
    "Vídeo",
    "Áudio",
    "Banco de dados",
    "Arquivo executável",
    "Arquivo compactado",
  ]),
  sel("Quanto ao estado de acesso", [
    "Ativo",
    "Excluído",
    "Oculto",
    "Criptografado",
    "Corrompido",
    "Recuperado",
  ]),
  sel("Quanto ao suporte", [
    "Disco rígido",
    "SSD",
    "Memória flash",
    "Nuvem",
    "Equipamento eletrônico",
    "Servidor",
  ]),
  sel("Quanto à finalidade pericial", [
    "Recuperação de dados",
    "Análise forense computacional",
    "Identificação de autoria",
    "Análise de fraude",
    "Investigação de invasão",
    "Análise de comunicações",
  ]),
  sel("Quanto ao valor probatório", [
    "Alto",
    "Médio",
    "Baixo",
    "Não conclusivo",
  ]),
];

// 108 — MERCEOLOGIA (14 critérios)
const CRITERIOS_108: CatalogacaoField[] = [
  sel("Quanto à natureza da mercadoria", [
    "Alimentícia",
    "Bebida",
    "Farmacêutica",
    "Cosmética",
    "Higiene pessoal",
    "Química",
    "Combustível",
    "Lubrificante",
    "Agrícola",
    "Veterinária",
    "Industrial",
    "Eletrônica",
    "Têxtil",
    "Automotiva",
    "Construção civil",
    "Financeira",
    "Comercial",
    "Diversa",
  ]),
  sel("Quanto à origem", [
    "Nacional",
    "Importada",
    "Artesanal",
    "Industrializada",
    "Natural",
    "Sintética",
    "Mista",
    "Origem desconhecida",
  ]),
  sel("Quanto à composição", [
    "Orgânica",
    "Inorgânica",
    "Biológica",
    "Química",
    "Mineral",
    "Metálica",
    "Polimérica",
    "Têxtil",
    "Mista",
  ]),
  sel("Quanto ao estado físico", [
    "Sólido",
    "Líquido",
    "Gasoso",
    "Pastoso",
    "Gelatinoso",
    "Pulverulento",
    "Granulado",
    "Semissólido",
  ]),
  sel("Quanto à forma de apresentação", [
    "Granel",
    "Fracionado",
    "Embalado",
    "Envasado",
    "Lacrado",
    "Selado",
    "Reembalado",
    "Manipulado",
  ]),
  sel("Quanto à condição comercial", [
    "Original",
    "Autêntico",
    "Regular",
    "Falsificado",
    "Contrafeito",
    "Adulterado",
    "Contrabandeado",
    "Descaminhado",
    "Sem procedência comprovada",
    "Comercialização proibida",
  ]),
  sel("Quanto à integridade", [
    "Íntegro",
    "Parcialmente danificado",
    "Danificado",
    "Violado",
    "Recondicionado",
    "Alterado",
  ]),
  sel("Quanto ao estado de conservação", [
    "Conservado",
    "Deteriorado",
    "Contaminado",
    "Corrompido",
    "Vencido",
    "Impróprio para consumo",
    "Impróprio para uso",
  ]),
  sel("Quanto à conformidade regulatória", [
    "Conforme",
    "Não conforme",
    "Sem registro",
    "Registro vencido",
    "Registro fraudulento",
    "Registro incompatível",
  ]),
  sel("Quanto ao risco associado", [
    "Sem risco identificado",
    "Baixo risco",
    "Médio risco",
    "Alto risco",
    "Risco sanitário",
    "Risco ambiental",
    "Risco econômico",
    "Risco ao consumidor",
    "Risco ocupacional",
  ]),
  sel("Quanto ao interesse pericial", [
    "Identificação de produto",
    "Verificação de autenticidade",
    "Verificação de origem",
    "Determinação de composição",
    "Pesquisa de adulteração",
    "Pesquisa de falsificação",
    "Avaliação de qualidade",
    "Avaliação de conformidade",
    "Avaliação econômica",
    "Avaliação tributária",
    "Avaliação sanitária",
  ]),
  sel("Quanto ao ilícito associado", [
    "Crime contra as relações de consumo",
    "Crime contra a saúde pública",
    "Crime tributário",
    "Contrabando",
    "Descaminho",
    "Propriedade intelectual",
    "Concorrência desleal",
    "Fraude comercial",
    "Fraude econômica",
    "Crime ambiental",
    "Sem ilícito identificado",
  ]),
  sel("Quanto ao valor probatório", [
    "Alto",
    "Médio",
    "Baixo",
    "Indeterminado",
    "Inconclusivo",
  ]),
  sel("Quanto à rastreabilidade", [
    "Rastreável",
    "Parcialmente rastreável",
    "Não rastreável",
    "Origem identificada",
    "Origem presumida",
    "Origem desconhecida",
  ]),
];

// 109 — ARMAMENTOS: schemas por grupo (cada grupo tem critérios próprios no doc)

const CRITERIOS_109_1: CatalogacaoField[] = [
  sel("Quanto ao tipo de arma", ["Arma curta", "Arma longa"]),
];

const CRITERIOS_109_2: CatalogacaoField[] = [
  sel("Quanto ao tipo de projétil", [
    "Encamisado",
    "Expansivo",
    "Semiencamisado",
    "Ogival",
    "Ponta plana",
    "Ponta macia",
    "Perfurante",
    "Incendiário",
  ]),
];

const CRITERIOS_109_3: CatalogacaoField[] = [
  sel("Quanto à constituição do cartucho", [
    "Completo",
    "De festim",
    "De exercício",
    "De manejo",
  ]),
  sel("Quanto ao estado", ["Íntegro", "Deflagrado"]),
];

const CRITERIOS_109_4: CatalogacaoField[] = [
  sel("Quanto ao estado de utilização", [
    "Não deflagrado",
    "Deflagrado",
    "Parcialmente deflagrado",
    "Indeterminado",
  ]),
  sel("Quanto ao tipo de fabricação", [
    "Latão",
    "Aço",
    "Alumínio",
    "Níquel",
    "Polímero",
    "Material misto",
  ]),
  sel("Quanto ao sistema de ignição", [
    "Fogo central (Centerfire)",
    "Fogo circular/periférico (Rimfire)",
  ]),
  sel("Quanto ao calibre", [
    ".22 LR",
    ".32 ACP",
    ".38 SPL",
    ".380 ACP",
    "9 mm",
    ".40 S&W",
    ".45 ACP",
    "5,56 mm",
    "7,62 mm",
    "Calibre 12",
  ]),
  sel("Quanto à forma construtiva", [
    "Cilíndrico reto",
    "Gargalo (Bottleneck)",
    "Cônico",
    "Com aro (Rimmed)",
    "Sem aro (Rimless)",
    "Semiaro (Semi-rimmed)",
    "Rebatido (Rebated rim)",
  ]),
  sel("Quanto ao estado de conservação", [
    "Íntegro",
    "Deformado",
    "Amassado",
    "Fragmentado",
    "Corroído",
    "Carbonizado",
  ]),
  sel("Quanto às características periciais", [
    "Com marca de percussão",
    "Com marca de extrator",
    "Com marca de ejetor",
    "Com marca de câmara",
    "Com sinais de recarga",
    "Com resíduos de disparo",
    "Com material biológico aderido",
    "Com impressão papiloscópica",
  ]),
  sel("Quanto à origem da recuperação", [
    "Local de crime",
    "Corpo de delito",
    "Veículo",
    "Residência",
    "Via pública",
    "Apreensão policial",
  ]),
  sel("Quanto ao potencial identificador", [
    "Identificável",
    "Parcialmente identificável",
    "Não identificável",
  ]),
  sel("Quanto à quantidade", [
    "Unidade isolada",
    "Conjunto de estojos",
    "Agrupamento de estojos de mesmo calibre",
    "Agrupamento de estojos de calibres distintos",
  ]),
];

const CRITERIOS_109_5: CatalogacaoField[] = [
  sel("Quanto à função no artefato", [
    "Carga explosiva",
    "Sistema de iniciação",
    "Sistema de acionamento",
    "Fonte de energia",
    "Invólucro ou recipiente",
    "Elemento de fragmentação",
    "Componente eletrônico",
    "Componente estrutural",
  ]),
  sel("Quanto à natureza", [
    "Metálico",
    "Polimérico",
    "Cerâmico",
    "Vítreo",
    "Orgânico",
    "Misto",
  ]),
  sel("Quanto ao estado de conservação", [
    "Íntegro",
    "Danificado",
    "Deformado",
    "Fragmentado",
    "Carbonizado",
    "Corroído",
  ]),
  sel("Quanto ao grau de montagem", [
    "Componente isolado",
    "Subconjunto",
    "Artefato parcialmente montado",
    "Artefato completo",
    "Fragmento pós-explosão",
  ]),
  sel("Quanto ao mecanismo de acionamento", [
    "Manual",
    "Mecânico",
    "Elétrico",
    "Eletrônico",
    "Químico",
    "Remoto",
    "Temporizado",
    "Por pressão",
    "Por movimento",
  ]),
  sel("Quanto à fonte de energia", [
    "Bateria",
    "Pilha",
    "Fonte elétrica externa",
    "Capacitor",
    "Energia mecânica",
  ]),
  sel("Quanto ao potencial de fragmentação", [
    "Sem fragmentação secundária",
    "Baixa fragmentação",
    "Média fragmentação",
    "Alta fragmentação",
  ]),
  sel("Quanto à origem pericial", [
    "Coletado em local de crime",
    "Apreendido",
    "Recuperado após explosão",
    "Obtido em busca e apreensão",
    "Encaminhado para exame",
  ]),
  sel("Quanto ao valor probatório", [
    "Identificável",
    "Parcialmente identificável",
    "Não identificável",
    "Comparável",
    "Associável a outros vestígios",
  ]),
];

const CRITERIOS_109_6: CatalogacaoField[] = [
  sel("Quanto à natureza do objeto", [
    "Ferramenta",
    "Utensílio doméstico",
    "Equipamento esportivo",
    "Peça automotiva",
    "Material de construção",
    "Objeto mobiliário",
    "Objeto improvisado",
    "Objeto natural",
  ]),
  sel("Quanto ao material constitutivo", [
    "Metálico",
    "Madeira",
    "Pedra/Rocha",
    "Concreto",
    "Plástico",
    "Borracha",
    "Vidro",
    "Material misto",
  ]),
  sel("Quanto à dimensão", ["Pequeno porte", "Médio porte", "Grande porte"]),
  sel("Quanto à forma predominante", [
    "Cilíndrica",
    "Esférica",
    "Prismática",
    "Irregular",
    "Plana",
    "Alongada",
  ]),
  sel("Quanto ao estado de conservação", [
    "Íntegro",
    "Danificado",
    "Quebrado",
    "Fragmentado",
    "Deformado",
    "Corroído",
  ]),
  sel("Quanto ao grau de rigidez", ["Rígido", "Semirrígido", "Flexível"]),
  sel("Quanto ao modo de emprego potencial", [
    "Impacto direto",
    "Compressão",
    "Esmagamento",
    "Arremesso",
    "Percussão repetitiva",
  ]),
  sel("Quanto à origem do objeto", [
    "Industrializado",
    "Artesanal",
    "Improvisado",
    "Natural",
  ]),
  sel("Quanto às características periciais", [
    "Presença de sangue",
    "Presença de tecidos biológicos",
    "Presença de impressões digitais",
    "Presença de material capilar",
    "Presença de resíduos de tinta",
    "Presença de fibras",
    "Presença de deformações compatíveis com impacto",
  ]),
  sel("Quanto ao potencial lesivo", ["Baixo", "Médio", "Alto"]),
  sel("Quanto ao valor probatório", [
    "Identificável",
    "Associável ao evento",
    "Comparável com lesões",
    "Comparável com danos materiais",
    "Não identificável",
  ]),
];

// 201 — PSIQUIATRIA FORENSE (11 critérios, só títulos sem valores)
const CRITERIOS_201: CatalogacaoField[] = [
  txt("Quanto ao tipo de vestígio"),
  txt("Quanto à natureza do vestígio"),
  txt("Quanto à origem institucional"),
  txt("Quanto ao transtorno investigado"),
  txt("Quanto ao estado mental avaliado"),
  txt("Quanto ao período temporal analisado"),
  txt("Quanto à confiabilidade da informação"),
  txt("Quanto ao contexto jurídico"),
  txt("Quanto ao resultado pericial"),
  txt("Quanto ao valor probatório"),
];

// 202 — PSICOLOGIA FORENSE (11 critérios, só títulos)
const CRITERIOS_202: CatalogacaoField[] = [
  txt("Quanto ao tipo de instrumento psicológico"),
  txt("Quanto à natureza do vestígio"),
  txt("Quanto à forma de expressão"),
  txt("Quanto ao grau de estruturação"),
  txt("Quanto à origem do vestígio"),
  txt("Quanto ao suporte do registro"),
  txt("Quanto à finalidade psicológica pericial"),
  txt("Quanto ao contexto jurídico"),
  txt("Quanto ao nível de subjetividade"),
  txt("Quanto ao valor probatório"),
  txt("Quanto ao tempo de referência psicológica"),
];

// 203 — ANTROPOLOGIA E ARQUEOLOGIA FORENSE (11 critérios, só títulos)
const CRITERIOS_203: CatalogacaoField[] = [
  txt("Quanto à natureza do vestígio"),
  txt("Quanto ao estado de preservação"),
  txt("Quanto ao contexto de deposição"),
  txt("Quanto à associação com vestígios"),
  txt("Quanto à origem temporal"),
  txt("Quanto ao tipo de material"),
  txt("Quanto ao grau de contextualização arqueológica"),
  txt("Quanto à finalidade pericial"),
  txt("Quanto ao valor informacional pericial"),
  txt("Quanto ao nível de associação contextual"),
  txt("Quanto à condição de intervenção humana"),
];

// 204 — TANATOLOGIA FORENSE (13 critérios, só títulos)
const CRITERIOS_204: CatalogacaoField[] = [
  txt("Quanto à natureza do vestígio"),
  txt("Quanto ao estado do corpo"),
  txt("Quanto ao fenômeno cadavérico"),
  txt("Quanto ao intervalo pós-morte"),
  txt("Quanto ao mecanismo de morte (indiciário)"),
  txt("Quanto ao contexto de achado"),
  txt("Quanto ao tipo de vestígio associado"),
  txt("Quanto à integridade anatômica"),
  txt("Quanto à conservação do material biológico"),
  txt("Quanto à causa presumida de morte"),
  txt("Quanto ao ambiente de decomposição"),
  txt("Quanto ao valor pericial"),
  txt("Quanto à finalidade pericial"),
];

// 205 — SEXOLOGIA FORENSE (13 critérios, só títulos)
const CRITERIOS_205: CatalogacaoField[] = [
  txt("Quanto à natureza do vestígio"),
  txt("Quanto ao tipo de vestígio sexual"),
  txt("Quanto à localização anatômica"),
  txt("Quanto ao tipo de material biológico"),
  txt("Quanto ao mecanismo de produção do vestígio"),
  txt("Quanto ao contexto pericial"),
  txt("Quanto ao estado das lesões"),
  txt("Quanto ao tipo de lesão"),
  txt("Quanto ao tipo de vestuário associado"),
  txt("Quanto ao valor pericial"),
  txt("Quanto ao grau de compatibilidade com violência sexual"),
  txt("Quanto ao tempo de ocorrência estimado"),
  txt("Quanto à finalidade pericial"),
];

// 206/207 — o documento fornece apenas os títulos, sem opções.
const CRITERIOS_206: CatalogacaoField[] = [
  txt("Quanto ao instrumento causador"),
  txt("Quanto ao mecanismo de produção"),
  txt("Quanto à região anatômica"),
  txt("Quanto à gravidade"),
];

const CRITERIOS_207: CatalogacaoField[] = [
  txt("Quanto ao elemento dentário"),
  txt("Quanto ao método de identificação"),
  txt("Quanto ao estado de conservação"),
  txt("Quanto à finalidade pericial"),
];

// ─── MAPA DE CRITÉRIOS POR CLASSCODE ──────────────────────────────────────

type CriteriaMap = {
  perClass1: Record<string, CatalogacaoField[]>;
  perGroup: Record<string, CatalogacaoField[]>;
};

const CRITERIA_MAP: CriteriaMap = {
  perClass1: {
    "001": CRITERIOS_001,
    "101": CRITERIOS_101,
    "102": CRITERIOS_102,
    "103": CRITERIOS_103,
    "104": CRITERIOS_104,
    "105": CRITERIOS_105,
    "106": CRITERIOS_106,
    "107": CRITERIOS_107,
    "108": CRITERIOS_108,
    "201": CRITERIOS_201,
    "202": CRITERIOS_202,
    "203": CRITERIOS_203,
    "204": CRITERIOS_204,
    "205": CRITERIOS_205,
    "206": CRITERIOS_206,
    "207": CRITERIOS_207,
  },
  perGroup: {
    "109.1": CRITERIOS_109_1,
    "109.2": CRITERIOS_109_2,
    "109.3": CRITERIOS_109_3,
    "109.4": CRITERIOS_109_4,
    "109.5": CRITERIOS_109_5,
    "109.6": CRITERIOS_109_6,
  },
};

// ─── SCHEMAS ──────────────────────────────────────────────────────────────

const getCriteria = (
  classCode: string,
  groupCode?: string,
): CatalogacaoField[] => {
  if (groupCode && CRITERIA_MAP.perGroup[groupCode]) {
    return CRITERIA_MAP.perGroup[groupCode];
  }
  return CRITERIA_MAP.perClass1[classCode] ?? [];
};

export type CatalogacaoSchemaDefinition = {
  id: string;
  classCode: string;
  classLabel: string;
  subclassCode?: string;
  subclassLabel: string;
  typeLabel: string;
};

// Schema base por classe 1 (17 classes do doc)
const classDefs: CatalogacaoSchemaDefinition[] = [
  {
    id: "001-identificacao-humana",
    classCode: "001",
    classLabel: "Identificação Humana",
    subclassLabel: "Identificação Humana",
    typeLabel: "Geral",
  },
  {
    id: "101-biologia",
    classCode: "101",
    classLabel: "Biologia",
    subclassLabel: "Biologia",
    typeLabel: "Geral",
  },
  {
    id: "102-quimica",
    classCode: "102",
    classLabel: "Química",
    subclassLabel: "Química",
    typeLabel: "Geral",
  },
  {
    id: "103-toxicologia",
    classCode: "103",
    classLabel: "Toxicologia",
    subclassLabel: "Toxicologia",
    typeLabel: "Geral",
  },
  {
    id: "104-meio-ambiente",
    classCode: "104",
    classLabel: "Meio Ambiente",
    subclassLabel: "Meio Ambiente",
    typeLabel: "Geral",
  },
  {
    id: "105-engenharia-e-materiais",
    classCode: "105",
    classLabel: "Engenharia e Materiais",
    subclassLabel: "Engenharia e Materiais",
    typeLabel: "Geral",
  },
  {
    id: "106-documentoscopia",
    classCode: "106",
    classLabel: "Documentoscopia",
    subclassLabel: "Documentoscopia",
    typeLabel: "Geral",
  },
  {
    id: "107-tecnologia",
    classCode: "107",
    classLabel: "Tecnologia",
    subclassLabel: "Tecnologia",
    typeLabel: "Geral",
  },
  {
    id: "108-merceologia",
    classCode: "108",
    classLabel: "Merceologia",
    subclassLabel: "Merceologia",
    typeLabel: "Geral",
  },
  {
    id: "109-armamentos-e-artefatos",
    classCode: "109",
    classLabel: "Armamentos e Artefatos",
    subclassLabel: "Armamentos e Artefatos",
    typeLabel: "Geral",
  },
  {
    id: "201-psiquiatria-forense",
    classCode: "201",
    classLabel: "Psiquiatria Forense",
    subclassLabel: "Psiquiatria Forense",
    typeLabel: "Geral",
  },
  {
    id: "202-psicologia-forense",
    classCode: "202",
    classLabel: "Psicologia Forense",
    subclassLabel: "Psicologia Forense",
    typeLabel: "Geral",
  },
  {
    id: "203-antropologia-e-arqueologia-forense",
    classCode: "203",
    classLabel: "Antropologia e Arqueologia Forense",
    subclassLabel: "Antropologia e Arqueologia Forense",
    typeLabel: "Geral",
  },
  {
    id: "204-tanatologia-forense",
    classCode: "204",
    classLabel: "Tanatologia Forense",
    subclassLabel: "Tanatologia Forense",
    typeLabel: "Geral",
  },
  {
    id: "205-sexologia-forense",
    classCode: "205",
    classLabel: "Sexologia Forense",
    subclassLabel: "Sexologia Forense",
    typeLabel: "Geral",
  },
  {
    id: "206-traumatologia-forense",
    classCode: "206",
    classLabel: "Traumatologia Forense",
    subclassLabel: "Traumatologia Forense",
    typeLabel: "Geral",
  },
  {
    id: "207-odontologia-legal",
    classCode: "207",
    classLabel: "Odontologia Legal",
    subclassLabel: "Odontologia Legal",
    typeLabel: "Geral",
  },
];

// Schema por grupo de 109 (critérios específicos por linha do doc)
const groupDefs: CatalogacaoSchemaDefinition[] = [
  {
    id: "109.1-armas",
    classCode: "109",
    classLabel: "Armamentos e Artefatos",
    subclassCode: "109.1",
    subclassLabel: "Armas",
    typeLabel: "Armas",
  },
  {
    id: "109.2-projeteis",
    classCode: "109",
    classLabel: "Armamentos e Artefatos",
    subclassCode: "109.2",
    subclassLabel: "Projéteis",
    typeLabel: "Projéteis",
  },
  {
    id: "109.3-cartucho",
    classCode: "109",
    classLabel: "Armamentos e Artefatos",
    subclassCode: "109.3",
    subclassLabel: "Cartucho",
    typeLabel: "Cartucho",
  },
  {
    id: "109.4-estojos",
    classCode: "109",
    classLabel: "Armamentos e Artefatos",
    subclassCode: "109.4",
    subclassLabel: "Munições - Estojos",
    typeLabel: "Munições - Estojos",
  },
  {
    id: "109.5-artefatos-explosivos",
    classCode: "109",
    classLabel: "Armamentos e Artefatos",
    subclassCode: "109.5",
    subclassLabel: "Artefatos Explosivos",
    typeLabel: "Artefatos Explosivos",
  },
  {
    id: "109.6-instrumentos-contundentes",
    classCode: "109",
    classLabel: "Armamentos e Artefatos",
    subclassCode: "109.6",
    subclassLabel: "Instrumentos Contundentes",
    typeLabel: "Instrumentos Contundentes",
  },
];

const buildSchema = (def: CatalogacaoSchemaDefinition): CatalogacaoSchema => ({
  ...def,
  version: SCHEMA_VERSION,
  categories: {
    identificacao: IDENTIFICACAO_FIELDS,
    tecnicas: TECNICAS_FIELDS,
    periciais: getCriteria(def.classCode, def.subclassCode),
    controle: CONTROLE_FIELDS,
  },
});

export const catalogacaoSchemas: CatalogacaoSchema[] = [
  ...classDefs.map(buildSchema),
  ...groupDefs.map(buildSchema),
];

// ─── HELPERS ──────────────────────────────────────────────────────────────

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

  // 1) Se normalizedSubclass foi fornecido, procura schema de grupo específico
  if (normalizedSubclass) {
    const byGroup = catalogacaoSchemas.find((schema) => {
      if (schema.classCode !== classeCatalogacao) return false;
      if (!schema.subclassCode) return false;
      return (
        normalize(schema.subclassCode) === normalizedSubclass ||
        normalize(schema.subclassLabel) === normalizedSubclass
      );
    });
    if (byGroup) return byGroup;
  }

  // 2) Se normalizedType foi fornecido, procura schema por classCode + typeLabel
  if (normalizedType) {
    const byType = catalogacaoSchemas.find((schema) => {
      if (schema.classCode !== classeCatalogacao) return false;
      return normalize(schema.typeLabel) === normalizedType;
    });
    if (byType) return byType;
  }

  // 3) Fallback: match só por classCode (schema base)
  return catalogacaoSchemas.find(
    (schema) => schema.classCode === classeCatalogacao && !schema.subclassCode,
  );
};

export const getCatalogacaoOptionLabel = (
  schema: CatalogacaoSchema | undefined,
): string => {
  if (!schema) return "";
  if (schema.subclassCode) {
    return `${schema.subclassLabel}`;
  }
  return `${schema.classLabel} - ${schema.typeLabel}`;
};

// ─── SERIALIZAÇÃO / DESERIALIZAÇÃO ────────────────────────────────────────

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
