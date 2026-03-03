import { captureMonitoringException } from "@/lib/monitoring";

/**
 * Serviço de Logging centralizado para o frontend
 *
 * Este serviço fornece uma abstração para logging que:
 * - Desabilita logs em produção (exceto erros críticos)
 * - Permite configuração de níveis de log
 * - Pode ser facilmente integrado com serviços externos (Sentry, LogRocket, etc.)
 *
 * @security Não loga informações sensíveis em produção
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
  sendToServer: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

const defaultConfig: LoggerConfig = {
  enabled: isDevelopment,
  minLevel: isProduction ? "error" : "debug",
  includeTimestamp: true,
  sendToServer: isProduction,
};

class Logger {
  private config: LoggerConfig;
  private context: string;

  constructor(context: string = "App", config: Partial<LoggerConfig> = {}) {
    this.context = context;
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled && level !== "error") {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.config.includeTimestamp
      ? `[${new Date().toISOString()}] `
      : "";
    return `${timestamp}[${this.context}] [${level.toUpperCase()}] ${message}`;
  }

  private sanitizeData(data: unknown): unknown {
    if (!data) return data;

    // Lista de campos sensíveis que não devem ser logados
    const sensitiveFields = [
      "password",
      "senha",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "apiKey",
      "authorization",
      "cookie",
      "session",
      "creditCard",
      "cardNumber",
      "cvv",
      "cpf",
      "rg",
    ];

    if (typeof data === "object" && data !== null) {
      const sanitized = { ...data } as Record<string, unknown>;
      for (const key of Object.keys(sanitized)) {
        if (
          sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          sanitized[key] = "[REDACTED]";
        } else if (typeof sanitized[key] === "object") {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      return sanitized;
    }

    return data;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      console.debug(
        this.formatMessage("debug", message),
        data ? this.sanitizeData(data) : "",
      );
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      console.info(
        this.formatMessage("info", message),
        data ? this.sanitizeData(data) : "",
      );
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      console.warn(
        this.formatMessage("warn", message),
        data ? this.sanitizeData(data) : "",
      );
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog("error")) {
      const sanitizedError = this.sanitizeData(error);
      console.error(this.formatMessage("error", message), sanitizedError);

      // Em produção, enviar erros para um serviço de monitoramento
      if (this.config.sendToServer && isProduction) {
        this.sendErrorToServer(message, sanitizedError);
      }
    }
  }

  private async sendErrorToServer(
    message: string,
    error: unknown,
  ): Promise<void> {
    try {
      captureMonitoringException(error, {
        tags: {
          logger_context: this.context,
        },
        extra: {
          message,
        },
      });
    } catch {
      // Silenciosamente falha para não causar loop de erros
    }
  }

  /**
   * Cria um novo logger com contexto diferente
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`, this.config);
  }
}

// Exportar instância padrão e factory
export const logger = new Logger();

export function createLogger(
  context: string,
  config?: Partial<LoggerConfig>,
): Logger {
  return new Logger(context, config);
}

// Exportar tipos para uso externo
export type { LogLevel, LoggerConfig };
