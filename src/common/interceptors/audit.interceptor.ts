import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Auditoria } from "../../modules/audit/entities/auditoria.entity";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, params, query, ip } = request;
    const user = request.user as any;

    // Só audita operações importantes (POST, PUT, DELETE)
    const shouldAudit =
      ["POST", "PUT", "DELETE"].includes(method) &&
      !url.includes("/auth/") &&
      !url.includes("/health");

    if (!shouldAudit || !user) {
      return next.handle();
    }

    const auditData = {
      userId: user.id,
      action: this.getActionFromMethod(method),
      resource: this.getResourceFromUrl(url),
      details: {
        method,
        url,
        body: this.sanitizeBody(body),
        params,
        query,
        ip,
        userAgent: request.get("User-Agent"),
      },
      timestamp: new Date(),
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Sucesso - salva auditoria
          this.saveAudit({
            ...auditData,
            success: true,
            response: this.sanitizeResponse(response),
          });
        },
        error: (error) => {
          // Erro - salva auditoria com erro
          this.saveAudit({
            ...auditData,
            success: false,
            error: error.message || "Erro desconhecido",
          });
        },
      }),
    );
  }

  private async saveAudit(auditData: any) {
    try {
      const audit = this.auditoriaRepository.create(auditData);
      await this.auditoriaRepository.save(audit);
    } catch (error) {
      console.error("Erro ao salvar auditoria:", error);
    }
  }

  private getActionFromMethod(method: string): string {
    const actions = {
      POST: "CREATE",
      PUT: "UPDATE",
      PATCH: "UPDATE",
      DELETE: "DELETE",
    };
    return actions[method] || "UNKNOWN";
  }

  private getResourceFromUrl(url: string): string {
    // Extrai o recurso da URL (ex: /api/nugecid/123 -> nugecid)
    const parts = url.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "api") {
      return parts[1];
    }
    return parts[0] || "unknown";
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;

    // Remove campos sensíveis
    const sanitized = { ...body };
    const sensitiveFields = ["password", "senha", "token", "secret"];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private sanitizeResponse(response: any): any {
    if (!response) return null;

    // Limita o tamanho da resposta para não sobrecarregar o banco
    const responseStr = JSON.stringify(response);
    if (responseStr.length > 1000) {
      return { message: "Response too large to store" };
    }

    return response;
  }
}
