import { validateEnvironment } from "./validation";

const ORIGINAL_ENV = { ...process.env };

const applyProductionBaseEnv = () => {
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "x".repeat(64);
  process.env.JWT_REFRESH_SECRET = "y".repeat(64);
  process.env.SESSION_SECRET = "z".repeat(64);
  process.env.DATABASE_HOST = "db";
  process.env.DATABASE_PORT = "5432";
  process.env.DATABASE_USERNAME = "sgc";
  process.env.DATABASE_PASSWORD = "password";
  process.env.DATABASE_NAME = "sgc";
  process.env.FRONTEND_URL = "https://frontend.example.com";
  process.env.CORS_ORIGIN = "https://frontend.example.com";
  process.env.CLAMAV_ENABLED = "true";
};

describe("validateEnvironment", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("deve exigir Redis em produção", () => {
    applyProductionBaseEnv();
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;

    expect(() => validateEnvironment()).toThrow(
      "Redis obrigatório em produção",
    );
  });

  it("deve bloquear fallback de memória em produção", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    process.env.ALLOW_MEMORY_SESSION_STORE = "true";

    expect(() => validateEnvironment()).toThrow(
      "ALLOW_MEMORY_SESSION_STORE=true não é permitido em produção",
    );
  });

  it("deve exigir FRONTEND_URL em produção", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    delete process.env.FRONTEND_URL;

    expect(() => validateEnvironment()).toThrow(
      "Missing required production variables: FRONTEND_URL",
    );
  });

  it("deve bloquear SESSION_SECURE diferente de true em produção pública", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    process.env.SESSION_SECURE = "auto";

    expect(() => validateEnvironment()).toThrow(
      "SESSION_SECURE deve ser true em produção",
    );
  });

  it("deve aceitar SESSION_SECURE auto em produção local via localhost", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    process.env.SESSION_SECURE = "auto";
    process.env.FRONTEND_URL = "http://localhost:3001";
    process.env.CORS_ORIGIN = "http://localhost:3000,http://localhost:3001";
    process.env.BASE_URL = "http://localhost:8080";

    expect(() => validateEnvironment()).not.toThrow();
  });

  it("deve aceitar SESSION_SECURE false em produção local via localhost", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    process.env.SESSION_SECURE = "false";
    process.env.FRONTEND_URL = "http://localhost:3001";
    process.env.CORS_ORIGIN = "http://localhost:3000,http://localhost:3001";
    process.env.BASE_URL = "http://localhost:8080";

    expect(() => validateEnvironment()).not.toThrow();
  });

  it("deve bloquear fail-open de OCR e busca em produção", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    process.env.SESSION_SECURE = "true";
    process.env.OCR_FAIL_OPEN = "true";
    process.env.SEARCH_FAIL_OPEN = "true";

    expect(() => validateEnvironment()).toThrow(
      "OCR_FAIL_OPEN, SEARCH_FAIL_OPEN e CLAMAV_FAIL_OPEN devem ser false em produção",
    );
  });

  it("deve exigir credenciais S3 quando storage S3 estiver ativo em produção", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    process.env.SESSION_SECURE = "true";
    process.env.STORAGE_DRIVER = "s3";
    delete process.env.STORAGE_S3_ACCESS_KEY;
    delete process.env.STORAGE_S3_SECRET_KEY;

    expect(() => validateEnvironment()).toThrow(
      "Missing required S3 production variables",
    );
  });

  it("deve exigir chave Meilisearch quando busca estiver ativa em produção", () => {
    applyProductionBaseEnv();
    process.env.REDIS_HOST = "redis";
    process.env.SESSION_SECURE = "true";
    process.env.SEARCH_ENABLED = "true";
    delete process.env.SEARCH_MEILI_API_KEY;

    expect(() => validateEnvironment()).toThrow(
      "Missing required search production variables",
    );
  });

  it("deve aplicar alias legado MAIL_* para EMAIL_*", () => {
    process.env.NODE_ENV = "development";
    process.env.MAIL_HOST = "smtp.local";
    delete process.env.EMAIL_HOST;

    validateEnvironment();

    expect(process.env.EMAIL_HOST).toBe("smtp.local");
  });

  it("aceita BACKUP_HTTP_RESTORE_ENABLED booleano válido", () => {
    process.env.NODE_ENV = "development";
    process.env.BACKUP_HTTP_RESTORE_ENABLED = "false";

    expect(() => validateEnvironment()).not.toThrow();
  });
});
