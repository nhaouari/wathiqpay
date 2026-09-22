import { ConfigurationError } from "./errors.js";
import type { Money } from "./money.js";
import { normalizeLanguage, validateCredentials, buildRegisterParams, buildAcknowledgeParams, buildRefundParams, type AcknowledgeInput, type Language, type RefundInput, type RegisterOrderInput, type WireLanguage } from "./requests.js";
import { parseAcknowledgeResponse, interpretHttpResponse, parseRefundResponse, parseRegisterResponse, type AcknowledgeResult, type RefundResult, type RegisterResult } from "./responses.js";
import { createFetchTransport, type FetchLike, type Transport } from "./transport.js";

export type Environment = "certification" | "production" | "simulator";

/** Documented certification base URL. Production has no documented default. */
export const CERTIFICATION_BASE_URL = "https://test2.satim.dz/payment/rest";

export const ENDPOINTS = Object.freeze({
  register: "/register.do",
  acknowledge: "/public/acknowledgeTransaction.do",
  refund: "/refund.do",
});

export interface ClientConfig {
  environment: Environment;
  /** Required for production and simulator; optional override for certification. */
  baseUrl?: string;
  username: string;
  password: string;
  terminalId: string;
  /** Language sent when a request does not specify one. Default "FR". */
  defaultLanguage?: Language;
  /** Per-request timeout. Default 30 000 ms (an SDK choice, not a SATIM guarantee). */
  timeoutMs?: number;
  /** Injected fetch for tests; defaults to the global fetch. */
  fetch?: FetchLike;
  /** Full transport override; takes precedence over `fetch`. */
  transport?: Transport;
  /** Allow http:// return/fail URLs. Local development only. */
  allowInsecureReturnUrls?: boolean;
}

export interface CallOptions {
  signal?: AbortSignal;
}

export interface WathiqPayClient {
  readonly environment: Environment;
  readonly baseUrl: string;
  registerOrder(input: RegisterOrderInput, options?: CallOptions): Promise<RegisterResult>;
  acknowledgeTransaction(input: string | AcknowledgeInput, options?: CallOptions): Promise<AcknowledgeResult>;
  /** Experimental until live-verified. Never retried automatically. */
  refund(input: RefundInput, options?: CallOptions): Promise<RefundResult>;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function resolveBaseUrl(config: ClientConfig): string {
  const { environment, baseUrl } = config;
  if (environment === "certification") {
    return validateBaseUrl(baseUrl ?? CERTIFICATION_BASE_URL, false);
  }
  if (environment === "production") {
    if (!baseUrl) {
      throw new ConfigurationError(
        "production requires an explicit baseUrl; SATIM's production host is not documented and no fallback is applied",
      );
    }
    return validateBaseUrl(baseUrl, false);
  }
  if (environment === "simulator") {
    if (!baseUrl) throw new ConfigurationError("simulator requires an explicit baseUrl");
    return validateBaseUrl(baseUrl, true);
  }
  throw new ConfigurationError(`unknown environment "${String(environment)}"`);
}

function validateBaseUrl(value: string, allowLoopbackHttp: boolean): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConfigurationError("baseUrl must be an absolute URL");
  }
  const loopback = LOOPBACK_HOSTS.has(url.hostname);
  if (url.protocol === "http:" && !(allowLoopbackHttp && loopback)) {
    throw new ConfigurationError("baseUrl must use https:// (http:// is only allowed for a loopback simulator)");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConfigurationError("baseUrl must use http:// or https://");
  }
  if (url.search || url.hash) throw new ConfigurationError("baseUrl must not contain a query string or fragment");
  return value.replace(/\/+$/, "");
}

export function createClient(config: ClientConfig): WathiqPayClient {
  if (typeof config !== "object" || config === null) throw new ConfigurationError("config must be an object");
  validateCredentials({ username: config.username, password: config.password });
  if (typeof config.terminalId !== "string" || config.terminalId.length === 0 || config.terminalId.length > 16) {
    throw new ConfigurationError("terminalId must be a string of 1..16 characters");
  }
  const baseUrl = resolveBaseUrl(config);
  const timeoutMs = config.timeoutMs ?? 30_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new ConfigurationError("timeoutMs must be a positive number");
  const defaultLanguage: WireLanguage = normalizeLanguage(config.defaultLanguage, "FR");
  const transport = config.transport ?? createFetchTransport(config.fetch);
  const credentials = { username: config.username, password: config.password };
  const allowInsecureReturnUrls = config.allowInsecureReturnUrls ?? false;
  const environment = config.environment;

  async function post(operation: "register" | "acknowledge" | "refund", path: string, body: URLSearchParams, options: CallOptions | undefined) {
    const response = await transport({ url: baseUrl + path, body, timeoutMs, signal: options?.signal });
    return interpretHttpResponse(operation, response.status, response.bodyText);
  }

  return {
    environment,
    baseUrl,
    async registerOrder(input, options) {
      const body = buildRegisterParams(input, {
        ...credentials,
        terminalId: config.terminalId,
        defaultLanguage,
        allowInsecureReturnUrls,
      });
      return parseRegisterResponse(await post("register", ENDPOINTS.register, body, options));
    },
    async acknowledgeTransaction(input, options) {
      const ack: AcknowledgeInput = typeof input === "string" ? { orderId: input } : input;
      const body = buildAcknowledgeParams(ack, { ...credentials, defaultLanguage });
      return parseAcknowledgeResponse(await post("acknowledge", ENDPOINTS.acknowledge, body, options));
    },
    async refund(input, options) {
      const body = buildRefundParams(input, credentials);
      return parseRefundResponse(await post("refund", ENDPOINTS.refund, body, options));
    },
  };
}

export type { Money };
