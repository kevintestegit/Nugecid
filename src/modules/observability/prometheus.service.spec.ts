import { PrometheusService } from "./prometheus.service";
import { RuntimeMetricsService } from "./runtime-metrics.service";

describe("PrometheusService", () => {
  let runtime: RuntimeMetricsService;

  afterEach(() => {
    runtime?.onModuleDestroy();
  });

  it("getMetrics retorna texto Prometheus com as métricas customizadas e default", async () => {
    runtime = new RuntimeMetricsService();
    const service = new PrometheusService(runtime);

    const metrics = await service.getMetrics();

    expect(typeof metrics).toBe("string");
    expect(metrics).toContain("sgc_process_uptime_seconds");
    expect(metrics).toContain("sgc_http_requests_total");
    expect(metrics).toContain("sgc_cache_hit_ratio_pct");
    expect(metrics).toContain("sgc_event_loop_lag_ms");
    expect(metrics).toContain("process_cpu_");
  });

  it("getMetrics reflete valores atualizados do snapshot de runtime", async () => {
    runtime = new RuntimeMetricsService();
    runtime.recordHttpRequest("GET", "/api/test", 200, 15);
    runtime.recordHttpRequest("GET", "/api/test", 500, 30);
    const service = new PrometheusService(runtime);

    const metrics = await service.getMetrics();

    expect(metrics).toContain("sgc_http_requests_total 2");
    expect(metrics).toContain("sgc_http_errors_total 1");
  });

  it("getMetrics expõe cache hits/misses por namespace", async () => {
    runtime = new RuntimeMetricsService();
    runtime.recordCacheHit("pastas");
    runtime.recordCacheHit("pastas");
    runtime.recordCacheMiss("pastas");
    const service = new PrometheusService(runtime);

    const metrics = await service.getMetrics();

    expect(metrics).toContain("sgc_cache_hits_total 2");
    expect(metrics).toContain("sgc_cache_misses_total 1");
  });
});
