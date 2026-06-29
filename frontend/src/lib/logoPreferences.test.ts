import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readNugecidLogoPreference,
  resolveNugecidLogoTheme,
  writeNugecidLogoPreference,
} from "./logoPreferences";

describe("logoPreferences", () => {
  it("usa o tema Brasil quando o usuario ainda nao escolheu uma preferencia", () => {
    expect(readNugecidLogoPreference()).toBe("brasil");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("alterna Sao Joao e Copa em junho quando o modo e automatico", () => {
    expect(
      resolveNugecidLogoTheme(new Date("2026-06-03T12:00:00-03:00"), "auto"),
    ).toBe("saoJoao");

    expect(
      resolveNugecidLogoTheme(new Date("2026-06-04T12:00:00-03:00"), "auto"),
    ).toBe("worldCup2026");
  });

  it("respeita a preferencia forcada", () => {
    expect(
      resolveNugecidLogoTheme(
        new Date("2026-06-03T12:00:00-03:00"),
        "standard",
      ),
    ).toBe("standard");
  });

  it("salva e le a preferencia no localStorage", () => {
    writeNugecidLogoPreference("saoJoao");

    expect(window.localStorage.getItem("nugecid-logo-preference")).toBe(
      "saoJoao",
    );
    expect(readNugecidLogoPreference()).toBe("saoJoao");
  });
});
