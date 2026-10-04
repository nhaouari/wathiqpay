/** Pages only the course store has: the course catalog, a course's own page, and the contact page. */
import { formatAmount } from "./i18n.js";
import { productImg, type Product } from "./catalog.js";
import type { Operator } from "./legal.js";
import { layout, esc, shopOf, cardMark, type Ctx } from "./views.js";

const svg = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = [
  svg(`<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`), // lock
  svg(`<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10 9l4 2-4 2z"/><path d="M8 20h8"/>`), // screen
  svg(`<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>`), // receipt
];
const CHECK = svg(`<path d="M5 12l5 5 9-10"/>`);

function addForm(ctx: Ctx, p: Product): string {
  const t = shopOf(ctx).messages[ctx.lang];
  return `<form class="add" method="post" action="/cart/add"><input type="hidden" name="product" value="${p.id}"><button type="submit">${esc(t.addToCart)}</button></form>`;
}

function steps(ctx: Ctx): string {
  const c = shopOf(ctx).courseText![ctx.lang];
  return `<section class="sec"><h2>${esc(c.howTitle)}</h2><ol class="steps">${c.steps.map(([title, text]) => `<li><strong>${esc(title)}</strong><span>${esc(text)}</span></li>`).join("")}</ol></section>`;
}

function trainer(ctx: Ctx): string {
  const c = shopOf(ctx).courseText![ctx.lang];
  return `<section class="sec"><h2>${esc(c.trainerTitle)}</h2><div class="trainer"><img src="/images/trainer.jpg" alt="${esc(c.trainerName)}" width="400" height="400" loading="lazy" decoding="async"><div><strong>${esc(c.trainerName)}</strong><span class="role">${esc(c.trainerRole)}</span><ul>${c.trainerBio.map((line) => `<li>${esc(line)}</li>`).join("")}</ul></div></div></section>`;
}

export function courseCatalogPage(ctx: Ctx): string {
  const shop = shopOf(ctx);
  const t = shop.messages[ctx.lang];
  const c = shop.courseText![ctx.lang];
  const cards = shop.products
    .map(
      (p) => `<article class="item"><a class="art" href="/courses/${p.id}">${productImg(p, ctx.lang, "(max-width: 52rem) 100vw, 50vw")}</a><div class="item-body"><span class="tag">${esc(c.taughtIn)}</span><h2><a href="/courses/${p.id}">${esc(p.name[ctx.lang])}</a></h2><p>${esc(p.blurb[ctx.lang])}</p><div class="money">${esc(formatAmount(p.priceMinor, ctx.lang))}</div>
<div class="add">${addForm(ctx, p)}<a class="btn quiet" href="/courses/${p.id}">${esc(c.viewCourse)}</a></div></div></article>`,
    )
    .join("");
  return layout(
    ctx,
    t.catalog,
    `<section class="hero"><h1>${esc(t.catalog)}</h1><p class="lede">${esc(t.tagline)}</p></section>
<section class="list">${cards}</section>
<section class="sec"><ul class="assure">${c.assurances.map(([title, text], i) => `<li>${ICONS[i] ?? ""}<div><strong>${esc(title)}</strong><span>${esc(text)}</span></div></li>`).join("")}</ul></section>
${trainer(ctx)}
${steps(ctx)}`,
  );
}

export function coursePage(ctx: Ctx, p: Product): string {
  const shop = shopOf(ctx);
  const t = shop.messages[ctx.lang];
  const c = shop.courseText![ctx.lang];
  const features = p.features?.[ctx.lang] ?? [];
  return layout(
    ctx,
    p.name[ctx.lang],
    `<p><a href="/">${esc(t.backToShop)}</a></p>
<article class="course"><div class="c-head"><span class="tag">${esc(c.taughtIn)}</span><h1>${esc(p.name[ctx.lang])}</h1><p class="lede">${esc(p.blurb[ctx.lang])}</p></div>
<aside class="buy"><span class="money">${esc(formatAmount(p.priceMinor, ctx.lang))}</span>${addForm(ctx, p)}
<ul>${c.assurances.map(([title]) => `<li>${CHECK}<span>${esc(title)}</span></li>`).join("")}</ul>${cardMark}</aside>
<div class="c-body"><span class="art">${productImg(p, ctx.lang, "(max-width: 52rem) 100vw, 60vw")}</span>
${features.length ? `<section class="sec"><h2>${esc(c.included)}</h2><ul class="feat">${features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>` : ""}
${trainer(ctx)}
${steps(ctx)}
<section class="sec faq"><h2>${esc(c.faqTitle)}</h2>${c.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section></div></article>`,
  );
}

export function contactPage(ctx: Ctx, op: Operator): string {
  const c = shopOf(ctx).courseText![ctx.lang];
  const labels = { FR: ["Vendeur", "Adresse", "Registre du commerce", "E-mail", "Téléphone", "Site"], EN: ["Seller", "Address", "Trade register", "Email", "Telephone", "Website"], AR: ["البائع", "العنوان", "السجل التجاري", "البريد الإلكتروني", "الهاتف", "الموقع"] }[ctx.lang];
  const rows: Array<[string, string | undefined, (string | undefined)?]> = [
    [labels[0]!, op.name],
    [labels[1]!, op.address],
    [labels[2]!, op.rc],
    [labels[3]!, op.email, op.email ? `mailto:${op.email}` : undefined],
    [labels[4]!, op.phone, op.phone ? `tel:${op.phone.replace(/\s/g, "")}` : undefined],
    [labels[5]!, op.website, op.website],
  ];
  const dl = rows
    .filter(([, value]) => value)
    .map(([label, value, href]) => `<dt>${esc(label)}</dt><dd>${href ? `<a href="${esc(href)}" dir="ltr">${esc(value)}</a>` : esc(value)}</dd>`)
    .join("");
  return layout(ctx, c.contact, `<h1>${esc(c.contact)}</h1><p class="lede">${esc(c.contactIntro)}</p><div class="contact-card"><dl>${dl}</dl></div>`);
}
