import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";

/**
 * Modulo global de Redis.
 * Exporta RedisService para uso em qualquer modulo da aplicacao.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
