import { messages, formatAmount, formatDateTime, type Lang } from "./i18n.js";
import type { OrderRow, OrderItem, CartLine } from "./store.js";
import { PRODUCTS, findProduct, productImg, type Product } from "./catalog.js";
import type { AcknowledgeResult } from "../../../src/index.js";
import type { LegalPage } from "./legal.js";

export function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const css = `
:root{color-scheme:light;--paper:#FBFAF7;--sand:#EADFC8;--sand-2:#F4EDDD;--ink:#221E19;--ink-2:#5C554B;--olive:#6B7A55;--blue:#1B4F86;--blue-ink:#143B64;--saffron:#D99A17;--ok:#2E6B3F;--ko:#9B2C2C;--hold:#8A5A00;--rule:#E3DCCB;
--serif:"Fraunces","Noto Naskh Arabic",Georgia,"Times New Roman",serif;--sans:"Inter","Noto Sans Arabic",system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55;font-feature-settings:"tnum" 1,"cv11" 1}
:root{--ink-2:#403A32;--blue:#143B64;--ok:#245330;--ko:#802323;--hold:#654100}
[dir=rtl] body,[dir=rtl]{font-family:var(--sans)}
a{color:var(--blue);text-decoration-thickness:1px;text-underline-offset:3px}a:hover{color:var(--blue-ink)}
:focus-visible{outline:3px solid #221E19;outline-offset:4px;box-shadow:0 0 0 4px #fff;border-radius:2px}
.skip-link{position:fixed;top:8px;inset-inline-start:8px;z-index:100;background:#fff;color:#221E19;padding:12px;transform:translateY(-200%)}.skip-link:focus{transform:translateY(0)}
.test-banner{background:#143B64;color:#fff;padding:1rem;border-bottom:4px solid #D99A17}.test-banner p{margin:.35rem 0 0;max-width:80ch}.test-banner strong{font-size:1.15rem}.demo-reminder{padding:1rem;border:2px solid #143B64;background:#F4EDDD;color:#221E19;margin:1rem 0}
main:focus{outline:none}nav a,.lang strong{display:inline-flex;min-width:44px;min-height:44px;align-items:center;justify-content:center}
input,button,.btn{min-height:44px}input[type=checkbox]{min-height:24px;min-width:24px}p,dd,td{overflow-wrap:anywhere}
.wrap{max-width:68rem;margin:0 auto;padding:0 clamp(1rem,4vw,2.5rem)}
header{border-bottom:1px solid var(--rule);background:var(--paper)}header .wrap{display:flex;align-items:baseline;gap:2rem;padding-block:1.1rem}
.wordmark{font-family:var(--serif);font-size:1.6rem;font-weight:600;letter-spacing:-.01em;color:var(--ink);text-decoration:none}
nav{margin-inline-start:auto;display:flex;gap:1.4rem;align-items:baseline;font-size:.95rem}nav a{text-decoration:none;color:var(--ink)}nav a:hover{text-decoration:underline}
.count{display:inline-block;min-width:1.5em;text-align:center;background:var(--ink);color:var(--paper);border-radius:1em;padding:0 .45em;font-size:.8rem;margin-inline-start:.35em;vertical-align:1px}
.lang{display:flex;gap:.6rem;color:var(--ink-2)}.lang strong{color:var(--ink)}
main{padding:2rem 0 5rem}
h1{font-family:var(--serif);font-weight:500;font-size:clamp(1.9rem,3.6vw,2.8rem);line-height:1.1;letter-spacing:-.015em;margin:0 0 .6rem}
h2{font-family:var(--serif);font-weight:500;font-size:1.35rem;line-height:1.2;margin:0 0 .5rem}
p{margin:.3rem 0 1rem;max-width:62ch}.lede{color:var(--ink-2);font-size:1.05rem;max-width:52ch}
.money{font-family:var(--serif);font-variant-numeric:tabular-nums;font-weight:500;letter-spacing:-.01em}
/* catalog */
.lead{display:grid;grid-template-columns:1.2fr 1fr;gap:2.5rem;align-items:center;margin:2.5rem 0 3rem}.lead .art{aspect-ratio:4/3}
.art{display:block;overflow:hidden;border-radius:6px;background:var(--sand-2)}.art img{display:block;width:100%;height:100%;object-fit:cover}
.lead h2{font-size:1.8rem}.lead .money{font-size:1.5rem}
.list{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem 1.5rem}.item .art{aspect-ratio:1}.item h2{font-size:1.1rem;margin:.9rem 0 .15rem;font-family:var(--sans);font-weight:600}
.item p{color:var(--ink-2);font-size:.92rem;margin:0 0 .5rem}.item .money{font-size:1.15rem}
.add{display:flex;gap:.5rem;align-items:center;margin-top:.7rem}
/* controls */
input[type=number]{width:4.2rem;padding:.5rem .4rem;border:1px solid var(--rule);border-radius:4px;background:#fff;font:inherit;text-align:center}
input[type=email],input[type=text]{padding:.6rem .7rem;border:1px solid var(--rule);border-radius:4px;background:#fff;font:inherit;width:100%}
input[type=number],input[type=email],input[type=text]{border-color:#776C5B}
label{display:block}.field{margin:0 0 1.1rem;max-width:26rem}.field span{display:block;font-size:.9rem;color:var(--ink-2);margin-bottom:.3rem}
button,.btn{font:inherit;font-weight:600;padding:.6rem 1rem;border-radius:4px;border:1px solid var(--blue);background:var(--blue);color:#fff;cursor:pointer;text-decoration:none;display:inline-block;line-height:1.3}
button:hover,.btn:hover{background:var(--blue-ink);border-color:var(--blue-ink);color:#fff}
.quiet{background:transparent;color:var(--blue);border-color:var(--rule)}.quiet:hover{background:var(--sand-2);color:var(--blue-ink);border-color:var(--rule)}
.link{background:none;border:0;padding:0;color:var(--blue);font-weight:400;text-decoration:underline;text-underline-offset:3px}.link:hover{background:none;color:var(--blue-ink)}
.pay{width:100%;font-size:1.1rem;padding:.95rem 1.2rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;box-shadow:inset 0 -4px 0 var(--saffron)}
.cards{display:block;flex:none;background:#fff;border-radius:6px;padding:2px;line-height:0}.cards img{display:block;width:7rem;height:auto}
/* tables */
table{border-collapse:collapse;width:100%}th,td{padding:.75rem .2rem;text-align:start;border-bottom:1px solid var(--rule);vertical-align:middle}th{font-weight:500;color:var(--ink-2);font-size:.9rem}
td.num,th.num{text-align:end;white-space:nowrap}tfoot th,tfoot td{border-bottom:0;padding-top:.6rem}tfoot tr:last-child th,tfoot tr:last-child td{font-size:1.15rem;color:var(--ink);font-weight:500}
.thumb{width:3.4rem;height:3.4rem;border-radius:4px;overflow:hidden;display:inline-block;vertical-align:middle;margin-inline-end:.8rem;background:var(--sand-2)}.thumb img{width:100%;height:100%;display:block;object-fit:cover}
.line form{display:inline-flex;gap:.4rem;align-items:center}
/* checkout */
.split{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(18rem,.9fr);gap:3rem;align-items:start}.summary{position:sticky;top:1.5rem;background:var(--sand-2);border-radius:6px;padding:1.4rem 1.5rem}
.summary table th,.summary table td{border-color:rgba(34,30,25,.12)}
.total{margin:1rem 0 0;padding-top:1rem;border-top:1px solid rgba(34,30,25,.2);display:flex;justify-content:space-between;align-items:baseline;gap:1rem}.total .money{font-size:2rem}
.terms{border:1px solid var(--rule);border-radius:6px;padding:1rem 1.2rem;margin:1.4rem 0;background:#fff}.terms h2{font-size:1.05rem;font-family:var(--sans);font-weight:600}.terms p{font-size:.93rem;color:var(--ink-2)}
.check{display:flex;gap:.6rem;align-items:flex-start;font-size:.95rem}.check input{margin-top:.3rem}
.captcha{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin:1rem 0 1.4rem}.captcha.recaptcha{min-height:78px}.captcha input{width:4.5rem;text-align:center}
.alert{border-radius:4px;padding:.7rem .9rem;margin:0 0 1.2rem;font-size:.95rem;border:1px solid}.alert.bad{background:#FBECEC;border-color:#E9BABA;color:var(--ko)}.alert.good{background:#EAF3EC;border-color:#BFD9C6;color:var(--ok)}
small,.note{color:var(--ink-2);font-size:.85rem}
/* result + receipt */
.result{max-width:36rem}.result h1{margin-bottom:.2rem}.result .status{font-size:1.05rem;color:var(--ink-2);margin-bottom:1.6rem}
.receipt{background:var(--sand);border-radius:6px;padding:1.6rem 1.8rem;position:relative}.receipt:after{content:"";position:absolute;left:0;right:0;bottom:-8px;height:8px;background:radial-gradient(circle at 8px -2px,transparent 8px,var(--sand) 9px) 0 0/16px 16px repeat-x}
.receipt-brand{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;margin:0 0 1rem;padding-bottom:.7rem;border-bottom:1px solid rgba(34,30,25,.2);font-family:var(--serif);font-size:1.3rem;font-weight:600}.receipt-brand span{font-family:var(--sans);font-size:.85rem;font-weight:500;color:var(--ink-2)}
.receipt dl{display:grid;grid-template-columns:auto 1fr;gap:.55rem 1.2rem;margin:0}.receipt dt{color:var(--ink-2);font-size:.9rem}.receipt dd{margin:0;font-variant-numeric:tabular-nums}
.receipt .big{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(34,30,25,.2);padding-top:.8rem;margin-top:.4rem}.receipt dl>.big:first-child{border-top:0;padding-top:0;margin-top:0}.receipt .big .money{font-size:2rem}
.items{margin:1.2rem 0 0;padding:0;list-style:none}.items li{display:flex;justify-content:space-between;gap:1rem;padding:.35rem 0;border-bottom:1px dashed rgba(34,30,25,.2);font-size:.95rem}
.support{margin:1.6rem 0 .4rem;font-weight:500}.actions{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.4rem 0}
.ok{color:var(--ok)}.ko{color:var(--ko)}.hold{color:var(--hold)}
.state{display:inline-block;padding:.15rem .55rem;border-radius:3px;font-size:.82rem;font-weight:500;background:var(--sand-2);color:var(--ink-2)}.state.paid{background:#EAF3EC;color:var(--ok)}.state.declined,.state.failed,.state.reversed{background:#FBECEC;color:var(--ko)}.state.unknown,.state.review,.state.registered,.state.partially_refunded{background:#FBF1D9;color:var(--hold)}
.empty{max-width:32rem;padding:2rem 0}
.site-foot{border-top:1px solid var(--rule);margin-top:2rem}.site-foot .wrap{display:flex;flex-wrap:wrap;gap:.6rem 1.6rem;padding-block:1.4rem 2rem;font-size:.9rem;color:var(--ink-2)}.site-foot a{color:var(--ink-2)}
.legal{max-width:44rem}.legal-sec{margin-top:1.6rem}.legal-sec h2{font-size:1.15rem;margin-bottom:.4rem}.legal-sec p{color:var(--ink-2)}
@media(max-width:52rem){.lead,.split{grid-template-columns:1fr}.list{grid-template-columns:repeat(2,1fr);gap:1.5rem 1rem}.summary{position:static}header .wrap{flex-wrap:wrap;gap:.6rem 1.2rem}nav{margin-inline-start:0;flex-wrap:wrap;gap:.9rem;font-size:.92rem}}
@media(max-width:34rem){.list{grid-template-columns:1fr}}
@media(prefers-reduced-motion:no-preference){button,.btn{transition:background-color .15s,border-color .15s}}
@media print{header,.actions,form,.no-print{display:none}body{background:#fff}.receipt{background:#fff;border:1px solid #999}.receipt:after{display:none}}
`;

