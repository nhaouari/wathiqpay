/**
 * Typed errors. None of them ever carries credentials, request bodies, or
 * card data in its message. Raw gateway responses are attached only where the
 * gateway actually answered.
 */

/**
 * What is known about whether the operation reached SATIM.
 * - not-sent: the request was rejected locally before any network I/O.
 * - indeterminate: the request may have reached SATIM; the outcome is unknown.
 * - rejected: SATIM answered and refused the request.
 */
export type Outcome = "not-sent" | "indeterminate" | "rejected";

export abstract class WathiqPayError extends Error {
  abstract readonly outcome: Outcome;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/** The client configuration is invalid. Nothing was sent. */
export class ConfigurationError extends WathiqPayError {
  override readonly name = "ConfigurationError";
  readonly outcome = "not-sent";
}

/** Input failed local validation. Nothing was sent. */
export class ValidationError extends WathiqPayError {
  override readonly name = "ValidationError";
  readonly outcome = "not-sent";
  readonly field: string;
  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.field = field;
  }
}

/**
 * The HTTP exchange failed (network error, timeout, caller abort, redirect,
 * or non-2xx status). The request may have reached SATIM.
 */
export class TransportError extends WathiqPayError {
  override readonly name = "TransportError";
  readonly outcome = "indeterminate";
  readonly kind: "network" | "timeout" | "aborted" | "redirect" | "http-status";
  readonly status: number | undefined;
  /** Response body for http-status failures (truncated); never contains the request. */
  readonly bodyText: string | undefined;
  constructor(
    kind: TransportError["kind"],
    message: string,
    options?: { cause?: unknown; status?: number; bodyText?: string },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.kind = kind;
    this.status = options?.status;
    this.bodyText = options?.bodyText?.slice(0, 512);
  }
}

/** SATIM answered, but the body could not be interpreted. Outcome unknown. */
export class MalformedResponseError extends WathiqPayError {
  override readonly name = "MalformedResponseError";
  readonly outcome = "indeterminate";
  readonly raw: unknown;
  constructor(message: string, raw: unknown) {
    super(message);
    this.raw = raw;
  }
}

/** SATIM answered with a non-zero error code for the request itself. */
export class GatewayError extends WathiqPayError {
  override readonly name = "GatewayError";
  readonly outcome = "rejected";
  readonly operation: "register" | "acknowledge" | "refund";
  /** Error code as a string, e.g. "5". */
  readonly errorCode: string;
  readonly errorMessage: string | undefined;
  readonly raw: Record<string, unknown>;
  /** HTTP status of the rejection (200 for documented in-body error codes). */
  readonly httpStatus: number;
  constructor(
    operation: GatewayError["operation"],
    errorCode: string,
    errorMessage: string | undefined,
    raw: Record<string, unknown>,
    httpStatus = 200,
  ) {
    super(`SATIM ${operation} rejected with errorCode ${errorCode}${errorMessage ? `: ${errorMessage}` : ""}`);
    this.operation = operation;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.raw = raw;
    this.httpStatus = httpStatus;
  }
}

export function isWathiqPayError(value: unknown): value is WathiqPayError {
  return value instanceof WathiqPayError;
}
