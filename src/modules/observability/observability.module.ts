import { Global, Module } from "@nestjs/common";
import { RuntimeMetricsService } from "./runtime-metrics.service";
import { PrometheusService } from "./prometheus.service";

@Global()
@Module({
  providers: [RuntimeMetricsService, PrometheusService],
  exports: [RuntimeMetricsService, PrometheusService],
})
export class ObservabilityModule {}
