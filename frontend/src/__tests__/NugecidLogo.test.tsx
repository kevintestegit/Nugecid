import { render } from "@testing-library/react";

import { NugecidLogo } from "@/components/ui/NugecidLogo";

describe("NugecidLogo", () => {
  it("gera ids de pattern diferentes para cada instancia", () => {
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
});
