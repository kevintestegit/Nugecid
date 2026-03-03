import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { RuntimeMetricsService } from "../../modules/observability/runtime-metrics.service";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly runtimeMetricsService?: RuntimeMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const sanitizedUrl = this.sanitizeUrl(request.originalUrl || url);
    const isHealthCheck = this.isHealthCheckEndpoint(sanitizedUrl);
    const isSseRequest = this.isSseRequest(request, sanitizedUrl);
    const userAgent = request.get("User-Agent") || "";
    const user = request.user as any;

    if (isHealthCheck) {
      return next.handle();
    }

    const now = Date.now();

    // Log da requisição
    this.logger.log(
      `${method} ${sanitizedUrl} - ${ip} - ${userAgent} - User: ${user?.id || "Anonymous"}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          if (isSseRequest) {
            return;
          }

          const responseTime = Date.now() - now;
          const statusCode = response?.statusCode || 200;
          this.runtimeMetricsService?.recordHttpRequest(
            method,
            sanitizedUrl,
            statusCode,
            responseTime,
          );
          this.logger.log(
            `${method} ${sanitizedUrl} - ${ip} - ${statusCode} - Response time: ${responseTime}ms`,
          );
        },
        error: (error: unknown) => {
          const responseTime = Date.now() - now;
          const statusCode = this.resolveStatusCode(error, response);
          this.runtimeMetricsService?.recordHttpRequest(
            method,
            sanitizedUrl,
            statusCode,
            responseTime,
          );
          if (isSseRequest && statusCode < 400) {
            this.logger.log(
              `${method} ${sanitizedUrl} - ${ip} - ${statusCode} - SSE connection closed in ${responseTime}ms`,
            );
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : "Erro desconhecido";

          this.logger.warn(
            `${method} ${sanitizedUrl} - ${ip} - ${statusCode} - Failed in ${responseTime}ms - ${message}`,
          );
        },
      }),
    );
  }

  private sanitizeUrl(rawUrl: string): string {
    if (!rawUrl || !rawUrl.includes("?")) {
      return rawUrl;
    }

    const [path, queryString] = rawUrl.split("?", 2);
    const params = new URLSearchParams(queryString);

    ["token", "access_token", "refreshToken", "refresh_token"].forEach(
      (key) => {
        if (params.has(key)) {
          params.set(key, "[REDACTED]");
        }
      },
    );

    const sanitizedQuery = params.toString();
    return sanitizedQuery ? `${path}?${sanitizedQuery}` : path;
  }

  private isSseRequest(request: Request, sanitizedUrl: string): boolean {
    const acceptHeader = request.get("accept") || "";
    return (
      acceptHeader.includes("text/event-stream") ||
      sanitizedUrl.includes("/stream")
    );
  }

  private isHealthCheckEndpoint(sanitizedUrl: string): boolean {
    const [path] = sanitizedUrl.split("?", 1);
    return path === "/api/health";
  }

  private resolveStatusCode(error: unknown, response: Response): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    if (typeof error === "object" && error && "status" in error) {
      const status = Number((error as { status?: unknown }).status);
      if (Number.isFinite(status) && status > 0) {
        return status;
      }
    }

    if (response?.statusCode && response.statusCode >= 100) {
      return response.statusCode;
    }

    return 500;
  }
}
