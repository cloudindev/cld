// Página de un tema (/academy/<tema>/): cabecera con su icono, todas sus guías y el resto de temas.
import Link from 'next/link';
import { categorias, catHref, guiaHref, guiasDe, type Category } from '@/content/academy';
import { Arrow, CatIcon } from './Icons';
import { HelpContact, Topbar } from './Parts';
import a from './Academy.module.css';
import s from './Category.module.css';

export function CategoryPage({ cat: c }: { cat: Category }) {
  const list = guiasDe(c.slug);
  const others = categorias.filter(x => x.slug !== c.slug);
  const steps = !!c.featured;   // «Primeros pasos»: las guías van en orden, como pasos

  return (
    <>
      <Topbar crumbs={[{ label: 'Centro de Ayuda', href: '/academy/' }, { label: c.name }]} />

      <header className={`${a.wrap} ${s.header}`}>
        <div>
          <p className={a.eyebrow}>{steps ? c.name : 'Centro de ayuda'} · {list.length} {list.length === 1 ? 'guía' : 'guías'}</p>
          <h1 className={s.title}>{c.card ?? c.name}</h1>
          <p className={s.lead}>{c.intro}</p>
        </div>
        <span className={`${s.icon} ${c.ink === 'dark' ? s.inkDark : ''}`} style={{ background: c.color }} aria-hidden="true">
          <CatIcon name={c.icon} size={44} />
        </span>
      </header>

      <ol className={`${a.wrap} ${s.list}`}>
        {list.map((g, i) => (
          <li key={g.slug}>
            <Link href={guiaHref(g)} className={s.row}>
              <span className={s.num}>{steps ? `Paso ${i + 1}` : String(i + 1).padStart(2, '0')}</span>
              <span className={s.body}>
                <span className={s.rowTitle}>{g.title}</span>
                <span className={s.rowText}>{g.summary}</span>
              </span>
              <span className={s.level}>Nivel {g.level}</span>
              <span className={s.arrow}><Arrow size={16} /></span>
            </Link>
          </li>
        ))}
      </ol>

      <section className={`${a.wrap} ${s.others}`} aria-labelledby="otros-temas">
        <h2 id="otros-temas" className={s.h2}>Otros temas</h2>
        <ul className={s.otherGrid}>
          {others.map(o => (
            <li key={o.slug}>
              <Link href={catHref(o)} className={s.other}>
                <span className={`${s.otherIcon} ${o.ink === 'dark' ? s.inkDark : ''}`} style={{ background: o.color }}><CatIcon name={o.icon} size={18} /></span>
                <span className={s.otherName}>{o.card ?? o.name}</span>
                <Arrow size={14} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <HelpContact />
    </>
  );
}
