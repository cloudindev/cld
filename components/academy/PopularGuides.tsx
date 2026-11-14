'use client';
// «Las que más resuelven»: lista numerada con filtro por tema. Sin JS se ve la lista completa («Todas»).
import Link from 'next/link';
import { useState } from 'react';
import { Arrow } from './Icons';
import s from './Home.module.css';

export type PopularItem = { href: string; title: string; cat: string; catLabel: string; rank: number };
type Filter = { slug: string; label: string };

export function PopularGuides({ top, items, filters }: { top: PopularItem[]; items: PopularItem[]; filters: Filter[] }) {
  const [cat, setCat] = useState<string | null>(null);
  const list = cat ? items.filter(i => i.cat === cat).sort((x, y) => x.rank - y.rank) : top;

  return (
    <section className={s.top} aria-labelledby="mas-resuelven">
      <div className={s.topHead}>
        <h2 id="mas-resuelven" className={s.h2}>Las que más resuelven</h2>
        <p id="filtra" className={s.sub}>Filtra por tema</p>
        <div className={s.filters} role="group" aria-labelledby="filtra">
          <button type="button" aria-pressed={cat === null} onClick={() => setCat(null)}>Todas</button>
          {filters.map(f => (
            <button key={f.slug} type="button" aria-pressed={cat === f.slug} onClick={() => setCat(f.slug)}>{f.label}</button>
          ))}
        </div>
      </div>
      <ol className={s.topList} aria-live="polite">
        {list.map((g, i) => (
          <li key={g.href}>
            <Link href={g.href} className={s.topRow}>
              <span className={s.topNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={s.topTitle}>{g.title}</span>
              <span className={s.topCat}>{g.catLabel}</span>
              <span className={s.topArrow}><Arrow size={15} /></span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
