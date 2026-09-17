import type { Lang } from "./i18n.js";

export interface Product {
  id: string;
  name: Record<Lang, string>;
  blurb: Record<Lang, string>;
  priceMinor: string;
  /** Inline SVG illustration so the demo ships no binary assets. */
  art: { bg: string; fg: string; glyph: string };
}

export const PRODUCTS: readonly Product[] = [
  { id: "dates", name: { FR: "Dattes Deglet Nour 1 kg", AR: "تمر دقلة نور 1 كغ", EN: "Deglet Nour dates 1 kg" }, blurb: { FR: "Biskra, récolte de l'année.", AR: "بسكرة، محصول السنة.", EN: "Biskra, this year's harvest." }, priceMinor: "120000", art: { bg: "#f6e7c1", fg: "#7a4a12", glyph: "M20 60 Q50 10 80 60 Q50 90 20 60Z" } },
  { id: "olive-oil", name: { FR: "Huile d'olive de Kabylie 1 L", AR: "زيت زيتون القبائل 1 ل", EN: "Kabylie olive oil 1 L" }, blurb: { FR: "Première pression à froid.", AR: "عصرة أولى على البارد.", EN: "First cold press." }, priceMinor: "180000", art: { bg: "#e3efd3", fg: "#3f6b1f", glyph: "M50 15 L65 45 A15 15 0 1 1 35 45 Z" } },
  { id: "burnous", name: { FR: "Burnous en laine", AR: "برنوس صوفي", EN: "Wool burnous" }, blurb: { FR: "Tissé à la main, taille unique.", AR: "نسج يدوي، مقاس واحد.", EN: "Hand-woven, one size." }, priceMinor: "950000", art: { bg: "#efe6da", fg: "#6b4f35", glyph: "M50 15 L80 85 L20 85 Z" } },
  { id: "tea-set", name: { FR: "Service à thé en cuivre", AR: "طقم شاي نحاسي", EN: "Copper tea set" }, blurb: { FR: "Théière et six verres gravés.", AR: "إبريق وستة أكواب منقوشة.", EN: "Teapot and six engraved glasses." }, priceMinor: "650000", art: { bg: "#f8dcc8", fg: "#9a4a1e", glyph: "M30 40 H70 L65 80 H35 Z M70 50 Q85 55 70 65" } },
  { id: "ceramic", name: { FR: "Plat en céramique de Nabeul", AR: "طبق سيراميك", EN: "Ceramic serving dish" }, blurb: { FR: "Motif bleu traditionnel, 32 cm.", AR: "نقش أزرق تقليدي، 32 سم.", EN: "Traditional blue pattern, 32 cm." }, priceMinor: "320000", art: { bg: "#d9e8f5", fg: "#1f4e8a", glyph: "M50 50 m-32 0 a32 32 0 1 0 64 0 a32 32 0 1 0 -64 0 M50 50 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0" } },
  { id: "book", name: { FR: "Livre : Cuisine algérienne", AR: "كتاب: المطبخ الجزائري", EN: "Book: Algerian cooking" }, blurb: { FR: "200 recettes, édition reliée.", AR: "200 وصفة، طبعة مجلدة.", EN: "200 recipes, hardcover." }, priceMinor: "250000", art: { bg: "#e9e2f5", fg: "#4b2e83", glyph: "M25 20 H70 V80 H25 Z M32 30 H63 M32 40 H63 M32 50 H55" } },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function productSvg(p: Product): string {
  return `<svg viewBox="0 0 100 100" role="img" aria-hidden="true"><rect width="100" height="100" rx="12" fill="${p.art.bg}"/><path d="${p.art.glyph}" fill="none" stroke="${p.art.fg}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
