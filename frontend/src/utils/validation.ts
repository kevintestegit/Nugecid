/**
 * Utilitários de validação para IDs e outros dados
 */

/**
 * Verifica se um valor é um ID numérico válido
 * @param id - O valor a ser validado
 * @returns true se for um número válido, false caso contrário
 */
export const isValidNumericId = (
  id: string | number | null | undefined,
): boolean => {
  if (id === null || id === undefined || id === "") {
    return false;
  }

  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  return !isNaN(numericId) && numericId > 0 && Number.isInteger(numericId);
};

/**
 * Verifica se um valor é um UUID válido
 * @param id - O valor a ser validado
 * @returns true se for um UUID válido, false caso contrário
 */
export const isValidUUID = (id: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Converte um ID para número, retornando null se inválido
 * @param id - O ID a ser convertido
 * @returns O número convertido ou null se inválido
 */
export const parseNumericId = (
  id: string | number | null | undefined,
): number | null => {
  if (!isValidNumericId(id)) {
    return null;
  }

  return typeof id === "string" ? parseInt(id, 10) : (id as number);
};

/**
 * Valida se um ID é apropriado para endpoints de usuários (deve ser numérico)
 * @param id - O ID a ser validado
 * @returns true se for válido para usuários, false caso contrário
 */
export const isValidUserIdFormat = (
  id: string | number | null | undefined,
): boolean => {
  return isValidNumericId(id);
};

/**
 * Valida se um ID é apropriado para endpoints de desarquivamentos (deve ser numérico)
 * @param id - O ID a ser validado
 * @returns true se for válido para desarquivamentos, false caso contrário
 */
export const isValidDesarquivamentoIdFormat = (
  id: string | number | null | undefined,
): boolean => {
  return isValidNumericId(id);
};
