// Landing page copy in French, Arabic and English. Keep the three in step:
// every key present in `fr` must exist in `ar` and `en`.

const codeFr = `import {
  createClient, classifyPayment, paymentMatchesOrder
} from "wathiqpay";

const satim = createClient({
  environment: "certification",
  username: process.env.SATIM_USERNAME,
  password: process.env.SATIM_PASSWORD,
  terminalId: process.env.SATIM_TERMINAL_ID,
});

// 1. Enregistrer la commande chez SATIM
const order = await satim.registerOrder({
  orderNumber: "CMD000123",
  amount: { value: "806.50", currency: "DZD" },
  returnUrl: "https://votre-site.dz/paiement/retour",
  failUrl: "https://votre-site.dz/paiement/echec",
  language: "fr",
});
// → rediriger le client vers order.formUrl

// 2. Au retour, confirmer depuis votre serveur
const payment =
  await satim.acknowledgeTransaction(order.orderId);

const matches = paymentMatchesOrder(payment, {
  orderNumber: "CMD000123",
  amount: { value: "806.50", currency: "DZD" },
});
if (classifyPayment(payment) === "paid" && matches.matches) {
  // livrer la commande, une seule fois
}`;

const codeFor = (c) =>
  codeFr
    .replace("// 1. Enregistrer la commande chez SATIM", c.c1)
    .replace("// → rediriger le client vers order.formUrl", c.c2)
    .replace("// 2. Au retour, confirmer depuis votre serveur", c.c3)
    .replace("// livrer la commande, une seule fois", c.c4)
    .replace('language: "fr"', `language: "${c.lang}"`)
    .replace("votre-site.dz/paiement/retour", c.ret)
    .replace("votre-site.dz/paiement/echec", c.fail);

export const LANGS = ["fr", "ar", "en"];

