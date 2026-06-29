import { z } from "zod";

type EnvMap = Record<string, string | undefined>;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.string().regex(/^\d+$/).optional(),
  APP_PORT: z.string().regex(/^\d+$/).optional(),
  HOST_BACKEND_PORT: z.string().regex(/^\d+$/).optional(),
  HOST_FRONTEND_PORT: z.string().regex(/^\d+$/).optional(),
  DATABASE_HOST: z.string().min(1).optional(),
  DATABASE_PORT: z.string().regex(/^\d+$/).optional(),
  DATABASE_USERNAME: z.string().min(1).optional(),
  DATABASE_PASSWORD: z.string().min(1).optional(),
  DATABASE_NAME: z.string().min(1).optional(),
  DATABASE_SSL: z.enum(["true", "false"]).optional(),
  DATABASE_SSL_CA: z.string().optional(),
  DATABASE_SSL_ALLOW_UNAUTHORIZED: z.enum(["true", "false"]).optional(),
  REDIS_URL: z.string().min(1).optional(),
  REDIS_HOST: z.string().min(1).optional(),
  REDIS_PORT: z.string().regex(/^\d+$/).optional(),
  ALLOW_MEMORY_SESSION_STORE: z.enum(["true", "false"]).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(1).optional(),
  SESSION_SECURE: z.enum(["true", "false", "auto"]).optional(),
  MAX_LOGIN_ATTEMPTS: z.string().regex(/^\d+$/).optional(),
  LOCKOUT_DURATION: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_ENABLED: z.enum(["true", "false"]).optional(),
  RATE_LIMIT_GLOBAL_MAX: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_LOGIN_MAX: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_LOGIN_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_REGISTER_MAX: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_REGISTER_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_UPLOAD_MAX: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_UPLOAD_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
  TRUST_PROXY_HOPS: z.string().regex(/^\d+$/).optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().regex(/^\d+$/).optional(),
  EMAIL_SECURE: z.enum(["true", "false"]).optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  DATABASE_POOL_MAX: z.string().regex(/^\d+$/).optional(),
  DATABASE_POOL_MIN: z.string().regex(/^\d+$/).optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "s3"]).optional(),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_SECRET_KEY: z.string().optional(),
  STORAGE_S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).optional(),
  STORAGE_S3_AUTO_CREATE_BUCKET: z.enum(["true", "false"]).optional(),
  CLAMAV_ENABLED: z.enum(["true", "false"]).optional(),
  CLAMAV_HOST: z.string().optional(),
  CLAMAV_PORT: z.string().regex(/^\d+$/).optional(),
  CLAMAV_TIMEOUT_MS: z.string().regex(/^\d+$/).optional(),
  CLAMAV_FAIL_OPEN: z.enum(["true", "false"]).optional(),
  OCR_ENABLED: z.enum(["true", "false"]).optional(),
  OCR_COMMAND: z.string().optional(),
  OCR_LANGUAGE: z.string().optional(),
  OCR_TIMEOUT_MS: z.string().regex(/^\d+$/).optional(),
  OCR_TESSERACT_TIMEOUT: z.string().regex(/^\d+$/).optional(),
  OCR_FAIL_OPEN: z.enum(["true", "false"]).optional(),
  SEARCH_ENABLED: z.enum(["true", "false"]).optional(),
  SEARCH_MEILI_HOST: z.string().optional(),
  SEARCH_MEILI_API_KEY: z.string().optional(),
  SEARCH_MEILI_INDEX: z.string().optional(),
  SEARCH_FAIL_OPEN: z.enum(["true", "false"]).optional(),
  SEARCH_BOOTSTRAP_ON_START: z.enum(["true", "false"]).optional(),
  BACKUP_HTTP_RESTORE_ENABLED: z.enum(["true", "false"]).optional(),
  WEB_PUSH_VAPID_PUBLIC_KEY: z.string().optional(),
  WEB_PUSH_VAPID_PRIVATE_KEY: z.string().optional(),
  WEB_PUSH_VAPID_SUBJECT: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  BASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  FEATURE_QUEUE_ENABLED: z.enum(["true", "false"]).optional(),
  ESCAVADOR_WEBHOOK_TOLERANCE_SECONDS: z.string().regex(/^\d+$/).optional(),
  ESCAVADOR_WEBHOOK_ALLOW_LEGACY_TOKEN: z.enum(["true", "false"]).optional(),
});

const isPlaceholderSecret = (value: string | undefined): boolean => {
  if (!value) return true;
  return (
    value.includes("change-in-production") ||
    value.includes("change-me") ||
    value.includes("replace-with")
  );
};

const isLocalUrl = (value: string | undefined): boolean => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
};

const isLocalUrlList = (value: string | undefined): boolean => {
  if (!value) return false;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .every(isLocalUrl);
};

