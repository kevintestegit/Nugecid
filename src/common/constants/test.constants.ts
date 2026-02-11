/**
 * Constantes de teste para uso em arquivos de especificação (.spec.ts)
 *
 * NOTA: Estas constantes são EXCLUSIVAMENTE para uso em testes automatizados.
 * Nunca use estas credenciais em código de produção.
 *
 * @security As credenciais aqui são fictícias e usadas apenas em ambientes de teste isolados.
 */

// Credenciais de teste para autenticação
export const TEST_CREDENTIALS = {
  /** Senha padrão para usuários de teste */
  DEFAULT_PASSWORD: process.env.TEST_PASSWORD || "password123",
  /** Senha de administrador para testes */
  ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || "admin123",
  /** Senha inválida para testes de falha de autenticação */
  INVALID_PASSWORD: "wrongpassword",
} as const;

// Tokens de teste para JWT
export const TEST_TOKENS = {
  /** Token JWT mock para testes */
  MOCK_JWT_TOKEN: "mock-jwt-token",
  /** Token JWT mock com expiração de 50 minutos */
  MOCK_JWT_TOKEN_50M: "mock-jwt-token-50m",
  /** Token JWT inválido para testes de rejeição */
  INVALID_JWT_TOKEN: "invalid.jwt.token",
} as const;

// Configurações de teste
export const TEST_CONFIG = {
  /** Secret JWT para ambiente de teste */
  JWT_SECRET: process.env.TEST_JWT_SECRET || "test-secret",
  /** Tempo de expiração do JWT para testes */
  JWT_EXPIRATION_TIME: "50m",
  /** Rounds para hash bcrypt em testes (menor para performance) */
  BCRYPT_ROUNDS: 12,
} as const;

// Usuários de teste padrão
export const TEST_USERS = {
  ADMIN: {
    nome: "Admin",
    usuario: "admin",
    email: "admin@itep.rn.gov.br",
  },
  REGULAR: {
    nome: "Test User",
    usuario: "testuser",
    email: "test@example.com",
  },
  INACTIVE: {
    nome: "Inactive User",
    usuario: "inactive",
    email: "inactive@itep.rn.gov.br",
  },
  BLOCKED: {
    nome: "Blocked User",
    usuario: "blocked",
    email: "blocked@itep.rn.gov.br",
  },
} as const;
