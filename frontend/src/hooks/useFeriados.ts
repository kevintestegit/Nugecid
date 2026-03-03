import { useMemo, useCallback } from "react";
import { todosFeriados, Feriado } from "../constants/feriadosBR";

export interface FeriadoInfo {
  nome: string;
  tipo: Feriado["tipo"];
  abrangencia: string;
  data: string;
}

type FeriadoHashMap = ReadonlyMap<string, readonly FeriadoInfo[]>;

/**
 * Hook otimizado para gerenciar feriados brasileiros.
 *
 * Otimizações implementadas:
 * 1. HashMap indexado por data (YYYY-MM-DD) para busca O(1)
 * 2. useMemo para evitar reprocessamento a cada render
 * 3. Dados pré-compilados como constantes estáticas (zero runtime cost)
 * 4. Estrutura readonly para permitir tree-shaking e evitar mutações
 * 5. useCallback para referenciar estável das funções
 */
export const useFeriados = (
  year: number,
): {
  feriadosMap: FeriadoHashMap;
  isFeriado: (date: Date) => boolean;
  getFeriadosForDay: (day: number, month: number) => readonly FeriadoInfo[];
} => {
  const feriadosMap = useMemo(() => {
    const map = new Map<string, FeriadoInfo[]>();

    const allFeriados = todosFeriados(year);

    for (const feriado of allFeriados) {
      const dateKey = `${year}-${feriado.data}`;
      const existing = map.get(dateKey) ?? [];

      existing.push({
        nome: feriado.nome,
        tipo: feriado.tipo,
        abrangencia: feriado.abrangencia,
        data: feriado.data,
      });

      map.set(dateKey, existing);
    }

    return map as FeriadoHashMap;
  }, [year]);

  const isFeriado = useCallback(
    (date: Date): boolean => {
      const y = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateKey = `${y}-${month}-${day}`;

      return feriadosMap.has(dateKey);
    },
    [feriadosMap],
  );

  const getFeriadosForDay = useCallback(
    (day: number, month: number): readonly FeriadoInfo[] => {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      return feriadosMap.get(dateKey) ?? [];
    },
    [feriadosMap, year],
  );

  return {
    feriadosMap,
    isFeriado,
    getFeriadosForDay,
  };
};
