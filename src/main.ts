// Import Sentry instrumentation before anything else!
import "./instrument";

import "module-alias/register";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger, LogLevel, RequestMethod } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
import RedisStore from "connect-redis";
import { Redis } from "ioredis";
import rateLimit from "express-rate-limit";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { DatabaseErrorInterceptor } from "./common/interceptors/database-error.interceptor";
import { RuntimeMetricsService } from "./modules/observability/runtime-metrics.service";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const environment = process.env.NODE_ENV || "development";
  const loggerLevels: LogLevel[] =
    environment === "production" ? ["error", "warn"] : ["error", "warn", "log"];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: loggerLevels,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port", 3000);
  const appEnvironment = configService.get<string>(
    "app.environment",
    "development",
  );
  const appName = configService.get<string>("app.name", "SGC-ITEP v2.0");
  const normalizePositiveInt = (
    value: string | number | undefined,
    fallback: number,
  ): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.floor(parsed)
      : fallback;
  };

  const rateLimitEnabled =
    configService.get<string>("RATE_LIMIT_ENABLED", "true") !== "false";
  const trustProxyHops = normalizePositiveInt(
    configService.get<string>("TRUST_PROXY_HOPS", "1"),
    1,
  );
  const globalRateLimitMax = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_GLOBAL_MAX", "1000"),
    1000,
  );
  const globalRateLimitWindowMs = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_GLOBAL_WINDOW_MS", "900000"),
    15 * 60 * 1000,
  );
  const uploadRateLimitMax = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_UPLOAD_MAX", "500"),
    500,
  );
  const uploadRateLimitWindowMs = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_UPLOAD_WINDOW_MS", "300000"),
    5 * 60 * 1000,
  );
  const loginRateLimitMax = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_LOGIN_MAX", "20"),
    20,
  );
  const loginRateLimitWindowMs = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_LOGIN_WINDOW_MS", "900000"),
    15 * 60 * 1000,
  );
  const registerRateLimitMax = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_REGISTER_MAX", "10"),
    10,
  );
  const registerRateLimitWindowMs = normalizePositiveInt(
    configService.get<string>("RATE_LIMIT_REGISTER_WINDOW_MS", "900000"),
    15 * 60 * 1000,
  );

  // Habilita trust proxy para rate limiting funcionar corretamente com proxies
  app.set("trust proxy", trustProxyHops);

  app.use(
    helmet({
      contentSecurityPolicy:
        appEnvironment === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                  "'self'",
                  "'unsafe-inline'",
                  "https://cdn.jsdelivr.net",
                  "https://cdnjs.cloudflare.com",
                ],
                scriptSrc: [
                  "'self'",
                  "https://cdn.jsdelivr.net",
                  "https://cdnjs.cloudflare.com",
                ],
                imgSrc: ["'self'", "data:", "https:"],
                fontSrc: [
                  "'self'",
                  "https://cdn.jsdelivr.net",
                  "https://cdnjs.cloudflare.com",
                ],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
              },
            }
          : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Helper para criar rate limiters
  const createRateLimiter = (
    max: number,
    message: string,
    windowMs = 15 * 60 * 1000,
  ) =>
    rateLimit({
      windowMs,
      max,
      message: {
        error: "Too Many Requests",
        message,
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

  if (rateLimitEnabled) {
    // Rate limit geral para todas as rotas da API (aumentado para uploads)
    app.use(
      "/api/",
      createRateLimiter(
        globalRateLimitMax,
        "Muitas requisições deste IP. Aguarde 15 minutos e tente novamente.",
        globalRateLimitWindowMs,
      ),
    );

    // Rate limit específico para upload de arquivos (mais permissivo)
    app.use(
      "/api/pastas/*/arquivos",
      createRateLimiter(
        uploadRateLimitMax,
        "Muitas tentativas de upload. Aguarde antes de tentar novamente.",
        uploadRateLimitWindowMs,
      ),
    );

    // Rate limit específico para login (mais restritivo)
    app.use(
      "/api/auth/login",
      createRateLimiter(
        loginRateLimitMax,
        "Muitas tentativas de login. Por segurança, aguarde 15 minutos antes de tentar novamente.",
        loginRateLimitWindowMs,
      ),
    );

    // Rate limit para registro de usuários
    app.use(
      "/api/auth/register",
      createRateLimiter(
        registerRateLimitMax,
        "Muitas tentativas de registro. Aguarde 15 minutos.",
        registerRateLimitWindowMs,
      ),
    );
  } else {
    logger.warn(
      "Rate limiting desativado (RATE_LIMIT_ENABLED=false). Use apenas em cenários controlados.",
    );
  }

  app.use(
    compression({
      threshold: 1024,
      level: 6,
      filter: (req, res) => {
        const accepts = req.headers.accept || "";
        if (
          typeof accepts === "string" &&
          accepts.includes("text/event-stream")
        ) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );
  app.use(cookieParser());

  const sessionConfig = configService.get("auth.session");
  const allowMemorySessionStoreFlag =
    configService.get<string>("ALLOW_MEMORY_SESSION_STORE", "false") === "true";
  const allowMemorySessionStore =
    appEnvironment !== "production" && allowMemorySessionStoreFlag;

  if (appEnvironment === "production" && allowMemorySessionStoreFlag) {
    logger.warn(
      "ALLOW_MEMORY_SESSION_STORE=true foi ignorado em produção. Redis é obrigatório para sessões.",
    );
  }

  // Configura Redis como session store quando disponível
  const redisUrl = configService.get<string>("REDIS_URL");
  const redisHost = configService.get<string>("REDIS_HOST");
  let sessionStore: RedisStore | undefined;

  if (redisUrl || redisHost) {
    try {
      const redisClient = redisUrl
        ? new Redis(redisUrl)
        : new Redis({
            host: redisHost,
            port: configService.get<number>("REDIS_PORT", 6379),
            password: configService.get<string>("REDIS_PASSWORD") || undefined,
            db: configService.get<number>("REDIS_DB", 0),
          });

      redisClient.on("error", (err) => {
        logger.error(`Redis session store error: ${err.message}`);
      });

      redisClient.on("connect", () => {
        logger.log("Redis session store connected");
      });

      const pingResult = await redisClient.ping();
      if (pingResult !== "PONG") {
        throw new Error(
          `Redis ping retornou valor inesperado durante bootstrap: ${pingResult}`,
        );
      }

      sessionStore = new RedisStore({
        client: redisClient,
        prefix: "sgc:sess:",
        ttl: Math.floor((sessionConfig.maxAge || 86400000) / 1000),
      });

      logger.log("Session store: Redis");
    } catch (err) {
      const message = `Falha ao conectar Redis para sessões: ${err.message}`;
      if (allowMemorySessionStore) {
        logger.warn(`${message}. Usando fallback em memória neste ambiente.`);
      } else {
        throw new Error(`${message}. Fallback em memória desabilitado.`);
      }
    }
  } else if (allowMemorySessionStore) {
    logger.warn(
      "Session store: in-memory (configure REDIS_URL for production)",
    );
  } else {
    throw new Error(
      "REDIS_URL/REDIS_HOST não configurados e fallback em memória desabilitado.",
    );
  }

  app.use(
    session({
      store: sessionStore,
      secret: sessionConfig.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: sessionConfig.secure,
        httpOnly: sessionConfig.httpOnly,
        maxAge: sessionConfig.maxAge,
        sameSite: sessionConfig.sameSite,
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Rejeitar propriedades não declaradas nos DTOs
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false, // Sempre mostrar erros para debug
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints
            ? Object.values(error.constraints).join(", ")
            : "Validation failed";
          return `${error.property}: ${constraints}`;
        });
        logger.error(`Validation failed: ${messages.join(" | ")}`);
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix("api", {
    exclude: [
      "/",
      { path: "health", method: RequestMethod.GET },
      { path: "ready", method: RequestMethod.GET },
    ],
  });

  app.useGlobalInterceptors(
    new LoggingInterceptor(app.get(RuntimeMetricsService)),
    new TransformInterceptor(),
    new DatabaseErrorInterceptor(),
  );

  if (appEnvironment !== "production") {
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription("Sistema de Gestão de Conteúdo - ITEP/RN")
      .setVersion(configService.get<string>("app.version", "2.0.0"))
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .addCookieAuth("connect.sid", {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid",
        description: "Session cookie",
      })
      .addTag("auth", "Autenticação e Autorização")
      .addTag("users", "Gestão de Usuários")
      .addTag("nugecid", "NUGECID - Desarquivamentos")
      .addTag("auditoria", "Auditoria e Logs")
      .addServer(
        configService.get<string>("app.baseUrl", `http://localhost:${port}`),
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });

    SwaggerModule.setup("api/docs", app, document, {
      customSiteTitle: `${appName} - API Documentation`,
      customfavIcon: "/public/favicon.ico",
      customCss: ".swagger-ui .topbar { display: none }",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });
  }

  const corsConfig = configService.get("app.cors");
  app.enableCors({
    origin: corsConfig.origin,
    credentials: corsConfig.credentials,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
  });

  app.set("etag", false);

  process.on("SIGTERM", async () => {
    logger.log("Encerrando (SIGTERM)...");
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.log("Encerrando (SIGINT)...");
    await app.close();
    process.exit(0);
  });

  await app.listen(port, "0.0.0.0");

  // Logs essenciais de startup
  logger.log(`Servidor iniciado: http://localhost:${port}`);
  if (appEnvironment !== "production") {
    logger.log(`Docs: http://localhost:${port}/api/docs`);
  }

  // Verificação rápida de conectividade com o banco
  try {
    const dataSource = app.get(DataSource);
    await dataSource.query("SELECT 1");
    logger.log("Conectividade com o banco OK (SELECT 1)");
  } catch (e) {
    logger.error(`Falha na verificação de conexão com o banco: ${e.message}`);
  }
}

bootstrap();
