import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

export type SyncScope =
  | "tarefas"
  | "projetos"
  | "pastas"
  | "planilhas"
  | "desarquivamentos"
  | "dashboard"
  | "usuarios"
  | "online-users"
  | "global-search";

export type SyncAction =
  | "created"
  | "updated"
  | "deleted"
  | "restored"
  | "moved"
  | "bulk";

export interface DomainChangeEvent {
  scope: SyncScope;
  action: SyncAction;
  entityId?: number | string;
  entityType?: string;
  actorId?: number | null;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface EmitDomainChangeInput
  extends Omit<DomainChangeEvent, "timestamp"> {
  userIds?: number[];
}

interface UserChannel {
  subject: Subject<DomainChangeEvent>;
  connections: number;
}

@Injectable()
export class SyncRealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(SyncRealtimeService.name);
  private readonly userChannels = new Map<number, UserChannel>();

  onModuleDestroy(): void {
    for (const channel of this.userChannels.values()) {
      channel.subject.complete();
    }
    this.userChannels.clear();
  }

  registerConnection(userId: number): Observable<DomainChangeEvent> {
    const channel = this.getOrCreateChannel(userId);
    channel.connections += 1;
    this.logger.debug(
      `Conexão realtime registrada para usuário ${userId} (ativas=${channel.connections})`,
    );
    return channel.subject.asObservable();
  }

  removeConnection(userId: number): void {
    const channel = this.userChannels.get(userId);
    if (!channel) {
      return;
    }

    channel.connections = Math.max(0, channel.connections - 1);
    if (channel.connections === 0) {
      channel.subject.complete();
      this.userChannels.delete(userId);
      this.logger.debug(
        `Conexões realtime encerradas para usuário ${userId} (canal removido)`,
      );
    }
  }

  emitDomainChange(input: EmitDomainChangeInput): void {
    const event: DomainChangeEvent = {
      scope: input.scope,
      action: input.action,
      entityId: input.entityId,
      entityType: input.entityType,
      actorId: input.actorId ?? null,
      metadata: input.metadata,
      timestamp: new Date().toISOString(),
    };

    const targetUsers =
      input.userIds?.length && Array.isArray(input.userIds)
        ? Array.from(new Set(input.userIds))
        : null;

    if (targetUsers) {
      for (const userId of targetUsers) {
        this.emitToUser(userId, event);
      }
      return;
    }

    this.broadcast(event);
  }

  private getOrCreateChannel(userId: number): UserChannel {
    let channel = this.userChannels.get(userId);
    if (!channel) {
      channel = {
        subject: new Subject<DomainChangeEvent>(),
        connections: 0,
      };
      this.userChannels.set(userId, channel);
    }
    return channel;
  }

  private emitToUser(userId: number, event: DomainChangeEvent): void {
    const channel = this.userChannels.get(userId);
    if (!channel || channel.connections <= 0) {
      return;
    }
    channel.subject.next(event);
  }

  private broadcast(event: DomainChangeEvent): void {
    if (!this.userChannels.size) {
      return;
    }

    for (const channel of this.userChannels.values()) {
      if (channel.connections > 0) {
        channel.subject.next(event);
      }
    }
  }
}
