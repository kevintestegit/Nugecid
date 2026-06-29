import { Injectable } from "@nestjs/common";
import { Registry, collectDefaultMetrics, Gauge } from "prom-client";
import { RuntimeMetricsService } from "./runtime-metrics.service";

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  private readonly uptimeSeconds: Gauge<string>;
  private readonly httpRequestsTotal: Gauge<string>;
  private readonly httpErrorsTotal: Gauge<string>;
  private readonly httpErrorRatePct: Gauge<string>;
  private readonly cacheHitsTotal: Gauge<string>;
  private readonly cacheMissesTotal: Gauge<string>;
  private readonly cacheHitRatioPct: Gauge<string>;
  private readonly eventLoopLagMs: Gauge<string>;
  private readonly eventLoopUtilizationPct: Gauge<string>;
  private readonly gcTotalCount: Gauge<string>;
  private readonly gcTotalDurationMs: Gauge<string>;

  constructor(private readonly runtimeMetrics: RuntimeMetricsService) {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.uptimeSeconds = new Gauge({
      name: "sgc_process_uptime_seconds",
      help: "Process uptime in seconds",
      registers: [this.registry],
    });
    this.httpRequestsTotal = new Gauge({
      name: "sgc_http_requests_total",
      help: "Total HTTP requests since start",
      registers: [this.registry],
    });
    this.httpErrorsTotal = new Gauge({
      name: "sgc_http_errors_total",
      help: "Total HTTP errors since start",
      registers: [this.registry],
    });
    this.httpErrorRatePct = new Gauge({
      name: "sgc_http_error_rate_pct",
      help: "HTTP error rate percentage",
      registers: [this.registry],
    });
    this.cacheHitsTotal = new Gauge({
      name: "sgc_cache_hits_total",
      help: "Total cache hits since start",
      registers: [this.registry],
    });
    this.cacheMissesTotal = new Gauge({
      name: "sgc_cache_misses_total",
      help: "Total cache misses since start",
      registers: [this.registry],
    });
    this.cacheHitRatioPct = new Gauge({
      name: "sgc_cache_hit_ratio_pct",
      help: "Cache hit ratio percentage",
      registers: [this.registry],
    });
    this.eventLoopLagMs = new Gauge({
      name: "sgc_event_loop_lag_ms",
      help: "Event loop lag in milliseconds",
      registers: [this.registry],
    });
    this.eventLoopUtilizationPct = new Gauge({
      name: "sgc_event_loop_utilization_pct",
      help: "Event loop utilization percentage",
      registers: [this.registry],
    });
    this.gcTotalCount = new Gauge({
      name: "sgc_gc_total_count",
      help: "Total garbage collection events",
      registers: [this.registry],
    });
    this.gcTotalDurationMs = new Gauge({
      name: "sgc_gc_total_duration_ms",
      help: "Total garbage collection duration in milliseconds",
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    const snapshot = this.runtimeMetrics.getSnapshot();

    this.uptimeSeconds.set(snapshot.process.uptimeSeconds);
    this.httpRequestsTotal.set(snapshot.http.totalRequests);
    this.httpErrorsTotal.set(snapshot.http.totalErrors);
    this.httpErrorRatePct.set(snapshot.http.errorRatePct);
    this.cacheHitsTotal.set(snapshot.cache.total.hits);
    this.cacheMissesTotal.set(snapshot.cache.total.misses);
    this.cacheHitRatioPct.set(snapshot.cache.total.hitRatioPct);
    this.eventLoopLagMs.set(snapshot.eventLoop.lagMs.p95);
    this.eventLoopUtilizationPct.set(snapshot.eventLoop.utilizationPct);
    this.gcTotalCount.set(snapshot.gc.total.count);
    this.gcTotalDurationMs.set(snapshot.gc.total.totalDurationMs);

    return this.registry.metrics();
  }
}
