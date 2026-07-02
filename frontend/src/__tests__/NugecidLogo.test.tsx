import { render } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { NugecidLogo } from "@/components/ui/NugecidLogo";

const parseTranslateYAndScale = (transform: string): [number, number] => {
  const match = transform.match(
    /translate\([^,]+,\s*([\d.-]+)\) scale\(([\d.-]+)\)/,
  );

  if (!match) {
    throw new Error(`Transform invalido: ${transform}`);
  }

  return [Number(match[1]), Number(match[2])];
};

describe("NugecidLogo", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renderiza o tema Brasil por padrao quando nao ha preferencia salva", () => {
    const { container } = render(<NugecidLogo />);

    const image = container.querySelector("img");

    expect(image).toHaveAttribute("src", "/nugecid_logo_animada_brasil.webp");
    expect(image).toHaveAttribute("alt", "NUGECID");
  });

  it("gera ids de pattern diferentes para cada instancia", () => {
    window.localStorage.setItem("nugecid-logo-preference", "standard");

    const { container } = render(
      <div>
        <NugecidLogo />
        <NugecidLogo />
      </div>,
    );

    const patterns = Array.from(container.querySelectorAll("pattern"));
    const patternIds = patterns.map((pattern) => pattern.getAttribute("id"));
    const fillTargets = Array.from(
      container.querySelectorAll('text[fill^="url(#"]'),
    ).map((node) => node.getAttribute("fill"));

    expect(patterns).toHaveLength(2);
    expect(new Set(patternIds).size).toBe(2);
    expect(fillTargets).toHaveLength(2);
    fillTargets.forEach((fillTarget) => {
      expect(fillTarget).toMatch(/^url\(#.+\)$/);
    });
  });

  it("renderiza a versao compacta quando showText for falso", () => {
    const { container } = render(<NugecidLogo showText={false} />);

    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("viewBox", "0 0 35 50");
    expect(container.textContent).toContain("N");
  });

  it("alterna Sao Joao e Copa em junho no modo automatico", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00-03:00"));
    window.localStorage.setItem("nugecid-logo-preference", "auto");

    const { container, rerender } = render(<NugecidLogo />);

    const svg = container.querySelector("svg");
    const firstLetter = container.querySelector("text tspan");

    expect(svg).toHaveAttribute("data-theme", "saoJoao");
    expect(firstLetter).toHaveAttribute("fill", "#EA580C");

    window.localStorage.setItem("nugecid-logo-preference", "worldCup2026");
    rerender(<NugecidLogo key="forced-world-cup" />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "data-theme",
      "worldCup2026",
    );
  });

  it("renderiza os elementos visuais da copa com animacao", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T12:00:00-03:00"));
    window.localStorage.setItem("nugecid-logo-preference", "worldCup2026");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const { container } = render(<NugecidLogo />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "data-theme",
      "worldCup2026",
    );
    expect(container.querySelector("canvas")).toBeTruthy();
    expect(container.querySelector('path[fill="#0033a0"]')).toBeTruthy();
    expect(container.querySelector('path[fill="#10B981"]')).toBeTruthy();
  });

  it("mantem as estrelas da copa acima do texto da logo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T12:00:00-03:00"));
    window.localStorage.setItem("nugecid-logo-preference", "worldCup2026");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const { container } = render(<NugecidLogo />);

    const starGroups = Array.from(
      container.querySelectorAll('svg g[fill="#eab308"] > g'),
    );

    expect(starGroups).toHaveLength(5);

    const lowestStarPoint = Math.max(
      ...starGroups.map((starGroup) => {
        const transform = starGroup.getAttribute("transform") ?? "";
        const [translateY, scale] = parseTranslateYAndScale(transform);

        return translateY + 6 * scale;
      }),
    );

    expect(lowestStarPoint).toBeLessThanOrEqual(16);
  });

  it("limpa o canvas da animacao em coordenadas reais antes de desenhar", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T12:00:00-03:00"));
    window.localStorage.setItem("nugecid-logo-preference", "worldCup2026");

    const originalDevicePixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });

    const operations: string[] = [];
    const context: Partial<CanvasRenderingContext2D> = {
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(() => operations.push("save")),
      restore: vi.fn(() => operations.push("restore")),
      translate: vi.fn(),
      scale: vi.fn((x: number, y: number) => {
        operations.push(`scale:${x}:${y}`);
      }),
      rotate: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(
        (x: number, y: number, width: number, height: number) => {
          operations.push(`clearRect:${x}:${y}:${width}:${height}`);
        },
      ),
      setTransform: (
        a?: number | DOMMatrix2DInit,
        b?: number,
        c?: number,
        d?: number,
        e?: number,
        f?: number,
      ) => {
        if (typeof a === "number") {
          operations.push(`setTransform:${a}:${b}:${c}:${d}:${e}:${f}`);
        }
      },
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      lineCap: "butt" as CanvasLineCap,
      lineJoin: "miter" as CanvasLineJoin,
      globalAlpha: 1,
    };

    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect",
    ).mockReturnValue({
      bottom: 82,
      height: 82,
      left: 0,
      right: 82,
      top: 0,
      width: 82,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );

    render(<NugecidLogo />);

    const clearIndex = operations.findIndex((operation) =>
      operation.startsWith("clearRect:"),
    );

    expect(clearIndex).toBeGreaterThan(0);
    expect(operations[clearIndex - 1]).toBe("setTransform:1:0:0:1:0:0");
    expect(operations[clearIndex]).toBe("clearRect:0:0:164:164");

    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: originalDevicePixelRatio,
    });
  });

  it("oculta a animacao quando showAnimation for falso", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00-03:00"));

    const { container } = render(<NugecidLogo showAnimation={false} />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
