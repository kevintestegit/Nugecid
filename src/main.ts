import "module-alias/register";
import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe, Logger, BadRequestException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { join } from "path";
import helmet from "helmet";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
import rateLimit from "express-rate-limit";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { DatabaseErrorInterceptor } from "./common/interceptors/database-error.interceptor";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port", 3000);
  const environment = configService.get<string>(
    "app.environment",
    "development",
  );
  const appName = configService.get<string>("app.name", "SGC-ITEP v2.0");

  // Habilita trust proxy para rate limiting funcionar corretamente com proxies
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy:
        environment === "production"
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
                  "'unsafe-inline'",
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
              },
            }
          : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const rateLimitConfig = configService.get("app.security.rateLimit");
  app.use(
    rateLimit({
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.max,
      message: {
        error: "Too Many Requests",
        message: "Muitas requisições deste IP, tente novamente mais tarde.",
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(compression());
  app.use(cookieParser());

  const sessionConfig = configService.get("auth.session");
  app.use(
    session({
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

  app.useStaticAssets(join(__dirname, "..", "public"), { prefix: "/public/" });

  const uploadPath = configService.get<string>("app.uploadPath");
  app.useStaticAssets(uploadPath, { prefix: "/uploads/" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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
    exclude: ["/"],
  });

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new DatabaseErrorInterceptor(),
  );

  if (environment !== "production") {
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
  if (environment !== "production") {
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
