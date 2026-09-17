import { test } from "node:test";
import assert from "node:assert/strict";
import { toMinorUnits, fromMinorUnits, compareMinorUnits, MoneyError } from "../../src/money.js";

test("converts documented examples exactly", () => {
  assert.equal(toMinorUnits({ value: "5000.00", currency: "DZD" }), "500000");
  assert.equal(toMinorUnits({ value: "806.50", currency: "DZD" }), "80650");
  assert.equal(toMinorUnits({ value: "50.00", currency: "DZD" }), "5000");
  assert.equal(toMinorUnits({ value: "50", currency: "DZD" }), "5000");
  assert.equal(toMinorUnits({ value: "0.1", currency: "DZD" }), "10");
  assert.equal(toMinorUnits({ value: "0.07", currency: "DZD" }), "7");
});

test("handles values that would break floating point", () => {
  assert.equal(toMinorUnits({ value: "1.15", currency: "DZD" }), "115");
  assert.equal(toMinorUnits({ value: "4.35", currency: "DZD" }), "435");
  assert.equal(toMinorUnits({ value: "999999999999.99", currency: "DZD" }), "99999999999999");
});

test("rejects invalid precision, signs, exponents, numbers, and currencies", () => {
  const bad = ["806.505", "-1.00", "+1.00", "1e3", "1,00", ".5", "", " 5", "0x10", "NaN"];
  for (const value of bad) {
    assert.throws(() => toMinorUnits({ value, currency: "DZD" }), MoneyError, value);
  }
  assert.throws(() => toMinorUnits({ value: 806.5 as unknown as string, currency: "DZD" }), MoneyError);
  assert.throws(() => toMinorUnits({ value: "1.00", currency: "EUR" as "DZD" }), MoneyError);
  assert.throws(() => toMinorUnits(null as unknown as { value: string; currency: "DZD" }), MoneyError);
});

test("round-trips minor units", () => {
  assert.deepEqual(fromMinorUnits("80650"), { value: "806.50", currency: "DZD" });
  assert.deepEqual(fromMinorUnits(7), { value: "0.07", currency: "DZD" });
  assert.deepEqual(fromMinorUnits("0"), { value: "0.00", currency: "DZD" });
  assert.throws(() => fromMinorUnits("12.5"), MoneyError);
  assert.throws(() => fromMinorUnits(1.5), MoneyError);
});

test("compares minor units numerically", () => {
  assert.equal(compareMinorUnits("5000", "5000"), 0);
  assert.equal(compareMinorUnits("4999", "5000"), -1);
  assert.equal(compareMinorUnits("10000", "5000"), 1);
});
