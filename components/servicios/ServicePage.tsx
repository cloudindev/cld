// Plantilla de las páginas de servicio (/paginas-web/, /seguridad/): encabezado con la pieza 3D interactiva,
// ventajas, pasos, banda destacada, preguntas frecuentes y llamada final. Contenido en content/servicios.ts.
import Link from 'next/link';
import type { Link as L, ServicePage as Page } from '@/content/servicios';
import { JellyCloud } from '@/components/home/JellyCloud';
import { Icon } from './Icons';
import s from './ServicePage.module.css';

const isExternal = (href: string) => /^https?:\/\//.test(href);
function A({ link, className }: { link: L; className?: string }) {
  return isExternal(link.href)
    ? <a href={link.href} className={className} target="_blank" rel="noopener nofollow">{link.label}</a>
    : <Link href={link.href} className={className}>{link.label}</Link>;
}
const Arrow = () => <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export function ServicePage({ page: p }: { page: Page }) {
  const h = p.hero;
  return (
    <div className={s.page}>
      {/* Encabezado */}
      <section className={`${s.hero} ${s[h.tone]}`}>
        <div className={s.heroText}>
          <p className={s.eyebrow}>{h.eyebrow}</p>
          <h1 className={s.title}>
            {h.title.map(t => <span key={t} className={s.titleLine}>{t}</span>)}
            <span className={s.mark}>{h.highlight}</span>
          </h1>
          <p className={s.lead}>{h.text}</p>
          <div className={s.actions}>
            <A link={h.cta} className={`btn-sm ${s.btn}`} />
            {h.secondary && <span className={s.more}><A link={h.secondary} /> <Arrow /></span>}
          </div>
        </div>
        <JellyCloud image={h.jelly} alt="" className={`${s.jelly} ${s[`jelly_${h.jelly}`]}`} />
      </section>

      {p.intro && (
        <section className={s.intro}>
          <h2 className={s.h2}>{p.intro.title}</h2>
          <p className={s.introText}>{p.intro.text}</p>
        </section>
      )}

      {/* Ventajas */}
      <section className={s.section}>
        <h2 className={s.h2}>{p.features.title}</h2>
        <ul className={s.grid}>
          {p.features.items.map(f => (
            <li key={f.title} className={s.card}>
              <span className={`${s.icon} ${s[`icon_${h.tone}`]}`}><Icon name={f.icon} /></span>
              <h3 className={s.h3}>{f.title}</h3>
              <p className={s.text}>{f.text}</p>
              {f.link && <span className={s.more}><A link={f.link} /> <Arrow /></span>}
            </li>
          ))}
        </ul>
      </section>

      {/* Pasos */}
      {p.steps && (
        <section className={s.section}>
          <h2 className={s.h2}>{p.steps.title}</h2>
          <ol className={s.steps}>
            {p.steps.items.map((st, i) => (
              <li key={st.title} className={s.step}>
                <span className={s.num}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={s.h3}>{st.title}</h3>
                <p className={s.text}>{st.text}</p>
                {st.link && <span className={s.more}><A link={st.link} /> <Arrow /></span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Banda destacada */}
      {p.band && (
        <section className={s.band}>
          <div>
            <h2 className={s.bandTitle}>{p.band.title}</h2>
            <p className={s.bandText}>{p.band.text}</p>
          </div>
          <A link={p.band.link} className={s.bandBtn} />
        </section>
      )}

      {/* Preguntas frecuentes */}
      {p.faq && (
        <section className={s.section}>
          <h2 className={s.h2}>{p.faq.title}</h2>
          <div className={s.faq}>
            {p.faq.items.map(f => (
              <details key={f.q} className={s.qa}>
                <summary className={s.q}>{f.q}</summary>
                <p className={s.a}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Llamada final */}
      <section className={`${s.cta} ${s[h.tone]}`}>
        <h2 className={s.ctaTitle}>{p.cta.title}</h2>
        <p className={s.ctaText}>{p.cta.text}</p>
        <div className={s.actions}>
          <A link={p.cta.button} className={`btn-sm ${s.btn}`} />
          {p.cta.secondary && <span className={s.more}><A link={p.cta.secondary} /> <Arrow /></span>}
        </div>
      </section>
    </div>
  );
}
