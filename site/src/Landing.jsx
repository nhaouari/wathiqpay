import { useEffect } from "react";

const DEMO = "https://demo.wathiqpay.com";
const UPDATED = "24 septembre 2026";

const code = `import {
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

const steps = [
  { state: "done", title: "Dossier de certification déposé et accepté", text: "Demande « Certifier mon module » sur CIBWeb, jugée recevable par le GIE Monétique." },
  { state: "done", title: "Accès à la plateforme de test SATIM", text: "Compte marchand et terminal de certification activés." },
  { state: "done", title: "Parcours de paiement et reçus disponibles", text: "Enregistrement, confirmation, remboursements, reçus imprimables, en PDF et par e-mail, en français, arabe et anglais." },
  { state: "done", title: "Tests d'intégration SATIM réussis", text: "Séance de certification du 24 septembre 2026 : tous les scénarios réussis et toutes les exigences respectées, sans réserve. Procès-verbal de SATIM établi." },
  { state: "now", title: "Certificat du GIE Monétique", text: "Le procès-verbal est transmis au GIE Monétique, qui délivre le certificat puis référence le module sur CIBWeb." },
];

const journey = [
  { img: "/shots/boutique.webp", alt: "Catalogue de la boutique de démonstration Maison Wathiq", title: "Le client choisit ses articles", text: "Sur votre site, comme d'habitude." },
  { img: "/shots/satim.webp", alt: "Page de paiement SATIM avec les logos CIB et Algérie Poste", title: "Il paie sur la page de SATIM", text: "La carte n'est jamais saisie chez vous. SATIM gère le 3-D Secure." },
  { img: "/shots/recu.webp", alt: "Page de confirmation avec le reçu de paiement", title: "Il revient avec un reçu", text: "Votre serveur a d'abord confirmé le paiement auprès de SATIM." },
  { img: "/shots/recu-ar.webp", pos: "top right", alt: "Reçu de paiement au format PDF en arabe", title: "Reçu PDF, aussi en arabe", text: "Reçus et messages disponibles en français, arabe et anglais." },
];

const does = [
  ["Montants exacts", "806,50 DA devient 80650 sans arrondi ni virgule flottante."],
  ["Confirmation côté serveur", "Un paiement n'est accepté que si SATIM renvoie respCode 00, ErrorCode 0 et OrderStatus 2, avec le bon montant et le bon numéro de commande."],
  ["Protection contre les doublons", "La boutique de référence ne déclenche qu’une seule validation de commande malgré les retours répétés. Votre intégration doit conserver cette protection."],
  ["Remboursements", "Totaux ou partiels, testés sur la plateforme SATIM."],
  ["Pas de relance automatique", "Si SATIM ne répond pas, le module ne rejoue pas l'opération : il vous dit que le résultat est incertain."],
  ["Saisie de carte chez SATIM", "Le numéro complet, le CVV et le mot de passe sont saisis sur la page SATIM. Les réponses peuvent contenir un numéro masqué ; les données sensibles sont filtrées dans les journaux."],
];

const results = [
  ["Contrôles du site marchand", "Vérifiés", "Conditions générales, CAPTCHA, logo CIB/Edahabia, langues, reçus et sécurité des retours"],
  ["Remboursements", "3 sur 3", "Partiel, total, refus au-delà du montant"],
  ["Tests automatisés du code", "Suite de régression", "Vérification locale et workflow CI configuré pour Node.js 22 et 24"],
];

function mark(state) {
  if (state === "done") return <span className="mark done"><span aria-hidden="true">✓</span><span className="sr-only">Fait : </span></span>;
  if (state === "now") return <span className="mark now"><span className="sr-only">En cours : </span></span>;
  return <span className="mark next"><span className="sr-only">À venir : </span></span>;
}

export default function Landing() {
  useEffect(() => {
    const load = () => {
      if (window.Tally) window.Tally.loadEmbeds();
      else document.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((f) => (f.src = f.dataset.tallySrc));
    };
    if (window.Tally) return load();
    if (!document.querySelector('script[src="https://tally.so/widgets/embed.js"]')) {
      const s = document.createElement("script");
      s.src = "https://tally.so/widgets/embed.js";
      s.onload = load;
      s.onerror = load;
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div className="page">
      <a className="skip-link" href="#contenu">Aller au contenu principal</a>
      <header className="top">
        <div className="wrap top-row">
          <a className="brand" href="/">
            Wathiq<span>Pay</span>
          </a>
          <nav aria-label="Navigation principale">
            <a href="#parcours">Démonstration</a>
            <a href="#avancement">Avancement</a>
            <a href="#marchands">Pour les marchands</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <main id="contenu" tabIndex={-1}>
        <section className="hero wrap">
          <div className="hero-text">
            <p className="status-chip"><span className="dot" /> Tests SATIM réussis · certificat GIE Monétique en cours · mis à jour le {UPDATED}</p>
            <h1>Acceptez CIB et Edahabia. Gardez la main sur votre intégration.</h1>
            <p className="lede">
              Ne repartez pas de zéro pour intégrer le paiement. WathiqPay réunit les échanges avec SATIM,
              la vérification des paiements et les remboursements dans un module installé sur votre serveur.
              Votre équipe se concentre sur votre boutique, pas sur chaque détail du protocole.
            </p>
            <p className="ar" lang="ar" dir="rtl">اقبل الدفع ببطاقة CIB والذهبية، واحتفظ بالتحكم في التكامل على خادمك.</p>
            <p className="fine"><strong>Sans abonnement WathiqPay pour utiliser le module.</strong> Vos frais bancaires et votre hébergement restent distincts. Logiciel propriétaire en version alpha ; certification en cours.</p>
            <div className="actions">
              <a className="btn primary" href={DEMO} target="_blank" rel="noreferrer">Essayer la boutique de démonstration</a>
              <a className="btn" href="#contact">Discuter de votre intégration</a>
            </div>
            <p className="fine">Démonstration en environnement de certification : aucune livraison réelle. Utilisez uniquement les cartes de test fournies par SATIM, jamais votre carte personnelle.</p>
          </div>
          <figure className="code-card">
            <figcaption>Extrait serveur simplifié, pas une intégration complète</figcaption>
            <pre tabIndex={0} aria-label="Exemple de code Node.js"><code>{code}</code></pre>
          </figure>
        </section>

        <section className="wrap" aria-labelledby="benefices">
          <h2 id="benefices">Moins de travail technique. Plus de maîtrise.</h2>
          <dl className="does">
            <div><dt>Une base déjà développée et testée</dt><dd>Réutilisez les contrôles de montant, la confirmation côté serveur et la gestion des erreurs. Vous évitez de reconstruire ces mécanismes pour chaque projet.</dd></div>
            <div><dt>Pas d’abonnement au module</dt><dd>L’utilisation de WathiqPay ne nécessite pas d’abonnement récurrent. Les conditions d’acquisition et les éventuelles prestations sont à préciser dans votre offre ; les frais de votre banque restent applicables.</dd></div>
            <div><dt>Votre serveur, votre relation bancaire</dt><dd>Le module communique avec SATIM depuis votre infrastructure. Aucun service hébergé par WathiqPay n’est nécessaire au traitement des paiements, et WathiqPay ne collecte pas vos fonds.</dd></div>
          </dl>
          <p className="section-lede">Une fois certifié et référencé, le module pourra s’inscrire dans le parcours CIBWeb prévu pour les marchands utilisant un module déjà certifié. Votre dossier, les tests requis et l’activation bancaire restent nécessaires : aucun délai d’acceptation n’est garanti.</p>
          <p className="band-cta"><a href="#contact">Parlons de votre site et de votre intégration</a></p>
        </section>

        <section id="parcours" className="band">
          <div className="wrap">
            <h2>Ce que vit votre client</h2>
            <p className="section-lede">Captures réelles de notre boutique de démonstration, prises sur la plateforme de test SATIM.</p>
            <ol className="journey">
              {journey.map((j) => (
                <li key={j.img}>
                  <div className="shot"><img src={j.img} alt={j.alt} loading="lazy" width="1600" height="1000" style={j.pos ? { objectPosition: j.pos } : undefined} /></div>
                  <h3>{j.title}</h3>
                  <p>{j.text}</p>
                </li>
              ))}
            </ol>
            <p className="band-cta"><a href={DEMO} target="_blank" rel="noreferrer">Faire le parcours vous-même sur la boutique de démonstration</a></p>
          </div>
        </section>

        <section id="avancement" className="wrap two-col">
          <div>
            <h2>Où nous en sommes</h2>
            <p className="section-lede">
              Nous ne sommes pas encore certifiés, et nous préférons le dire clairement. Voici les étapes
              du processus du GIE Monétique et ce qui est fait.
            </p>
            <p className="updated">Mis à jour le {UPDATED}</p>
          </div>
          <ol className="steps">
            {steps.map((s) => (
              <li key={s.title} className={s.state}>
                {mark(s.state)}
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="wrap">
          <h2>Ce que fait le module</h2>
          <dl className="does">
            {does.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="wrap">
          <h2>Testé, pas seulement promis</h2>
          <div className="table-wrap">
            <table className="results">
              <thead>
                <tr><th scope="col">Essai</th><th scope="col">Résultat</th><th scope="col">Détail</th></tr>
              </thead>
              <tbody>
                {results.map(([a, b, c]) => (
                  <tr key={a}><th scope="row">{a}</th><td className="num">{b}</td><td>{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine">
            Les tests de cartes officiels sont réalisés par SATIM lors de la séance de certification. Pour une question sur votre intégration, <a href="#contact">contactez-nous</a>.
          </p>
        </section>

        <section id="marchands" className="band">
          <div className="wrap two-col">
            <div>
              <h2>Votre boutique. Votre banque. Votre module.</h2>
              <p className="section-lede">
                Une intégration directe pour les marchands qui veulent garder leur infrastructure et leur relation bancaire.
                Vous choisissez un module logiciel, pas un service de collecte de vos ventes.
              </p>
            </div>
            <div className="merchant">
              <h3>Ce qui reste chez vous</h3>
              <ul>
                <li>Votre banque, votre contrat et votre compte : les paiements arrivent directement chez vous.</li>
                <li>Vos identifiants SATIM et votre terminal.</li>
                <li>Votre autorisation auprès du GIE Monétique : le module WathiqPay n’est pas encore référencé.</li>
              </ul>
              <h3>Ce qu’il vous faut</h3>
              <ul>
                <li>Un registre du commerce ou de l’artisanat.</li>
                <li>L’inscription au fichier national des e-fournisseurs (code e-commerce, CNRC).</li>
                <li>Une banque domiciliataire membre du GIE Monétique.</li>
              </ul>
              <p className="fine">Conditions publiées par le <a href="https://www.cibweb.dz/fr/">GIE Monétique sur CIBWeb</a>. L’éligibilité du marchand et l’activation par sa banque restent distinctes de la certification du module. Pour un statut d’auto-entrepreneur, demandez une confirmation écrite au GIE.</p>
            </div>
          </div>
        </section>

        <section id="contact" className="wrap contact">
          <div>
            <h2>Préparez votre intégration dès maintenant</h2>
            <p className="section-lede">
              Présentez votre site, votre technologie et l’avancement de votre dossier marchand pour discuter de l’intégration et des conditions d’acquisition du module.
              Ne transmettez ni données de carte, ni mot de passe, ni identifiants SATIM.
            </p>
          </div>
          <div className="form-box">
            <p className="fine">Formulaire hébergé par Tally. Si le formulaire ne s’affiche pas, <a href="https://tally.so/r/3yav5p">ouvrez le formulaire de contact directement</a>. Consultez la <a href="https://tally.so/help/privacy-policy">politique de confidentialité de Tally</a> avant de transmettre vos coordonnées.</p>
            <iframe
              data-tally-src="https://tally.so/embed/3yav5p?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
              loading="lazy"
              width="100%"
              height="560"
              title="Formulaire de contact WathiqPay"
            />
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-row">
          <p>WathiqPay · Logiciel propriétaire · <a href="#contact">Contact</a></p>
          <p>CIB, Edahabia, SATIM et GIE Monétique sont des marques de leurs propriétaires. WathiqPay n’est pas affilié à SATIM.</p>
        </div>
      </footer>
    </div>
  );
}