const fonts = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23143B64'/%3E%3Ctext x='16' y='23' text-anchor='middle' fill='white' font-size='22'%3EW%3C/text%3E%3C/svg%3E"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;600&display=swap">`;

const cardMark = `<span class="cards"><img src="/images/cib-edahabia-logo.png" width="363" height="232" alt="CIB · Edahabia"></span>`;

export interface Ctx {
  lang: Lang;
  cartCount: number;
  current?: string;
  mode?: "simulator" | "certification" | "production";
  emailEnabled?: boolean;
}

const demoCopy = {
  FR: { title: "DÉMONSTRATION — PAS UNE BOUTIQUE RÉELLE", text: "Les articles, prix et commandes servent uniquement à tester WathiqPay. Aucun achat ni aucune livraison réels. Utilisez uniquement les cartes de test SATIM, jamais votre carte personnelle, et des coordonnées fictives.", pay: "Tester le paiement", catalog: "Catalogue de démonstration : aucun article n’est réellement vendu ou livré." },
  EN: { title: "DEMO — NOT A REAL STORE", text: "Products, prices and orders are only for testing WathiqPay. No real purchases or deliveries. Use only SATIM test cards, never your personal card, and fictional contact details.", pay: "Test payment", catalog: "Demo catalog: no products are actually sold or delivered." },
  AR: { title: "عرض تجريبي — ليس متجرًا حقيقيًا", text: "المنتجات والأسعار والطلبات مخصصة لاختبار WathiqPay فقط. لا توجد مشتريات أو عمليات توصيل فعلية. استخدم بطاقات اختبار SATIM فقط، وليس بطاقتك الشخصية، وبيانات اتصال وهمية.", pay: "اختبار الدفع", catalog: "كتالوج تجريبي: لا يتم بيع المنتجات أو توصيلها فعليًا." },
};
const isDemo = (ctx: Ctx) => ctx.mode === "simulator" || ctx.mode === "certification";

