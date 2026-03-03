export type FeriadoTipo =
  | "nacional"
  | "estadual"
  | "municipal"
  | "ponto_facultativo";

export interface Feriado {
  nome: string;
  tipo: FeriadoTipo;
  data: string; // MM-DD
  abrangencia: string;
}

/**
 * Calcula a data da Páscoa para um dado ano usando o algoritmo de Meeus/Jones/Butcher.
 * Retorna um Date em horário local.
 */
export function calcularPascoa(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=março, 4=abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/** Adiciona (ou subtrai) dias a uma Date, retornando uma nova Date. */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Formata Date como "MM-DD". */
function toMMDD(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

/**
 * Retorna os feriados móveis para um dado ano.
 * Todos dependem da data da Páscoa:
 *   - Carnaval (segunda): Páscoa − 48
 *   - Carnaval (terça): Páscoa − 47
 *   - Sexta-feira Santa: Páscoa − 2
 *   - Corpus Christi: Páscoa + 60
 */
export function feriadosMoveis(year: number): Feriado[] {
  const pascoa = calcularPascoa(year);

  return [
    {
      nome: "Carnaval (segunda)",
      tipo: "ponto_facultativo",
      data: toMMDD(addDays(pascoa, -48)),
      abrangencia: "Facultativo em órgãos públicos",
    },
    {
      nome: "Carnaval (terça)",
      tipo: "ponto_facultativo",
      data: toMMDD(addDays(pascoa, -47)),
      abrangencia: "Facultativo em órgãos públicos",
    },
    {
      nome: "Sexta-feira Santa",
      tipo: "nacional",
      data: toMMDD(addDays(pascoa, -2)),
      abrangencia: "Brasil",
    },
    {
      nome: "Corpus Christi",
      tipo: "ponto_facultativo",
      data: toMMDD(addDays(pascoa, 60)),
      abrangencia: "Facultativo em órgãos públicos",
    },
  ];
}

// ---------------------------------------------------------------------------
// Feriados fixos
// ---------------------------------------------------------------------------

export const FERIADOS_NACIONAIS_FIXOS: Feriado[] = [
  {
    nome: "Confraternização Universal",
    tipo: "nacional",
    data: "01-01",
    abrangencia: "Brasil",
  },
  {
    nome: "Tiradentes",
    tipo: "nacional",
    data: "04-21",
    abrangencia: "Brasil",
  },
  {
    nome: "Dia do Trabalho",
    tipo: "nacional",
    data: "05-01",
    abrangencia: "Brasil",
  },
  {
    nome: "Independência do Brasil",
    tipo: "nacional",
    data: "09-07",
    abrangencia: "Brasil",
  },
  {
    nome: "Nossa Senhora Aparecida",
    tipo: "nacional",
    data: "10-12",
    abrangencia: "Brasil",
  },
  { nome: "Finados", tipo: "nacional", data: "11-02", abrangencia: "Brasil" },
  {
    nome: "Proclamação da República",
    tipo: "nacional",
    data: "11-15",
    abrangencia: "Brasil",
  },
  { nome: "Natal", tipo: "nacional", data: "12-25", abrangencia: "Brasil" },
];

export const FERIADOS_ESTADUAIS_RN: Feriado[] = [
  {
    nome: "Mártires de Cunhaú e Uruaçu",
    tipo: "estadual",
    data: "10-03",
    abrangencia: "Rio Grande do Norte",
  },
];

export const FERIADOS_MUNICIPAIS_NATAL_RN: Feriado[] = [
  {
    nome: "Santos Reis",
    tipo: "municipal",
    data: "01-06",
    abrangencia: "Natal/RN",
  },
  {
    nome: "Nossa Senhora da Apresentação",
    tipo: "municipal",
    data: "11-21",
    abrangencia: "Natal/RN",
  },
];

/**
 * Retorna todos os feriados (fixos + móveis) para um dado ano.
 * Os feriados móveis são recalculados para cada ano.
 */
export function todosFeriados(year: number): readonly Feriado[] {
  return [
    ...FERIADOS_NACIONAIS_FIXOS,
    ...feriadosMoveis(year),
    ...FERIADOS_ESTADUAIS_RN,
    ...FERIADOS_MUNICIPAIS_NATAL_RN,
  ];
}

/**
 * @deprecated Use `todosFeriados(year)` em vez desta constante.
 * Mantida apenas por compatibilidade — inclui somente feriados fixos.
 */
export const TODOS_FERIADOS: readonly Feriado[] = [
  ...FERIADOS_NACIONAIS_FIXOS,
  ...FERIADOS_ESTADUAIS_RN,
  ...FERIADOS_MUNICIPAIS_NATAL_RN,
];

export const FERIADOS_CORES: Record<FeriadoTipo, string> = {
  nacional: "#22c55e",
  estadual: "#f59e0b",
  municipal: "#8b5cf6",
  ponto_facultativo: "#0ea5e9",
};

export const FERIADOS_TIPO_LABELS: Record<FeriadoTipo, string> = {
  nacional: "Nacional",
  estadual: "Estadual",
  municipal: "Municipal",
  ponto_facultativo: "Ponto facultativo",
};
