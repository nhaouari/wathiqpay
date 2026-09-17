import { messages, formatAmount, formatDateTime, type Lang } from "./i18n.js";
import type { OrderRow } from "./store.js";
import type { AcknowledgeResult } from "../../../src/index.js";

export function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const css = `
:root{color-scheme:light}body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#1a1a1a;background:#fff}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;padding-bottom:.5rem;margin-bottom:1.5rem}
nav a{margin:0 .3rem}.total{font-size:1.8rem;font-weight:700;margin:1rem 0;padding:1rem;background:#f3f6ff;border:2px solid #2b4c9b;border-radius:8px}
.badge{display:inline-block;border:1px solid #2b4c9b;color:#2b4c9b;border-radius:4px;padding:.1rem .5rem;font-weight:600;margin-inline-start:.5rem}
button.pay{font-size:1.1rem;padding:.8rem 1.2rem;background:#2b4c9b;color:#fff;border:0;border-radius:6px;cursor:pointer}
.terms{border:1px solid #ddd;padding:1rem;border-radius:6px;background:#fafafa;margin:1rem 0}.error{color:#a40000;font-weight:600}
table.receipt{border-collapse:collapse;width:100%}table.receipt th{text-align:start;padding:.4rem .6rem;width:40%;background:#f3f3f3}table.receipt td{padding:.4rem .6rem;border-bottom:1px solid #eee}
.ok{color:#0a6b2c}.ko{color:#a40000}.warn{color:#8a5a00}.support{margin-top:1.5rem;font-weight:600}.actions a,.actions button{margin-inline-end:.6rem}
small.note{color:#666}@media print{nav,.actions,form,.no-print{display:none}}
`;

export function layout(lang: Lang, title: string, body: string, current = "/"): string {
  const t = messages[lang];
  const langLinks = (["FR", "AR", "EN"] as Lang[])
    .map((l) => (l === lang ? `<strong>${l}</strong>` : `<a href="/lang/${l}?next=${encodeURIComponent(current)}">${l}</a>`))
    .join(" · ");
  return `<!doctype html><html lang="${lang.toLowerCase()}" dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} – ${esc(t.shopTitle)}</title><style>${css}</style></head>
<body><header><a href="/"><strong>${esc(t.shopTitle)}</strong></a><nav>${t.language}: ${langLinks}</nav></header><main>${body}</main></body></html>`;
}

export function checkoutPage(lang: Lang, opts: { unitMinor: string; quantity: number; totalMinor: string; captchaQuestion: string; captchaToken: string; error?: string }): string {
  const t = messages[lang];
  return layout(
    lang,
    t.shopTitle,
    `
${opts.error ? `<p class="error" role="alert">${esc(opts.error)}</p>` : ""}
<form method="post" action="/checkout">
  <h1>${esc(t.product)}</h1>
  <p>${esc(t.unitPrice)}: <strong>${esc(formatAmount(opts.unitMinor, lang))}</strong></p>
  <p><label>${esc(t.quantity)} <input type="number" name="quantity" min="1" max="99" value="${opts.quantity}" onchange="this.form.submit()"></label></p>
  <div class="total">${esc(t.total)}: <span id="total">${esc(formatAmount(opts.totalMinor, lang))}</span></div>
  <div class="terms"><h2>${esc(t.terms)}</h2><p>${esc(t.termsText)}</p>
    <label><input type="checkbox" name="terms" value="yes" required> ${esc(t.acceptTerms)}</label></div>
  <p><label>${esc(t.captcha)} <strong>${esc(opts.captchaQuestion)}</strong> ? <input name="captcha" required inputmode="numeric" size="4" autocomplete="off"></label>
  <input type="hidden" name="captchaToken" value="${esc(opts.captchaToken)}"></p>
  <p><button class="pay" type="submit">${esc(t.pay)}</button><span class="badge" title="CIB / Edahabia">${esc(t.payBadge)}</span></p>
  <p><small class="note">${esc(t.logoNote)}</small></p>
</form>`,
  );
}