export function layout(ctx: Ctx, title: string, body: string): string {
  const t = messages[ctx.lang];
  const current = ctx.current ?? "/";
  const skip = { FR: "Aller au contenu principal", EN: "Skip to main content", AR: "انتقل إلى المحتوى الرئيسي" }[ctx.lang];
  const demo = demoCopy[ctx.lang];
  const langLinks = (["FR", "AR", "EN"] as Lang[])
    .map((l) => (l === ctx.lang ? `<strong lang="${l.toLowerCase()}" aria-current="true">${l}</strong>` : `<a lang="${l.toLowerCase()}" hreflang="${l.toLowerCase()}" href="/lang/${l}?next=${encodeURIComponent(current)}">${l}</a>`))
    .join("");
  return `<!doctype html><html lang="${ctx.lang.toLowerCase()}" dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} – ${esc(t.shopTitle)}</title>${fonts}<style>${css}</style></head>
<body><a class="skip-link" href="#main">${skip}</a>${isDemo(ctx) ? `<aside class="test-banner" aria-label="${esc(demo.title)}"><div class="wrap"><strong>${esc(demo.title)}</strong><p>${esc(demo.text)}</p></div></aside>` : ""}<header><div class="wrap"><a class="wordmark" href="/">${esc(t.shopTitle)}${isDemo(ctx) ? " · DEMO" : ""}</a>
<nav><a href="/">${esc(t.shop)}</a><a href="/orders">${esc(t.myOrders)}</a><a href="/cart">${esc(t.cart)}<span class="count">${ctx.cartCount}</span></a><span class="lang">${langLinks}</span></nav></div></header>
<main id="main" tabindex="-1"><div class="wrap">${body}</div></main>
<footer class="site-foot"><div class="wrap"><a href="/conditions">${esc(t.legalTerms)}</a><a href="/confidentialite">${esc(t.legalPrivacy)}</a><span>${esc(t.support)}</span></div></footer></body></html>`;
}

