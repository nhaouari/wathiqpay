/**
 * Terms of sale and privacy policy of the course store, in French, Arabic and
 * English. Like legal.ts, the text describes what the code does; the seller's
 * identity comes from the LEGAL_* environment variables.
 */
import type { Lang } from "./i18n.js";
import { contactLine, identity, type LegalPage, type Operator } from "./legal.js";

const UPDATED = { FR: "Dernière mise à jour : 4 octobre 2026", EN: "Last updated: 4 October 2026", AR: "آخر تحديث: 4 أكتوبر 2026" };

export function courseTermsPage(lang: Lang, op: Operator): LegalPage {
  const who = identity(op, lang);
  const contact = contactLine(op, lang);
  if (lang === "AR") {
    return {
      title: "شروط البيع وشروط الدفع الإلكتروني",
      updated: UPDATED.AR,
      intro: `يبيع هذا الموقع دورات عبر الإنترنت يقدمها ${who}. تُتابَع الدورات على منصة دورات عبر الإنترنت.`,
      sections: [
        { heading: "1. الدورات والأسعار", paragraphs: ["الدورات محتوى رقمي يُتابَع عبر الإنترنت؛ لا يُرسل أي منتج مادي. لغة كل دورة مبيّنة في صفحتها.", "الأسعار معروضة بالدينار الجزائري وتشمل جميع الرسوم.", "لا يُعتبر الطلب مؤكدًا إلا بعد أن تؤكد SATIM الدفع لخادم المتجر. رسالة إعادة التوجيه في المتصفح وحدها لا تكفي لتأكيد الدفع."] },
        { heading: "2. الوصول إلى الدورة", paragraphs: [`بعد تأكيد الدفع يُسجَّل البريد الإلكتروني الذي أدخلته عند الطلب في الدورة على منصة الدورات، ويُنشأ لك حساب إن لم يكن لديك حساب. يُعرض رابط المنصة بعد الدفع. عند أول دخول تختار كلمة مرورك عبر رابط إعادة تعيين كلمة المرور في صفحة تسجيل الدخول.`, "يُفتح الوصول عادةً فور تأكيد الدفع. إذا لم يُفتح خلال ساعة، اتصل بنا مع رقم الطلب.", "الوصول شخصي: لا يجوز مشاركة الحساب ولا إعادة نشر محتوى الدورات."] },
        { heading: "3. الدفع الإلكتروني", paragraphs: ["يتم الدفع ببطاقة CIB أو الذهبية على صفحة الدفع الآمنة لـ SATIM، مع التحقق 3-D Secure. لا يُدخل رقم البطاقة ولا رمز CVV2 ولا كلمة السر على هذا الموقع، ولا تمر عبر خوادمه.", "يُقبل الدفع فقط إذا أكدت SATIM نجاح العملية والمبلغ ورقم الطلب. بعد القبول يمكنك طباعة الإيصال وتنزيله بصيغة PDF واستلامه بالبريد الإلكتروني."] },
        { heading: "4. الإلغاء والرفض والاسترداد", paragraphs: ["يمكنك إلغاء الدفع على صفحة SATIM قبل التأكيد: لا يُخصم أي مبلغ.", "إذا رفض البنك الدفع، يُعرض سبب الرفض كما ترسله SATIM، ولا يُفتح أي وصول.", "لطلب استرداد، اتصل بنا مع رقم الطلب؛ تُدرس الطلبات حالة بحالة. يتم الاسترداد، كليًا أو جزئيًا، إلى البطاقة المستعملة عبر SATIM، وتتوقف مدة ظهور المبلغ على بنكك. يُغلق الوصول إلى الدورة المستردة."] },
        { heading: "5. المطالبات", paragraphs: [`لأي سؤال حول طلب أو حول الوصول إلى دورة: ${contact}.`, "لأي مشكلة تخص بطاقتك: خدمة عملاء SATIM على الرقم المجاني 3020."] },
        { heading: "6. القانون المطبق", paragraphs: ["تخضع هذه الشروط للقانون الجزائري، ولا سيما القانون 18-05 المتعلق بالتجارة الإلكترونية."] },
      ],
    };
  }
  if (lang === "EN") {
    return {
      title: "Terms of sale and online payment",
      updated: UPDATED.EN,
      intro: `This site sells online courses offered by ${who}. The courses are followed on an online course platform.`,
      sections: [
        { heading: "1. Courses and prices", paragraphs: ["Courses are digital content followed online; no physical product is shipped. The language of each course is stated on its page.", "Prices are shown in Algerian dinars and include all charges.", "An order is confirmed only once SATIM has confirmed the payment to the store's server. The redirect in your browser alone does not confirm a payment."] },
        { heading: "2. Access to the course", paragraphs: [`Once the payment is confirmed, the email address you entered when ordering is enrolled in the course on the course platform, and an account is created for it if you do not have one. The link to the platform is shown after payment. On your first sign-in you choose your password through the password reset link on the sign-in page.`, "Access normally opens as soon as the payment is confirmed. If it has not opened within the hour, contact us with your order number.", "Access is personal: the account must not be shared and course content must not be redistributed."] },
        { heading: "3. Online payment", paragraphs: ["You pay by CIB or Edahabia card on SATIM's secure payment page, with 3-D Secure. Your card number, CVV2 and password are never entered on this site and never pass through its servers.", "A payment is accepted only if SATIM confirms the operation, the amount and the order number. Once accepted, you can print the receipt, download it as a PDF and receive it by e-mail."] },
        { heading: "4. Cancellation, refusal and refunds", paragraphs: ["You can cancel on SATIM's page before confirming: nothing is charged.", "If your bank refuses the payment, the reason is shown as SATIM sends it and no access is opened.", "To ask for a refund, contact us with your order number; requests are examined case by case. Refunds, full or partial, go back to the card used, through SATIM; how long they take to appear depends on your bank. Access to a refunded course is closed."] },
        { heading: "5. Complaints", paragraphs: [`For questions about an order or about access to a course: ${contact}.`, "For a problem with your card: SATIM customer service, free number 3020."] },
        { heading: "6. Governing law", paragraphs: ["These terms are governed by Algerian law, in particular Law 18-05 on electronic commerce."] },
      ],
    };
  }
  return {
    title: "Conditions générales de vente et de paiement en ligne",
    updated: UPDATED.FR,
    intro: `Ce site vend des cours en ligne proposés par ${who}. Les cours sont suivis sur une plateforme de cours en ligne.`,
    sections: [
      { heading: "1. Cours et prix", paragraphs: ["Les cours sont des contenus numériques suivis en ligne ; aucun produit physique n'est expédié. La langue de chaque cours est indiquée sur sa page.", "Les prix sont indiqués en dinars algériens, toutes charges comprises.", "Une commande n'est confirmée qu'après confirmation du paiement par SATIM au serveur de la boutique. Le simple retour du navigateur ne vaut pas confirmation du paiement."] },
      { heading: "2. Accès au cours", paragraphs: [`Une fois le paiement confirmé, l'adresse e-mail indiquée lors de la commande est inscrite au cours sur la plateforme de cours, et un compte lui est créé si vous n'en avez pas. Le lien vers la plateforme est affiché après le paiement. À la première connexion, vous choisissez votre mot de passe grâce au lien de réinitialisation du mot de passe de la page de connexion.`, "L'accès est normalement ouvert dès la confirmation du paiement. S'il ne l'est pas dans l'heure, contactez-nous avec votre numéro de commande.", "L'accès est personnel : le compte ne doit pas être partagé et le contenu des cours ne doit pas être rediffusé."] },
      { heading: "3. Paiement en ligne", paragraphs: ["Le paiement s'effectue par carte CIB ou Edahabia sur la page de paiement sécurisée de SATIM, avec authentification 3-D Secure. Le numéro de carte, le code CVV2 et le mot de passe ne sont jamais saisis sur ce site et ne transitent pas par ses serveurs.", "Un paiement n'est accepté que si SATIM confirme l'opération, le montant et le numéro de commande. Une fois accepté, vous pouvez imprimer le reçu, le télécharger en PDF et le recevoir par e-mail."] },
      { heading: "4. Annulation, refus et remboursement", paragraphs: ["Vous pouvez annuler sur la page SATIM avant de valider : aucun montant n'est débité.", "Si votre banque refuse le paiement, le motif est affiché tel que SATIM le transmet et aucun accès n'est ouvert.", "Pour demander un remboursement, contactez-nous avec votre numéro de commande ; les demandes sont étudiées au cas par cas. Les remboursements, totaux ou partiels, sont effectués sur la carte utilisée, via SATIM ; le délai d'apparition dépend de votre banque. L'accès au cours remboursé est fermé."] },
      { heading: "5. Réclamations", paragraphs: [`Pour toute question sur une commande ou sur l'accès à un cours : ${contact}.`, "Pour un problème lié à votre carte : service client SATIM, numéro vert 3020."] },
      { heading: "6. Droit applicable", paragraphs: ["Les présentes conditions sont soumises au droit algérien, notamment à la loi n° 18-05 relative au commerce électronique."] },
    ],
  };
}

