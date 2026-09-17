/**
 * Request models, validation, and wire encoding for the three SATIM operations.
 * Limits follow the certification portal (see docs/satim-integration.md).
 */
import { CURRENCY_NUMERIC, compareMinorUnits, toMinorUnits, MoneyError, type Money } from "./money.js";
import { ValidationError } from "./errors.js";

export type Language = "AR" | "FR" | "EN" | "ar" | "fr" | "en";
export type WireLanguage = "AR" | "FR" | "EN";

export interface OrderMetadata {
  /** Merchant reference (AN..20). Defaults to orderNumber when omitted. */
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface RegisterOrderInput {
  /** Unique merchant order reference, alphanumeric, 1..10 characters. */
  orderNumber: string;
  amount: Money;
  returnUrl: string;
  failUrl: string;
  description?: string;
  language?: Language;
  metadata?: OrderMetadata;
  /** Only for merchants enabled by SATIM (documented values: "CP", "698"). */
  fundingTypeIndicator?: string;
}

export interface AcknowledgeInput {
  /** SATIM orderId (mdOrder) returned by registration. */
  orderId: string;
  language?: Language;
}

export interface RefundInput {
  orderId: string;
  amount: Money;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface RegisterContext extends Credentials {
  terminalId: string;
  defaultLanguage: WireLanguage;
  /** Permit http:// return URLs (local development only). */
  allowInsecureReturnUrls: boolean;
}

/** Portal-documented minimum order amount: 50 DZD. Applied to registration only. */
export const MINIMUM_REGISTER_AMOUNT_MINOR = "5000";

const ALNUM = /^[A-Za-z0-9]+$/;

export function normalizeLanguage(language: Language | undefined, fallback: WireLanguage): WireLanguage {
  if (language === undefined) return fallback;
  const upper = String(language).toUpperCase();
  if (upper === "AR" || upper === "FR" || upper === "EN") return upper;
  throw new ValidationError("language", `must be one of AR, FR, EN (got "${String(language)}")`);
}

function requireString(field: string, value: unknown, max: number, min = 1): string {
  if (typeof value !== "string") throw new ValidationError(field, "must be a string");
  if (value.length < min) throw new ValidationError(field, `must be at least ${min} character(s)`);
  if (value.length > max) throw new ValidationError(field, `must be at most ${max} characters (got ${value.length})`);
  return value;
}

function requireAlnum(field: string, value: unknown, max: number): string {
  const s = requireString(field, value, max);
  if (!ALNUM.test(s)) throw new ValidationError(field, "must contain only letters and digits");
  return s;
}

function optionalString(field: string, value: unknown, max: number): string | undefined {
  if (value === undefined) return undefined;
  return requireString(field, value, max, 0);
}

function requireAmount(field: string, value: unknown): string {
  try {
    return toMinorUnits(value as Money);
  } catch (error) {
    if (error instanceof MoneyError) throw new ValidationError(field, error.message);
    throw error;
  }
}

export function validateCredentials(creds: Credentials): void {
  requireString("username", creds.username, 30);
  requireString("password", creds.password, 30);
}

function requireUrl(field: string, value: unknown, allowInsecure: boolean): string {
  const s = requireString(field, value, 512);
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new ValidationError(field, "must be an absolute URL");
  }
  if (url.protocol === "https:") return s;
  if (url.protocol === "http:" && allowInsecure) return s;
  throw new ValidationError(field, "must use https:// (http:// is only allowed with allowInsecureReturnUrls)");
}

/**
 * Validate registration input and encode it as form fields.
 * The result contains credentials; never log it unredacted.
 */
export function buildRegisterParams(input: RegisterOrderInput, ctx: RegisterContext): URLSearchParams {
  if (typeof input !== "object" || input === null) throw new ValidationError("input", "must be an object");
  const orderNumber = requireAlnum("orderNumber", input.orderNumber, 10);
  const amountMinor = requireAmount("amount", input.amount);
  if (amountMinor.length > 12) throw new ValidationError("amount", "exceeds 12 digits in minor units");
  if (compareMinorUnits(amountMinor, MINIMUM_REGISTER_AMOUNT_MINOR) < 0) {
    throw new ValidationError("amount", "is below the documented minimum of 50 DZD");
  }
  const returnUrl = requireUrl("returnUrl", input.returnUrl, ctx.allowInsecureReturnUrls);
  const failUrl = requireUrl("failUrl", input.failUrl, ctx.allowInsecureReturnUrls);
  const description = optionalString("description", input.description, 512);
  const language = normalizeLanguage(input.language, ctx.defaultLanguage);
  const terminalId = requireString("terminalId", ctx.terminalId, 16);

  const metadata = input.metadata ?? {};
  const jsonParams: Record<string, string> = {
    force_terminal_id: terminalId,
    udf1: requireString("metadata.udf1", metadata.udf1 ?? orderNumber, 20),
  };
  for (const key of ["udf2", "udf3", "udf4", "udf5"] as const) {
    const v = optionalString(`metadata.${key}`, metadata[key], 20);
    if (v !== undefined) jsonParams[key] = v;
  }
  if (input.fundingTypeIndicator !== undefined) {
    jsonParams["fundingTypeIndicator"] = requireString("fundingTypeIndicator", input.fundingTypeIndicator, 20);
  }
  const jsonParamsText = JSON.stringify(jsonParams);
  if (jsonParamsText.length > 1024) throw new ValidationError("jsonParams", "serialized value exceeds 1024 characters");

  const params = new URLSearchParams();
  params.set("userName", ctx.username);
  params.set("password", ctx.password);
  params.set("orderNumber", orderNumber);
  params.set("amount", amountMinor);
  params.set("currency", CURRENCY_NUMERIC[input.amount.currency]);
  params.set("returnUrl", returnUrl);
  params.set("failUrl", failUrl);
  if (description !== undefined && description !== "") params.set("description", description);
  params.set("language", language);
  params.set("jsonParams", jsonParamsText);
  return params;
}

export function buildAcknowledgeParams(input: AcknowledgeInput, ctx: Credentials & { defaultLanguage: WireLanguage }): URLSearchParams {
  if (typeof input !== "object" || input === null) throw new ValidationError("input", "must be an object");
  const orderId = requireString("orderId", input.orderId, 64);
  const language = normalizeLanguage(input.language, ctx.defaultLanguage);
  const params = new URLSearchParams();
  params.set("userName", ctx.username);
  params.set("password", ctx.password);
  params.set("mdOrder", orderId);
  params.set("language", language);
  return params;
}

export function buildRefundParams(input: RefundInput, ctx: Credentials): URLSearchParams {
  if (typeof input !== "object" || input === null) throw new ValidationError("input", "must be an object");
  const orderId = requireString("orderId", input.orderId, 64);
  const amountMinor = requireAmount("amount", input.amount);
  if (amountMinor === "0") throw new ValidationError("amount", "must be greater than zero");
  if (amountMinor.length > 20) throw new ValidationError("amount", "exceeds 20 digits in minor units");
  const params = new URLSearchParams();
  params.set("userName", ctx.username);
  params.set("password", ctx.password);
  params.set("orderId", orderId);
  params.set("amount", amountMinor);
  // `language` and `currency` appear in the portal summary but not in the
  // request table; they are omitted until SATIM confirms they are accepted.
  return params;
}
