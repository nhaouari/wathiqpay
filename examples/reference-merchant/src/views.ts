import { messages, formatAmount, formatDateTime, type Lang } from "./i18n.js";
import type { OrderRow, OrderItem, CartLine } from "./store.js";
import { PRODUCTS, findProduct, productSvg, type Product } from "./catalog.js";
import type { AcknowledgeResult } from "../../../src/index.js";

export function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const css = `
:root{color-scheme:light;--ink:#1b1f24;--muted:#5b6470;--brand:#0f4c81;--brand-2:#d97706;--line:#e5e7eb;--bg:#f7f8fa}
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;color:var(--ink);background:var(--bg);line-height:1.5}
a{color:var(--brand)}header{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:1}
.wrap{max-width:64rem;margin:0 auto;padding:0 1rem}header .wrap{display:flex;align-items:center;gap:1.5rem;height:3.6rem}
.logo{font-weight:800;font-size:1.15rem;text-decoration:none;color:var(--ink)}.logo span{color:var(--brand)}
nav{margin-inline-start:auto;display:flex;gap:1rem;align-items:center;font-size:.95rem}nav .lang a,nav .lang strong{margin:0 .15rem}
.pill{background:var(--brand);color:#fff;border-radius:999px;padding:.1rem .55rem;font-size:.8rem;margin-inline-start:.3rem}
main{padding:1.5rem 0 3rem}h1{font-size:1.6rem;margin:.2rem 0 1rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:1rem}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:1rem;display:flex;flex-direction:column;gap:.5rem}
.card svg{width:100%;height:auto;border-radius:8px}.card h2{font-size:1.05rem;margin:0}.card p{margin:0;color:var(--muted);font-size:.9rem}
.price{font-weight:700;font-size:1.1rem}.card form{display:flex;gap:.5rem;align-items:center;margin-top:auto}
input[type=number]{width:4rem;padding:.4rem;border:1px solid var(--line);border-radius:6px}input[type=email],input[type=text]{padding:.5rem;border:1px solid var(--line);border-radius:6px;width:100%;max-width:22rem}
button,.btn{font:inherit;padding:.55rem .9rem;border-radius:8px;border:1px solid var(--brand);background:var(--brand);color:#fff;cursor:pointer;text-decoration:none;display:inline-block}
button.secondary,.btn.secondary{background:#fff;color:var(--brand)}button.pay{font-size:1.1rem;padding:.85rem 1.3rem;background:var(--brand-2);border-color:var(--brand-2)}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}th,td{padding:.6rem .8rem;text-align:start;border-bottom:1px solid var(--line)}th{background:#f1f3f6;font-weight:600}tr:last-child td{border-bottom:0}
td.num,th.num{text-align:end;white-space:nowrap}.thumb{width:3rem;height:3rem;vertical-align:middle;margin-inline-end:.6rem}
.total{font-size:1.7rem;font-weight:800;margin:1rem 0;padding:1rem 1.2rem;background:#fff;border:2px solid var(--brand);border-radius:12px}
.badge{display:inline-block;border:1px solid var(--brand);color:var(--brand);border-radius:6px;padding:.15rem .6rem;font-weight:700;margin-inline-start:.6rem;background:#fff}
.terms{border:1px solid var(--line);padding:1rem 1.2rem;border-radius:12px;background:#fff;margin:1rem 0}.terms h2{font-size:1.05rem;margin:0 0 .4rem}
.error{color:#b42318;font-weight:600;background:#fee4e2;border:1px solid #fda29b;padding:.6rem .8rem;border-radius:8px}.notice{background:#ecfdf3;border:1px solid #abefc6;color:#067647;padding:.6rem .8rem;border-radius:8px}
.ok{color:#067647}.ko{color:#b42318}.warn{color:#b54708}.support{margin-top:1.5rem;font-weight:600}.actions>*{margin-inline-end:.6rem;margin-bottom:.5rem}
small.note{color:var(--muted)}.two{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}@media(max-width:44rem){.two{grid-template-columns:1fr}}
.state{display:inline-block;padding:.1rem .5rem;border-radius:6px;font-size:.85rem;background:#f1f3f6}.state.paid{background:#dcfae6;color:#067647}.state.declined,.state.failed,.state.reversed{background:#fee4e2;color:#b42318}.state.unknown,.state.review{background:#fef0c7;color:#b54708}
@media print{header,.actions,form,.no-print{display:none}body{background:#fff}}
`;

