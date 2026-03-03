// Opções de Instituto para desarquivamentos
export const INSTITUTOS = [
  { value: "IC", label: "Instituto de Criminalística (IC)" },
  { value: "II", label: "Instituto de Identificação (II)" },
  { value: "IML", label: "Instituto de Medicina Legal (IML)" },
] as const;

export type InstitutoValue = (typeof INSTITUTOS)[number]["value"];

// Função helper para obter o label do instituto pelo valor
export const getInstitutoLabel = (value: string | undefined | null): string => {
  if (!value) return "-";
  const instituto = INSTITUTOS.find((i) => i.value === value);
  return instituto?.label || value;
};
