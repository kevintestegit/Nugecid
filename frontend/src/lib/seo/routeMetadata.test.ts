import { describe, expect, it } from "vitest";

import { getRouteMetadata } from "./routeMetadata";

describe("getRouteMetadata", () => {
  it("retorna metadados do dashboard", () => {
    expect(getRouteMetadata("/")).toMatchObject({
      title: "Dashboard | SGC-ITEP",
      canonicalPath: "/",
    });
  });

  it("resolve rotas dinâmicas de desarquivamento", () => {
    expect(getRouteMetadata("/desarquivamentos/42")).toMatchObject({
      title: "Detalhe do Desarquivamento | SGC-ITEP",
      canonicalPath: "/desarquivamentos/:id",
    });
  });

  it("retorna fallback para rotas desconhecidas", () => {
    expect(getRouteMetadata("/rota-inexistente")).toMatchObject({
      title: "SGC-ITEP",
      canonicalPath: "/",
    });
  });
});
