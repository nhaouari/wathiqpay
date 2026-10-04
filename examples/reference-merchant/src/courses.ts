/**
 * Course store (MERCHANT_STORE=courses): online courses sold in dinars by
 * CIB / Edahabia card. The courses are taught in Arabic, so the French and
 * English texts are translations of the Arabic originals.
 *
 * `courseId` is the OnlineCourseHost course identifier returned by
 * GET /api/zapier-tenant-courses; the buyer is enrolled in it after payment.
 */
import type { Lang, Messages } from "./i18n.js";
import type { Product } from "./catalog.js";

export const COURSES: readonly Product[] = [
  {
    id: "prompt-engineering",
    courseId: "3IOz3Dgd5qNg4bwlq6qg",
    name: { AR: "مهارة تصميم الأوامر: تحصّل على ما تريد من الذكاء الاصطناعي", FR: "L'art du prompt : obtenez ce que vous voulez de l'IA", EN: "The Art of Prompt Engineering: Get What You Want from AI" },
    blurb: {
      AR: "اكتسب المهارات اللازمة لاستخدام الذكاء الاصطناعي وصياغة الأوامر بشكل فعّال.",
      FR: "Acquérez les compétences pour utiliser l'IA et rédiger des prompts efficaces.",
      EN: "Gain the skills to use AI and write effective prompts.",
    },
    features: {
      AR: ["اكتساب مهارة صياغة الأوامر (Prompts)", "تطبيقات عملية فورية تساعدك في حياتك الدراسية والمهنية", "دروس فيديو تتابعها بالوتيرة التي تناسبك", "كتيّب تعليمي مفصّل يبقى مرجعًا بين يديك"],
      FR: ["Apprendre à formuler des prompts efficaces", "Des applications pratiques immédiates pour vos études et votre travail", "Des leçons vidéo à suivre à votre rythme", "Un livret détaillé à conserver comme référence"],
      EN: ["Learn to write effective prompts", "Immediate practical applications for study and work", "Video lessons to follow at your own pace", "A detailed booklet to keep as a reference"],
    },
    priceMinor: "200000",
    image: "course-prompt.png",
    imageSize: [1126, 634],
  },
  {
    id: "n8n-automation",
    courseId: "rkUNIGXTgtrPCz130A2D",
    name: { AR: "الأتمتة بأداة N8N خطوة بخطوة", FR: "Automatiser avec N8N, pas à pas", EN: "Automation with N8N, Step by Step" },
    blurb: {
      AR: "N8N أداة مفتوحة المصدر لأتمتة العمليات. تعلّم تثبيتها وبناء أول أتمتة لك.",
      FR: "N8N est un outil open source d'automatisation. Apprenez à l'installer et à construire votre première automatisation.",
      EN: "N8N is an open-source automation tool. Learn to install it and build your first automation.",
    },
    features: {
      AR: ["تثبيت N8N", "إنشاء بوت تيليجرام", "استعمال وكيل ذكاء اصطناعي داخل البوت", "نموذج أتمتة بسيط جاهز للتطبيق"],
      FR: ["Installer N8N", "Créer un bot Telegram", "Utiliser un agent d'IA dans le bot", "Un modèle d'automatisation simple, prêt à appliquer"],
      EN: ["Install N8N", "Build a Telegram bot", "Use an AI agent inside the bot", "A simple automation template, ready to apply"],
    },
    priceMinor: "150000",
    image: "course-n8n.png",
    imageSize: [1126, 634],
  },
];

