import {
  Controller,
  Query,
  Request,
  Sse,
  MessageEvent,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable, from, interval, map, merge } from "rxjs";
import { finalize } from "rxjs/operators";
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import { SyncRealtimeService } from "./sync-realtime.service";

@ApiTags("sync")
@Controller("sync")
export class SyncController {
  constructor(
    private readonly syncRealtimeService: SyncRealtimeService,
    private readonly jwtService: JwtService,
  ) {}

  @Sse("stream")
  @IsPublic()
  @ApiExcludeEndpoint()
  stream(
    @Request() req: any,
    @Query("token") token?: string,
  ): Observable<MessageEvent> {
    const userId = this.resolveUserId(req, token);

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

  private resolveUserId(req: any, token?: string): number {
    if (req?.user?.id) {
      const parsedId = Number(req.user.id);
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        return parsedId;
      }
    }

    const cookieToken = req?.cookies?.access_token;
    if (cookieToken) {
      try {
        const payload = this.jwtService.verify(cookieToken);
        if (!payload?.sub) {
          throw new UnauthorizedException("Token do cookie inválido");
        }
        const parsedId = Number(payload.sub);
        if (!Number.isNaN(parsedId) && parsedId > 0) {
          return parsedId;
        }
        throw new UnauthorizedException("Token do cookie inválido");
      } catch {
        throw new UnauthorizedException("Token do cookie inválido ou expirado");
      }
    }

    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        if (!payload?.sub) {
          throw new UnauthorizedException("Token inválido");
        }
        const parsedId = Number(payload.sub);
        if (!Number.isNaN(parsedId) && parsedId > 0) {
          return parsedId;
        }
        throw new UnauthorizedException("Token inválido");
      } catch {
        throw new UnauthorizedException("Token inválido ou expirado");
      }
    }

    throw new UnauthorizedException("Token não fornecido");
  }
}
