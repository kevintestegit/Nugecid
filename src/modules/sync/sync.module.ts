import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SyncController } from "./sync.controller";
import { SyncRealtimeService } from "./sync-realtime.service";

@Global()
@Module({
  imports: [AuthModule],
  controllers: [SyncController],
  providers: [SyncRealtimeService],
  exports: [SyncRealtimeService],
})
export class SyncModule {}
