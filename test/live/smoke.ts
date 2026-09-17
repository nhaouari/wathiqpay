/**
 * Opt-in live smoke test against the SATIM certification environment.
 * Reads credentials from the environment (or a gitignored .env file).
 * It registers one order and acknowledges it before any payment, which
 * should yield OrderStatus 0 ("registered"). It does not refund.
 */
import { readFileSync } from "node:fs";
import { createClient, classifyPayment, redact, isWathiqPayError } from "../../src/index.js";

function loadDotEnv(): void {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!;
    }
  } catch {
    /* no .env file */
  }
}
loadDotEnv();

const env = process.env;
const required = ["SATIM_USERNAME", "SATIM_PASSWORD", "SATIM_TERMINAL_ID"] as const;
const missing = required.filter((k) => !env[k]);
if (missing.length) {
  console.error(`live smoke skipped: missing ${missing.join(", ")}`);
  process.exit(2);
}

const environment = (env["SATIM_ENVIRONMENT"] ?? "certification") as "certification" | "production";
const client = createClient({
  environment,
  ...(env["SATIM_BASE_URL"] ? { baseUrl: env["SATIM_BASE_URL"] } : {}),
  username: env["SATIM_USERNAME"]!,
  password: env["SATIM_PASSWORD"]!,
  terminalId: env["SATIM_TERMINAL_ID"]!,
  timeoutMs: 30_000,
});

const orderNumber = `L${Date.now().toString(36).toUpperCase().slice(-9)}`; // <= 10 alphanumeric chars
const amount = { value: env["SATIM_LIVE_AMOUNT"] ?? "50.00", currency: "DZD" as const };
console.log(`environment=${environment} baseUrl=${client.baseUrl} orderNumber=${orderNumber} amount=${amount.value}`);

try {
  const reg = await client.registerOrder({
    orderNumber,
    amount,
    returnUrl: env["SATIM_RETURN_URL"] ?? "https://example.com/wathiqpay/return",
    failUrl: env["SATIM_FAIL_URL"] ?? "https://example.com/wathiqpay/fail",
    description: "WathiqPay live smoke",
    language: "fr",
  });
  console.log("register ok:", JSON.stringify(redact(reg.raw)));
  const ack = await client.acknowledgeTransaction(reg.orderId);
  console.log("acknowledge ok:", JSON.stringify(redact(ack.raw)));
  console.log("classification:", classifyPayment(ack));
} catch (e) {
  if (isWathiqPayError(e)) {
    console.error(`${e.name} (${e.outcome}): ${e.message}`);
    if ("raw" in e) console.error("raw:", JSON.stringify(redact((e as { raw: unknown }).raw)));
    if ("cause" in e && e.cause) console.error("cause:", String(e.cause));
  } else {
    console.error(e);
  }
  process.exit(1);
}
