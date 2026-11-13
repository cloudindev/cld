// Fila de cuatro imágenes «familia Cloudin» (thesquads, chatbotweb, Synology). Como en el original, cada
// elemento parte de su ancho natural y la fila se ajusta con flex-shrink proporcional.
import Image from 'next/image';
import type { ReactNode } from 'react';
import { family } from '@/content/home';
import s from './Family.module.css';

const SIZES = [[630, 673], [506, 673], [541, 673], [559, 673]] as const;

export function Family({ extra }: { extra?: ReactNode }) {
  return (
    <section className={s.section}>
      <div className={s.row}>
        {family.flatMap((f, i) => {
          const [w, h] = SIZES[i]!;
          const img = <Image src={f.src} alt={f.alt} width={w} height={h} />;
          const item = (
            <div key={f.src} className={s.item} style={{ flexBasis: w }}>
              {f.href ? <a href={f.href} target="_blank">{img}</a> : img}
            </div>
          );
          return i === 1 && extra ? [item, <div key="extra" className={s.extra}>{extra}</div>] : [item];
        })}
      </div>
    </section>
  );
}
