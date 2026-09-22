/**
 * HTTP transport. One attempt, POST with form encoding, no redirects,
 * timeout plus caller abort. Any failure after dispatch is reported as
 * indeterminate because the request may already have reached SATIM.
 */
import { TransportError } from "./errors.js";

export interface TransportRequest {
  url: string;
  /** Form body. Contains credentials; never log it. */
  body: URLSearchParams;
  timeoutMs: number;
  signal?: AbortSignal | undefined;
}

export interface TransportResponse {
  status: number;
  bodyText: string;
}

export type Transport = (request: TransportRequest) => Promise<TransportResponse>;

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export function createFetchTransport(fetchImpl: FetchLike = globalThis.fetch as FetchLike): Transport {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("a fetch implementation is required (Node.js 22+ provides one globally)");
  }
  return async ({ url, body, timeoutMs, signal }) => {
    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          accept: "application/json",
        },
        body: body.toString(),
        redirect: "error",
        signal: combined,
      });
    } catch (cause) {
      throw classifyFetchFailure(cause, timeout, signal);
    }
    let bodyText: string;
    try {
      bodyText = await response.text();
    } catch (cause) {
      throw new TransportError("network", "response body could not be read", { cause });
    }
    // Non-2xx statuses are returned, not thrown: SATIM answers some
    // documented gateway errors with HTTP 401 and a JSON body (live-observed).
    return { status: response.status, bodyText };
  };
}

function classifyFetchFailure(cause: unknown, timeout: AbortSignal, caller: AbortSignal | undefined): TransportError {
  if (timeout.aborted) return new TransportError("timeout", "request timed out; the gateway may have received it", { cause });
  if (caller?.aborted) return new TransportError("aborted", "request aborted by caller; the gateway may have received it", { cause });
  const message = describeChain(cause);
  if (/redirect/i.test(message)) {
    return new TransportError("redirect", "gateway attempted an HTTP redirect, which is refused for credential-bearing calls", { cause });
  }
  return new TransportError("network", `network failure: ${redactMessage(message)}`, { cause });
}

/** Join the messages along the cause chain (undici wraps the real reason). */
function describeChain(cause: unknown): string {
  const parts: string[] = [];
  let current: unknown = cause;
  for (let i = 0; i < 5 && current !== undefined && current !== null; i += 1) {
    parts.push(current instanceof Error ? current.message : String(current));
    current = current instanceof Error ? current.cause : undefined;
  }
  return parts.join(": ");
}

function redactMessage(message: string): string {
  // Strip anything that looks like a query string or form body echoed by the runtime.
  return message.replace(/[?&][^\s]*/g, "[redacted]");
}
