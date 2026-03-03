import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "express";
import {
  buildApiSuccessResponse,
  isApiResponseEnvelope,
} from "../http/api-response";

/**
 * Interceptor para transformar respostas da API
 * Padroniza o formato de resposta e adiciona metadados
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // Se a resposta já foi enviada (ex: redirect, file download), não transformar
        if (response.headersSent) {
          return data;
        }

        // Se é uma resposta de erro, não transformar
        if (response.statusCode >= 400) {
          return data;
        }

        // Se é uma resposta de arquivo ou stream, não transformar
        if (data instanceof Buffer || data instanceof ArrayBuffer) {
          return data;
        }

        // Verificar se é uma resposta HTML (view rendering)
        const contentType = response.getHeader("content-type");
        if (contentType && contentType.toString().includes("text/html")) {
          return data;
        }

        // Se já está envelopado, apenas completa metadados ausentes.
        if (isApiResponseEnvelope(data)) {
          return {
            statusCode: response.statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            ...data,
          };
        }

        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          "meta" in data
        ) {
          return buildApiSuccessResponse({
            data: (data as { data: unknown }).data,
            meta: (data as { meta: unknown }).meta,
            statusCode: response.statusCode,
            path: request.url,
            method: request.method,
          });
        }

        return buildApiSuccessResponse({
          data,
          statusCode: response.statusCode,
          path: request.url,
          method: request.method,
        });
      }),
    );
  }
}
