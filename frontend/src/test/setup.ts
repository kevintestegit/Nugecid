import "@testing-library/jest-dom/vitest";

const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);
const originalGetContext = HTMLCanvasElement.prototype.getContext;

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  writable: true,
  value: function getContext(
    contextId: string,
    options?: CanvasRenderingContext2DSettings,
  ) {
    if (contextId !== "2d") {
      return originalGetContext.call(this, contextId, options);
    }

    return {
      drawImage: () => undefined,
      getImageData: () => ({
        data: new Uint8ClampedArray(0),
      }),
      putImageData: () => undefined,
    } as unknown as CanvasRenderingContext2D;
  },
});

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  writable: true,
  value: function play() {
    return Promise.resolve();
  },
});

Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
  configurable: true,
  value: () => false,
});

Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
  configurable: true,
  value: () => undefined,
});

Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
  configurable: true,
  value: () => undefined,
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value: () => undefined,
});

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