function addForm(t: (typeof messages)["FR"], p: Product): string {
  return `<form class="add" method="post" action="/cart/add"><input type="hidden" name="product" value="${p.id}"><input type="number" name="quantity" value="1" min="1" max="99" aria-label="${esc(t.quantity)}"><button type="submit">${esc(t.addToCart)}</button></form>`;
}

export function catalogPage(ctx: Ctx, notice?: string): string {
  const t = messages[ctx.lang];
  const [lead, ...rest] = PRODUCTS;
  const items = rest
    .map((p) => `<article class="item"><span class="art">${productImg(p, ctx.lang)}</span><h2>${esc(p.name[ctx.lang])}</h2><p>${esc(p.blurb[ctx.lang])}</p><div class="money">${esc(formatAmount(p.priceMinor, ctx.lang))}</div>${addForm(t, p)}</article>`)
    .join("");
  return layout(
    ctx,
    t.catalog,
    `${notice ? `<p class="alert good" role="status">${esc(notice)}</p>` : ""}
<h1>${esc(t.catalog)}</h1><p class="lede">${esc(isDemo(ctx) ? demoCopy[ctx.lang].catalog : t.tagline)}</p>
<section class="lead"><span class="art">${productImg(lead!, ctx.lang, "(max-width: 52rem) 100vw, 55vw")}</span><div><h2>${esc(lead!.name[ctx.lang])}</h2><p>${esc(lead!.blurb[ctx.lang])}</p><div class="money">${esc(formatAmount(lead!.priceMinor, ctx.lang))}</div>${addForm(t, lead!)}</div></section>
<section class="list">${items}</section>`,
  );
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
      ({ product, quantity, lineMinor }) => `<tr class="line"><td><span class="thumb">${productImg(product, lang, "4rem")}</span>${esc(product.name[lang])}</td>
<td class="num">${editable ? `<form method="post" action="/cart/update"><input type="hidden" name="product" value="${product.id}"><input type="number" name="quantity" value="${quantity}" min="0" max="99" aria-label="${esc(t.quantity)}"><button class="quiet" type="submit">${esc(t.update)}</button></form>` : `× ${quantity}`}</td>
<td class="num money">${esc(formatAmount(lineMinor, lang))}</td></tr>`,
    )
    .join("");
  return `<table><tbody>${rows}</tbody><tfoot><tr><th colspan="2">${esc(t.shipping)}</th><td class="num">${esc(t.shippingFree)}</td></tr><tr><th colspan="2">${esc(t.total)}</th><td class="num money">${esc(formatAmount(totalMinor, lang))}</td></tr></tfoot></table>`;
}

