'use client';
// Raya de colores con el personaje de Cloudin asomado detrás: sigue el ratón con la cabeza y la mirada.
// El motor (public/mascota/mascota.js) se carga en el navegador sin pasar por el bundler; hasta entonces
// (o sin JS) se ve la imagen quieta. La sección es decorativa.
import { useEffect, useRef, useState } from 'react';
import s from './Mascot.module.css';

type Mascot = { destroy(): void };
const ENGINE = '/mascota/mascota.js';

export function Mascot() {
  const section = useRef<HTMLElement>(null);
  const char = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);

  // Se asoma (sube desde detrás de la raya) la primera vez que la sección entra en pantalla
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setUp(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let m: Mascot | undefined, cancelled = false;
    import(/* webpackIgnore: true */ ENGINE).then((mod: { createMascot(el: HTMLElement): Mascot }) => {
      if (!cancelled && char.current) m = mod.createMascot(char.current);
    }).catch(() => { /* sin motor: queda la imagen quieta */ });
    return () => { cancelled = true; m?.destroy(); };
  }, []);

  return (
    <section ref={section} className={`${s.section} ${up ? s.up : ''}`} aria-hidden="true">
      <div className={s.stage}>
        <div ref={char} className={s.char}>
          {/* eslint-disable-next-line @next/next/no-img-element -- la <img> es la textura WebGL: debe ser el archivo original */}
          <img src="/mascota/mascota.webp" alt="" width={542} height={402} draggable={false} />
        </div>
      </div>
      <div className={s.line}>
        <span /><span /><span /><span /><span /><span />
      </div>
    </section>
  );
}
