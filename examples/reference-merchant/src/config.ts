import { readFileSync } from "node:fs";

export interface MerchantConfig {
  mode: "simulator" | "certification" | "production";
  port: number;
  /** Bind address. 127.0.0.1 by default; 0.0.0.0 inside containers behind a TLS proxy. */
  host: string;
  /** When set, /admin/* requires `Authorization: Bearer <token>`. Required outside simulator mode. */
  adminToken: string | undefined;
  /** smtps://user:pass@host:465 ; when unset the outbox mailer is used. */
  smtpUrl: string | undefined;
  smtpFrom: string;
  /** Public origin used to build return/fail URLs (must be https outside simulator mode). */
  publicUrl: string;
  /** libSQL URL: file:…, :memory:, or libsql://… with dbAuthToken (Turso). */
  dbUrl: string;
  dbAuthToken: string | undefined;
  outboxDir: string;
  captchaSecret: string;
  satim: { username: string; password: string; terminalId: string; baseUrl: string | undefined };
  /** Orders still "registered" after this many seconds are reconciled by the closed-browser job. */
  reconcileAfterSeconds: number;
}

export function loadDotEnv(path = ".env"): void {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!;
    }
  } catch {
    /* optional */
  }
}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): MerchantConfig {
  const mode = (env["MERCHANT_MODE"] ?? "simulator") as MerchantConfig["mode"];
  const port = Number(env["MERCHANT_PORT"] ?? 3000);
  const publicUrl = env["MERCHANT_PUBLIC_URL"] ?? `http://localhost:${port}`;
  const satim =
    mode === "simulator"
      ? { username: "user", password: "secret", terminalId: "E0000000000", baseUrl: env["SATIM_BASE_URL"] }
      : {
          username: required(env, "SATIM_USERNAME"),
          password: required(env, "SATIM_PASSWORD"),
          terminalId: required(env, "SATIM_TERMINAL_ID"),
          baseUrl: env["SATIM_BASE_URL"],
        };
  const adminToken = env["MERCHANT_ADMIN_TOKEN"] || undefined;
  if (mode !== "simulator" && !adminToken) throw new Error("MERCHANT_ADMIN_TOKEN is required outside simulator mode");
  return {
    mode,
    port,
    host: env["MERCHANT_HOST"] ?? "127.0.0.1",
    adminToken,
    smtpUrl: env["SMTP_URL"] || undefined,
    smtpFrom: env["SMTP_FROM"] ?? "receipts@merchant.example",
    publicUrl,
    dbUrl: env["MERCHANT_DB_URL"] ?? (env["MERCHANT_DB"] ? `file:${env["MERCHANT_DB"]}` : "file:examples/reference-merchant/data/merchant.sqlite"),
    dbAuthToken: env["MERCHANT_DB_AUTH_TOKEN"] || env["TURSO_AUTH_TOKEN"] || undefined,
    outboxDir: env["MERCHANT_OUTBOX"] ?? "examples/reference-merchant/outbox",
    captchaSecret: env["MERCHANT_CAPTCHA_SECRET"] ?? "dev-only-change-me",
    satim,
    reconcileAfterSeconds: Number(env["MERCHANT_RECONCILE_AFTER"] ?? 600),
  };
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const v = env[key];
  if (!v) throw new Error(`${key} is required in mode ${env["MERCHANT_MODE"]}`);
  return v;
}
