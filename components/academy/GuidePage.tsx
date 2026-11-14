// Página de una guía (/academy/<tema>/<guía>/): migas de pan y buscador, índice fijo a la izquierda,
// título, bloques (listas, tabla oscura, pasos con pestañas, «Si algo falla»…), valoración y «Sigue por aquí».
import Link from 'next/link';
import { catBySlug, catHref, datos, fecha, guiaBySlug, guiaHref, type Block, type Guide } from '@/content/academy';
import { Arrow } from './Icons';
import { Topbar } from './Parts';
import { Rich } from './Rich';
import { CopyButton, Feedback, Tabs, Toc } from './GuideClient';
import a from './Academy.module.css';
import s from './Guide.module.css';

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className={s.steps} role="list">
      {steps.map((t, i) => (
        <li key={i}>
          <span className={s.stepNum} aria-hidden="true">{i + 1}</span>
          <p><Rich text={t} /></p>
        </li>
      ))}
    </ol>
  );
}

function BlockView({ b, id }: { b: Block; id: string }) {
  switch (b.type) {
    case 'p':
      return <p className={s.p}><Rich text={b.text} /></p>;
    case 'list':
      return <ul className={s.dots}>{b.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>;
    case 'table':
      return (
        <figure className={s.tableWrap}>
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>{b.head.map((h, i) => (h ? <th key={i} scope="col">{h}</th> : <td key={i} />))}</tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (j === 0 ? <th key={j} scope="row"><Rich text={c} /></th> : <td key={j} data-label={b.head[j]}><Rich text={c} /></td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.note && <figcaption className={s.tableNote}><Rich text={b.note} /></figcaption>}
        </figure>
      );
    case 'steps':
      return <Steps steps={b.steps} />;
    case 'tabs':
      return <Tabs id={id} labels={b.tabs.map(t => t.label)} panels={b.tabs.map(t => <Steps key={t.label} steps={t.steps} />)} />;
    case 'issues':
      return (
        <dl className={s.issues}>
          {b.items.map((it, i) => (
            <div key={i}>
              <dt><Rich text={it.title} /></dt>
              <dd><Rich text={it.text} /></dd>
            </div>
          ))}
        </dl>
      );
    case 'code':
      return (
        <div className={s.code}>
          <div className={s.codeBar}><span>{b.label ?? 'Código'}</span><CopyButton text={b.code} /></div>
          <pre><code>{b.code}</code></pre>
        </div>
      );
    case 'note':
      return <p className={`${s.note} ${b.tone === 'warn' ? s.warn : ''}`}><Rich text={b.text} /></p>;
  }
}

export function GuidePage({ guide: g }: { guide: Guide }) {
  const c = catBySlug(g.cat);
  const related = g.related.map(guiaBySlug).filter((x): x is Guide => !!x);

  return (
    <>
      <Topbar crumbs={[{ label: 'Centro de Ayuda', href: '/academy/' }, { label: c.name, href: catHref(c) }, { label: g.crumb }]} />
      <div className={`${a.wrap} ${s.layout}`}>
        <aside className={s.aside}>
          <Toc items={g.sections.map(x => ({ id: x.id, title: x.title }))} />
        </aside>

        <article className={s.article}>
          <header>
            <p className={a.eyebrow}><Link href={catHref(c)} className={s.eyebrowLink}>{c.name}</Link> · Nivel {g.level}</p>
            <h1 className={s.title}>{g.title}</h1>
            <p className={s.lead}>{g.summary}</p>
            <p className={s.updated}>Actualizado el <time dateTime={g.updated}>{fecha(g.updated)}</time></p>
          </header>

          {/* En móvil no cabe el índice lateral: va aquí, como accesos directos */}
          <nav className={s.mobileToc} aria-label="En esta guía">
            <ul>{g.sections.map(x => <li key={x.id}><a href={`#${x.id}`}>{x.title}</a></li>)}</ul>
          </nav>

          {g.sections.map(sec => (
            <section key={sec.id} id={sec.id} className={s.section} aria-labelledby={`${sec.id}-titulo`}>
              <h2 id={`${sec.id}-titulo`} className={s.h2}>{sec.title}</h2>
              {sec.blocks.map((b, i) => <BlockView key={i} b={b} id={`${sec.id}-${i}`} />)}
            </section>
          ))}

          <Feedback guide={g.slug} ticket={datos.ticket} phone={datos.telefono} phoneHref={datos.telefonoHref} />

          {related.length > 0 && (
            <nav className={s.related} aria-labelledby="sigue-por-aqui">
              <p id="sigue-por-aqui" className={a.eyebrow}>Sigue por aquí</p>
              <ul>
                {related.map(r => (
                  <li key={r.slug}>
                    <Link href={guiaHref(r)}><span>{r.title}</span><Arrow size={15} /></Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </article>
      </div>
    </>
  );
}
