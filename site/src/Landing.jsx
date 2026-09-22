import { useEffect } from "react";

const DEMO = "https://wathiqpay-demo2.vercel.app";
const REPO = "https://github.com/nhaouari/wathiqpay";
const UPDATED = "22 septembre 2026";

const code = `import { createClient, classifyPayment } from "wathiqpay";

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

if (classifyPayment(payment) === "paid") {
  // livrer la commande, une seule fois
}`;

const steps = [
  { state: "done", title: "Dossier de certification déposé et accepté", text: "Demande « Certifier mon module » sur CIBWeb, jugée recevable par le GIE Monétique." },
  { state: "done", title: "Accès à la plateforme de test SATIM", text: "Compte marchand et terminal de certification activés." },
  { state: "done", title: "Module et site de démonstration terminés", text: "Enregistrement, confirmation, remboursements, reçus en français, arabe et anglais." },
  { state: "done", title: "Les 15 cartes de test passées", text: "11 donnent le résultat attendu. 4 cartes se comportent autrement que prévu côté SATIM ; nous les avons signalées." },
  { state: "now", title: "Séance de qualification avec SATIM", text: "À réserver. Le qualificateur teste notre site et rédige le procès-verbal." },
  { state: "next", title: "Certificat du GIE Monétique", text: "Délivré après le procès-verbal, puis référencement du module sur CIBWeb." },
];

const journey = [
  { img: "/shots/boutique.webp", alt: "Catalogue de la boutique de démonstration Maison Wathiq", title: "Le client choisit ses articles", text: "Sur votre site, comme d'habitude." },
  { img: "/shots/satim.webp", alt: "Page de paiement SATIM avec les logos CIB et Algérie Poste", title: "Il paie sur la page de SATIM", text: "La carte n'est jamais saisie chez vous. SATIM gère le 3-D Secure." },
  { img: "/shots/recu.webp", alt: "Page de confirmation avec le reçu de paiement", title: "Il revient avec un reçu", text: "Votre serveur a d'abord confirmé le paiement auprès de SATIM." },
  { img: "/shots/recu-ar.webp", pos: "top right", alt: "Reçu de paiement au format PDF en arabe", title: "Reçu PDF, aussi en arabe", text: "Français, arabe et anglais, de la boutique jusqu'au reçu." },
];

const does = [
  ["Montants exacts", "806,50 DA devient 80650 sans arrondi ni virgule flottante."],
  ["Confirmation côté serveur", "Un paiement n'est accepté que si SATIM renvoie respCode 00, ErrorCode 0 et OrderStatus 2, avec le bon montant et le bon numéro de commande."],
  ["Jamais deux fois", "Un client qui recharge la page ou revient deux fois ne déclenche qu'une seule livraison."],
  ["Remboursements", "Totaux ou partiels, testés sur la plateforme SATIM."],
  ["Pas de relance automatique", "Si SATIM ne répond pas, le module ne rejoue pas l'opération : il vous dit que le résultat est incertain."],
  ["Aucune donnée de carte", "Ni numéro, ni CVV, ni mot de passe ne passent par votre serveur. Les identifiants sont masqués dans les journaux."],
];

const results = [
  ["Cartes de test SATIM", "15 passées", "11 conformes, 4 signalées à SATIM"],
  ["Contrôles du site marchand", "16 sur 16", "CAPTCHA, conditions, langues, reçus, sécurité des retours"],
  ["Remboursements", "3 sur 3", "Partiel, total, refus au-delà du montant"],
  ["Tests automatisés du code", "63", "Exécutés à chaque modification, sous Node.js 22 et 24"],
];

function Mark({ state }) {
  if (state === "done") return <span className="mark done" aria-label="Fait">✓</span>;
  if (state === "now") return <span className="mark now" aria-label="En cours" />;
  return <span className="mark next" aria-label="À venir" />;
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
            <a className="nav-code" href={REPO} target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero wrap">
          <div className="hero-text">
            <p className="status-chip"><span className="dot" /> Certification SATIM en cours · mis à jour le {UPDATED}</p>
            <h1>Le paiement par carte CIB et Edahabia, branché proprement sur votre site.</h1>
            <p className="lede">
              WathiqPay est un module Node.js qui relie votre site marchand à la plateforme de paiement SATIM.
              Il s'occupe des détails qui font perdre des semaines : montants, confirmation du paiement,
              remboursements, reçus. Le code est public, et chaque affirmation de cette page se vérifie.
            </p>
            <p className="ar" lang="ar" dir="rtl">الدفع ببطاقة CIB والذهبية على موقعك، بطريقة سليمة وواضحة.</p>
            <div className="actions">
              <a className="btn primary" href={DEMO} target="_blank" rel="noreferrer">Essayer la boutique de démonstration</a>
              <a className="btn" href={REPO} target="_blank" rel="noreferrer">Lire le code</a>
            </div>
            <p className="fine">La démonstration fonctionne sur l'environnement de test de SATIM : aucun paiement réel.</p>
          </div>
          <figure className="code-card">
            <figcaption>Ce que vous écrivez, en tout et pour tout</figcaption>
            <pre><code>{code}</code></pre>
          </figure>
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
                <Mark state={s.state} />
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
            Le détail de chaque essai, avec les références de commande et les réponses de SATIM, est publié dans le{" "}
            <a href={`${REPO}/blob/main/docs/live-evidence.md`} target="_blank" rel="noreferrer">journal des tests</a>.
          </p>
        </section>

        <section id="marchands" className="band">
          <div className="wrap two-col">
            <div>
              <h2>Pour les marchands</h2>
              <p className="section-lede">
                WathiqPay est un logiciel, pas un intermédiaire financier. Nous ne touchons pas à votre argent.
              </p>
            </div>
            <div className="merchant">
              <h3>Ce qui reste chez vous</h3>
              <ul>
                <li>Votre banque, votre contrat et votre compte : les paiements arrivent directement chez vous.</li>
                <li>Vos identifiants SATIM et votre terminal.</li>
                <li>Votre autorisation auprès du GIE Monétique, obtenue avec un module référencé.</li>
              </ul>
              <h3>Ce qu'il vous faut</h3>
              <ul>
                <li>Un registre du commerce ou de l'artisanat.</li>
                <li>L'inscription au fichier national des e-fournisseurs (code e-commerce, CNRC).</li>
                <li>Une banque domiciliataire membre du GIE Monétique.</li>
              </ul>
              <p className="fine">Nous pouvons vous accompagner dans ces démarches une fois le module certifié.</p>
            </div>
          </div>
        </section>

        <section id="contact" className="wrap contact">
          <div>
            <h2>Être prévenu à la certification</h2>
            <p className="section-lede">
              Laissez votre adresse : nous vous écrirons une seule fois, le jour où le certificat sera délivré.
              Pour une question sur l'intégration, le même formulaire nous parvient directement.
            </p>
          </div>
          <div className="form-box">
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
          <p>WathiqPay · <a href={REPO} target="_blank" rel="noreferrer">github.com/nhaouari/wathiqpay</a></p>
          <p>CIB, Edahabia, SATIM et GIE Monétique sont des marques de leurs propriétaires. WathiqPay n'est pas affilié à SATIM.</p>
        </div>
      </footer>
    </div>
  );
}
