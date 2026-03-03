import { describe, expect, it } from "vitest";

import { getErrorMessage } from "@/components/ui/ErrorMessage";

describe("getErrorMessage", () => {
  it("classifica timeout como tempo limite excedido", () => {
    const errorInfo = getErrorMessage(
      Object.assign(new Error("timeout of 600000ms exceeded"), {
        code: "ECONNABORTED",
      }),
    );

    expect(errorInfo.title).toBe("Tempo Limite Excedido");
    expect(errorInfo.message).toContain("demorou mais");
  });

  it("mantem erros genéricos como erro comum", () => {
    const errorInfo = getErrorMessage(new Error("Falha ao criar backup"));

    expect(errorInfo.title).toBe("Erro");
    expect(errorInfo.message).toBe("Falha ao criar backup");
  });
});
