import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

/**
 * Serviço centralizado de acesso ao Redis.
 * Exposes the underlying ioredis client and convenience helpers.
 * Permite fallback para memória somente em dev/test com flag explícita.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private connected = false;
  private readonly environment: string;
  private readonly allowMemoryFallback: boolean;
  private usingMemoryFallback = false;

  /** Fallback in-memory store (usado quando Redis nao esta disponivel) */
  private memoryStore = new Map<string, string>();
  private memoryStoreTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly configService: ConfigService) {
    this.environment = this.configService.get<string>("NODE_ENV", "development");
    const fallbackFlag =
      this.configService.get<string>("ALLOW_MEMORY_SESSION_STORE", "false") ===
      "true";
    this.allowMemoryFallback = this.environment !== "production" && fallbackFlag;

    if (this.environment === "production" && fallbackFlag) {
      this.logger.warn(
        "ALLOW_MEMORY_SESSION_STORE=true foi ignorado em produção. Redis é obrigatório.",
      );
    }
  }

  private isRedisRequired(): boolean {
    return this.environment === "production";
  }

  private async handleUnavailableRedis(reason: string): Promise<void> {
    if (this.allowMemoryFallback) {
      this.usingMemoryFallback = true;
      this.logger.warn(
        `[REDIS] ${reason}. Usando fallback em memória (apenas ${this.environment}).`,
      );
      return;
    }

    const message = `[REDIS] ${reason}. Redis obrigatório no ambiente ${this.environment}.`;
    this.logger.error(message);
    throw new Error(message);
  }

  private ensureAvailableOrFallback(): void {
    if (this.client && this.connected) return;
    if (this.usingMemoryFallback) return;

    throw new Error(
      "[REDIS] indisponível e fallback em memória desabilitado. Operação abortada.",
    );
  }

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    const redisHost = this.configService.get<string>("REDIS_HOST");

    if (!redisUrl && !redisHost) {
      await this.handleUnavailableRedis(
        "REDIS_URL/REDIS_HOST não configurados",
      );
      return;
    }

    try {
      this.client = redisUrl
        ? new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) =>
              times > 5 ? null : Math.min(times * 200, 2000),
          })
        : new Redis({
            host: redisHost,
            port: this.configService.get<number>("REDIS_PORT", 6379),
            password:
              this.configService.get<string>("REDIS_PASSWORD") || undefined,
            db: this.configService.get<number>("REDIS_DB", 0),
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) =>
              times > 5 ? null : Math.min(times * 200, 2000),
          });

      this.client.on("connect", () => {
        this.connected = true;
        this.usingMemoryFallback = false;
        this.logger.log("Redis connected");
      });

      this.client.on("error", (err: Error) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      this.client.on("close", () => {
        this.connected = false;
        if (this.allowMemoryFallback) {
          this.usingMemoryFallback = true;
          this.logger.warn(
            "Redis connection closed. Alternando para fallback em memória neste ambiente.",
          );
          return;
        }
        this.logger.warn("Redis connection closed");
      });

      // Test connectivity
      const pong = await this.client.ping();
      if (pong !== "PONG") {
        throw new Error(`Redis respondeu "${pong}" no ping de inicialização`);
      }
      this.connected = true;
      this.usingMemoryFallback = false;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.client = null;
      this.connected = false;
      await this.handleUnavailableRedis(
        `Falha ao conectar no Redis durante bootstrap: ${message}`,
      );
    }

    if (this.isRedisRequired() && !this.connected) {
      throw new Error(
        "[REDIS] conexão obrigatória não estabelecida em produção.",
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.memoryStoreTimers.size > 0) {
      for (const timer of this.memoryStoreTimers.values()) {
        clearTimeout(timer);
      }
      this.memoryStoreTimers.clear();
      this.memoryStore.clear();
    }

    if (this.client) {
      await this.client.quit();
      this.logger.log("Redis connection closed gracefully");
    }
  }

  /** Returns true when Redis is connected and operational */
  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  /** Get underlying Redis client (null if not connected) */
  getClient(): Redis | null {
    return this.client;
  }

  async ping(): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const pong = await this.client.ping();
      return pong === "PONG";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[REDIS] ping falhou: ${message}`);
      return false;
    }
  }

  // ── Convenience methods with fallback control ──

  async get(key: string): Promise<string | null> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      return this.client.get(key);
    }
    return this.memoryStore.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      if (ttlSeconds) {
        await this.client.set(key, value, "EX", ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
      return;
    }
    this.memoryStore.set(key, value);

    const existingTimer = this.memoryStoreTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.memoryStoreTimers.delete(key);
    }

    if (ttlSeconds) {
      const timer = setTimeout(() => {
        this.memoryStore.delete(key);
        this.memoryStoreTimers.delete(key);
      }, ttlSeconds * 1000);
      timer.unref?.();
      this.memoryStoreTimers.set(key, timer);
    }
  }

  async del(key: string): Promise<void> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      await this.client.del(key);
      return;
    }
    this.memoryStore.delete(key);
    const existingTimer = this.memoryStoreTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.memoryStoreTimers.delete(key);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      return this.client.keys(pattern);
    }
    // Simple glob matching for memory fallback
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    );
    return Array.from(this.memoryStore.keys()).filter((k) => regex.test(k));
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      await this.client.hset(key, field, value);
      return;
    }
    const existing = this.memoryStore.get(key);
    const hash = existing ? JSON.parse(existing) : {};
    hash[field] = value;
    this.memoryStore.set(key, JSON.stringify(hash));
  }

  async hget(key: string, field: string): Promise<string | null> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      return this.client.hget(key, field);
    }
    const existing = this.memoryStore.get(key);
    if (!existing) return null;
    const hash = JSON.parse(existing);
    return hash[field] ?? null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      return this.client.hgetall(key);
    }
    const existing = this.memoryStore.get(key);
    if (!existing) return {};
    return JSON.parse(existing);
  }

  async hdel(key: string, field: string): Promise<void> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      await this.client.hdel(key, field);
      return;
    }
    const existing = this.memoryStore.get(key);
    if (!existing) return;
    const hash = JSON.parse(existing);
    delete hash[field];
    this.memoryStore.set(key, JSON.stringify(hash));
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    this.ensureAvailableOrFallback();
    if (this.client && this.connected) {
      await this.client.expire(key, ttlSeconds);
    }
  }
}
