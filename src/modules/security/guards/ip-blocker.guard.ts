import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Request } from "express";

import { SecurityService } from "../security.service";

@Injectable()
export class IpBlockerGuard implements CanActivate {
  private readonly logger = new Logger(IpBlockerGuard.name);

  constructor(private readonly securityService: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ipAddress = this.getClientIp(request);

    if (!ipAddress) {
      this.logger.warn("Não foi possível determinar o IP do cliente");
      return true; // Permitir se não conseguir determinar IP
    }

    const isBlocked = await this.securityService.isIpBlocked(ipAddress);

    if (isBlocked) {
      this.logger.warn(
        `Acesso bloqueado para IP: ${ipAddress} - Rota: ${request.path}`,
      );
      throw new ForbiddenException(
        "Seu endereço IP está bloqueado. Entre em contato com o administrador.",
      );
    }

    return true;
  }

  private getClientIp(request: Request): string | null {
    // Tenta obter IP de vários headers (útil quando atrás de proxy/load balancer)
    const headers = [
      "x-forwarded-for",
      "x-real-ip",
      "x-client-ip",
      "cf-connecting-ip", // Cloudflare
      "fastly-client-ip", // Fastly
      "x-cluster-client-ip",
      "x-forwarded",
      "forwarded-for",
      "forwarded",
    ];

    for (const header of headers) {
      const value = request.headers[header];
      if (value) {
        // x-forwarded-for pode ter múltiplos IPs, pega o primeiro
        const ip = Array.isArray(value) ? value[0] : value.split(",")[0];
        return ip.trim();
      }
    }

    // Fallback para IP da conexão
    return (
      request.socket.remoteAddress ||
      (request.connection as any)?.remoteAddress ||
      null
    );
  }
}
