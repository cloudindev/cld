'use client';
// Raya de colores con el personaje de Cloudin asomado detrás: sigue el ratón con la cabeza y la mirada.
// El motor (public/mascota/mascota.js) se carga en el navegador sin pasar por el bundler; hasta entonces
// (o sin JS) se ve la imagen quieta. La sección es decorativa.
import { useEffect, useRef, useState } from 'react';
import s from './Mascot.module.css';

type Mascot = { destroy(): void };
const ENGINE = '/mascota/mascota.js';

type Props = {
  align?: 'center' | 'right';   // 'right': asomado a la derecha (cabecera de Academy)
  className?: string;           // tamaño, posición y colores de la raya los pone quien lo usa (variables CSS)
  down?: boolean;               // se zambulle detrás de la raya (misiones de la home); al volver a false, sube otra vez
  onUp?: () => void;            // la primera vez que se asoma
  children?: React.ReactNode;   // capas encima del personaje (la burbuja de diálogo de las misiones)
};

export function Mascot({ align = 'center', className = '', down = false, onUp, children }: Props) {
  const section = useRef<HTMLElement>(null);
  const char = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);
  const onUpRef = useRef(onUp);
  onUpRef.current = onUp;

  // Se asoma (sube desde detrás de la raya) la primera vez que la sección entra en pantalla
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { setUp(true); onUpRef.current?.(); io.disconnect(); }
    }, { threshold: 0.35 });
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
    <section
      ref={section} aria-hidden="true" data-state={!up ? 'hidden' : down ? 'down' : 'up'}
      className={`${s.section} ${align === 'right' ? s.right : ''} ${up ? s.up : ''} ${down ? s.down : ''} ${className}`}
    >
      <div className={s.stage}>
        <div ref={char} className={s.char}>
          {/* eslint-disable-next-line @next/next/no-img-element -- la <img> es la textura WebGL: debe ser el archivo original */}
          <img src="/mascota/mascota.webp" alt="" width={542} height={402} draggable={false} />
        </div>
      </div>
      <div className={s.line}>
        <span /><span /><span /><span /><span /><span />
      </div>
      {children}
    </section>
  );
}