export interface Ctx {
  lang: Lang;
  cartCount: number;
  current?: string;
}

export function layout(ctx: Ctx, title: string, body: string): string {
  const t = messages[ctx.lang];
  const current = ctx.current ?? "/";
  const langLinks = (["FR", "AR", "EN"] as Lang[])
    .map((l) => (l === ctx.lang ? `<strong>${l}</strong>` : `<a href="/lang/${l}?next=${encodeURIComponent(current)}">${l}</a>`))
    .join(" · ");
  return `<!doctype html><html lang="${ctx.lang.toLowerCase()}" dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} – ${esc(t.shopTitle)}</title><style>${css}</style></head>
<body><header><div class="wrap"><a class="logo" href="/">Wathiq<span>Shop</span></a>
<nav><a href="/orders">${esc(t.myOrders)}</a><a href="/cart">${esc(t.cart)}<span class="pill">${ctx.cartCount}</span></a><span class="lang">${langLinks}</span></nav></div></header>
<main><div class="wrap">${body}</div></main></body></html>`;
}

export function catalogPage(ctx: Ctx, notice?: string): string {
  const t = messages[ctx.lang];
  const cards = PRODUCTS.map(
    (p) => `<article class="card">${productSvg(p)}<h2>${esc(p.name[ctx.lang])}</h2><p>${esc(p.blurb[ctx.lang])}</p><div class="price">${esc(formatAmount(p.priceMinor, ctx.lang))}</div>
<form method="post" action="/cart/add"><input type="hidden" name="product" value="${p.id}"><input type="number" name="quantity" value="1" min="1" max="99" aria-label="${esc(t.quantity)}"><button type="submit">${esc(t.addToCart)}</button></form></article>`,
  ).join("");
  return layout(ctx, t.catalog, `${notice ? `<p class="notice">${esc(notice)}</p>` : ""}<h1>${esc(t.catalog)}</h1><div class="grid">${cards}</div>`);
}

export interface PricedLine {
  product: Product;
  quantity: number;
  lineMinor: string;
}

export function priceCart(lines: CartLine[]): { lines: PricedLine[]; totalMinor: string } {
  const priced: PricedLine[] = [];
  let total = 0n;
  for (const l of lines) {
    const product = findProduct(l.productId);
    if (!product) continue;
    const lineMinor = (BigInt(product.priceMinor) * BigInt(l.quantity)).toString();
    total += BigInt(lineMinor);
    priced.push({ product, quantity: l.quantity, lineMinor });
  }
  return { lines: priced, totalMinor: total.toString() };
}

function linesTable(lang: Lang, lines: PricedLine[], totalMinor: string, editable: boolean): string {
  const t = messages[lang];
  const rows = lines
    .map(
      ({ product, quantity, lineMinor }) => `<tr><td><span class="thumb" style="display:inline-block">${productSvg(product)}</span>${esc(product.name[lang])}</td>
<td class="num">${esc(formatAmount(product.priceMinor, lang))}</td>
<td class="num">${editable ? `<form method="post" action="/cart/update" style="display:inline"><input type="hidden" name="product" value="${product.id}"><input type="number" name="quantity" value="${quantity}" min="0" max="99"> <button class="secondary" type="submit">${esc(t.update)}</button></form>` : quantity}</td>
<td class="num">${esc(formatAmount(lineMinor, lang))}</td></tr>`,
    )
    .join("");
  return `<table><thead><tr><th>${esc(t.items)}</th><th class="num">${esc(t.unitPrice)}</th><th class="num">${esc(t.quantity)}</th><th class="num">${esc(t.subtotal)}</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><th colspan="3">${esc(t.shipping)}</th><td class="num">${esc(t.shippingFree)}</td></tr><tr><th colspan="3">${esc(t.total)}</th><td class="num"><strong>${esc(formatAmount(totalMinor, lang))}</strong></td></tr></tfoot></table>`;
}

