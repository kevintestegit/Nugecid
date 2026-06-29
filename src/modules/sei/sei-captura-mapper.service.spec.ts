import { SeiCapturaMapperService } from "./sei-captura-mapper.service";
import { SeiCapturaStatus } from "./sei-captura.types";

describe("SeiCapturaMapperService", () => {
  const service = new SeiCapturaMapperService();

  it("mapeia aliases comuns de relatorio do SEI", () => {
    const registro = service.mapRow({
      "Processo SEI": "0391002.002025/2026-46",
      "Data de Entrada": "14/04/2026",
      Interessado: "Delegacia Teste",
      Assunto: "Pedido de desarquivamento PCI 123/2026",
      Unidade: "PCI-NUGECID",
    });

    expect(registro.numeroProcessoSei).toBe("0391002.002025/2026-46");
    expect(registro.numeroPci).toBe("PCI 123/2026");
    expect(registro.dataEntradaSei?.toISOString()).toBe(
      "2026-04-14T00:00:00.000Z",
    );
    expect(registro.interessado).toBe("Delegacia Teste");
    expect(registro.unidadeAtual).toBe("PCI-NUGECID");
  });

  it("mapeia payload de webhook do escavador como captura incompleta", () => {
    const registro = service.mapWebhook({
      numero: "0391002.002025/2026-46",
      titulo: "Pedido de desarquivamento PCI 123/2026",
      link: "https://sei.rn.gov.br/processo/0391002.002025/2026-46",
    });

    expect(registro.numeroProcessoSei).toBe("0391002.002025/2026-46");
    expect(registro.numeroPci).toBe("PCI 123/2026");
    expect(registro.assunto).toBe("Pedido de desarquivamento PCI 123/2026");
    expect(registro.linkSei).toBe(
      "https://sei.rn.gov.br/processo/0391002.002025/2026-46",
    );
    expect(service.validate(registro).status).toBe(SeiCapturaStatus.INCOMPLETO);
  });

  it("marca captura incompleta quando faltam campos minimos", () => {
    const registro = service.mapRow({
      Interessado: "Solicitante sem processo",
    });

    const validacao = service.validate(registro);

    expect(validacao.status).toBe(SeiCapturaStatus.INCOMPLETO);
    expect(validacao.camposAusentes).toContain("numeroProcessoSei");
    expect(validacao.camposAusentes).toContain("dataEntradaSei");
  });

  it("marca captura completa como pronta para importar", () => {
    const registro = service.mapRow({
      Processo: "00110010.003111/2026-12",
      Data: "2026-04-14",
      Requerente: "Instituto Teste",
      Tipo: "Desarquivamento",
    });

    const validacao = service.validate(registro);

    expect(validacao.status).toBe(SeiCapturaStatus.PRONTO_PARA_IMPORTAR);
    expect(validacao.camposAusentes).toEqual([]);
  });
});
