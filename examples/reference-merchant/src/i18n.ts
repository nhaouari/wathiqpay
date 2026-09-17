export type Lang = "FR" | "AR" | "EN";

const fr = {
  dir: "ltr",
  shopTitle: "Boutique de démonstration WathiqPay",
  product: "Article de démonstration",
  quantity: "Quantité",
  unitPrice: "Prix unitaire",
  total: "Montant total à payer",
  currency: "DZD",
  terms: "Conditions de vente et conditions de paiement en ligne",
  termsText:
    "En cliquant sur « Payer », vous acceptez les conditions de vente du produit et les conditions du paiement en ligne par carte CIB ou Edahabia. Le paiement est traité sur la page sécurisée de SATIM ; aucune donnée de carte n'est saisie sur ce site.",
  acceptTerms: "J'ai lu et j'accepte les conditions de vente et les conditions de paiement en ligne.",
  captcha: "Vérification anti-robot : combien font",
  pay: "Payer par carte CIB / Edahabia",
  payBadge: "CIB · Edahabia",
  logoNote: "Emplacement du logo officiel CIB/Edahabia fourni par SATIM (non redistribué dans ce dépôt).",
  captchaFailed: "La vérification anti-robot a échoué. Réessayez.",
  termsRequired: "Vous devez accepter les conditions avant de payer.",
  successTitle: "Paiement accepté",
  failureTitle: "Paiement refusé",
  pendingTitle: "Paiement en cours de vérification",
  reviewTitle: "Paiement à vérifier",
  pendingText: "Nous n'avons pas encore pu confirmer votre paiement auprès de SATIM. Ne relancez pas le paiement ; contactez-nous avec votre numéro de commande.",
  reviewText: "Le paiement a été accepté par SATIM mais ne correspond pas à la commande enregistrée. Notre service client vous contactera.",
  reversedText: "Votre transaction a été rejetée. Veuillez contacter votre banque ou le service client SATIM au 3020.",
  orderNumber: "Numéro de commande",
  transactionId: "Identifiant de transaction SATIM",
  approvalCode: "Code d'autorisation",
  dateTime: "Date et heure",
  amount: "Montant",
  paymentMethod: "Moyen de paiement",
  paymentMethodValue: "Carte CIB / Edahabia",
  support: "Service client SATIM : 3020",
  print: "Imprimer le reçu",
  downloadPdf: "Télécharger le reçu (PDF)",
  emailReceipt: "Recevoir le reçu par e-mail",
  emailAddress: "Adresse e-mail",
  send: "Envoyer",
  emailSent: "Le reçu a été envoyé à",
  receipt: "Reçu de paiement",
  backToShop: "Retour à la boutique",
  registrationFailed: "La commande n'a pas pu être enregistrée auprès de SATIM. Aucun paiement n'a été effectué.",
  notFound: "Commande introuvable.",
  language: "Langue",
};

const en: typeof fr = {
  dir: "ltr",
  shopTitle: "WathiqPay demo shop",
  product: "Demo item",
  quantity: "Quantity",
  unitPrice: "Unit price",
  total: "Total amount to pay",
  currency: "DZD",
  terms: "Terms of sale and online payment terms",
  termsText:
    "By clicking “Pay”, you accept the product terms of sale and the terms of online payment by CIB or Edahabia card. Payment is processed on SATIM's secure page; no card data is entered on this site.",
  acceptTerms: "I have read and accept the terms of sale and the online payment terms.",
  captcha: "Anti-robot check: what is",
  pay: "Pay by CIB / Edahabia card",
  payBadge: "CIB · Edahabia",
  logoNote: "Placement for the official CIB/Edahabia logo supplied by SATIM (not redistributed in this repository).",
  captchaFailed: "The anti-robot check failed. Please try again.",
  termsRequired: "You must accept the terms before paying.",
  successTitle: "Payment accepted",
  failureTitle: "Payment refused",
  pendingTitle: "Payment being verified",
  reviewTitle: "Payment needs review",
  pendingText: "We could not yet confirm your payment with SATIM. Do not pay again; contact us with your order number.",
  reviewText: "SATIM accepted the payment but it does not match the recorded order. Customer service will contact you.",
  reversedText: "Your transaction was rejected. Please contact your bank or SATIM customer service on 3020.",
  orderNumber: "Order number",
  transactionId: "SATIM transaction ID",
  approvalCode: "Approval code",
  dateTime: "Date and time",
  amount: "Amount",
  paymentMethod: "Payment method",
  paymentMethodValue: "CIB / Edahabia card",
  support: "SATIM customer service: 3020",
  print: "Print receipt",
  downloadPdf: "Download receipt (PDF)",
  emailReceipt: "Email the receipt",
  emailAddress: "Email address",
  send: "Send",
  emailSent: "The receipt was sent to",
  receipt: "Payment receipt",
  backToShop: "Back to shop",
  registrationFailed: "The order could not be registered with SATIM. No payment was taken.",
  notFound: "Order not found.",
  language: "Language",
};

