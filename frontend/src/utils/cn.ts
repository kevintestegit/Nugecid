/**
 * Função utilitária para combinar classes CSS condicionalmente
 * Similar ao clsx/classnames
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default cn;
