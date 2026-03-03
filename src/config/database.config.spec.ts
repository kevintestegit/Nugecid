import { buildSslConfigFromEnv } from "./database.config";

const ORIGINAL_ENV = { ...process.env };

describe("buildSslConfigFromEnv", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.DATABASE_SSL;
    delete process.env.DATABASE_SSL_CA;
    delete process.env.DATABASE_SSL_ALLOW_UNAUTHORIZED;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("retorna false quando DATABASE_SSL não está ativo", () => {
    expect(buildSslConfigFromEnv()).toBe(false);
  });

  it("usa CA com rejectUnauthorized em produção", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_SSL = "true";
    process.env.DATABASE_SSL_CA =
      "-----BEGIN CERTIFICATE-----\\nCA\\n-----END CERTIFICATE-----";

    expect(buildSslConfigFromEnv()).toEqual({
      rejectUnauthorized: true,
      ca: "-----BEGIN CERTIFICATE-----\nCA\n-----END CERTIFICATE-----",
    });
  });

  it("bloqueia SSL sem CA em produção por padrão", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_SSL = "true";

    expect(() => buildSslConfigFromEnv()).toThrow(
      "DATABASE_SSL_CA é obrigatório em produção",
    );
  });

  it("permite exceção explícita para SSL sem CA", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_SSL = "true";
    process.env.DATABASE_SSL_ALLOW_UNAUTHORIZED = "true";

    expect(buildSslConfigFromEnv()).toEqual({ rejectUnauthorized: false });
  });
});