export function coursePrivacyPage(lang: Lang, op: Operator): LegalPage {
  const who = identity(op, lang);
  const contact = contactLine(op, lang);
  if (lang === "AR") {
    return {
      title: "سياسة الخصوصية",
      updated: UPDATED.AR,
      intro: `المسؤول عن معالجة البيانات: ${who}.`,
      sections: [
        { heading: "1. البيانات التي نجمعها", paragraphs: ["عند الطلب: اسمك الكامل، رقم هاتفك، بريدك الإلكتروني، والدورات المطلوبة ومبلغ الطلب.", "من SATIM بعد الدفع: رقم المعاملة، رمز الموافقة، الحالة والمبلغ. لا نحتفظ برقم البطاقة ولا باسم حاملها ولا بتاريخ انتهائها.", "لا يمر رقم البطاقة ولا رمز CVV2 ولا كلمة السر عبر هذا الموقع أبدًا."] },
        { heading: "2. الغرض", paragraphs: ["تنفيذ طلبك، والتحقق من الدفع لدى SATIM، وفتح وصولك إلى الدورة، وإصدار الإيصال وإرساله، والحماية من الطلبات الآلية."] },
        { heading: "3. مقدمو الخدمات", paragraphs: ["SATIM: الدفع ببطاقة CIB والذهبية.", `OnlineCourseHost: منصة استضافة الدورات. بعد الدفع نرسل إليها اسمك وبريدك الإلكتروني لإنشاء حسابك وتسجيلك في الدورة.`, "Google reCAPTCHA: التحقق من أنك لست روبوتًا في صفحة الدفع. تخضع البيانات التي تجمعها Google لسياسة الخصوصية وشروط الاستخدام الخاصة بها.", "Resend: إرسال الإيصال وتأكيد الوصول بالبريد الإلكتروني.", "Vercel: استضافة الموقع (باريس). Turso: قاعدة بيانات الطلبات."] },
        { heading: "4. ملفات تعريف الارتباط", paragraphs: ["ملف sid: يحفظ سلتك وطلباتك خلال زيارتك، وهو ضروري لعمل المتجر.", "ملف lang: يحفظ اللغة التي اخترتها.", "قد تضع Google reCAPTCHA ملفاتها الخاصة في صفحة الدفع."] },
        { heading: "5. مدة الاحتفاظ", paragraphs: ["تُحفظ بيانات الطلبات طوال المدة اللازمة لمتابعة الطلب وللوفاء بالالتزامات القانونية والمحاسبية."] },
        { heading: "6. حقوقك", paragraphs: [`وفقًا للقانون 18-07 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، يحق لك الاطلاع على بياناتك وتصحيحها وحذفها والاعتراض على معالجتها. للتواصل: ${contact}.`, "يمكنك أيضًا تقديم شكوى إلى السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي (ANPDP)."] },
      ],
    };
  }
  if (lang === "EN") {
    return {
      title: "Privacy policy",
      updated: UPDATED.EN,
      intro: `Data controller: ${who}.`,
      sections: [
        { heading: "1. What we collect", paragraphs: ["When you order: your full name, your phone number, your email address, the courses ordered and the amount of the order.", "From SATIM after payment: the transaction ID, approval code, status and amount. We do not keep your card number, the cardholder name or the expiry date.", "Your card number, CVV2 and password never pass through this site."] },
        { heading: "2. Why", paragraphs: ["To process your order, confirm the payment with SATIM, open your access to the course, issue and send your receipt, and protect the store against automated orders."] },
        { heading: "3. Service providers", paragraphs: ["SATIM: CIB and Edahabia card payment.", `OnlineCourseHost: the platform that hosts the courses. After payment we send it your name and email address to create your account and enrol you in the course.`, "Google reCAPTCHA: the \"I'm not a robot\" check on the checkout page. Data Google collects is subject to Google's privacy policy and terms of service.", "Resend: sends the receipt and the access confirmation by e-mail.", "Vercel: hosts the site (Paris). Turso: stores the orders."] },
        { heading: "4. Cookies", paragraphs: ["sid: keeps your cart and orders during your visit; needed for the store to work.", "lang: remembers the language you chose.", "Google reCAPTCHA may set its own cookies on the checkout page."] },
        { heading: "5. How long", paragraphs: ["Order data is kept for as long as needed to follow up the order and to meet legal and accounting obligations."] },
        { heading: "6. Your rights", paragraphs: [`Under Law 18-07 on the protection of individuals in the processing of personal data, you can access, correct and delete your data and object to its processing. Contact: ${contact}.`, "You can also complain to the national personal data protection authority (ANPDP)."] },
      ],
    };
  }
  return {
    title: "Politique de confidentialité",
    updated: UPDATED.FR,
    intro: `Responsable du traitement : ${who}.`,
    sections: [
      { heading: "1. Données collectées", paragraphs: ["Lors de la commande : votre nom complet, votre numéro de téléphone, votre adresse e-mail, les cours commandés et le montant de la commande.", "Transmises par SATIM après le paiement : identifiant de transaction, code d'autorisation, statut et montant. Nous ne conservons ni le numéro de carte, ni le nom du porteur, ni la date d'expiration.", "Le numéro de carte, le code CVV2 et le mot de passe ne transitent jamais par ce site."] },
      { heading: "2. Finalités", paragraphs: ["Traiter votre commande, vérifier le paiement auprès de SATIM, ouvrir votre accès au cours, établir et envoyer votre reçu, et protéger la boutique contre les commandes automatisées."] },
      { heading: "3. Prestataires", paragraphs: ["SATIM : paiement par carte CIB et Edahabia.", `OnlineCourseHost : plateforme d'hébergement des cours. Après le paiement, nous lui transmettons votre nom et votre adresse e-mail pour créer votre compte et vous inscrire au cours.`, "Google reCAPTCHA : vérification « Je ne suis pas un robot » sur la page de paiement. Les données collectées par Google sont soumises à ses règles de confidentialité et conditions d'utilisation.", "Resend : envoi du reçu et de la confirmation d'accès par e-mail.", "Vercel : hébergement du site (Paris). Turso : base de données des commandes."] },
      { heading: "4. Cookies", paragraphs: ["sid : conserve votre panier et vos commandes pendant votre visite ; indispensable au fonctionnement de la boutique.", "lang : mémorise la langue choisie.", "Google reCAPTCHA peut déposer ses propres cookies sur la page de paiement."] },
      { heading: "5. Durée de conservation", paragraphs: ["Les données de commande sont conservées le temps nécessaire au suivi de la commande et au respect des obligations légales et comptables."] },
      { heading: "6. Vos droits", paragraphs: [`Conformément à la loi n° 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, vous pouvez accéder à vos données, les rectifier, les supprimer et vous opposer à leur traitement. Contact : ${contact}.`, "Vous pouvez également saisir l'Autorité nationale de protection des données à caractère personnel (ANPDP)."] },
    ],
  };
}
