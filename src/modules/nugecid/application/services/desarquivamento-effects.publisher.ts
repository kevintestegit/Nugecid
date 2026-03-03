import { Injectable, Optional } from "@nestjs/common";

import { SyncRealtimeService } from "../../../sync/sync-realtime.service";
import { SearchService } from "../../../search/search.service";

export type DesarquivamentoEntityAction =
  | "created"
  | "updated"
  | "deleted"
  | "restored";

@Injectable()
export class DesarquivamentoEffectsPublisher {
  constructor(
    private readonly syncRealtimeService: SyncRealtimeService,
    @Optional() private readonly searchService?: SearchService,
  ) {}

  publishEntityChange(params: {
    action: DesarquivamentoEntityAction;
    entityId: number;
    status?: string;
  }): void {
    this.syncRealtimeService.emitDomainChange({
      scope: "desarquivamentos",
      action: params.action,
      entityId: params.entityId,
      entityType: "desarquivamento",
      metadata: params.status ? { status: params.status } : undefined,
    });
    this.syncRealtimeService.emitDomainChange({
      scope: "dashboard",
      action: "updated",
      entityType: "dashboard",
      metadata: { section: "desarquivamentos" },
    });

    if (params.action === "deleted") {
      this.searchService?.requestRemoveDesarquivamento(params.entityId);
      return;
    }

    this.searchService?.requestSyncDesarquivamento(params.entityId);
  }

  publishBulkChange(params: {
    operation: "createMany" | "updateMany";
    count: number;
  }): void {
    this.syncRealtimeService.emitDomainChange({
      scope: "desarquivamentos",
      action: "bulk",
      entityType: "desarquivamento",
      metadata: { count: params.count, operation: params.operation },
    });
    this.syncRealtimeService.emitDomainChange({
      scope: "dashboard",
      action: "updated",
      entityType: "dashboard",
      metadata: { section: "desarquivamentos" },
    });
  }
}