const allowsLocalAutoSecureSession = (env: EnvMap): boolean =>
  env.SESSION_SECURE === "auto" &&
  [env.FRONTEND_URL, env.CORS_ORIGIN, env.BASE_URL]
    .filter((value): value is string => Boolean(value))
    .every(isLocalUrlList);

const allowsLocalInsecureSession = (env: EnvMap): boolean =>
  env.SESSION_SECURE === "false" &&
  [env.FRONTEND_URL, env.CORS_ORIGIN, env.BASE_URL]
    .filter((value): value is string => Boolean(value))
    .every(isLocalUrlList);

const applyLegacyAliases = (source: EnvMap): EnvMap => {
  const env = { ...source };
  const legacyAliases: Array<{ legacy: string; canonical: string }> = [
    { legacy: "MAIL_HOST", canonical: "EMAIL_HOST" },
    { legacy: "MAIL_PORT", canonical: "EMAIL_PORT" },
    { legacy: "MAIL_SECURE", canonical: "EMAIL_SECURE" },
    { legacy: "MAIL_USER", canonical: "EMAIL_USER" },
    { legacy: "MAIL_PASS", canonical: "EMAIL_PASSWORD" },
    { legacy: "MAIL_FROM", canonical: "EMAIL_FROM" },
    { legacy: "HOST_HTTP_PORT", canonical: "HOST_BACKEND_PORT" },
  ];

  for (const { legacy, canonical } of legacyAliases) {
    if (!env[canonical] && env[legacy]) {
      env[canonical] = env[legacy];
      // Warning forte para forcar migracao limpa sem quebrar deploy existente.
      // eslint-disable-next-line no-console
      console.warn(
        `[ENV][DEPRECATED] ${legacy} is deprecated; use ${canonical}.`,
      );
    }
  }

  return env;
};

const REQUIRED_IN_PRODUCTION = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "SESSION_SECRET",
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_USERNAME",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
  "FRONTEND_URL",
  "CORS_ORIGIN",
] as const;

export function validateEnvironment(): void {
  const normalized = applyLegacyAliases(process.env);

  for (const [key, value] of Object.entries(normalized)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }

  const parsed = envSchema.safeParse(normalized);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`[ENV] Invalid environment variables: ${details}`);
  }

  const envName = normalized.NODE_ENV || "development";
  if (envName !== "production") return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !normalized[key]);
  if (missing.length > 0) {
    throw new Error(
      `[ENV] Missing required production variables: ${missing.join(", ")}`,
    );
  }

  if (!normalized.REDIS_URL && !normalized.REDIS_HOST) {
    throw new Error(
      "[ENV] Redis obrigatório em produção: defina REDIS_URL ou REDIS_HOST.",
    );
  }

  if (normalized.ALLOW_MEMORY_SESSION_STORE === "true") {
    throw new Error(
      "[ENV] ALLOW_MEMORY_SESSION_STORE=true não é permitido em produção.",
    );
  }

  if (
    normalized.SESSION_SECURE !== "true" &&
    !allowsLocalAutoSecureSession(normalized) &&
    !allowsLocalInsecureSession(normalized)
  ) {
    throw new Error("[ENV] SESSION_SECURE deve ser true em produção.");
  }

  const failOpenFlags = [
    "OCR_FAIL_OPEN",
    "SEARCH_FAIL_OPEN",
    "CLAMAV_FAIL_OPEN",
  ].filter((key) => normalized[key] === "true");
  if (failOpenFlags.length > 0) {
    throw new Error(
      `[ENV] OCR_FAIL_OPEN, SEARCH_FAIL_OPEN e CLAMAV_FAIL_OPEN devem ser false em produção: ${failOpenFlags.join(", ")}`,
    );
  }

  if (normalized.STORAGE_DRIVER === "s3") {
    const missingS3 = ["STORAGE_S3_ACCESS_KEY", "STORAGE_S3_SECRET_KEY"].filter(
      (key) => isPlaceholderSecret(normalized[key]),
    );
    if (missingS3.length > 0) {
      throw new Error(
        `[ENV] Missing required S3 production variables: ${missingS3.join(", ")}`,
      );
    }
  }

  if (
    normalized.SEARCH_ENABLED === "true" &&
    isPlaceholderSecret(normalized.SEARCH_MEILI_API_KEY)
  ) {
    throw new Error(
      "[ENV] Missing required search production variables: SEARCH_MEILI_API_KEY",
    );
  }

  const weakSecrets = ["JWT_SECRET", "JWT_REFRESH_SECRET", "SESSION_SECRET"]
    .filter((key) => isPlaceholderSecret(normalized[key]))
    .join(", ");
  if (weakSecrets) {
    throw new Error(
      `[ENV] Weak/placeholder secrets in production: ${weakSecrets}`,
    );
  }
}