export interface ReceiptData {
  order: OrderRow;
  ack: AcknowledgeResult;
}

export function receiptRows(lang: Lang, { order, ack }: ReceiptData): Array<[string, string]> {
  const t = messages[lang];
  return [
    [t.orderNumber, order.orderNumber],
    [t.transactionId, order.satimOrderId ?? ""],
    [t.approvalCode, ack.approvalCode ?? ""],
    [t.dateTime, formatDateTime(order.acknowledgedAt ?? order.fulfilledAt ?? new Date().toISOString(), lang)],
    [t.amount, formatAmount(ack.amountMinor ?? order.amountMinor, lang)],
    [t.paymentMethod, t.paymentMethodValue],
  ];
}

export function successPage(lang: Lang, data: ReceiptData, emailSentTo?: string): string {
  const t = messages[lang];
  const rows = receiptRows(lang, data).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");
  const ref = data.order.orderNumber;
  return layout(
    lang,
    t.successTitle,
    `<h1 class="ok">${esc(t.successTitle)}</h1>
<p>${esc(data.ack.respCodeDescription ?? "")}</p>
<table class="receipt">${rows}</table>
<p class="support">${esc(t.support)}</p>
<p class="actions no-print"><a href="/orders/${ref}/receipt" target="_blank">${esc(t.print)}</a> <a href="/orders/${ref}/receipt.pdf">${esc(t.downloadPdf)}</a></p>
${emailSentTo ? `<p class="ok">${esc(t.emailSent)} ${esc(emailSentTo)}.</p>` : ""}
<form method="post" action="/orders/${ref}/receipt/email"><label>${esc(t.emailReceipt)}: <input type="email" name="email" required></label> <button type="submit">${esc(t.send)}</button></form>
<p><a href="/">${esc(t.backToShop)}</a></p>`,
    `/payment/return?ref=${ref}`,
  );
}

export function receiptPage(lang: Lang, data: ReceiptData): string {
  const t = messages[lang];
  const rows = receiptRows(lang, data).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");
  return layout(lang, t.receipt, `<h1>${esc(t.receipt)}</h1><table class="receipt">${rows}</table><p class="support">${esc(t.support)}</p><p class="no-print"><button onclick="print()">${esc(t.print)}</button></p>`);
}

export function failurePage(lang: Lang, order: OrderRow, ack: AcknowledgeResult | undefined, kind: "declined" | "reversed" | "pending" | "review" | "failed"): string {
  const t = messages[lang];
  let title = t.failureTitle;
  let text: string;
  let cls = "ko";
  switch (kind) {
    case "reversed":
      text = t.reversedText;
      break;
    case "pending":
      title = t.pendingTitle;
      text = t.pendingText;
      cls = "warn";
      break;
    case "review":
      title = t.reviewTitle;
      text = t.reviewText;
      cls = "warn";
      break;
    case "failed":
      text = t.registrationFailed;
      break;
    default:
      text = ack?.respCodeDescription || ack?.actionCodeDescription || t.reversedText;
  }
  return layout(
    lang,
    title,
    `<h1 class="${cls}">${esc(title)}</h1><p>${esc(text)}</p>
<table class="receipt"><tr><th>${esc(t.orderNumber)}</th><td>${esc(order.orderNumber)}</td></tr>${order.satimOrderId ? `<tr><th>${esc(t.transactionId)}</th><td>${esc(order.satimOrderId)}</td></tr>` : ""}<tr><th>${esc(t.amount)}</th><td>${esc(formatAmount(order.amountMinor, lang))}</td></tr></table>
<p class="support">${esc(t.support)}</p><p><a href="/">${esc(t.backToShop)}</a></p>`,
  );
}

export function notFoundPage(lang: Lang): string {
  return layout(lang, messages[lang].notFound, `<h1>${esc(messages[lang].notFound)}</h1><p><a href="/">${esc(messages[lang].backToShop)}</a></p>`);
}