const ar: typeof fr = {
  dir: "rtl",
  shopTitle: "متجر WathiqPay التجريبي",
  product: "منتج تجريبي",
  quantity: "الكمية",
  unitPrice: "سعر الوحدة",
  total: "المبلغ الإجمالي المستحق",
  currency: "دج",
  terms: "شروط البيع وشروط الدفع الإلكتروني",
  termsText:
    "بالضغط على «ادفع» فإنك تقبل شروط بيع المنتج وشروط الدفع الإلكتروني ببطاقة CIB أو الذهبية. تتم معالجة الدفع على صفحة SATIM الآمنة؛ لا تُدخل أي بيانات بطاقة على هذا الموقع.",
  acceptTerms: "قرأت وأقبل شروط البيع وشروط الدفع الإلكتروني.",
  captcha: "التحقق من أنك لست روبوتًا: كم يساوي",
  pay: "ادفع ببطاقة CIB / الذهبية",
  payBadge: "CIB · الذهبية",
  logoNote: "موضع الشعار الرسمي CIB/الذهبية المقدم من SATIM (غير مُعاد توزيعه في هذا المستودع).",
  captchaFailed: "فشل التحقق. حاول مرة أخرى.",
  termsRequired: "يجب قبول الشروط قبل الدفع.",
  successTitle: "تم قبول الدفع",
  failureTitle: "تم رفض الدفع",
  pendingTitle: "الدفع قيد التحقق",
  reviewTitle: "الدفع يحتاج إلى مراجعة",
  pendingText: "لم نتمكن بعد من تأكيد دفعك لدى SATIM. لا تعد الدفع؛ اتصل بنا مع رقم الطلب.",
  reviewText: "قبلت SATIM الدفع لكنه لا يطابق الطلب المسجل. ستتصل بك خدمة العملاء.",
  reversedText: "تم رفض معاملتك. يرجى الاتصال بالبنك أو بخدمة عملاء SATIM على الرقم 3020.",
  orderNumber: "رقم الطلب",
  transactionId: "معرّف معاملة SATIM",
  approvalCode: "رمز الموافقة",
  dateTime: "التاريخ والوقت",
  amount: "المبلغ",
  paymentMethod: "وسيلة الدفع",
  paymentMethodValue: "بطاقة CIB / الذهبية",
  support: "خدمة عملاء SATIM: 3020",
  print: "طباعة الإيصال",
  downloadPdf: "تنزيل الإيصال (PDF)",
  emailReceipt: "إرسال الإيصال بالبريد الإلكتروني",
  emailAddress: "البريد الإلكتروني",
  send: "إرسال",
  emailSent: "تم إرسال الإيصال إلى",
  receipt: "إيصال الدفع",
  backToShop: "العودة إلى المتجر",
  registrationFailed: "تعذر تسجيل الطلب لدى SATIM. لم يتم أي دفع.",
  notFound: "الطلب غير موجود.",
  language: "اللغة",
};

export const messages: Record<Lang, typeof fr> = { FR: fr, EN: en, AR: ar };

export function normalizeLang(value: string | undefined): Lang {
  const v = (value ?? "").toUpperCase();
  return v === "AR" || v === "EN" ? v : "FR";
}

export function formatAmount(minor: string, lang: Lang): string {
  const whole = minor.slice(0, -2) || "0";
  const fraction = minor.slice(-2).padStart(2, "0");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, lang === "EN" ? "," : " ");
  const sep = lang === "EN" ? "." : ",";
  return `${grouped}${sep}${fraction} ${messages[lang].currency}`;
}

export function formatDateTime(iso: string, lang: Lang): string {
  const locale = lang === "AR" ? "ar-DZ" : lang === "EN" ? "en-GB" : "fr-DZ";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "medium", timeZone: "Africa/Algiers" }).format(new Date(iso));
}
