// Portada de Academy (/academy/): «¿En qué te ayudamos?» con buscador y el personaje asomado sobre la raya,
// los temas («Elige por dónde empezar»), las guías que más resuelven y el contacto.
import Link from 'next/link';
import { Mascot } from '@/components/home/Mascot';
import { categorias, catBySlug, catHref, guiaBySlug, guiaHref, guiasDe, populares } from '@/content/academy';
import { Arrow, CatIcon } from './Icons';
import { HelpContact, Popular, SearchForm } from './Parts';
import { PopularGuides, type PopularItem } from './PopularGuides';
import a from './Academy.module.css';
import s from './Home.module.css';

export function AcademyHome() {
  // Para el filtro por tema: con «Todas», las 8 más útiles; con un tema, primero sus populares y después el resto
  const rank = (slug: string) => { const i = populares.indexOf(slug); return i < 0 ? 99 : i; };
  const items: PopularItem[] = categorias.filter(c => !c.featured).flatMap(c =>
    guiasDe(c.slug).map(g => ({ href: guiaHref(g), title: g.title, cat: c.slug, catLabel: c.short, rank: rank(g.slug) })),
  );
  const top = populares.map(slug => guiaBySlug(slug)!).map(g => ({ href: guiaHref(g), title: g.title, cat: g.cat, catLabel: catBySlug(g.cat).short, rank: rank(g.slug) }));

  return (
    <>
      <section className={s.hero}>
        <div className={`${a.wrap} ${s.heroText}`}>
          <p className={a.eyebrow}>Centro de ayuda</p>
          <h1 className={s.title}><span>¿En qué te</span> <span className={s.titleBig}>ayudamos?</span></h1>
          <p className={s.lead}>Guías claras, paso a paso, para tus dominios, tu hosting, tu VPS, tu correo y tu WordPress.</p>
          <SearchForm variant="hero" id="buscar-portada" />
          <Popular className={s.popular} />
        </div>
        <Mascot align="right" className={s.mascot} />
      </section>

      <section className={`${a.wrap} ${s.panel}`} aria-labelledby="temas">
        <h2 id="temas" className={s.h2}>Elige por dónde empezar</h2>
        <p className={`${a.eyebrow} ${s.sub}`}>Guías ordenadas de lo básico a lo avanzado</p>
        <ul className={s.grid}>
          {categorias.map(c => (
            <li key={c.slug} className={`${s.card} ${c.featured ? s.cardDark : ''}`}>
              <span className={`${s.icon} ${c.ink === 'dark' ? s.inkDark : ''}`} style={{ background: c.color }}><CatIcon name={c.icon} /></span>
              <h3 className={s.cardTitle}><Link href={catHref(c)}>{c.card ?? c.name}</Link></h3>
              <p className={s.cardText}>{c.intro}</p>
              <ul className={s.cardList}>
                {guiasDe(c.slug).slice(0, 3).map(g => <li key={g.slug}><Link href={guiaHref(g)}>{g.card ?? g.title}</Link></li>)}
              </ul>
              <Link href={catHref(c)} className={s.more} aria-label={`${c.more}: ${c.card ?? c.name}`}>{c.more} <Arrow size={13} /></Link>
            </li>
          ))}
        </ul>
      </section>

      <PopularGuides top={top} items={items} filters={categorias.filter(c => !c.featured).map(c => ({ slug: c.slug, label: c.short }))} />

      <HelpContact />
    </>
  );
}