export const content = {
  fr: {
    dir: "ltr",
    htmlTitle: "WathiqPay · Paiement CIB et Edahabia pour votre site",
    metaDescription: "Module Node.js qui relie votre site marchand à la plateforme de paiement SATIM (CIB, Edahabia). Tests d'intégration SATIM réussis, démonstration en ligne.",
    skip: "Aller au contenu principal",
    nav: { demo: "Démonstration", progress: "Avancement", merchants: "Pour les marchands", contact: "Contact", label: "Navigation principale", lang: "Langue" },
    updated: "24 septembre 2026",
    statusChip: "Tests SATIM réussis · certificat GIE Monétique en attente · mis à jour le",
    h1: "Acceptez CIB et Edahabia. Gardez la main sur votre intégration.",
    lede: "Ne repartez pas de zéro pour intégrer le paiement. WathiqPay réunit les échanges avec SATIM, la vérification des paiements et les remboursements dans un module installé sur votre serveur. Votre équipe se concentre sur votre boutique, pas sur chaque détail du protocole.",
    pricingNote: ["Sans abonnement WathiqPay pour utiliser le module.", " Vos frais bancaires et votre hébergement restent distincts. Logiciel propriétaire ; tests d'intégration SATIM réussis, certificat du GIE Monétique en attente."],
    ctaDemo: "Essayer la boutique de démonstration",
    ctaTalk: "Discuter de votre intégration",
    demoNote: "Démonstration en environnement de certification : aucune livraison réelle. Utilisez uniquement les cartes de test fournies par SATIM, jamais votre carte personnelle.",
    codeCaption: "Extrait serveur simplifié, pas une intégration complète",
    codeLabel: "Exemple de code Node.js",
    code: codeFr,
    benefitsTitle: "Moins de travail technique. Plus de maîtrise.",
    benefits: [
      ["Une base déjà développée et testée", "Réutilisez les contrôles de montant, la confirmation côté serveur et la gestion des erreurs. Vous évitez de reconstruire ces mécanismes pour chaque projet."],
      ["Pas d’abonnement au module", "L’utilisation de WathiqPay ne nécessite pas d’abonnement récurrent. Les conditions d’acquisition et les éventuelles prestations sont à préciser dans votre offre ; les frais de votre banque restent applicables."],
      ["Votre serveur, votre relation bancaire", "Le module communique avec SATIM depuis votre infrastructure. Aucun service hébergé par WathiqPay n’est nécessaire au traitement des paiements, et WathiqPay ne collecte pas vos fonds."],
    ],
    benefitsNote: "Une fois certifié et référencé, le module pourra s’inscrire dans le parcours CIBWeb prévu pour les marchands utilisant un module déjà certifié. Votre dossier, les tests requis et l’activation bancaire restent nécessaires : aucun délai d’acceptation n’est garanti.",
    benefitsCta: "Parlons de votre site et de votre intégration",
    journeyTitle: "Ce que vit votre client",
    journeyLede: "Captures réelles de notre boutique de démonstration, prises sur la plateforme de test SATIM.",
    journey: [
      ["Catalogue de la boutique de démonstration Maison Wathiq", "Le client choisit ses articles", "Sur votre site, comme d'habitude."],
      ["Page de paiement SATIM avec les logos CIB et Algérie Poste", "Il paie sur la page de SATIM", "La carte n'est jamais saisie chez vous. SATIM gère le 3-D Secure."],
      ["Page de confirmation avec le reçu de paiement", "Il revient avec un reçu", "Votre serveur a d'abord confirmé le paiement auprès de SATIM."],
      ["Reçu de paiement au format PDF en arabe", "Reçu PDF, aussi en arabe", "Reçus et messages disponibles en français, arabe et anglais."],
    ],
    journeyCta: "Faire le parcours vous-même sur la boutique de démonstration",
    progressTitle: "Où nous en sommes",
    progressLede: "Les tests d'intégration SATIM sont réussis. Il reste l'étape du GIE Monétique : l'établissement du certificat puis le référencement du module sur CIBWeb.",
    updatedLabel: "Mis à jour le",
    marks: { done: "Fait : ", now: "En cours : ", next: "À venir : " },
    steps: [
      ["done", "Dossier de certification déposé et accepté", "Demande « Certifier mon module » sur CIBWeb, jugée recevable par le GIE Monétique."],
      ["done", "Accès à la plateforme de test SATIM", "Compte marchand et terminal de certification activés."],
      ["done", "Parcours de paiement et reçus disponibles", "Enregistrement, confirmation, remboursements, reçus imprimables, en PDF et par e-mail, en français, arabe et anglais."],
      ["done", "Tests d'intégration SATIM réussis", "Séance de certification du 24 septembre 2026 : tous les scénarios réussis et toutes les exigences respectées, sans réserve. Procès-verbal de SATIM établi."],
      ["now", "Certificat du GIE Monétique", "Le procès-verbal est transmis au GIE Monétique, qui établit le certificat puis référence le module sur CIBWeb."],
    ],
    doesTitle: "Ce que fait le module",
    does: [
      ["Montants exacts", "806,50 DA devient 80650 sans arrondi ni virgule flottante."],
      ["Confirmation côté serveur", "Un paiement n'est accepté que si SATIM renvoie respCode 00, ErrorCode 0 et OrderStatus 2, avec le bon montant et le bon numéro de commande."],
      ["Protection contre les doublons", "La boutique de référence ne déclenche qu’une seule validation de commande malgré les retours répétés. Votre intégration doit conserver cette protection."],
      ["Remboursements", "Totaux ou partiels, testés sur la plateforme SATIM."],
      ["Pas de relance automatique", "Si SATIM ne répond pas, le module ne rejoue pas l'opération : il vous dit que le résultat est incertain."],
      ["Saisie de carte chez SATIM", "Le numéro complet, le CVV et le mot de passe sont saisis sur la page SATIM. Les réponses peuvent contenir un numéro masqué ; les données sensibles sont filtrées dans les journaux."],
    ],
    testedTitle: "Testé, pas seulement promis",
    testedHead: ["Essai", "Résultat", "Détail"],
    tested: [
      ["Séance de certification SATIM", "Réussie", "Tous les scénarios de cartes et toutes les exigences du site, sans réserve (24 septembre 2026)"],
      ["Contrôles du site marchand", "Vérifiés", "Conditions générales, CAPTCHA, logo CIB/Edahabia, langues, reçus et sécurité des retours"],
      ["Remboursements", "3 sur 3", "Partiel, total, refus au-delà du montant"],
      ["Tests automatisés du code", "Suite de régression", "Vérification locale et workflow CI configuré pour Node.js 22 et 24"],
    ],
    testedNote: ["Pour une question sur votre intégration, ", "contactez-nous", "."],
    merchantsTitle: "Votre boutique. Votre banque. Votre module.",
    merchantsLede: "Une intégration directe pour les marchands qui veulent garder leur infrastructure et leur relation bancaire. Vous choisissez un module logiciel, pas un service de collecte de vos ventes.",
    keepTitle: "Ce qui reste chez vous",
    keep: ["Votre banque, votre contrat et votre compte : les paiements arrivent directement chez vous.", "Vos identifiants SATIM et votre terminal.", "Votre autorisation auprès du GIE Monétique : le module WathiqPay n’est pas encore référencé."],
    needTitle: "Ce qu’il vous faut",
    need: ["Un registre du commerce ou de l’artisanat.", "L’inscription au fichier national des e-fournisseurs (code e-commerce, CNRC).", "Une banque domiciliataire membre du GIE Monétique."],
    needNote: ["Conditions publiées par le ", "GIE Monétique sur CIBWeb", ". L’éligibilité du marchand et l’activation par sa banque restent distinctes de la certification du module. Pour un statut d’auto-entrepreneur, demandez une confirmation écrite au GIE."],
    contactTitle: "Préparez votre intégration dès maintenant",
    contactLede: "Présentez votre site, votre technologie et l’avancement de votre dossier marchand pour discuter de l’intégration et des conditions d’acquisition du module. Ne transmettez ni données de carte, ni mot de passe, ni identifiants SATIM.",
    formNote: ["Formulaire hébergé par Tally. Si le formulaire ne s’affiche pas, ", "ouvrez le formulaire de contact directement", ". Consultez la ", "politique de confidentialité de Tally", " avant de transmettre vos coordonnées."],
    formTitle: "Formulaire de contact WathiqPay",
    footer: ["WathiqPay · Logiciel propriétaire · ", "Contact"],
    trademarks: "CIB, Edahabia, SATIM et GIE Monétique sont des marques de leurs propriétaires. WathiqPay n’est pas affilié à SATIM.",
  },

  ar: {
    dir: "rtl",
    htmlTitle: "WathiqPay · الدفع ببطاقة CIB والذهبية لموقعك",
    metaDescription: "وحدة Node.js تربط موقعك التجاري بمنصة الدفع SATIM (CIB والذهبية). نجاح اختبارات التكامل لدى SATIM، ومتجر تجريبي متاح على الإنترنت.",
    skip: "انتقل إلى المحتوى الرئيسي",
    nav: { demo: "العرض التجريبي", progress: "مراحل التقدم", merchants: "للتجار", contact: "اتصل بنا", label: "القائمة الرئيسية", lang: "اللغة" },
    updated: "24 سبتمبر 2026",
    statusChip: "نجاح اختبارات SATIM · شهادة GIE Monétique قيد الانتظار · آخر تحديث",
    h1: "اقبل الدفع ببطاقة CIB والذهبية، واحتفظ بالتحكم في التكامل.",
    lede: "لا تبدأ من الصفر عند دمج الدفع الإلكتروني. تجمع WathiqPay التواصل مع SATIM والتحقق من المدفوعات والاسترداد في وحدة واحدة تُثبَّت على خادمك. يركّز فريقك على متجرك، لا على كل تفاصيل البروتوكول.",
    pricingNote: ["دون اشتراك في WathiqPay لاستعمال الوحدة.", " تبقى رسوم البنك والاستضافة منفصلة. برنامج مملوك؛ نجحت اختبارات التكامل لدى SATIM، وشهادة GIE Monétique قيد الانتظار."],
    ctaDemo: "جرّب المتجر التجريبي",
    ctaTalk: "ناقش مشروع التكامل معنا",
    demoNote: "عرض تجريبي في بيئة الاعتماد: لا توجد عمليات توصيل حقيقية. استعمل فقط بطاقات الاختبار التي توفرها SATIM، ولا تستعمل بطاقتك الشخصية أبدًا.",
    codeCaption: "مقتطف مبسّط من جهة الخادم، وليس تكاملًا كاملًا",
    codeLabel: "مثال على شيفرة Node.js",
    // Code comments stay in English: Arabic inside left-to-right code renders poorly.
    code: codeFor({ c1: "// 1. Register the order with SATIM", c2: "// → redirect the customer to order.formUrl", c3: "// 2. On return, confirm from your server", c4: "// fulfil the order, only once", lang: "ar", ret: "your-site.dz/payment/return", fail: "your-site.dz/payment/failure" }),
    benefitsTitle: "عمل تقني أقل، وتحكّم أكبر.",
    benefits: [
      ["أساس مطوَّر ومختبَر مسبقًا", "أعد استعمال التحقق من المبالغ والتأكيد من جهة الخادم ومعالجة الأخطاء، دون إعادة بنائها في كل مشروع."],
      ["لا اشتراك في الوحدة", "استعمال WathiqPay لا يتطلب اشتراكًا دوريًا. تُحدَّد شروط الاقتناء والخدمات المحتملة في عرضك، وتبقى رسوم بنكك سارية."],
      ["خادمك وعلاقتك البنكية", "تتواصل الوحدة مع SATIM من بنيتك التحتية. لا تحتاج معالجة المدفوعات إلى أي خدمة تستضيفها WathiqPay، ولا تجمع WathiqPay أموالك."],
    ],
    benefitsNote: "بعد اعتماد الوحدة وإدراجها، يمكن للتجار استعمالها في مسار CIBWeb المخصص لمن يستعمل وحدة معتمدة. يبقى ملفك والاختبارات المطلوبة والتفعيل البنكي ضروريًا، ولا يوجد أجل قبول مضمون.",
    benefitsCta: "لنتحدث عن موقعك ومشروع التكامل",
    journeyTitle: "ما يعيشه زبونك",
    journeyLede: "لقطات حقيقية من متجرنا التجريبي، مأخوذة على منصة الاختبار الخاصة بـ SATIM.",
    journey: [
      ["فهرس المتجر التجريبي Maison Wathiq", "يختار الزبون مشترياته", "على موقعك، كالمعتاد."],
      ["صفحة الدفع الخاصة بـ SATIM مع شعاري CIB وبريد الجزائر", "يدفع على صفحة SATIM", "لا تُدخَل البطاقة أبدًا على موقعك، وتتولى SATIM التحقق 3-D Secure."],
      ["صفحة التأكيد مع إيصال الدفع", "يعود ومعه إيصال", "بعد أن يؤكد خادمك الدفع لدى SATIM."],
      ["إيصال الدفع بصيغة PDF باللغة العربية", "إيصال PDF بالعربية أيضًا", "الإيصالات والرسائل متوفرة بالفرنسية والعربية والإنجليزية."],
    ],
    journeyCta: "جرّب المسار بنفسك على المتجر التجريبي",
    progressTitle: "أين وصلنا",
    progressLede: "نجحت اختبارات التكامل لدى SATIM. تبقى مرحلة GIE Monétique: إصدار الشهادة ثم إدراج الوحدة على CIBWeb.",
    updatedLabel: "آخر تحديث",
    marks: { done: "تم: ", now: "جارٍ: ", next: "لاحقًا: " },
    steps: [
      ["done", "إيداع ملف الاعتماد وقبوله", "طلب «اعتماد وحدتي» على CIBWeb، وقبله GIE Monétique."],
      ["done", "الوصول إلى منصة الاختبار لدى SATIM", "تفعيل حساب التاجر ومحطة الاعتماد."],
      ["done", "مسار الدفع والإيصالات جاهزة", "التسجيل والتأكيد والاسترداد، وإيصالات للطباعة وبصيغة PDF وبالبريد الإلكتروني، بالفرنسية والعربية والإنجليزية."],
      ["done", "نجاح اختبارات التكامل لدى SATIM", "جلسة الاعتماد بتاريخ 24 سبتمبر 2026: نجاح جميع السيناريوهات واحترام جميع المتطلبات دون أي تحفظ. تم تحرير محضر SATIM."],
      ["now", "شهادة GIE Monétique", "يُحال المحضر إلى GIE Monétique الذي يُصدر الشهادة ثم يُدرج الوحدة على CIBWeb."],
    ],
    doesTitle: "ما تقوم به الوحدة",
    does: [
      ["مبالغ دقيقة", "806,50 دج تصبح 80650 دون تقريب ولا أعداد عشرية تقريبية."],
      ["تأكيد من جهة الخادم", "لا يُقبل الدفع إلا إذا أعادت SATIM القيم respCode 00 وErrorCode 0 وOrderStatus 2، مع المبلغ ورقم الطلب الصحيحين."],
      ["حماية من التكرار", "لا ينفّذ المتجر المرجعي الطلب إلا مرة واحدة رغم تكرار العودة. يجب أن يحافظ تكاملك على هذه الحماية."],
      ["الاسترداد", "كلي أو جزئي، مختبَر على منصة SATIM."],
      ["لا إعادة تلقائية", "إذا لم تُجب SATIM، لا تعيد الوحدة العملية، بل تُعلمك بأن النتيجة غير مؤكدة."],
      ["إدخال البطاقة لدى SATIM", "يُدخَل الرقم الكامل ورمز CVV وكلمة السر على صفحة SATIM. قد تحتوي الردود على رقم مُقنَّع، وتُحذف البيانات الحساسة من السجلات."],
    ],
    testedTitle: "مختبَر، وليس مجرد وعود",
    testedHead: ["الاختبار", "النتيجة", "التفاصيل"],
    tested: [
      ["جلسة الاعتماد لدى SATIM", "ناجحة", "جميع سيناريوهات البطاقات وجميع متطلبات الموقع، دون أي تحفظ (24 سبتمبر 2026)"],
      ["فحوصات الموقع التجاري", "تم التحقق", "الشروط العامة وCAPTCHA وشعار CIB/الذهبية واللغات والإيصالات وأمان العودة"],
      ["الاسترداد", "3 من 3", "جزئي، كلي، ورفض ما يتجاوز المبلغ"],
      ["الاختبارات الآلية للشيفرة", "مجموعة اختبارات انحدار", "تحقق محلي ومسار CI مُعَد لـ Node.js 22 و24"],
    ],
    testedNote: ["لأي سؤال حول تكاملك، ", "اتصل بنا", "."],
    merchantsTitle: "متجرك. بنكك. وحدتك.",
    merchantsLede: "تكامل مباشر للتجار الذين يريدون الاحتفاظ ببنيتهم التحتية وعلاقتهم البنكية. أنت تختار وحدة برمجية، لا خدمة لتحصيل مبيعاتك.",
    keepTitle: "ما يبقى لديك",
    keep: ["بنكك وعقدك وحسابك: تصل المدفوعات إليك مباشرة.", "معرّفات SATIM الخاصة بك ومحطتك.", "ترخيصك لدى GIE Monétique: وحدة WathiqPay غير مدرجة بعد."],
    needTitle: "ما تحتاجه",
    need: ["سجل تجاري أو سجل الصناعة التقليدية والحرف.", "التسجيل في البطاقية الوطنية للمورّدين الإلكترونيين (رمز التجارة الإلكترونية، CNRC).", "بنك توطين عضو في GIE Monétique."],
    needNote: ["شروط منشورة من طرف ", "GIE Monétique على CIBWeb", ". تبقى أهلية التاجر وتفعيله من طرف بنكه منفصلين عن اعتماد الوحدة. بالنسبة لصفة المقاول الذاتي، اطلب تأكيدًا كتابيًا من GIE."],
    contactTitle: "حضّر تكاملك من الآن",
    contactLede: "قدّم موقعك والتقنية المستعملة ومدى تقدم ملفك التجاري لمناقشة التكامل وشروط اقتناء الوحدة. لا ترسل بيانات بطاقة ولا كلمة سر ولا معرّفات SATIM.",
    formNote: ["النموذج مستضاف لدى Tally. إذا لم يظهر النموذج، ", "افتح نموذج الاتصال مباشرة", ". اطّلع على ", "سياسة الخصوصية الخاصة بـ Tally", " قبل إرسال بياناتك."],
    formTitle: "نموذج الاتصال بـ WathiqPay",
    footer: ["WathiqPay · برنامج مملوك · ", "اتصل بنا"],
    trademarks: "CIB والذهبية وSATIM وGIE Monétique علامات مملوكة لأصحابها. WathiqPay غير تابعة لـ SATIM.",
  },

  en: {
    dir: "ltr",
    htmlTitle: "WathiqPay · CIB and Edahabia payments for your site",
    metaDescription: "A Node.js module that connects your online shop to SATIM's payment platform (CIB, Edahabia). SATIM integration tests passed; live demo available.",
    skip: "Skip to main content",
    nav: { demo: "Demo", progress: "Progress", merchants: "For merchants", contact: "Contact", label: "Main navigation", lang: "Language" },
    updated: "24 September 2026",
    statusChip: "SATIM tests passed · GIE Monétique certificate pending · updated",
    h1: "Accept CIB and Edahabia. Stay in control of your integration.",
    lede: "Don't start from scratch to add payments. WathiqPay brings the exchanges with SATIM, payment verification and refunds together in a module installed on your own server. Your team focuses on your shop, not on every detail of the protocol.",
    pricingNote: ["No WathiqPay subscription to use the module.", " Your bank fees and hosting stay separate. Proprietary software; SATIM integration tests passed, GIE Monétique certificate pending."],
    ctaDemo: "Try the demo shop",
    ctaTalk: "Discuss your integration",
    demoNote: "Demo running in SATIM's certification environment: nothing is delivered. Use only the test cards provided by SATIM, never your personal card.",
    codeCaption: "Simplified server excerpt, not a complete integration",
    codeLabel: "Node.js code example",
    code: codeFor({ c1: "// 1. Register the order with SATIM", c2: "// → redirect the customer to order.formUrl", c3: "// 2. On return, confirm from your server", c4: "// fulfil the order, only once", lang: "en", ret: "your-site.dz/payment/return", fail: "your-site.dz/payment/failure" }),
    benefitsTitle: "Less technical work. More control.",
    benefits: [
      ["A foundation already built and tested", "Reuse the amount checks, server-side confirmation and error handling instead of rebuilding them for every project."],
      ["No module subscription", "Using WathiqPay needs no recurring subscription. Purchase terms and any services are set out in your offer; your bank's fees still apply."],
      ["Your server, your banking relationship", "The module talks to SATIM from your own infrastructure. No service hosted by WathiqPay is needed to process payments, and WathiqPay never collects your funds."],
    ],
    benefitsNote: "Once certified and referenced, the module can be used through the CIBWeb path for merchants adopting an already certified module. Your application, the required tests and your bank's activation are still needed; no approval time is guaranteed.",
    benefitsCta: "Let's talk about your site and your integration",
    journeyTitle: "What your customer sees",
    journeyLede: "Real screenshots of our demo shop, taken on SATIM's test platform.",
    journey: [
      ["Catalogue of the Maison Wathiq demo shop", "The customer picks items", "On your site, as usual."],
      ["SATIM payment page with the CIB and Algérie Poste logos", "They pay on SATIM's page", "The card is never entered on your site. SATIM handles 3-D Secure."],
      ["Confirmation page with the payment receipt", "They come back with a receipt", "After your server has confirmed the payment with SATIM."],
      ["Payment receipt as a PDF in Arabic", "PDF receipt, in Arabic too", "Receipts and messages in French, Arabic and English."],
    ],
    journeyCta: "Try the journey yourself on the demo shop",
    progressTitle: "Where we are",
    progressLede: "SATIM's integration tests have passed. What remains is the GIE Monétique step: issuing the certificate, then listing the module on CIBWeb.",
    updatedLabel: "Updated",
    marks: { done: "Done: ", now: "In progress: ", next: "Next: " },
    steps: [
      ["done", "Certification application filed and accepted", "“Certifier mon module” application on CIBWeb, found admissible by GIE Monétique."],
      ["done", "Access to SATIM's test platform", "Merchant account and certification terminal activated."],
      ["done", "Payment journey and receipts ready", "Registration, confirmation, refunds, and receipts to print, as PDF and by e-mail, in French, Arabic and English."],
      ["done", "SATIM integration tests passed", "Certification session of 24 September 2026: every scenario passed and every requirement met, with no reserves. SATIM's report (PV) issued."],
      ["now", "GIE Monétique certificate", "The report goes to GIE Monétique, which issues the certificate and then lists the module on CIBWeb."],
    ],
    doesTitle: "What the module does",
    does: [
      ["Exact amounts", "806.50 DZD becomes 80650 with no rounding and no floating point."],
      ["Server-side confirmation", "A payment is accepted only if SATIM returns respCode 00, ErrorCode 0 and OrderStatus 2, with the right amount and order number."],
      ["Protection against duplicates", "The reference shop fulfils an order only once, even when the customer returns several times. Your integration must keep this protection."],
      ["Refunds", "Full or partial, tested on SATIM's platform."],
      ["No automatic retries", "If SATIM doesn't answer, the module doesn't replay the operation: it tells you the outcome is uncertain."],
      ["Card entry at SATIM", "The full card number, CVV and password are entered on SATIM's page. Responses may contain a masked number; sensitive data is filtered from logs."],
    ],
    testedTitle: "Tested, not just promised",
    testedHead: ["Test", "Result", "Detail"],
    tested: [
      ["SATIM certification session", "Passed", "Every card scenario and every site requirement, with no reserves (24 September 2026)"],
      ["Merchant site checks", "Verified", "Terms, CAPTCHA, CIB/Edahabia logo, languages, receipts and return security"],
      ["Refunds", "3 of 3", "Partial, full, refusal above the paid amount"],
      ["Automated code tests", "Regression suite", "Local checks and a CI workflow for Node.js 22 and 24"],
    ],
    testedNote: ["For a question about your integration, ", "contact us", "."],
    merchantsTitle: "Your shop. Your bank. Your module.",
    merchantsLede: "A direct integration for merchants who want to keep their own infrastructure and banking relationship. You choose a software module, not a service that collects your sales.",
    keepTitle: "What stays with you",
    keep: ["Your bank, your contract and your account: payments go straight to you.", "Your SATIM credentials and your terminal.", "Your authorization from GIE Monétique: the WathiqPay module is not referenced yet."],
    needTitle: "What you need",
    need: ["A trade or craft register entry.", "Registration in the national e-supplier file (e-commerce code, CNRC).", "A domiciliation bank that is a member of GIE Monétique."],
    needNote: ["Conditions published by ", "GIE Monétique on CIBWeb", ". Merchant eligibility and activation by the merchant's bank are separate from the module's certification. If you are self-employed (auto-entrepreneur), ask GIE for written confirmation."],
    contactTitle: "Prepare your integration now",
    contactLede: "Tell us about your site, your technology and how far your merchant application has progressed, to discuss the integration and purchase terms for the module. Never send card data, passwords or SATIM credentials.",
    formNote: ["Form hosted by Tally. If the form doesn't appear, ", "open the contact form directly", ". Read ", "Tally's privacy policy", " before sending your details."],
    formTitle: "WathiqPay contact form",
    footer: ["WathiqPay · Proprietary software · ", "Contact"],
    trademarks: "CIB, Edahabia, SATIM and GIE Monétique are trademarks of their respective owners. WathiqPay is not affiliated with SATIM.",
  },
};
