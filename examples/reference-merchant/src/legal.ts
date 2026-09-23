/**
 * Terms of sale / online payment and privacy policy for the demo shop, in
 * French, Arabic and English. The content describes what the code actually
 * does; operator details come from environment variables so a real merchant
 * can fill in its own legal identity without editing the text.
 */
import type { Lang } from "./i18n.js";

export interface Operator {
  name: string;
  address?: string | undefined;
  rc?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  website: string;
}

export function operatorFromEnv(env: NodeJS.ProcessEnv = process.env): Operator {
  return {
    name: env["LEGAL_NAME"] || "WathiqPay",
    address: env["LEGAL_ADDRESS"] || undefined,
    rc: env["LEGAL_RC"] || undefined,
    email: env["LEGAL_EMAIL"] || undefined,
    phone: env["LEGAL_PHONE"] || undefined,
    website: env["LEGAL_WEBSITE"] || "https://www.wathiqpay.com",
  };
}

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPage {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const UPDATED = { FR: "Dernière mise à jour : 23 septembre 2026", EN: "Last updated: 23 September 2026", AR: "آخر تحديث: 23 سبتمبر 2026" };

function contactLine(op: Operator, lang: Lang): string {
  const parts = [op.email, op.phone].filter(Boolean).join(" · ");
  const via = { FR: `le formulaire de contact de ${op.website}`, EN: `the contact form at ${op.website}`, AR: `نموذج الاتصال على ${op.website}` }[lang];
  return parts ? `${parts} (${via})` : via;
}

function identity(op: Operator, lang: Lang): string {
  const bits = [op.name, op.address, op.rc ? { FR: `RC ${op.rc}`, EN: `Trade register ${op.rc}`, AR: `السجل التجاري ${op.rc}` }[lang] : undefined].filter(Boolean);
  return bits.join(", ");
}

export function termsPage(lang: Lang, op: Operator): LegalPage {
  const who = identity(op, lang);
  const contact = contactLine(op, lang);
  if (lang === "AR") {
    return {
      title: "شروط البيع وشروط الدفع الإلكتروني",
      updated: UPDATED.AR,
      intro: `هذا الموقع متجر تجريبي يديره ${who} لعرض وحدة الدفع WathiqPay. يعمل على بيئة الاختبار الخاصة بـ SATIM: لا يُباع أي منتج فعليًا، ولا يتم أي توصيل، ولا يُخصم أي مبلغ حقيقي.`,
      sections: [
        { heading: "1. الطلبات والأسعار", paragraphs: ["الأسعار معروضة بالدينار الجزائري وتشمل جميع الرسوم. التوصيل مجاني.", "لا يُعتبر الطلب مؤكدًا إلا بعد أن تؤكد SATIM الدفع لخادم المتجر. رسالة إعادة التوجيه في المتصفح وحدها لا تكفي لتأكيد الدفع."] },
        { heading: "2. الدفع الإلكتروني", paragraphs: ["يتم الدفع ببطاقة CIB أو الذهبية على صفحة الدفع الآمنة لـ SATIM، مع التحقق 3-D Secure. لا يُدخل رقم البطاقة ولا رمز CVV2 ولا كلمة السر على هذا الموقع، ولا تمر عبر خوادمه.", "يُقبل الدفع فقط إذا أكدت SATIM نجاح العملية والمبلغ ورقم الطلب. بعد القبول يمكنك طباعة الإيصال وتنزيله بصيغة PDF واستلامه بالبريد الإلكتروني."] },
        { heading: "3. الإلغاء والرفض والاسترداد", paragraphs: ["يمكنك إلغاء الدفع على صفحة SATIM قبل التأكيد: لا يُخصم أي مبلغ.", "إذا رفض البنك الدفع، يُعرض سبب الرفض كما ترسله SATIM، ولا يُنفذ الطلب.", "يتم الاسترداد، كليًا أو جزئيًا، إلى البطاقة المستعملة عبر SATIM. تتوقف مدة ظهور المبلغ على بنكك."] },
        { heading: "4. المطالبات", paragraphs: [`لأي سؤال حول طلب: ${contact}.`, "لأي مشكلة تخص بطاقتك: خدمة عملاء SATIM على الرقم المجاني 3020."] },
        { heading: "5. القانون المطبق", paragraphs: ["تخضع هذه الشروط للقانون الجزائري، ولا سيما القانون 18-05 المتعلق بالتجارة الإلكترونية."] },
      ],
    };
  }
  if (lang === "EN") {
    return {
      title: "Terms of sale and online payment",
      updated: UPDATED.EN,
      intro: `This site is a demonstration shop operated by ${who} to show the WathiqPay payment module. It runs on SATIM's test platform: nothing is actually sold, nothing is delivered, and no real money is charged.`,
      sections: [
        { heading: "1. Orders and prices", paragraphs: ["Prices are shown in Algerian dinars and include all charges. Delivery is free.", "An order is confirmed only once SATIM has confirmed the payment to the shop's server. The redirect in your browser alone does not confirm a payment."] },
        { heading: "2. Online payment", paragraphs: ["You pay by CIB or Edahabia card on SATIM's secure payment page, with 3-D Secure. Your card number, CVV2 and password are never entered on this site and never pass through its servers.", "A payment is accepted only if SATIM confirms the operation, the amount and the order number. Once accepted, you can print the receipt, download it as a PDF and receive it by e-mail."] },
        { heading: "3. Cancellation, refusal and refunds", paragraphs: ["You can cancel on SATIM's page before confirming: nothing is charged.", "If your bank refuses the payment, the reason is shown as SATIM sends it and the order is not fulfilled.", "Refunds, full or partial, go back to the card used, through SATIM. How long they take to appear depends on your bank."] },
        { heading: "4. Complaints", paragraphs: [`For questions about an order: ${contact}.`, "For a problem with your card: SATIM customer service, free number 3020."] },
        { heading: "5. Governing law", paragraphs: ["These terms are governed by Algerian law, in particular Law 18-05 on electronic commerce."] },
      ],
    };
  }
  return {
    title: "Conditions générales de vente et de paiement en ligne",
    updated: UPDATED.FR,
    intro: `Ce site est une boutique de démonstration exploitée par ${who} pour présenter le module de paiement WathiqPay. Il fonctionne sur la plateforme de test de SATIM : aucun produit n'est réellement vendu, aucune livraison n'a lieu et aucun montant réel n'est débité.`,
    sections: [
      { heading: "1. Commandes et prix", paragraphs: ["Les prix sont indiqués en dinars algériens, toutes charges comprises. La livraison est offerte.", "Une commande n'est confirmée qu'après confirmation du paiement par SATIM au serveur de la boutique. Le simple retour du navigateur ne vaut pas confirmation du paiement."] },
      { heading: "2. Paiement en ligne", paragraphs: ["Le paiement s'effectue par carte CIB ou Edahabia sur la page de paiement sécurisée de SATIM, avec authentification 3-D Secure. Le numéro de carte, le code CVV2 et le mot de passe ne sont jamais saisis sur ce site et ne transitent pas par ses serveurs.", "Un paiement n'est accepté que si SATIM confirme l'opération, le montant et le numéro de commande. Une fois accepté, vous pouvez imprimer le reçu, le télécharger en PDF et le recevoir par e-mail."] },
      { heading: "3. Annulation, refus et remboursement", paragraphs: ["Vous pouvez annuler sur la page SATIM avant de valider : aucun montant n'est débité.", "Si votre banque refuse le paiement, le motif est affiché tel que SATIM le transmet et la commande n'est pas exécutée.", "Les remboursements, totaux ou partiels, sont effectués sur la carte utilisée, via SATIM. Le délai d'apparition dépend de votre banque."] },
      { heading: "4. Réclamations", paragraphs: [`Pour toute question sur une commande : ${contact}.`, "Pour un problème lié à votre carte : service client SATIM, numéro vert 3020."] },
      { heading: "5. Droit applicable", paragraphs: ["Les présentes conditions sont soumises au droit algérien, notamment à la loi n° 18-05 relative au commerce électronique."] },
    ],
  };
}

export function privacyPage(lang: Lang, op: Operator): LegalPage {
  const who = identity(op, lang);
  const contact = contactLine(op, lang);
  if (lang === "AR") {
    return {
      title: "سياسة الخصوصية",
      updated: UPDATED.AR,
      intro: `المسؤول عن معالجة البيانات: ${who}. هذا المتجر تجريبي ويعمل على بيئة الاختبار الخاصة بـ SATIM.`,
      sections: [
        { heading: "1. البيانات التي نجمعها", paragraphs: ["عند الطلب: اسمك الكامل، رقم هاتفك، وعنوانك وبريدك الإلكتروني إن أدخلتهما، ومحتوى الطلب ومبلغه.", "من SATIM بعد الدفع: رقم المعاملة، رمز الموافقة، الحالة والمبلغ. لا نحتفظ برقم البطاقة ولا باسم حاملها ولا بتاريخ انتهائها.", "لا يمر رقم البطاقة ولا رمز CVV2 ولا كلمة السر عبر هذا الموقع أبدًا."] },
        { heading: "2. الغرض", paragraphs: ["تنفيذ طلبك، والتحقق من الدفع لدى SATIM، وإصدار الإيصال وإرساله، والحماية من الطلبات الآلية."] },
        { heading: "3. مقدمو الخدمات", paragraphs: ["SATIM: الدفع ببطاقة CIB والذهبية.", "Google reCAPTCHA: التحقق من أنك لست روبوتًا في صفحة الدفع. تخضع البيانات التي تجمعها Google لسياسة الخصوصية وشروط الاستخدام الخاصة بها.", "Resend: إرسال الإيصال بالبريد الإلكتروني، فقط إذا طلبت ذلك.", "Vercel: استضافة الموقع (باريس). Turso: قاعدة بيانات الطلبات."] },
        { heading: "4. ملفات تعريف الارتباط", paragraphs: ["ملف sid: يحفظ سلتك وطلباتك خلال زيارتك، وهو ضروري لعمل المتجر.", "ملف lang: يحفظ اللغة التي اخترتها.", "قد تضع Google reCAPTCHA ملفاتها الخاصة في صفحة الدفع."] },
        { heading: "5. مدة الاحتفاظ", paragraphs: ["تُحفظ بيانات هذا المتجر التجريبي طوال مرحلة الاعتماد لدى SATIM، ثم تُحذف."] },
        { heading: "6. حقوقك", paragraphs: [`وفقًا للقانون 18-07 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، يحق لك الاطلاع على بياناتك وتصحيحها وحذفها والاعتراض على معالجتها. للتواصل: ${contact}.`, "يمكنك أيضًا تقديم شكوى إلى السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي (ANPDP)."] },
      ],
    };
  }
  if (lang === "EN") {
    return {
      title: "Privacy policy",
      updated: UPDATED.EN,
      intro: `Data controller: ${who}. This is a demonstration shop running on SATIM's test platform.`,
      sections: [
        { heading: "1. What we collect", paragraphs: ["When you order: your full name, your phone number, your address and e-mail if you enter them, and the contents and amount of the order.", "From SATIM after payment: the transaction ID, approval code, status and amount. We do not keep your card number, the cardholder name or the expiry date.", "Your card number, CVV2 and password never pass through this site."] },
        { heading: "2. Why", paragraphs: ["To process your order, confirm the payment with SATIM, issue and send your receipt, and protect the shop against automated orders."] },
        { heading: "3. Service providers", paragraphs: ["SATIM: CIB and Edahabia card payment.", "Google reCAPTCHA: the \"I'm not a robot\" check on the checkout page. Data Google collects is subject to Google's privacy policy and terms of service.", "Resend: sends the receipt by e-mail, only if you ask for it.", "Vercel: hosts the site (Paris). Turso: stores the orders."] },
        { heading: "4. Cookies", paragraphs: ["sid: keeps your cart and orders during your visit; needed for the shop to work.", "lang: remembers the language you chose.", "Google reCAPTCHA may set its own cookies on the checkout page."] },
        { heading: "5. How long", paragraphs: ["Data from this demonstration shop is kept for the duration of the SATIM certification phase, then deleted."] },
        { heading: "6. Your rights", paragraphs: [`Under Law 18-07 on the protection of individuals in the processing of personal data, you can access, correct and delete your data and object to its processing. Contact: ${contact}.`, "You can also complain to the national personal data protection authority (ANPDP)."] },
      ],
    };
  }
  return {
    title: "Politique de confidentialité",
    updated: UPDATED.FR,
    intro: `Responsable du traitement : ${who}. Cette boutique est une démonstration qui fonctionne sur la plateforme de test de SATIM.`,
    sections: [
      { heading: "1. Données collectées", paragraphs: ["Lors de la commande : votre nom complet, votre numéro de téléphone, votre adresse et votre e-mail si vous les indiquez, le contenu et le montant de la commande.", "Transmises par SATIM après le paiement : identifiant de transaction, code d'autorisation, statut et montant. Nous ne conservons ni le numéro de carte, ni le nom du porteur, ni la date d'expiration.", "Le numéro de carte, le code CVV2 et le mot de passe ne transitent jamais par ce site."] },
      { heading: "2. Finalités", paragraphs: ["Traiter votre commande, vérifier le paiement auprès de SATIM, établir et envoyer votre reçu, et protéger la boutique contre les commandes automatisées."] },
      { heading: "3. Prestataires", paragraphs: ["SATIM : paiement par carte CIB et Edahabia.", "Google reCAPTCHA : vérification « Je ne suis pas un robot » sur la page de paiement. Les données collectées par Google sont soumises à ses règles de confidentialité et conditions d'utilisation.", "Resend : envoi du reçu par e-mail, uniquement si vous le demandez.", "Vercel : hébergement du site (Paris). Turso : base de données des commandes."] },
      { heading: "4. Cookies", paragraphs: ["sid : conserve votre panier et vos commandes pendant votre visite ; indispensable au fonctionnement de la boutique.", "lang : mémorise la langue choisie.", "Google reCAPTCHA peut déposer ses propres cookies sur la page de paiement."] },
      { heading: "5. Durée de conservation", paragraphs: ["Les données de cette boutique de démonstration sont conservées pendant la phase de certification SATIM, puis supprimées."] },
      { heading: "6. Vos droits", paragraphs: [`Conformément à la loi n° 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, vous pouvez accéder à vos données, les rectifier, les supprimer et vous opposer à leur traitement. Contact : ${contact}.`, "Vous pouvez également saisir l'Autorité nationale de protection des données à caractère personnel (ANPDP)."] },
    ],
  };
}