export function cartPage(ctx: Ctx, cart: { lines: PricedLine[]; totalMinor: string }): string {
  const t = messages[ctx.lang];
  if (cart.lines.length === 0) return layout(ctx, t.cart, `<h1>${esc(t.cart)}</h1><p>${esc(t.cartEmpty)}</p><a class="btn" href="/">${esc(t.continueShopping)}</a>`);
  return layout(
    ctx,
    t.cart,
    `<h1>${esc(t.cart)}</h1>${linesTable(ctx.lang, cart.lines, cart.totalMinor, true)}
<p class="actions" style="margin-top:1rem"><a class="btn secondary" href="/">${esc(t.continueShopping)}</a><a class="btn" href="/checkout">${esc(t.proceed)}</a></p>`,
  );
}

export function checkoutPage(ctx: Ctx, cart: { lines: PricedLine[]; totalMinor: string }, captcha: { question: string; token: string }, opts: { error?: string; email?: string } = {}): string {
  const t = messages[ctx.lang];
  return layout(
    ctx,
    t.checkout,
    `<h1>${esc(t.checkout)}</h1>${opts.error ? `<p class="error" role="alert">${esc(opts.error)}</p>` : ""}
<h2>${esc(t.orderSummary)}</h2>${linesTable(ctx.lang, cart.lines, cart.totalMinor, false)}
<div class="total">${esc(t.total)}: <span id="total">${esc(formatAmount(cart.totalMinor, ctx.lang))}</span></div>
<form method="post" action="/checkout">
  <p><label>${esc(t.customerEmail)}<br><input type="email" name="email" value="${esc(opts.email ?? "")}"></label></p>
  <div class="terms"><h2>${esc(t.terms)}</h2><p>${esc(t.termsText)}</p><label><input type="checkbox" name="terms" value="yes" required> ${esc(t.acceptTerms)}</label></div>
  <p><label>${esc(t.captcha)} <strong>${esc(captcha.question)}</strong> ? <input type="text" name="captcha" required inputmode="numeric" autocomplete="off" style="width:4rem"></label>
  <input type="hidden" name="captchaToken" value="${esc(captcha.token)}"></p>
  <p><button class="pay" type="submit">${esc(t.pay)}</button><span class="badge" title="CIB / Edahabia">${esc(t.payBadge)}</span></p>
  <p><small class="note">${esc(t.logoNote)}</small></p>
</form>`,
  );
}

export function ordersPage(ctx: Ctx, orders: OrderRow[]): string {
  const t = messages[ctx.lang];
  if (orders.length === 0) return layout(ctx, t.myOrders, `<h1>${esc(t.myOrders)}</h1><p>${esc(t.noOrders)}</p><a class="btn" href="/">${esc(t.continueShopping)}</a>`);
  const rows = orders
    .map(
      (o) => `<tr><td><a href="/orders/${o.orderNumber}">${o.orderNumber}</a></td><td>${esc(formatDateTime(o.createdAt, ctx.lang))}</td><td class="num">${esc(formatAmount(o.amountMinor, ctx.lang))}</td><td><span class="state ${o.state}">${esc(t.stateLabels[o.state])}</span></td></tr>`,
    )
    .join("");
  return layout(ctx, t.myOrders, `<h1>${esc(t.myOrders)}</h1><table><thead><tr><th>${esc(t.orderNumber)}</th><th>${esc(t.date)}</th><th class="num">${esc(t.amount)}</th><th>${esc(t.status)}</th></tr></thead><tbody>${rows}</tbody></table>`);
}