/** Wording that replaces the demo shop's (physical goods, delivery) for a course store. */
export const COURSE_MESSAGES: Record<Lang, Partial<Messages>> = {
  FR: {
    shopTitle: "Wathiq Store",
    catalog: "Cours en ligne",
    tagline: "Des cours en ligne en arabe sur l'intelligence artificielle et l'automatisation. Paiement sécurisé par carte CIB ou Edahabia, accès ouvert dès la confirmation du paiement.",
    shop: "Cours",
    continueShopping: "Voir les cours",
    backToShop: "Retour aux cours",
    shipping: "Accès",
    shippingFree: "En ligne, dès la confirmation du paiement",
    customerEmail: "E-mail (votre identifiant pour accéder au cours)",
    items: "Cours",
    addedToCart: "Cours ajouté au panier.",
    product: "Cours en ligne",
    termsText:
      "En cliquant sur « Payer », vous acceptez les conditions de vente du cours et les conditions du paiement en ligne par carte CIB ou Edahabia. Le paiement est traité sur la page sécurisée de SATIM ; aucune donnée de carte n'est saisie sur ce site.",
  },
  EN: {
    shopTitle: "Wathiq Store",
    catalog: "Online courses",
    tagline: "Online courses in Arabic on artificial intelligence and automation. Secure payment by CIB or Edahabia card; access opens as soon as the payment is confirmed.",
    shop: "Courses",
    continueShopping: "Browse courses",
    backToShop: "Back to courses",
    shipping: "Access",
    shippingFree: "Online, as soon as the payment is confirmed",
    customerEmail: "Email (your login to access the course)",
    items: "Courses",
    addedToCart: "Course added to cart.",
    product: "Online course",
    termsText:
      "By clicking “Pay”, you accept the course terms of sale and the terms of online payment by CIB or Edahabia card. Payment is processed on SATIM's secure page; no card data is entered on this site.",
  },
  AR: {
    shopTitle: "متجر وثيق",
    catalog: "دورات عبر الإنترنت",
    tagline: "دورات عبر الإنترنت باللغة العربية في الذكاء الاصطناعي والأتمتة. دفع آمن ببطاقة CIB أو الذهبية، ويُفتح الوصول فور تأكيد الدفع.",
    shop: "الدورات",
    continueShopping: "تصفح الدورات",
    backToShop: "العودة إلى الدورات",
    shipping: "الوصول",
    shippingFree: "عبر الإنترنت، فور تأكيد الدفع",
    customerEmail: "البريد الإلكتروني (للدخول إلى الدورة)",
    items: "الدورات",
    addedToCart: "تمت إضافة الدورة إلى السلة.",
    product: "دورة عبر الإنترنت",
    termsText:
      "بالضغط على «ادفع» فإنك تقبل شروط بيع الدورة وشروط الدفع الإلكتروني ببطاقة CIB أو الذهبية. تتم معالجة الدفع على صفحة SATIM الآمنة؛ لا تُدخل أي بيانات بطاقة على هذا الموقع.",
  },
};

/** Strings only a course store needs. `{email}` and `{url}` are filled in by the views. */
export interface CourseText {
  viewCourse: string;
  included: string;
  taughtIn: string;
  emailRequired: string;
  accessTitle: string;
  accessReady: string;
  accessPending: string;
  /** Link text standing for the course platform, so its address is not spelled out on the page. */
  platform: string;
  accessCta: string;
  accessSubject: string;
  /** One line above the header. */
  strip: string;
  /** Three [title, text] reassurances shown on the home page and beside the price. */
  assurances: Array<[string, string]>;
  trainerTitle: string;
  trainerName: string;
  trainerRole: string;
  trainerBio: string[];
  howTitle: string;
  steps: Array<[string, string]>;
  faqTitle: string;
  faq: Array<[string, string]>;
  contact: string;
  contactIntro: string;
  footAbout: string;
  footLinks: string;
  footPayment: string;
  securePay: string;
  rights: string;
}

