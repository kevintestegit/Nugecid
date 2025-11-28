import { registerAs } from "@nestjs/config";
import * as crypto from "crypto";

function validateSecret(
  secret: string | undefined,
  secretName: string,
): string {
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `${secretName} must be set in production environment. ` +
          `Generate a strong secret using: openssl rand -hex 32`,
      );
    }
    return crypto.randomBytes(32).toString("hex");
  }

  if (
    secret.includes("change-in-production") ||
    secret.includes("change-me") ||
    secret.includes("replace-with")
  ) {
    throw new Error(
      `${secretName} is using a default/placeholder value! ` +
        `This is not secure.`,
    );
  }

  if (secret.length < 32) {
    console.warn(`WARNING: ${secretName} is less than 32 characters.`);
  }

  return secret;
}

export default registerAs("auth", () => {
  const nodeEnv = process.env.NODE_ENV || "development";

  return {
    jwt: {
      secret: validateSecret(process.env.JWT_SECRET, "JWT_SECRET"),
      expiresIn: process.env.JWT_EXPIRES_IN || "50m",
      refreshSecret: validateSecret(
        process.env.JWT_REFRESH_SECRET,
        "JWT_REFRESH_SECRET",
      ),
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    session: {
      secret: validateSecret(process.env.SESSION_SECRET, "SESSION_SECRET"),
      maxAge: parseInt(process.env.SESSION_MAX_AGE || "86400000", 10),
      secure: nodeEnv === "production",
      httpOnly: true,
      sameSite: "strict" as const,
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    },
    lockout: {
      maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || "900000", 10),
    },
  };
});
