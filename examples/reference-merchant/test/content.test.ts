import { test } from "node:test";
import assert from "node:assert/strict";
import { layout, checkoutPage } from "../src/views.js";

test("demo warnings and skip links are localized; production has no test banner", () => {
  for (const lang of ["FR", "AR", "EN"] as const) {
    const html = layout({ lang, cartCount: 0, mode: "certification" }, "Test", "<h1>Test</h1>");
    assert.match(html, /class="test-banner"/);
    assert.match(html, /PAS UNE BOUTIQUE RÉELLE|NOT A REAL STORE|ليس متجرًا حقيقيًا/);
    assert.match(html, /href="#main"/);
    assert.match(html, /id="main" tabindex="-1"/);
    assert.match(html, new RegExp(`lang="${lang.toLowerCase()}" dir="${lang === "AR" ? "rtl" : "ltr"}"`));
    assert.doesNotMatch(layout({ lang, cartCount: 0, mode: "production" }, "Test", ""), /<aside class="test-banner"/);
  }
});

test("checkout does not request an email address when delivery is disabled", () => {
  for (const lang of ["FR", "AR", "EN"] as const) {
    const html = checkoutPage({ lang, cartCount: 0, mode: "simulator", emailEnabled: false }, { lines: [], totalMinor: "5000" }, { question: "2 + 3", token: "test" });
    assert.doesNotMatch(html, /name="email"/);
    assert.match(html, /name="terms"/);
    assert.match(html, /cib-edahabia\.jpg/);
    assert.match(html, /class="demo-reminder"/);
    assert.match(html, /Tester le paiement|Test payment|اختبار الدفع/);
  }
});