export function cartPage(ctx: Ctx, cart: { lines: PricedLine[]; totalMinor: string }): string {
  const t = messages[ctx.lang];
  if (cart.lines.length === 0) return layout(ctx, t.cart, `<div class="empty"><h1>${esc(t.cart)}</h1><p class="lede">${esc(t.cartEmpty)}</p><a class="btn" href="/">${esc(t.continueShopping)}</a></div>`);
  return layout(
    ctx,
    t.cart,
    `<h1>${esc(t.cart)}</h1>${linesTable(ctx.lang, cart.lines, cart.totalMinor, true)}
<div class="actions"><a class="btn" href="/checkout">${esc(t.proceed)}</a><a class="btn quiet" href="/">${esc(t.continueShopping)}</a></div>`,
  );
}

export interface CustomerInput {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
}

export type CaptchaWidget = { kind: "math"; question: string; token: string } | { kind: "recaptcha"; siteKey: string };

export function checkoutPage(ctx: Ctx, cart: { lines: PricedLine[]; totalMinor: string }, captcha: CaptchaWidget | { question: string; token: string }, opts: { error?: string; customer?: CustomerInput } = {}): string {
  const t = messages[ctx.lang];
  const amount = formatAmount(cart.totalMinor, ctx.lang);
  const summaryRows = cart.lines.map((l) => `<tr><td>${esc(l.product.name[ctx.lang])} × ${l.quantity}</td><td class="num money">${esc(formatAmount(l.lineMinor, ctx.lang))}</td></tr>`).join("");
  return layout(
    ctx,
    t.checkout,
    `<h1>${esc(t.checkout)}</h1>
<div class="split"><form method="post" action="/checkout">
  ${opts.error ? `<p class="alert bad" role="alert">${esc(opts.error)}</p>` : ""}
  <h2>${esc(t.customerDetails)}</h2>
  <label class="field"><span>${esc(t.fullName)}</span><input type="text" name="name" value="${esc(opts.customer?.name ?? "")}" required autocomplete="name" maxlength="80"></label>
  <label class="field"><span>${esc(t.phone)}</span><input type="text" name="phone" value="${esc(opts.customer?.phone ?? "")}" required autocomplete="tel" inputmode="tel" placeholder="${esc(t.phoneHint)}"></label>
  <label class="field"><span>${esc(t.address)}</span><input type="text" name="address" value="${esc(opts.customer?.address ?? "")}" autocomplete="street-address" maxlength="200"></label>
  ${ctx.emailEnabled !== false ? `<label class="field"><span>${esc(t.customerEmail)}</span><input type="email" name="email" value="${esc(opts.customer?.email ?? "")}" autocomplete="email"></label>` : ""}
  <div class="terms"><h2>${esc(t.terms)}</h2><p>${esc(t.termsText)}</p><p><a href="/conditions" target="_blank" rel="noopener">${esc(t.readFullTerms)}</a> · <a href="/confidentialite" target="_blank" rel="noopener">${esc(t.legalPrivacy)}</a></p><label class="check"><input type="checkbox" name="terms" value="yes" required><span>${esc(t.acceptTerms)}</span></label></div>
  ${"kind" in captcha && captcha.kind === "recaptcha"
    ? `<div class="captcha recaptcha"><div class="g-recaptcha" data-sitekey="${esc(captcha.siteKey)}"></div></div><script src="https://www.google.com/recaptcha/api.js?hl=${ctx.lang.toLowerCase()}" async defer></script>`
    : `<div class="captcha"><label for="captcha">${esc(t.captcha)} <strong>${esc((captcha as { question: string }).question)}</strong> ?</label><input id="captcha" type="text" name="captcha" required inputmode="numeric" autocomplete="off"><input type="hidden" name="captchaToken" value="${esc((captcha as { token: string }).token)}"></div>`}
  <button class="pay" type="submit"><span>${esc(t.payAmount)} <span class="money">${esc(amount)}</span></span>${cardMark}</button>
</form>
<aside class="summary"><h2>${esc(t.orderSummary)}</h2><table><tbody>${summaryRows}</tbody><tfoot><tr><th>${esc(t.shipping)}</th><td class="num">${esc(t.shippingFree)}</td></tr></tfoot></table>
<div class="total"><span>${esc(t.total)}</span><span class="money" id="total">${esc(amount)}</span></div></aside></div>`,
  );
}

