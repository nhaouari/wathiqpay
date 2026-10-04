/**
 * The same application serves two shops, selected by MERCHANT_STORE:
 * "demo" is the certification demonstration (sample goods, nothing sold);
 * "courses" is the real store selling online courses.
 */
import { messages, type Lang, type Messages } from "./i18n.js";
import { PRODUCTS, type Product } from "./catalog.js";
import { COURSES, COURSE_MESSAGES, COURSE_TEXT, type CourseText } from "./courses.js";

export type ShopId = "demo" | "courses";

export interface Shop {
  id: ShopId;
  products: readonly Product[];
  /** Digital goods: one of each, an e-mail address instead of a delivery address. */
  digital: boolean;
  /** Language shown to a visitor who has not chosen one. */
  defaultLang: Lang;
  messages: Record<Lang, Messages>;
  courseText?: Record<Lang, CourseText>;
}

export const demoShop: Shop = { id: "demo", products: PRODUCTS, digital: false, defaultLang: "FR", messages };

export const coursesShop: Shop = {
  id: "courses",
  products: COURSES,
  digital: true,
  defaultLang: "AR",
  messages: {
    FR: { ...messages.FR, ...COURSE_MESSAGES.FR },
    EN: { ...messages.EN, ...COURSE_MESSAGES.EN },
    AR: { ...messages.AR, ...COURSE_MESSAGES.AR },
  },
  courseText: COURSE_TEXT,
};

export function shopFor(id: ShopId | undefined): Shop {
  return id === "courses" ? coursesShop : demoShop;
}
