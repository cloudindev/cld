'use client';
// /academy/buscar/?q=…: la web es estática, así que la búsqueda se hace en el navegador sobre el índice
// de guías que le pasa la página. Mientras no hay JS (o mientras carga) se ve el buscador vacío.
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { SearchDoc } from '@/content/academy';
import { masBuscado } from '@/content/academy/categorias';
import { Arrow } from './Icons';
import { SearchForm } from './SearchForm';
import { highlight, prepare, search } from './search';
import a from './Academy.module.css';
import s from './Search.module.css';

const Marked = ({ text, terms }: { text: string; terms: string[] }) => (
  <>{highlight(text, terms).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : p.text))}</>
);

function Suggestions() {
  return (
    <ul className={s.suggest}>
      {masBuscado.map(t => (
        <li key={t.q}><Link href={`/academy/buscar/?q=${encodeURIComponent(t.q)}`} className={a.chip}>{t.label}</Link></li>
      ))}
    </ul>
  );
}

/** Vista de resultados para una búsqueda dada (q = null: todavía no se sabe, p. ej. sin JS) */
export function SearchView({ docs, q }: { docs: SearchDoc[]; q: string | null }) {
  const index = useMemo(() => prepare(docs), [docs]);
  const { results, partial, terms } = useMemo(() => search(index, q ?? ''), [index, q]);
  const searched = !!q && terms.length > 0;

  return (
    <div className={`${a.wrap} ${s.page}`}>
      <p className={a.eyebrow}>Centro de ayuda</p>
      <h1 className={s.title}>{searched ? <>Resultados para <span className={s.q}>«{q}»</span></> : '¿Qué estás buscando?'}</h1>
      {/* key: al buscar otra cosa desde esta misma página, el campo muestra la búsqueda nueva */}
      <div className={s.form}><SearchForm key={q ?? ''} variant="hero" id="buscar-resultados" defaultValue={q ?? ''} autoFocus={q === ''} /></div>

      {q !== null && (
        <div className={s.results} aria-live="polite">
          {!searched && (
            <>
              <p className={s.count}>Escribe lo que necesitas o empieza por lo más buscado:</p>
              <Suggestions />
            </>
          )}

          {searched && results.length === 0 && (
            <>
              <p className={s.count}>No hemos encontrado ninguna guía para «{q}». Prueba con otras palabras o con lo más buscado:</p>
              <Suggestions />
            </>
          )}

          {searched && results.length > 0 && (
            <>
              <p className={s.count}>
                {partial
                  ? `Ninguna guía tiene todas esas palabras. Estas se acercan:`
                  : `${results.length} ${results.length === 1 ? 'guía' : 'guías'} para «${q}»`}
              </p>
              <ol className={s.list}>
                {results.map(({ doc }) => (
                  <li key={doc.href}>
                    <Link href={doc.href} className={s.row}>
                      <span className={s.body}>
                        <span className={s.cat}>{doc.catLabel}</span>
                        <span className={s.rowTitle}><Marked text={doc.title} terms={terms} /></span>
                        <span className={s.rowText}><Marked text={doc.summary} terms={terms} /></span>
                      </span>
                      <span className={s.arrow}><Arrow size={16} /></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Lee ?q= de la dirección (useSearchParams necesita un <Suspense> por encima en una web estática) */
export function SearchFromUrl({ docs }: { docs: SearchDoc[] }) {
  const q = (useSearchParams().get('q') ?? '').trim();
  return <SearchView docs={docs} q={q} />;
}