export function ordersPage(ctx: Ctx, orders: OrderRow[]): string {
  const t = messages[ctx.lang];
  if (orders.length === 0) return layout(ctx, t.myOrders, `<div class="empty"><h1>${esc(t.myOrders)}</h1><p class="lede">${esc(t.noOrders)}</p><a class="btn" href="/">${esc(t.continueShopping)}</a></div>`);
  const rows = orders
    .map((o) => `<tr><td><a href="/orders/${o.orderNumber}">${o.orderNumber}</a></td><td>${esc(formatDateTime(o.createdAt, ctx.lang))}</td><td class="num money">${esc(formatAmount(o.amountMinor, ctx.lang))}</td><td><span class="state ${o.state}">${esc(t.stateLabels[o.state])}</span></td></tr>`)
    .join("");
  return layout(ctx, t.myOrders, `<h1>${esc(t.myOrders)}</h1><table><thead><tr><th>${esc(t.orderNumber)}</th><th>${esc(t.date)}</th><th class="num">${esc(t.amount)}</th><th>${esc(t.status)}</th></tr></thead><tbody>${rows}</tbody></table>`);
}

export function orderDetailPage(ctx: Ctx, order: OrderRow, items: OrderItem[], ack: AcknowledgeResult | undefined): string {
  const t = messages[ctx.lang];
  const lines = items.map((it) => `<tr><td>${esc(it.name)} × ${it.quantity}</td><td class="num money">${esc(formatAmount((BigInt(it.unitMinor) * BigInt(it.quantity)).toString(), ctx.lang))}</td></tr>`).join("");
  const receipt = order.state === "paid" && ack ? `<div class="actions"><a class="btn quiet" href="/orders/${order.orderNumber}/receipt" target="_blank">${esc(t.print)}</a><a class="btn quiet" href="/orders/${order.orderNumber}/receipt.pdf">${esc(t.downloadPdf)}</a></div>` : "";
  return layout(
    ctx,
    `${t.orderNumber} ${order.orderNumber}`,
    `<div class="result"><h1>${esc(t.orderNumber)} ${order.orderNumber}</h1><p class="status"><span class="state ${order.state}">${esc(t.stateLabels[order.state])}</span> &nbsp; ${esc(formatDateTime(order.createdAt, ctx.lang))}${order.satimOrderId ? `<br><small>${esc(t.transactionId)}: ${esc(order.satimOrderId)}</small>` : ""}</p>
<table><tbody>${lines}</tbody><tfoot><tr><th>${esc(t.total)}</th><td class="num money">${esc(formatAmount(order.amountMinor, ctx.lang))}</td></tr></tfoot></table>
<h2 style="margin-top:1.6rem">${esc(t.customer)}</h2><p>${esc(order.customerName ?? "")}<br>${esc(order.customerPhone ?? "")}${order.customerAddress ? `<br>${esc(order.customerAddress)}` : ""}${order.customerEmail ? `<br>${esc(order.customerEmail)}` : ""}</p>
${receipt}<p><a href="/orders">${esc(t.myOrders)}</a></p></div>`,
  );
}

