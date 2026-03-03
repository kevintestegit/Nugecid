#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const args = process.argv.slice(2);
const shouldWriteEnv = args.includes("--write-env");
const envPathArgIndex = args.findIndex((arg) => arg === "--env-file");
const envFile =
  envPathArgIndex >= 0 && args[envPathArgIndex + 1]
    ? args[envPathArgIndex + 1]
    : ".env";

const keys = webpush.generateVAPIDKeys();
const subject = "mailto:admin@example.com";

const entries = {
  WEB_PUSH_VAPID_PUBLIC_KEY: keys.publicKey,
  WEB_PUSH_VAPID_PRIVATE_KEY: keys.privateKey,
  WEB_PUSH_VAPID_SUBJECT: subject,
};

const upsertEnvContent = (content, key, value) => {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  return `${content}${suffix}${line}\n`;
};

if (shouldWriteEnv) {
  const resolvedEnvPath = path.resolve(process.cwd(), envFile);
  const currentContent = fs.existsSync(resolvedEnvPath)
    ? fs.readFileSync(resolvedEnvPath, "utf8")
    : "";

  const nextContent = Object.entries(entries).reduce(
    (content, [key, value]) => upsertEnvContent(content, key, value),
    currentContent,
  );

  fs.writeFileSync(resolvedEnvPath, nextContent, "utf8");
  process.stdout.write(
    `Chaves VAPID gravadas em ${path.relative(process.cwd(), resolvedEnvPath)}\n`,
  );
  process.exit(0);
}

process.stdout.write(
  [
    `WEB_PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}`,
    `WEB_PUSH_VAPID_PRIVATE_KEY=${keys.privateKey}`,
    `WEB_PUSH_VAPID_SUBJECT=${subject}`,
  ].join("\n") + "\n",
);
