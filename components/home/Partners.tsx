'use client';
// Logos de partners (Flickity en el original: wrapAround, groupCells, sin flechas; puntos <1200px).
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { partners } from '@/content/home';
import s from './Partners.module.css';

const N = partners.logos.length;

export function Partners() {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(7);
  const drag = useRef<number | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1200px)');
    const upd = () => setPerPage(mq.matches ? 7 : 3);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);
  const pages = Math.ceil(N / perPage);
  const go = (p: number) => setPage(((p % pages) + pages) % pages);
  // Orden circular: el último logo queda a la izquierda del primero, como en el original.
  const order = [N - 1, ...Array.from({ length: N - 1 }, (_, i) => i)];
  return (
    <section className={s.section}>
      <div className={s.head}><p className={s.title}>{partners.title}</p></div>
      <div className={s.viewport}
        onPointerDown={e => { drag.current = e.clientX; }}
        onPointerUp={e => { if (drag.current != null) { const dx = e.clientX - drag.current; if (Math.abs(dx) > 40) go(page + (dx < 0 ? 1 : -1)); } drag.current = null; }}
      >
        <div className={s.track} style={{ transform: `translateX(calc(${-(page * perPage + 1)} * var(--cell)))` }}>
          {order.map(li => (
            <p key={li} className={s.cell}>
              <Image src={partners.logos[li]!.src} alt="" width={300} height={122} />
            </p>
          ))}
        </div>
      </div>
      {pages > 1 && perPage === 3 && (
        <ol className={s.dots}>
          {Array.from({ length: pages }, (_, i) => (
            <li key={i} className={i === page ? s.dotActive : undefined}>
              <button type="button" aria-label={`Página ${i + 1}`} onClick={() => go(i)} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