export const COURSE_TEXT: Record<Lang, CourseText> = {
  FR: {
    viewCourse: "Voir le cours",
    included: "Ce que comprend le cours",
    taughtIn: "Cours dispensé en arabe",
    emailRequired: "Indiquez votre adresse e-mail : elle sert à ouvrir votre accès au cours.",
    accessTitle: "Accès à vos cours",
    accessReady: "Votre inscription est active. Connectez-vous sur {url} avec l'adresse {email}. Si c'est votre première connexion, utilisez le lien de réinitialisation du mot de passe de la page de connexion pour choisir votre mot de passe.",
    accessPending: "Votre paiement est confirmé. Votre inscription est en cours de finalisation ; l'accès sera ouvert sous peu pour l'adresse {email}. S'il n'apparaît pas dans l'heure, contactez-nous avec votre numéro de commande.",
    platform: "la plateforme de cours",
    accessCta: "Accéder au cours",
    accessSubject: "Votre accès au cours",
    strip: "Paiement sécurisé par carte CIB ou Edahabia · Accès en ligne dès la confirmation du paiement",
    assurances: [
      ["Paiement sécurisé", "Vous payez sur la page sécurisée de SATIM, avec authentification 3-D Secure."],
      ["Accès dès le paiement confirmé", "Votre accès au cours est ouvert en ligne, sans attente de livraison."],
      ["Un reçu pour chaque achat", "Reçu imprimable et téléchargeable en PDF après chaque paiement."],
    ],
    trainerTitle: "Votre formateur",
    trainerName: "Dr Noureddine Haouari",
    trainerRole: "Chercheur en informatique",
    trainerBio: ["Docteur en systèmes informatiques.", "Consultant et créateur de contenu en intelligence artificielle générative.", "Développeur de Text Generator, une extension open source pour utiliser les modèles d'IA dans Obsidian."],
    howTitle: "Comment ça marche",
    steps: [
      ["Choisissez votre cours", "Ajoutez-le au panier et indiquez vos coordonnées."],
      ["Payez par carte CIB ou Edahabia", "Le paiement se fait sur la page sécurisée de SATIM."],
      ["Suivez le cours en ligne", "Dès la confirmation du paiement, votre adresse e-mail est inscrite au cours."],
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      ["Comment accéder au cours après le paiement ?", "Dès que SATIM confirme le paiement, l'adresse e-mail indiquée à la commande est inscrite au cours. La page de confirmation vous indique comment vous connecter."],
      ["Quelles cartes sont acceptées ?", "Les cartes CIB et Edahabia. Le numéro de carte n'est jamais saisi sur ce site : le paiement se fait sur la page de SATIM."],
      ["Dans quelle langue est le cours ?", "Le cours est dispensé en arabe."],
      ["Vais-je recevoir un reçu ?", "Oui. Après le paiement, vous pouvez imprimer le reçu ou le télécharger en PDF."],
      ["Puis-je être remboursé ?", "Contactez-nous avec votre numéro de commande. Les remboursements sont effectués sur la carte utilisée, via SATIM."],
    ],
    contact: "Contact",
    contactIntro: "Une question sur un cours ou sur une commande ? Écrivez-nous en indiquant votre numéro de commande.",
    footAbout: "Cours en ligne en arabe sur l'intelligence artificielle et l'automatisation.",
    footLinks: "Informations",
    footPayment: "Paiement",
    securePay: "Paiement sécurisé par SATIM",
    rights: "Tous droits réservés.",
  },
  EN: {
    viewCourse: "View course",
    included: "What the course includes",
    taughtIn: "Course taught in Arabic",
    emailRequired: "Enter your email address: it is used to open your access to the course.",
    accessTitle: "Access to your courses",
    accessReady: "Your enrolment is active. Sign in on {url} with {email}. If this is your first sign-in, use the password reset link on the sign-in page to choose your password.",
    accessPending: "Your payment is confirmed. Your enrolment is being finalised; access will open shortly for {email}. If it has not appeared within the hour, contact us with your order number.",
    platform: "the course platform",
    accessCta: "Go to the course",
    accessSubject: "Your course access",
    strip: "Secure payment by CIB or Edahabia card · Online access as soon as the payment is confirmed",
    assurances: [
      ["Secure payment", "You pay on SATIM's secure page, with 3-D Secure authentication."],
      ["Access once payment is confirmed", "Your access to the course opens online, with no delivery to wait for."],
      ["A receipt for every purchase", "A receipt you can print or download as a PDF after each payment."],
    ],
    trainerTitle: "Your instructor",
    trainerName: "Dr. Noureddine Haouari",
    trainerRole: "Computer science researcher",
    trainerBio: ["PhD in computer systems.", "Consultant and content creator in generative artificial intelligence.", "Developer of Text Generator, an open-source plugin for using AI models in Obsidian."],
    howTitle: "How it works",
    steps: [
      ["Choose your course", "Add it to the cart and enter your details."],
      ["Pay by CIB or Edahabia card", "Payment takes place on SATIM's secure page."],
      ["Follow the course online", "As soon as the payment is confirmed, your email address is enrolled in the course."],
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      ["How do I access the course after paying?", "As soon as SATIM confirms the payment, the email address you gave when ordering is enrolled in the course. The confirmation page tells you how to sign in."],
      ["Which cards are accepted?", "CIB and Edahabia cards. Your card number is never entered on this site: payment takes place on SATIM's page."],
      ["What language is the course in?", "The course is taught in Arabic."],
      ["Will I get a receipt?", "Yes. After the payment you can print the receipt or download it as a PDF."],
      ["Can I get a refund?", "Contact us with your order number. Refunds go back to the card used, through SATIM."],
    ],
    contact: "Contact",
    contactIntro: "A question about a course or an order? Write to us and include your order number.",
    footAbout: "Online courses in Arabic on artificial intelligence and automation.",
    footLinks: "Information",
    footPayment: "Payment",
    securePay: "Secure payment by SATIM",
    rights: "All rights reserved.",
  },
  AR: {
    viewCourse: "عرض الدورة",
    included: "ماذا تتضمن الدورة",
    taughtIn: "الدورة باللغة العربية",
    emailRequired: "أدخل بريدك الإلكتروني: يُستعمل لفتح وصولك إلى الدورة.",
    accessTitle: "الوصول إلى دوراتك",
    accessReady: "تسجيلك مفعّل. سجّل الدخول على {url} بالبريد {email}. إذا كانت هذه أول مرة تسجّل فيها الدخول، استعمل رابط إعادة تعيين كلمة المرور في صفحة تسجيل الدخول لاختيار كلمة مرورك.",
    accessPending: "تم تأكيد دفعك. يجري الآن إتمام تسجيلك؛ سيُفتح الوصول قريبًا للبريد {email}. إذا لم يظهر خلال ساعة، اتصل بنا مع رقم الطلب.",
    platform: "منصة الدورات",
    accessCta: "الدخول إلى الدورة",
    accessSubject: "وصولك إلى الدورة",
    strip: "دفع آمن ببطاقة CIB أو الذهبية · وصول عبر الإنترنت فور تأكيد الدفع",
    assurances: [
      ["دفع آمن", "تدفع على صفحة SATIM الآمنة، مع التحقق \u200E3-D Secure\u200E."],
      ["وصول فور تأكيد الدفع", "يُفتح وصولك إلى الدورة عبر الإنترنت دون انتظار أي توصيل."],
      ["إيصال لكل عملية شراء", "إيصال يمكنك طباعته أو تنزيله بصيغة PDF بعد كل دفع."],
    ],
    trainerTitle: "المدرّب",
    trainerName: "د. نورالدين هواري",
    trainerRole: "باحث في علوم الحاسوب",
    trainerBio: ["دكتوراه في أنظمة الحاسوب.", "استشاري وصانع محتوى في مجال الذكاء الاصطناعي التوليدي.", "مطوّر إضافة Text Generator مفتوحة المصدر لاستعمال نماذج الذكاء الاصطناعي في Obsidian."],
    howTitle: "كيف يتم ذلك",
    steps: [
      ["اختر دورتك", "أضفها إلى السلة وأدخل بياناتك."],
      ["ادفع ببطاقة CIB أو الذهبية", "يتم الدفع على صفحة SATIM الآمنة."],
      ["تابع الدورة عبر الإنترنت", "فور تأكيد الدفع يُسجَّل بريدك الإلكتروني في الدورة."],
    ],
    faqTitle: "أسئلة شائعة",
    faq: [
      ["كيف أصل إلى الدورة بعد الدفع؟", "فور تأكيد SATIM للدفع يُسجَّل البريد الإلكتروني الذي أدخلته عند الطلب في الدورة. صفحة التأكيد تبيّن لك كيفية تسجيل الدخول."],
      ["ما هي البطاقات المقبولة؟", "بطاقات CIB والذهبية. لا يُدخل رقم البطاقة على هذا الموقع أبدًا: يتم الدفع على صفحة SATIM."],
      ["ما هي لغة الدورة؟", "الدورة باللغة العربية."],
      ["هل أحصل على إيصال؟", "نعم. بعد الدفع يمكنك طباعة الإيصال أو تنزيله بصيغة PDF."],
      ["هل يمكن استرداد المبلغ؟", "اتصل بنا مع رقم الطلب. يتم الاسترداد إلى البطاقة المستعملة عبر SATIM."],
    ],
    contact: "اتصل بنا",
    contactIntro: "لديك سؤال حول دورة أو طلب؟ راسلنا مع ذكر رقم الطلب.",
    footAbout: "دورات عبر الإنترنت باللغة العربية في الذكاء الاصطناعي والأتمتة.",
    footLinks: "معلومات",
    footPayment: "الدفع",
    securePay: "دفع آمن عبر SATIM",
    rights: "جميع الحقوق محفوظة.",
  },
};
