import type { Lang } from "./i18n.js";

export interface Product {
  id: string;
  name: Record<Lang, string>;
  blurb: Record<Lang, string>;
  priceMinor: string;
  /** Served from public/images; see public/images/ATTRIBUTION.md for licences. */
  image: string;
}

export const PRODUCTS: readonly Product[] = [
  { id: "dates", name: { FR: "Dattes Deglet Nour 1 kg", AR: "تمر دقلة نور 1 كغ", EN: "Deglet Nour dates 1 kg" }, blurb: { FR: "Biskra, récolte de l'année, calibre extra.", AR: "بسكرة، محصول السنة، حجم ممتاز.", EN: "Biskra, this year's harvest, extra grade." }, priceMinor: "120000", image: "dates.jpg" },
  { id: "olive-oil", name: { FR: "Huile d'olive de Kabylie 1 L", AR: "زيت زيتون القبائل 1 ل", EN: "Kabylie olive oil 1 L" }, blurb: { FR: "Première pression à froid, non filtrée.", AR: "عصرة أولى على البارد، غير مصفاة.", EN: "First cold press, unfiltered." }, priceMinor: "180000", image: "olive-oil.jpg" },
  { id: "rug", name: { FR: "Tapis berbère 120 × 180 cm", AR: "زربية أمازيغية 120 × 180 سم", EN: "Berber rug 120 × 180 cm" }, blurb: { FR: "Laine tissée main, motifs des Aurès.", AR: "صوف منسوج يدويًا، نقوش الأوراس.", EN: "Hand-woven wool, Aurès patterns." }, priceMinor: "2400000", image: "rug.jpg" },
  { id: "tea-set", name: { FR: "Service à thé, théière et six verres", AR: "طقم شاي، إبريق وستة أكواب", EN: "Tea set, teapot and six glasses" }, blurb: { FR: "Plateau ciselé et verres peints.", AR: "صينية منقوشة وأكواب مزخرفة.", EN: "Engraved tray and painted glasses." }, priceMinor: "650000", image: "tea-set.jpg" },
  { id: "ceramic", name: { FR: "Bols en céramique peints, lot de 4", AR: "أوعية خزفية مزخرفة، طقم من 4", EN: "Painted ceramic bowls, set of 4" }, blurb: { FR: "Émaillés à la main, passent au lave-vaisselle.", AR: "مطلية يدويًا، آمنة لغسالة الصحون.", EN: "Hand-glazed, dishwasher safe." }, priceMinor: "320000", image: "ceramic.jpg" },
  { id: "honey", name: { FR: "Miel de montagne 1 kg", AR: "عسل جبلي 1 كغ", EN: "Mountain honey 1 kg" }, blurb: { FR: "Toutes fleurs, récolté dans le Djurdjura.", AR: "متعدد الأزهار، من جبال جرجرة.", EN: "Wildflower, harvested in the Djurdjura." }, priceMinor: "250000", image: "honey.jpg" },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function productImg(p: Product, lang: Lang, sizes = "(max-width: 52rem) 100vw, 33vw"): string {
  return `<img src="/images/${p.image}" alt="${p.name[lang].replace(/"/g, "&quot;")}" width="1200" height="900" loading="lazy" decoding="async" sizes="${sizes}">`;
}
