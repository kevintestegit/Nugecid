import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "express";

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

        // Se o data já tem a estrutura esperada, retornar como está
        if (data && typeof data === "object" && "success" in data) {
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

        // Transformar resposta para formato padrão
        const transformedResponse = {
          success: true,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          data: data,
        };

        // Adicionar metadados de paginação se existirem
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          "meta" in data
        ) {
          transformedResponse.data = data.data;
          transformedResponse["meta"] = data.meta;
        }

        return transformedResponse;
      }),
    );
  }
}
