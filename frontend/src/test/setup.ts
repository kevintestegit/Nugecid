import "@testing-library/jest-dom/vitest";

const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);

const shouldSuppress = (args: unknown[]): boolean => {
  const text = args.map((item) => String(item ?? "")).join(" ");
  return (
    text.includes("React Router Future Flag Warning") ||
    text.includes("Erro ao carregar avisos: Error: fail")
  );
};

console.error = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalError(...args);
};

console.warn = (...args: unknown[]) => {
  if (shouldSuppress(args)) return;
  originalWarn(...args);
};
