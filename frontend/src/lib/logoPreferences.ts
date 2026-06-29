export type NugecidLogoTheme =
  | "brasil"
  | "easter"
  | "mothersDay"
  | "saoJoao"
  | "worldCup2026"
  | "standard";

export type NugecidLogoPreference = "auto" | NugecidLogoTheme;

export const NUGECID_LOGO_PREFERENCE_KEY = "nugecid-logo-preference";
export const NUGECID_LOGO_PREFERENCE_CHANGE_EVENT =
  "nugecid-logo-preference-change";

export const DEFAULT_NUGECID_LOGO_PREFERENCE: NugecidLogoPreference = "brasil";

const isBrowser = () => typeof window !== "undefined";

const calcularPascoa = (ano: number): Date => {
  const f = Math.floor;
  const G = ano % 19;
  const C = f(ano / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I =
    H - f(H / 28) * (1 - f(H / 28) * f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (ano + f(ano / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const mes = 3 + f((L + 40) / 44);
  const dia = L + 28 - 31 * f(mes / 4);
  return new Date(ano, mes - 1, dia);
};

export const isNugecidLogoPreference = (
  value: string | null,
): value is NugecidLogoPreference => {
  return (
    value === "auto" ||
    value === "brasil" ||
    value === "easter" ||
    value === "mothersDay" ||
    value === "saoJoao" ||
    value === "worldCup2026" ||
    value === "standard"
  );
};

export const readNugecidLogoPreference = (): NugecidLogoPreference => {
  if (!isBrowser()) {
    return DEFAULT_NUGECID_LOGO_PREFERENCE;
  }

  const stored = window.localStorage.getItem(NUGECID_LOGO_PREFERENCE_KEY);
  return isNugecidLogoPreference(stored)
    ? stored
    : DEFAULT_NUGECID_LOGO_PREFERENCE;
};

export const writeNugecidLogoPreference = (
  preference: NugecidLogoPreference,
): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(NUGECID_LOGO_PREFERENCE_KEY, preference);
  window.dispatchEvent(
    new CustomEvent(NUGECID_LOGO_PREFERENCE_CHANGE_EVENT, {
      detail: { preference },
    }),
  );
};

const resolveAutoTheme = (date: Date): NugecidLogoTheme => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 6) {
    return day % 2 === 0 ? "worldCup2026" : "saoJoao";
  }

  if (year === 2026 && (month === 5 || month === 7)) {
    return "worldCup2026";
  }

  const pascoa = calcularPascoa(year);
  const currentTime = new Date(year, date.getMonth(), day).getTime();
  const diffDays = (currentTime - pascoa.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays >= -15 && diffDays <= 3) {
    return "easter";
  }

  if ((month === 4 && day >= 25) || (month === 5 && day <= 15)) {
    return "mothersDay";
  }

  return "standard";
};

export const resolveNugecidLogoTheme = (
  date: Date,
  preference: NugecidLogoPreference,
): NugecidLogoTheme => {
  if (preference !== "auto") {
    return preference;
  }

  return resolveAutoTheme(date);
};