export function orderDetailPage(ctx: Ctx, order: OrderRow, items: OrderItem[], ack: AcknowledgeResult | undefined): string {
  const t = messages[ctx.lang];
  const lines = items.map((it) => `<tr><td>${esc(it.name)}</td><td class="num">${esc(formatAmount(it.unitMinor, ctx.lang))}</td><td class="num">${it.quantity}</td><td class="num">${esc(formatAmount((BigInt(it.unitMinor) * BigInt(it.quantity)).toString(), ctx.lang))}</td></tr>`).join("");
  const receipt = order.state === "paid" && ack ? `<p class="actions"><a class="btn secondary" href="/orders/${order.orderNumber}/receipt" target="_blank">${esc(t.print)}</a><a class="btn secondary" href="/orders/${order.orderNumber}/receipt.pdf">${esc(t.downloadPdf)}</a></p>` : "";
  return layout(
    ctx,
    `${t.orderNumber} ${order.orderNumber}`,
    `<h1>${esc(t.orderNumber)} ${order.orderNumber} <span class="state ${order.state}">${esc(t.stateLabels[order.state])}</span></h1>
<p>${esc(t.date)}: ${esc(formatDateTime(order.createdAt, ctx.lang))}${order.satimOrderId ? ` · ${esc(t.transactionId)}: ${esc(order.satimOrderId)}` : ""}</p>
<table><thead><tr><th>${esc(t.items)}</th><th class="num">${esc(t.unitPrice)}</th><th class="num">${esc(t.quantity)}</th><th class="num">${esc(t.subtotal)}</th></tr></thead><tbody>${lines}</tbody><tfoot><tr><th colspan="3">${esc(t.total)}</th><td class="num"><strong>${esc(formatAmount(order.amountMinor, ctx.lang))}</strong></td></tr></tfoot></table>
${receipt}<p><a href="/orders">${esc(t.myOrders)}</a></p>`,
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

function receiptTable(lang: Lang, data: ReceiptData): string {
  return `<table>${receiptRows(lang, data).map(([k, v]) => `<tr><th style="width:40%">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>`;
}

export function successPage(ctx: Ctx, data: ReceiptData, items: OrderItem[], emailSentTo?: string): string {
  const t = messages[ctx.lang];
  const ref = data.order.orderNumber;
  const itemList = items.map((it) => `<li>${esc(it.name)} × ${it.quantity}</li>`).join("");
  return layout(
    { ...ctx, current: `/payment/return?ref=${ref}` },
    t.successTitle,
    `<h1 class="ok">✓ ${esc(t.successTitle)}</h1><p>${esc(data.ack.respCodeDescription ?? "")}</p>
<div class="two"><div>${receiptTable(ctx.lang, data)}</div><div><h2>${esc(t.items)}</h2><ul>${itemList}</ul></div></div>
<p class="support">${esc(t.support)}</p>
<p class="actions no-print"><a class="btn secondary" href="/orders/${ref}/receipt" target="_blank">${esc(t.print)}</a><a class="btn secondary" href="/orders/${ref}/receipt.pdf">${esc(t.downloadPdf)}</a></p>
${emailSentTo ? `<p class="notice">${esc(t.emailSent)} ${esc(emailSentTo)}.</p>` : ""}
<form method="post" action="/orders/${ref}/receipt/email"><label>${esc(t.emailReceipt)}: <input type="email" name="email" required value="${esc(data.order.customerEmail ?? "")}"></label> <button type="submit">${esc(t.send)}</button></form>
<p><a href="/">${esc(t.backToShop)}</a> · <a href="/orders">${esc(t.myOrders)}</a></p>`,
  );
}

export function receiptPage(ctx: Ctx, data: ReceiptData): string {
  const t = messages[ctx.lang];
  return layout(ctx, t.receipt, `<h1>${esc(t.receipt)}</h1>${receiptTable(ctx.lang, data)}<p class="support">${esc(t.support)}</p><p class="no-print"><button onclick="print()">${esc(t.print)}</button></p>`);
}

export function failurePage(ctx: Ctx, order: OrderRow, ack: AcknowledgeResult | undefined, kind: "declined" | "reversed" | "pending" | "review" | "failed"): string {
  const t = messages[ctx.lang];
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
    ctx,
    title,
    `<h1 class="${cls}">${esc(title)}</h1><p>${esc(text)}</p>
<table><tr><th style="width:40%">${esc(t.orderNumber)}</th><td>${esc(order.orderNumber)}</td></tr>${order.satimOrderId ? `<tr><th>${esc(t.transactionId)}</th><td>${esc(order.satimOrderId)}</td></tr>` : ""}<tr><th>${esc(t.amount)}</th><td>${esc(formatAmount(order.amountMinor, ctx.lang))}</td></tr></table>
<p class="support">${esc(t.support)}</p><p class="actions"><a class="btn" href="/cart">${esc(t.cart)}</a><a class="btn secondary" href="/">${esc(t.backToShop)}</a></p>`,
  );
}

export function notFoundPage(ctx: Ctx): string {
  const t = messages[ctx.lang];
  return layout(ctx, t.notFound, `<h1>${esc(t.notFound)}</h1><p><a href="/">${esc(t.backToShop)}</a></p>`);
}
