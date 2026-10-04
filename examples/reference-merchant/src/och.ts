/**
 * OnlineCourseHost enrolment: creates the student account if it does not
 * exist and enrols it in a course, in one call.
 * https://help.onlinecoursehost.com/article/78-enroll-student-api
 */
import { randomBytes } from "node:crypto";

export interface Enroller {
  enroll(input: { name: string | null; email: string; courseId: string }): Promise<void>;
}

export function createOchEnroller(options: { token: string; baseUrl?: string | undefined; timeoutMs?: number }): Enroller {
  const baseUrl = (options.baseUrl ?? "https://api.onlinecoursehost.com").replace(/\/+$/, "");
  return {
    async enroll({ name, email, courseId }) {
      const res = await fetch(`${baseUrl}/api/zapier-enroll-student-action-webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", "x-integration-token": options.token },
        // The API requires a password for accounts it creates. It is random and
        // never shown: the student chooses their own through the platform's
        // password reset, which works whether or not the account already existed.
        body: JSON.stringify({ ...(name ? { name } : {}), email, courseId, password: randomBytes(18).toString("base64url") }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
      });
      const text = await res.text();
      let status: unknown;
      try {
        status = (JSON.parse(text) as { status?: unknown }).status;
      } catch {
        /* not JSON: reported below */
      }
      if (!res.ok || status !== "success") throw new Error(`enrolment rejected (HTTP ${res.status}): ${text.slice(0, 200)}`);
    },
  };
}
