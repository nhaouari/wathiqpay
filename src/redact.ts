/**
 * Redaction helpers for anything a merchant might log.
 */

const SENSITIVE_KEYS = new Set([
  "username",
  "password",
  "pan",
  "cardholdername",
  "expiration",
  "cvv",
  "cvc",
  "bindingid",
  "paymentaccountreference",
]);

const PAN_LIKE = /\b\d{12,19}\b/g;

export function redactString(text: string): string {
  return text.replace(PAN_LIKE, (m) => `${m.slice(0, 6)}${"*".repeat(m.length - 10)}${m.slice(-4)}`);
}

/** Deep-copy a value with sensitive keys masked and PAN-like digit runs shortened. */
export function redact<T>(value: T): T {
  return walk(value, new WeakSet()) as T;
}

function walk(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((v) => walk(v, seen));
  if (value instanceof URLSearchParams) {
    const out = new URLSearchParams();
    for (const [k, v] of value) out.set(k, SENSITIVE_KEYS.has(k.toLowerCase()) ? "[redacted]" : redactString(v));
    return out;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? "[redacted]" : walk(v, seen);
  }
  return out;
}
