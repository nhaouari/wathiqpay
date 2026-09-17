/**
 * Self-contained arithmetic CAPTCHA with an HMAC-signed, expiring challenge.
 * It satisfies the "CAPTCHA on the page with the payment button" requirement
 * without a third-party service. A production merchant may substitute any
 * CAPTCHA provider; the checkout handler only needs `verify` to hold.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export interface Challenge {
  question: string;
  token: string;
}

export function createChallenge(secret: string, ttlMs = 10 * 60 * 1000): Challenge {
  const a = randomInt(1, 10);
  const b = randomInt(1, 10);
  const exp = Date.now() + ttlMs;
  const nonce = randomInt(0, 1_000_000_000).toString(36);
  const payload = `${a + b}.${exp}.${nonce}`;
  return { question: `${a} + ${b}`, token: `${payload}.${sign(secret, payload)}` };
}

export function verify(secret: string, token: string | undefined, answer: string | undefined): boolean {
  if (!token || answer === undefined) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [sum, exp, nonce, mac] = parts as [string, string, string, string];
  const payload = `${sum}.${exp}.${nonce}`;
  const expected = sign(secret, payload);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  if (Number(exp) < Date.now()) return false;
  return answer.trim() === sum;
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
