/**
 * Exact money handling. Amounts enter as decimal strings and leave as
 * integer minor-unit strings. No binary floating point is used anywhere.
 */

export type CurrencyCode = "DZD";

export interface Money {
  /** Unsigned decimal string with at most two fractional digits, e.g. "806.50". */
  value: string;
  currency: CurrencyCode;
}

/** ISO 4217 numeric codes for supported currencies. */
export const CURRENCY_NUMERIC: Readonly<Record<CurrencyCode, string>> = Object.freeze({
  DZD: "012",
});

const MINOR_DIGITS: Readonly<Record<CurrencyCode, number>> = Object.freeze({ DZD: 2 });

const DECIMAL_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

export class MoneyError extends Error {
  override readonly name = "MoneyError";
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && Object.hasOwn(CURRENCY_NUMERIC, value);
}

/**
 * Convert a Money value to an integer minor-unit string ("806.50" -> "80650").
 * Rejects numbers, signs, exponents, more than two fractional digits, and
 * unsupported currencies.
 */
export function toMinorUnits(money: Money): string {
  if (typeof money !== "object" || money === null) {
    throw new MoneyError("amount must be an object with value and currency");
  }
  const { value, currency } = money;
  if (!isCurrencyCode(currency)) {
    throw new MoneyError(`unsupported currency: ${String(currency)}`);
  }
  if (typeof value !== "string") {
    throw new MoneyError("amount.value must be a decimal string, not a number");
  }
  const match = DECIMAL_PATTERN.exec(value);
  if (!match) {
    throw new MoneyError(`amount.value "${value}" is not an unsigned decimal with at most two fractional digits`);
  }
  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").padEnd(MINOR_DIGITS[currency], "0");
  const minor = BigInt(whole + fraction);
  return minor.toString();
}

/** Convert an integer minor-unit value ("80650" or 80650) to a Money value. */
export function fromMinorUnits(minor: string | number, currency: CurrencyCode = "DZD"): Money {
  const digits = typeof minor === "number" ? minor.toString() : minor;
  if (typeof minor === "number" && !Number.isSafeInteger(minor)) {
    throw new MoneyError("minor units must be a safe integer");
  }
  if (!/^\d+$/.test(digits)) {
    throw new MoneyError(`minor units "${digits}" are not an unsigned integer`);
  }
  const scale = MINOR_DIGITS[currency];
  const padded = digits.padStart(scale + 1, "0");
  const whole = padded.slice(0, -scale);
  const fraction = padded.slice(-scale);
  return { value: `${whole}.${fraction}`, currency };
}

/** Compare two minor-unit strings numerically. */
export function compareMinorUnits(a: string, b: string): -1 | 0 | 1 {
  const x = BigInt(a);
  const y = BigInt(b);
  return x < y ? -1 : x > y ? 1 : 0;
}
