import { test } from "node:test";
import assert from "node:assert/strict";
import { redact, redactString } from "../../src/redact.js";

test("masks sensitive keys and PAN-like runs", () => {
  const out = redact({
    userName: "merchant",
    password: "secret",
    Pan: "6280580000000011",
    nested: { cardholderName: "X", note: "card 6280580000000011 used" },
    list: ["4111111111111111"],
    OrderNumber: "CMD000123",
  });
  assert.deepEqual(out, {
    userName: "[redacted]",
    password: "[redacted]",
    Pan: "[redacted]",
    nested: { cardholderName: "[redacted]", note: "card 628058******0011 used" },
    list: ["411111******1111"],
    OrderNumber: "CMD000123",
  });
  assert.equal(redactString("short 12345"), "short 12345");
});

test("redacts URLSearchParams bodies", () => {
  const body = new URLSearchParams({ userName: "u", password: "p", amount: "80650" });
  const out = redact(body);
  assert.equal(out.toString(), "userName=%5Bredacted%5D&password=%5Bredacted%5D&amount=80650");
});
