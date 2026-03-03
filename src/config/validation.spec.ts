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

  it("deve aplicar alias legado MAIL_* para EMAIL_*", () => {
    process.env.NODE_ENV = "development";
    process.env.MAIL_HOST = "smtp.local";
    delete process.env.EMAIL_HOST;

    validateEnvironment();

    expect(process.env.EMAIL_HOST).toBe("smtp.local");
  });
});

