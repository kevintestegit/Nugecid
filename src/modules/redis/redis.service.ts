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
 * Falls back to an in-memory Map when Redis is unavailable.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private connected = false;

  /** Fallback in-memory store (usado quando Redis nao esta disponivel) */
  private memoryStore = new Map<string, string>();
  private memoryStoreTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    const redisHost = this.configService.get<string>("REDIS_HOST");

    if (!redisUrl && !redisHost) {
      this.logger.warn(
        "Redis not configured (REDIS_URL/REDIS_HOST). Using in-memory fallback.",
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
        this.logger.log("Redis connected");
      });

      this.client.on("error", (err: Error) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      this.client.on("close", () => {
        this.connected = false;
        this.logger.warn("Redis connection closed");
      });

      // Test connectivity
      await this.client.ping();
      this.connected = true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to connect to Redis, using in-memory fallback: ${message}`,
      );
      this.client = null;
      this.connected = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const timer of this.memoryStoreTimers.values()) {
      clearTimeout(timer);
    }
    this.memoryStoreTimers.clear();
    this.memoryStore.clear();

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

  // ── Convenience methods with fallback ──

  async get(key: string): Promise<string | null> {
    if (this.client && this.connected) {
      return this.client.get(key);
    }
    return this.memoryStore.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
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
    if (this.client && this.connected) {
      return this.client.hget(key, field);
    }
    const existing = this.memoryStore.get(key);
    if (!existing) return null;
    const hash = JSON.parse(existing);
    return hash[field] ?? null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.client && this.connected) {
      return this.client.hgetall(key);
    }
    const existing = this.memoryStore.get(key);
    if (!existing) return {};
    return JSON.parse(existing);
  }

  async hdel(key: string, field: string): Promise<void> {
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
    if (this.client && this.connected) {
      await this.client.expire(key, ttlSeconds);
    }
  }
}
