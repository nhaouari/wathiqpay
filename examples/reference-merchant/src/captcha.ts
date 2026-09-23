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

// ---------------------------------------------------------------------------
// Google reCAPTCHA v2 (checkbox), verified server-side.

export type RecaptchaVerifier = (token: string, remoteIp: string | undefined) => Promise<{ success: boolean; hostname?: string; errors?: string[] }>;

export function createRecaptchaVerifier(secretKey: string, fetchImpl: typeof fetch = fetch): RecaptchaVerifier {
  return async (token, remoteIp) => {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    try {
      const res = await fetchImpl("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json()) as { success?: boolean; hostname?: string; "error-codes"?: string[] };
      return { success: data.success === true, ...(data.hostname ? { hostname: data.hostname } : {}), ...(data["error-codes"] ? { errors: data["error-codes"] } : {}) };
    } catch (e) {
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  };
}