export interface ReceiptData {
  order: OrderRow;
  ack: AcknowledgeResult;
}

export function receiptRows(lang: Lang, { order, ack }: ReceiptData): Array<[string, string]> {
  const t = messages[lang];
  return [
    [t.status, t.successTitle],
    [t.orderNumber, order.orderNumber],
    [t.transactionId, order.satimOrderId ?? ""],
    [t.approvalCode, ack.approvalCode ?? ""],
    [t.dateTime, formatDateTime(order.acknowledgedAt ?? order.fulfilledAt ?? new Date().toISOString(), lang)],
    [t.amount, formatAmount(ack.amountMinor ?? order.amountMinor, lang)],
    [t.paymentMethod, t.paymentMethodValue],
  ];
}

function receiptBlock(lang: Lang, data: ReceiptData, items: OrderItem[]): string {
  const t = messages[lang];
  const rows = receiptRows(lang, data);
  const amountRow = rows.find(([k]) => k === t.amount)!;
  const dl = rows.filter(([k]) => k !== t.amount).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  const list = items.length ? `<ul class="items">${items.map((it) => `<li><span>${esc(it.name)} × ${it.quantity}</span><span class="money">${esc(formatAmount((BigInt(it.unitMinor) * BigInt(it.quantity)).toString(), lang))}</span></li>`).join("")}</ul>` : "";
  return `<div class="receipt"><p class="receipt-brand">${esc(t.shopTitle)}<span>${esc(t.receipt)}</span></p><dl>${dl}<div class="big"><dt>${esc(amountRow[0])}</dt><dd class="money">${esc(amountRow[1])}</dd></div></dl>${list}</div>`;
}

export function successPage(ctx: Ctx, data: ReceiptData, items: OrderItem[], emailSentTo?: string, emailError?: boolean, owner = true, emailEnabled = true): string {
  const t = messages[ctx.lang];
  const ref = data.order.orderNumber;
  return layout(
    { ...ctx, current: `/payment/return?ref=${ref}` },
    t.successTitle,
    `<div class="result"><h1 class="ok">${esc(t.successTitle)}</h1><p class="status">${esc(data.ack.respCodeDescription ?? "")}</p>
${receiptBlock(ctx.lang, data, items)}
<p class="support">${esc(t.support)}</p>
${owner ? `<div class="actions no-print"><a class="btn quiet" href="/orders/${ref}/receipt" target="_blank">${esc(t.print)}</a><a class="btn quiet" href="/orders/${ref}/receipt.pdf">${esc(t.downloadPdf)}</a></div>
${emailSentTo ? `<p class="alert good" role="status">${esc(t.emailSent)} ${esc(emailSentTo)}.</p>` : ""}
${emailError ? `<p class="alert bad" role="alert">${esc(t.emailFailed)}</p>` : ""}
${emailEnabled ? `<form method="post" action="/orders/${ref}/receipt/email"><label class="field"><span>${esc(t.emailReceipt)}</span><input type="email" name="email" required value="${esc(data.order.customerEmail ?? "")}" autocomplete="email"></label><button class="quiet" type="submit">${esc(t.send)}</button></form>` : ""}` : ""}
<p style="margin-top:2rem"><a href="/">${esc(t.backToShop)}</a> &nbsp; <a href="/orders">${esc(t.myOrders)}</a></p></div>`,
  );
}

