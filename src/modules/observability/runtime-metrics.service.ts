import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import {
  constants as perfConstants,
  monitorEventLoopDelay,
  performance,
  PerformanceObserver,
} from "node:perf_hooks";
import { cpus, loadavg } from "node:os";

export interface CacheNamespaceStats {
  hits: number;
  misses: number;
  sets: number;
  errors: number;
}

interface RouteStats {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
  latenciesMs: number[];
}

export interface GcStats {
  count: number;
  totalDurationMs: number;
  maxDurationMs: number;
}

@Injectable()
export class RuntimeMetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(RuntimeMetricsService.name);
  private readonly startedAt = Date.now();
  private readonly eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
  private eventLoopUtilizationSample = performance.eventLoopUtilization();
  private gcObserver?: PerformanceObserver;
  private readonly routeStats = new Map<string, RouteStats>();
  private readonly cacheStats = new Map<string, CacheNamespaceStats>();
  private readonly gcStats = new Map<string, GcStats>();

  private static readonly MAX_ROUTE_KEYS = 300;
  private static readonly MAX_ROUTE_SAMPLES = 512;

  constructor() {
    this.eventLoopDelay.enable();
    this.initGcObserver();
  }

  onModuleDestroy(): void {
    this.eventLoopDelay.disable();
    this.gcObserver?.disconnect();
  }

  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
  ): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return;
    }

    const normalizedPath = this.normalizePath(path);
    const key = `${(method || "GET").toUpperCase()} ${normalizedPath}`;

    if (!this.routeStats.has(key)) {
      if (this.routeStats.size >= RuntimeMetricsService.MAX_ROUTE_KEYS) {
        const firstKey = this.routeStats.keys().next().value;
        if (firstKey) {
          this.routeStats.delete(firstKey);
        }
      }
      this.routeStats.set(key, {
        count: 0,
        errors: 0,
        totalMs: 0,
        maxMs: 0,
        latenciesMs: [],
      });
    }

    const stats = this.routeStats.get(key);
    if (!stats) {
      return;
    }

    stats.count += 1;
    if (statusCode >= 400) {
      stats.errors += 1;
    }
    stats.totalMs += durationMs;
    stats.maxMs = Math.max(stats.maxMs, durationMs);
    stats.latenciesMs.push(durationMs);
    if (stats.latenciesMs.length > RuntimeMetricsService.MAX_ROUTE_SAMPLES) {
      stats.latenciesMs.shift();
    }
  }

  recordCacheHit(namespace: string): void {
    this.getOrCreateCacheStats(namespace).hits += 1;
  }

  recordCacheMiss(namespace: string): void {
    this.getOrCreateCacheStats(namespace).misses += 1;
  }

  recordCacheSet(namespace: string): void {
    this.getOrCreateCacheStats(namespace).sets += 1;
  }

  recordCacheError(namespace: string): void {
    this.getOrCreateCacheStats(namespace).errors += 1;
  }

  getSummary(): {
    uptimeSeconds: number;
    eventLoopUtilizationPct: number;
    eventLoopLagP95Ms: number;
    httpErrorRatePct: number;
    cacheHitRatioPct: number;
  } {
    const snapshot = this.getSnapshot();
    return {
      uptimeSeconds: snapshot.process.uptimeSeconds,
      eventLoopUtilizationPct: snapshot.eventLoop.utilizationPct,
      eventLoopLagP95Ms: snapshot.eventLoop.lagMs.p95,
      httpErrorRatePct: snapshot.http.errorRatePct,
      cacheHitRatioPct: snapshot.cache.total.hitRatioPct,
    };
  }

  getSnapshot(): {
    generatedAt: string;
    process: {
      pid: number;
      nodeVersion: string;
      uptimeSeconds: number;
      uptimeSinceIso: string;
      cpuCount: number;
      loadAverage: number[];
      memoryBytes: NodeJS.MemoryUsage;
      cpuUsageMicros: NodeJS.CpuUsage;
    };
    eventLoop: {
      utilizationPct: number;
      activeMs: number;
      idleMs: number;
      lagMs: {
        min: number;
        p50: number;
        p95: number;
        p99: number;
        max: number;
        mean: number;
        stddev: number;
      };
    };
    gc: {
      total: GcStats;
      byKind: Array<GcStats & { kind: string }>;
    };
    http: {
      totalRequests: number;
      totalErrors: number;
      errorRatePct: number;
      slowestRoutes: Array<{
        route: string;
        count: number;
        errors: number;
        avgMs: number;
        p95Ms: number;
        maxMs: number;
      }>;
    };
    cache: {
      total: CacheNamespaceStats & { hitRatioPct: number };
      byNamespace: Array<
        CacheNamespaceStats & { namespace: string; hitRatioPct: number }
      >;
    };
  } {
    const now = Date.now();
    const deltaElu = performance.eventLoopUtilization(
      this.eventLoopUtilizationSample,
    );
    this.eventLoopUtilizationSample = performance.eventLoopUtilization();
    const eluUtilization = Math.max(0, Math.min(1, deltaElu.utilization || 0));
    const eluActiveMs = Math.max(0, deltaElu.active || 0) / 1000;
    const eluIdleMs = Math.max(0, deltaElu.idle || 0) / 1000;

    const lagMs = {
      min: this.toMs(this.eventLoopDelay.min),
      p50: this.toMs(this.eventLoopDelay.percentile(50)),
      p95: this.toMs(this.eventLoopDelay.percentile(95)),
      p99: this.toMs(this.eventLoopDelay.percentile(99)),
      max: this.toMs(this.eventLoopDelay.max),
      mean: this.toMs(this.eventLoopDelay.mean),
      stddev: this.toMs(this.eventLoopDelay.stddev),
    };

    const routes = Array.from(this.routeStats.entries()).map(
      ([route, stats]) => ({
        route,
        count: stats.count,
        errors: stats.errors,
        avgMs:
          stats.count > 0
            ? Number((stats.totalMs / stats.count).toFixed(3))
            : 0,
        p95Ms: this.percentile(stats.latenciesMs, 95),
        maxMs: Number(stats.maxMs.toFixed(3)),
      }),
    );

    const totalRequests = routes.reduce((acc, item) => acc + item.count, 0);
    const totalErrors = routes.reduce((acc, item) => acc + item.errors, 0);
    const httpErrorRatePct =
      totalRequests > 0
        ? Number(((totalErrors * 100) / totalRequests).toFixed(2))
        : 0;
    const slowestRoutes = [...routes]
      .sort((a, b) => b.p95Ms - a.p95Ms || b.avgMs - a.avgMs)
      .slice(0, 10);

    const cacheByNamespace = Array.from(this.cacheStats.entries()).map(
      ([namespace, stats]) => {
        const totalLookups = stats.hits + stats.misses;
        const hitRatioPct =
          totalLookups > 0
            ? Number(((stats.hits * 100) / totalLookups).toFixed(2))
            : 0;
        return { namespace, ...stats, hitRatioPct };
      },
    );
    const cacheTotal = cacheByNamespace.reduce(
      (acc, item) => ({
        hits: acc.hits + item.hits,
        misses: acc.misses + item.misses,
        sets: acc.sets + item.sets,
        errors: acc.errors + item.errors,
      }),
      { hits: 0, misses: 0, sets: 0, errors: 0 },
    );
    const totalLookups = cacheTotal.hits + cacheTotal.misses;
    const cacheHitRatioPct =
      totalLookups > 0
        ? Number(((cacheTotal.hits * 100) / totalLookups).toFixed(2))
        : 0;

    const gcByKind = Array.from(this.gcStats.entries()).map(
      ([kind, stats]) => ({
        kind,
        ...stats,
      }),
    );
    const gcTotal = gcByKind.reduce(
      (acc, item) => ({
        count: acc.count + item.count,
        totalDurationMs: Number(
          (acc.totalDurationMs + item.totalDurationMs).toFixed(3),
        ),
        maxDurationMs: Number(Math.max(acc.maxDurationMs, item.maxDurationMs)),
      }),
      { count: 0, totalDurationMs: 0, maxDurationMs: 0 },
    );

    return {
      generatedAt: new Date(now).toISOString(),
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        uptimeSeconds: Number(process.uptime().toFixed(2)),
        uptimeSinceIso: new Date(this.startedAt).toISOString(),
        cpuCount: cpus().length,
        loadAverage: loadavg(),
        memoryBytes: process.memoryUsage(),
        cpuUsageMicros: process.cpuUsage(),
      },
      eventLoop: {
        utilizationPct: Number((eluUtilization * 100).toFixed(2)),
        activeMs: Number(eluActiveMs.toFixed(3)),
        idleMs: Number(eluIdleMs.toFixed(3)),
        lagMs,
      },
      gc: {
        total: gcTotal,
        byKind: gcByKind,
      },
      http: {
        totalRequests,
        totalErrors,
        errorRatePct: httpErrorRatePct,
        slowestRoutes,
      },
      cache: {
        total: {
          ...cacheTotal,
          hitRatioPct: cacheHitRatioPct,
        },
        byNamespace: cacheByNamespace,
      },
    };
  }

  private initGcObserver(): void {
    try {
      this.gcObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const gcEntry = entry as PerformanceEntry & { kind?: number };
          const kind = this.gcKindLabel(gcEntry.kind);
          const stats = this.getOrCreateGcStats(kind);
          stats.count += 1;
          stats.totalDurationMs = Number(
            (stats.totalDurationMs + gcEntry.duration).toFixed(3),
          );
          stats.maxDurationMs = Number(
            Math.max(stats.maxDurationMs, gcEntry.duration).toFixed(3),
          );
        }
      });
      this.gcObserver.observe({ entryTypes: ["gc"] });
    } catch (error) {
      this.logger.warn(
        `Falha ao habilitar observador de GC: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private getOrCreateCacheStats(namespace: string): CacheNamespaceStats {
    const key = namespace || "default";
    let stats = this.cacheStats.get(key);
    if (!stats) {
      stats = { hits: 0, misses: 0, sets: 0, errors: 0 };
      this.cacheStats.set(key, stats);
    }
    return stats;
  }

  private getOrCreateGcStats(kind: string): GcStats {
    let stats = this.gcStats.get(kind);
    if (!stats) {
      stats = { count: 0, totalDurationMs: 0, maxDurationMs: 0 };
      this.gcStats.set(kind, stats);
    }
    return stats;
  }

  private gcKindLabel(kind?: number): string {
    switch (kind) {
      case perfConstants.NODE_PERFORMANCE_GC_MAJOR:
        return "major";
      case perfConstants.NODE_PERFORMANCE_GC_MINOR:
        return "minor";
      case perfConstants.NODE_PERFORMANCE_GC_INCREMENTAL:
        return "incremental";
      case perfConstants.NODE_PERFORMANCE_GC_WEAKCB:
        return "weakcb";
      default:
        return "unknown";
    }
  }

  private normalizePath(path: string): string {
    const raw = (path || "/").split("?")[0] || "/";
    return raw
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
        ":uuid",
      )
      .replace(/\/\d+(?=\/|$)/g, "/:id")
      .replace(/\/{2,}/g, "/");
  }

  private percentile(values: number[], p: number): number {
    if (!values.length) {
      return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return Number(
      sorted[Math.max(0, Math.min(idx, sorted.length - 1))].toFixed(3),
    );
  }

  private toMs(ns: number): number {
    if (!Number.isFinite(ns) || ns < 0 || ns > 1e15) {
      return 0;
    }
    return Number((ns / 1e6).toFixed(3));
  }
}
