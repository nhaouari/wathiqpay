/**
 * Tiny CLI used by the live card-scenario driver:
 *   node build/test/live/cli.js register <amount> <label>
 *   node build/test/live/cli.js ack <orderId>
 *   node build/test/live/cli.js refund <orderId> <amount>
 * Prints one JSON line. Reads credentials from .env / environment.
 */
import { readFileSync } from "node:fs";
import { createClient, classifyPayment, isWathiqPayError, redact } from "../../src/index.js";

try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!;
  }
} catch {
  /* optional */
}
const env = process.env;
const client = createClient({
  environment: (env["SATIM_ENVIRONMENT"] ?? "certification") as "certification",
  username: env["SATIM_USERNAME"]!,
  password: env["SATIM_PASSWORD"]!,
  terminalId: env["SATIM_TERMINAL_ID"]!,
});
const [cmd, a, b] = process.argv.slice(2);
try {
  if (cmd === "register") {
    const orderNumber = `C${Date.now().toString(36).toUpperCase().slice(-9)}`;
    const r = await client.registerOrder({
      orderNumber,
      amount: { value: a ?? "50.00", currency: "DZD" },
      returnUrl: "https://example.com/wathiqpay/return",
      failUrl: "https://example.com/wathiqpay/fail",
      description: (b ?? "scenario").slice(0, 100),
      language: "fr",
    });
    console.log(JSON.stringify({ ok: true, orderNumber, orderId: r.orderId, formUrl: r.formUrl }));
  } else if (cmd === "ack") {
    const r = await client.acknowledgeTransaction(a!);
    console.log(JSON.stringify({ ok: true, state: classifyPayment(r), result: redact({ ...r, raw: undefined }), raw: redact(r.raw) }));
  } else if (cmd === "refund") {
    const r = await client.refund({ orderId: a!, amount: { value: b!, currency: "DZD" } });
    console.log(JSON.stringify({ ok: true, raw: r.raw }));
  } else {
    throw new Error("usage: register <amount> <label> | ack <orderId> | refund <orderId> <amount>");
  }
} catch (e) {
  const err = isWathiqPayError(e) ? { name: e.name, outcome: e.outcome, message: e.message, ...("errorCode" in e ? { errorCode: (e as { errorCode: string }).errorCode } : {}), ...("httpStatus" in e ? { httpStatus: (e as { httpStatus: number }).httpStatus } : {}), ...("raw" in e ? { raw: redact((e as { raw: unknown }).raw) } : {}) } : { name: "Error", message: String(e) };
  console.log(JSON.stringify({ ok: false, error: err }));
  process.exit(1);
}
