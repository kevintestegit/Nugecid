// src/config/app.config.ts
import { registerAs } from "@nestjs/config";
import { join } from "path";

export default registerAs("app", () => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : [frontendUrl];

  return {
    name: process.env.APP_NAME || "SGC-ITEP v2.0",
    version: process.env.APP_VERSION || "2.0.0",
    description:
      process.env.APP_DESCRIPTION || "Sistema de Gestão de Conteúdo - ITEP",

    // Server Configuration
    port: parseInt(process.env.PORT || "3000"),
    host: process.env.HOST || "0.0.0.0",

    // Environment
    environment: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",

    // URLs
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    frontendUrl,

    // File Upload
    uploadPath: process.env.UPLOAD_PATH || join(process.cwd(), "uploads"),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB
    allowedFileTypes: (
      process.env.ALLOWED_FILE_TYPES || "pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif"
    ).split(","),

    // Pagination
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || "20"),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || "100"),

    // Rate Limiting
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || "60"), // seconds
      limit: parseInt(process.env.THROTTLE_LIMIT || "10"), // requests per ttl
    },

    // CORS
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Skip-Auth-Redirect",
        "X-CSRF-Token",
      ],
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || "info",
      format: process.env.LOG_FORMAT || "combined",
      file: process.env.LOG_FILE || "logs/app.log",
    },

    // Security
    security: {
      helmet: {
        contentSecurityPolicy: process.env.NODE_ENV === "production",
        crossOriginEmbedderPolicy: false,
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || "100"), // requests per window
      },
    },

    // Cache
    cache: {
      ttl: parseInt(process.env.CACHE_TTL || "300"), // 5 minutes
      max: parseInt(process.env.CACHE_MAX || "100"), // max items
    },

    // Email
    email: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM || "noreply@itep.rn.gov.br",
    },

    // Features Flags
    features: {
      enableAuditLog: process.env.ENABLE_AUDIT_LOG !== "false",
      enableFileUpload: process.env.ENABLE_FILE_UPLOAD !== "false",
      enableNotifications: process.env.ENABLE_NOTIFICATIONS === "true",
      enableExcelImport: process.env.ENABLE_EXCEL_IMPORT !== "false",
      enableBarcodeGeneration:
        process.env.ENABLE_BARCODE_GENERATION !== "false",
    },

    webPush: {
      vapidPublicKey: process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
      subject: process.env.WEB_PUSH_VAPID_SUBJECT,
    },
  };
});