export function receiptPage(ctx: Ctx, data: ReceiptData, items: OrderItem[]): string {
  const t = messages[ctx.lang];
  return layout(ctx, t.receipt, `<div class="result"><h1>${esc(t.receipt)}</h1><p class="status">${esc(t.shopTitle)}</p>${receiptBlock(ctx.lang, data, items)}<p class="support">${esc(t.support)}</p><p class="no-print"><button class="quiet" onclick="print()">${esc(t.print)}</button></p></div>`);
}

/** SATIM action codes that arrive with English-only text (live-observed, 22–23 September 2026). */
const KNOWN_ACTION_CODES: Record<string, "cancelled" | "authFailed" | "blocked"> = {
  "342034": "cancelled", // Operation cancelled by user
  "-2006": "authFailed", // TDS_AUTH_FAILED (3-D Secure password not validated)
  "2003": "blocked", // Card blocked for E-payments
};

export function failurePage(ctx: Ctx, order: OrderRow, ack: AcknowledgeResult | undefined, kind: "declined" | "reversed" | "refunded" | "partially_refunded" | "pending" | "review" | "failed"): string {
  const t = messages[ctx.lang];
  let title = t.failureTitle;
  let text: string;
  let cls = "ko";
  let satimNote: string | undefined;
  switch (kind) {
    case "refunded":
    case "partially_refunded":
      title = t.stateLabels[kind];
      text = t.stateLabels[kind];
      cls = "hold";
      break;
    case "reversed":
      text = t.reversedText;
      break;
    case "pending":
      title = t.pendingTitle;
      text = t.pendingText;
      cls = "hold";
      break;
    case "review":
      title = t.reviewTitle;
      text = t.reviewText;
      cls = "hold";
      break;
    case "failed":
      text = t.registrationFailed;
      break;
    default: {
      // Checklist: show respCode_desc, otherwise actionCodeDescription. SATIM only
      // sends English text for a few codes (live-observed), so for those we add a
      // translated explanation and keep SATIM's own text underneath.
      const satimText = ack?.respCodeDescription || ack?.actionCodeDescription;
      const known = !ack?.respCodeDescription ? KNOWN_ACTION_CODES[String(ack?.actionCode ?? "")] : undefined;
      if (known) {
        if (known === "cancelled") {
          title = t.cancelledTitle;
          cls = "hold";
        }
        text = t[`${known}Text` as "cancelledText" | "authFailedText" | "blockedText"];
        satimNote = satimText;
      } else {
        text = satimText || t.reversedText;
      }
    }
  }
  return layout(
    ctx,
    title,
    `<div class="result"><h1 class="${cls}">${esc(title)}</h1><p class="status">${esc(text)}</p>${satimNote ? `<p class="note">${esc(t.satimMessage)} : <span lang="en">${esc(satimNote)}</span></p>` : ""}
<div class="receipt"><dl><div class="big"><dt>${esc(t.amount)}</dt><dd class="money">${esc(formatAmount(order.amountMinor, ctx.lang))}</dd></div></dl></div>
<p class="support">${esc(t.support)}</p><div class="actions"><a class="btn" href="/cart">${esc(t.cart)}</a><a class="btn quiet" href="/">${esc(t.backToShop)}</a></div></div>`,
  );
}

export function legalPage(ctx: Ctx, page: LegalPage): string {
  const sections = page.sections
    .map((sec) => `<section class="legal-sec"><h2>${esc(sec.heading)}</h2>${sec.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</section>`)
    .join("");
  return layout(ctx, page.title, `<article class="legal"><h1>${esc(page.title)}</h1><p class="note">${esc(page.updated)}</p><p class="lede">${esc(page.intro)}</p>${sections}</article>`);
}

export function notFoundPage(ctx: Ctx): string {
  const t = messages[ctx.lang];
  return layout(ctx, t.notFound, `<div class="empty"><h1>${esc(t.notFound)}</h1><a class="btn" href="/">${esc(t.backToShop)}</a></div>`);
}
