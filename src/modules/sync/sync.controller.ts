import {
  Controller,
  Post,
  Request,
  Sse,
  MessageEvent,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
} from "@nestjs/common";
import { Observable, from, interval, map, merge } from "rxjs";
import { finalize } from "rxjs/operators";
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SyncRealtimeService } from "./sync-realtime.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { SearchService } from "../search/search.service";

@ApiTags("sync")
@Controller("sync")
export class SyncController {
  constructor(
    private readonly syncRealtimeService: SyncRealtimeService,
    @Optional()
    private readonly searchService?: SearchService,
  ) {}

  @Sse("stream")
  @UseGuards(JwtAuthGuard)
  @ApiExcludeEndpoint()
  stream(@Request() req: any): Observable<MessageEvent> {
    const userId = Number(req.user.id);

    const init$ = from([
      {
        type: "init",
        data: {
          connectedAt: new Date().toISOString(),
          userId,
        },
      } as MessageEvent,
    ]);

    const realtime$ = this.syncRealtimeService.registerConnection(userId).pipe(
      map(
        (event) =>
          ({
            type: "domain-change",
            data: event,
          }) as MessageEvent,
      ),
    );

    const heartbeat$ = interval(30000).pipe(
      map(
        () =>
          ({
            type: "heartbeat",
            data: { timestamp: new Date().toISOString() },
          }) as MessageEvent,
      ),
    );

    return merge(init$, realtime$, heartbeat$).pipe(
      finalize(() => {
        this.syncRealtimeService.removeConnection(userId);
      }),
    );
  }

  @Post("search/reindex")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Solicita reindexação completa do Meilisearch em background",
  })
  @ApiResponse({
    status: 202,
    description: "Reindexação aceita para execução assíncrona",
  })
  requestSearchReindex() {
    const accepted = this.searchService?.requestFullReindex() ?? false;

    return {
      status: accepted ? "accepted" : "disabled",
      target: "search",
      mode: "full-reindex",
      queuedAt: new Date().toISOString(),
    };
  }
}
