import { DesarquivamentoEffectsPublisher } from "./desarquivamento-effects.publisher";

describe("DesarquivamentoEffectsPublisher", () => {
  let publisher: DesarquivamentoEffectsPublisher;
  let syncRealtimeService: { emitDomainChange: jest.Mock };
  let searchService: {
    requestSyncDesarquivamento: jest.Mock;
    requestRemoveDesarquivamento: jest.Mock;
  };

  beforeEach(() => {
    syncRealtimeService = {
      emitDomainChange: jest.fn(),
    };
    searchService = {
      requestSyncDesarquivamento: jest.fn(),
      requestRemoveDesarquivamento: jest.fn(),
    };
    publisher = new DesarquivamentoEffectsPublisher(
      syncRealtimeService as any,
      searchService as any,
    );
  });

  it("publica atualização com realtime e sync de busca", () => {
    publisher.publishEntityChange({
      action: "updated",
      entityId: 42,
      status: "SOLICITADO",
    });

    expect(syncRealtimeService.emitDomainChange).toHaveBeenCalledTimes(2);
    expect(syncRealtimeService.emitDomainChange).toHaveBeenNthCalledWith(1, {
      scope: "desarquivamentos",
      action: "updated",
      entityId: 42,
      entityType: "desarquivamento",
      metadata: { status: "SOLICITADO" },
    });
    expect(searchService.requestSyncDesarquivamento).toHaveBeenCalledWith(42);
    expect(searchService.requestRemoveDesarquivamento).not.toHaveBeenCalled();
  });

  it("publica remoção com invalidação de busca", () => {
    publisher.publishEntityChange({
      action: "deleted",
      entityId: 7,
    });

    expect(syncRealtimeService.emitDomainChange).toHaveBeenCalledTimes(2);
    expect(searchService.requestRemoveDesarquivamento).toHaveBeenCalledWith(7);
    expect(searchService.requestSyncDesarquivamento).not.toHaveBeenCalled();
  });
});
