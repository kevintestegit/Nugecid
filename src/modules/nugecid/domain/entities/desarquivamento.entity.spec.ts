import {
  DesarquivamentoDomain,
  StatusDesarquivamento,
  StatusDesarquivamentoEnum,
} from "../../domain";

describe("DesarquivamentoDomain", () => {
  const createEntity = () =>
    DesarquivamentoDomain.create({
      tipoDesarquivamento: "FISICO",
      status: StatusDesarquivamento.createSolicitado(),
      nomeCompleto: "João da Silva",
      numeroNicLaudoAuto: "NIC-123",
      numeroProcesso: "PROC-1",
      tipoDocumento: "Laudo",
      dataSolicitacao: new Date("2026-01-01T00:00:00.000Z"),
      setorDemandante: "Delegacia",
      servidorResponsavel: "Servidor A",
      finalidadeDesarquivamento: "Finalidade inicial",
      solicitacaoProrrogacao: false,
      criadoPorId: 1,
      responsavelId: 2,
    });

  it("atualiza campos mutáveis sem usar reflexão externa", () => {
    const entity = createEntity();
    const previousUpdatedAt = entity.updatedAt;

    entity.updateMutableFields({
      nomeCompleto: "Maria da Silva",
      numeroProcesso: "PROC-2",
      dadosAdicionais: "Observação complementar",
      urgente: true,
    });

    expect(entity.nomeCompleto).toBe("Maria da Silva");
    expect(entity.numeroProcesso).toBe("PROC-2");
    expect(entity.dadosAdicionais).toBe("Observação complementar");
    expect(entity.urgente).toBe(true);
    expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime(),
    );
  });

  it("revalida a entidade ao aplicar atualização inválida", () => {
    const entity = createEntity();

    expect(() =>
      entity.updateMutableFields({
        nomeCompleto: "",
      }),
    ).toThrow("Nome completo");
  });

  it("expõe transição explícita por código de status", () => {
    const entity = createEntity();

    entity.transitionToStatus(StatusDesarquivamentoEnum.DESARQUIVADO);

    expect(entity.status.value).toBe(StatusDesarquivamentoEnum.DESARQUIVADO);
  });

  it("permite transição forçada para status final", () => {
    const entity = createEntity();

    entity.transitionToStatus(StatusDesarquivamentoEnum.FINALIZADO, {
      force: true,
    });

    expect(entity.status.value).toBe(StatusDesarquivamentoEnum.FINALIZADO);
  });
});
