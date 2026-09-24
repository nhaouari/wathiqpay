import { useEffect, useState } from "react";
import { content, LANGS } from "./content.js";

const DEMO = "https://demo.wathiqpay.com";
const SHOTS = [
  { img: "/shots/boutique.webp" },
  { img: "/shots/satim.webp" },
  { img: "/shots/recu.webp" },
  { img: "/shots/recu-ar.webp", pos: "top right" },
];
const LANG_LABEL = { fr: "FR", ar: "AR", en: "EN" };
const LANG_NAME = { fr: "Français", ar: "العربية", en: "English" };

/** ?lang= in the URL, then the last choice, then the browser language; French by default. */
function initialLang() {
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q && LANGS.includes(q)) return q;
    const saved = window.localStorage.getItem("lang");
    if (saved && LANGS.includes(saved)) return saved;
  } catch {
    /* storage may be unavailable */
  }
  const nav = (navigator.language || "fr").slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : "fr";
}

function Mark({ state, t }) {
  if (state === "done") return <span className="mark done"><span aria-hidden="true">✓</span><span className="sr-only">{t.marks.done}</span></span>;
  if (state === "now") return <span className="mark now"><span className="sr-only">{t.marks.now}</span></span>;
  return <span className="mark next"><span className="sr-only">{t.marks.next}</span></span>;
}

export default function Landing() {
  const [lang, setLang] = useState(initialLang);
  const t = content[lang];
  const demoUrl = `${DEMO}/lang/${lang.toUpperCase()}?next=/`;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    document.title = t.htmlTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t.metaDescription);
    try {
      window.localStorage.setItem("lang", lang);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    if (lang === "fr") url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    window.history.replaceState(null, "", url);
  }, [lang, t]);

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
      <a className="skip-link" href="#contenu">{t.skip}</a>
      <header className="top">
        <div className="wrap top-row">
          <a className="brand" href="/" dir="ltr">
            Wathiq<span>Pay</span>
          </a>
          <nav aria-label={t.nav.label}>
            <a href="#parcours">{t.nav.demo}</a>
            <a href="#avancement">{t.nav.progress}</a>
            <a href="#marchands">{t.nav.merchants}</a>
            <a href="#contact">{t.nav.contact}</a>
            <span className="lang-switch" role="group" aria-label={t.nav.lang}>
              {LANGS.map((l) => (
                <button key={l} type="button" lang={l} aria-pressed={l === lang} title={LANG_NAME[l]} onClick={() => setLang(l)}>
                  {LANG_LABEL[l]}
                </button>
              ))}
            </span>
          </nav>
        </div>
      </header>

      <main id="contenu" tabIndex={-1}>
        <section className="hero wrap">
          <div className="hero-text">
            <p className="status-chip"><span className="dot" /> {t.statusChip} {t.updated}</p>
            <h1>{t.h1}</h1>
            <p className="lede">{t.lede}</p>
            <p className="fine"><strong>{t.pricingNote[0]}</strong>{t.pricingNote[1]}</p>
            <div className="actions">
              <a className="btn primary" href={demoUrl} target="_blank" rel="noreferrer">{t.ctaDemo}</a>
              <a className="btn" href="#contact">{t.ctaTalk}</a>
            </div>
            <p className="fine">{t.demoNote}</p>
          </div>
          <figure className="code-card" dir="ltr">
            <figcaption dir={t.dir}>{t.codeCaption}</figcaption>
            <pre tabIndex={0} aria-label={t.codeLabel}><code>{t.code}</code></pre>
          </figure>
        </section>

        <section className="wrap" aria-labelledby="benefices">
          <h2 id="benefices">{t.benefitsTitle}</h2>
          <dl className="does">
            {t.benefits.map(([title, text]) => (
              <div key={title}><dt>{title}</dt><dd>{text}</dd></div>
            ))}
          </dl>
          <p className="section-lede">{t.benefitsNote}</p>
          <p className="band-cta"><a href="#contact">{t.benefitsCta}</a></p>
        </section>

        <section id="parcours" className="band">
          <div className="wrap">
            <h2>{t.journeyTitle}</h2>
            <p className="section-lede">{t.journeyLede}</p>
            <ol className="journey">
              {SHOTS.map((s, i) => {
                const [alt, title, text] = t.journey[i];
                return (
                  <li key={s.img}>
                    <div className="shot"><img src={s.img} alt={alt} loading="lazy" width="1600" height="1000" style={s.pos ? { objectPosition: s.pos } : undefined} /></div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                );
              })}
            </ol>
            <p className="band-cta"><a href={demoUrl} target="_blank" rel="noreferrer">{t.journeyCta}</a></p>
          </div>
        </section>

        <section id="avancement" className="wrap two-col">
          <div>
            <h2>{t.progressTitle}</h2>
            <p className="section-lede">{t.progressLede}</p>
            <p className="updated">{t.updatedLabel} {t.updated}</p>
          </div>
          <ol className="steps">
            {t.steps.map(([state, title, text]) => (
              <li key={title} className={state}>
                <Mark state={state} t={t} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="wrap">
          <h2>{t.doesTitle}</h2>
          <dl className="does">
            {t.does.map(([title, text]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="wrap">
          <h2>{t.testedTitle}</h2>
          <div className="table-wrap">
            <table className="results">
              <thead>
                <tr>{t.testedHead.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
              </thead>
              <tbody>
                {t.tested.map(([a, b, c]) => (
                  <tr key={a}><th scope="row">{a}</th><td className="num">{b}</td><td>{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine">{t.testedNote[0]}<a href="#contact">{t.testedNote[1]}</a>{t.testedNote[2]}</p>
        </section>

        <section id="marchands" className="band">
          <div className="wrap two-col">
            <div>
              <h2>{t.merchantsTitle}</h2>
              <p className="section-lede">{t.merchantsLede}</p>
            </div>
            <div className="merchant">
              <h3>{t.keepTitle}</h3>
              <ul>{t.keep.map((k) => <li key={k}>{k}</li>)}</ul>
              <h3>{t.needTitle}</h3>
              <ul>{t.need.map((k) => <li key={k}>{k}</li>)}</ul>
              <p className="fine">{t.needNote[0]}<a href="https://www.cibweb.dz/fr/">{t.needNote[1]}</a>{t.needNote[2]}</p>
            </div>
          </div>
        </section>

        <section id="contact" className="wrap contact">
          <div>
            <h2>{t.contactTitle}</h2>
            <p className="section-lede">{t.contactLede}</p>
          </div>
          <div className="form-box">
            <p className="fine">{t.formNote[0]}<a href="https://tally.so/r/3yav5p">{t.formNote[1]}</a>{t.formNote[2]}<a href="https://tally.so/help/privacy-policy">{t.formNote[3]}</a>{t.formNote[4]}</p>
            <iframe
              data-tally-src="https://tally.so/embed/3yav5p?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
              loading="lazy"
              width="100%"
              height="560"
              title={t.formTitle}
            />
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-row">
          <p>{t.footer[0]}<a href="#contact">{t.footer[1]}</a></p>
          <p>{t.trademarks}</p>
        </div>
      </footer>
    </div>
  );
}
