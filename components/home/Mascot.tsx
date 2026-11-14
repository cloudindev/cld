'use client';
// Personaje de Cloudin (Cloudy) asomado detrás de una raya de colores: sigue el ratón con la cabeza y la mirada.
// En la home se asoma por encima del buscador de dominios (CloudySearch); en Academy, sobre la raya.
// El motor (public/mascota/mascota.js) se carga en el navegador sin pasar por el bundler; hasta entonces
// (o sin JS) se ve la imagen quieta. La sección es decorativa.
import { useEffect, useRef, useState } from 'react';
import s from './Mascot.module.css';

/** Motor (public/mascota/mascota.js): look(x, y) le hace mirar un punto de la pantalla; look(null), al frente */
export type MascotEngine = { destroy(): void; look(x: number | null, y?: number): void };
const ENGINE = '/mascota/mascota.js';

type Props = {
  align?: 'center' | 'right';   // 'right': asomado a la derecha (cabecera de Academy)
  className?: string;           // tamaño, posición y colores de la raya los pone quien lo usa (variables CSS)
  down?: boolean;               // se zambulle detrás de la raya; al volver a false, sube otra vez
  line?: boolean;               // false: sin raya propia (el horizonte lo pone otro elemento, p. ej. el buscador)
  onUp?: () => void;            // la primera vez que se asoma
  onEngine?: (m: MascotEngine | null) => void;   // el motor, cuando está listo (null al desmontar)
  children?: React.ReactNode;   // capas encima del personaje (la burbuja de diálogo)
};

export function Mascot({ align = 'center', className = '', down = false, line = true, onUp, onEngine, children }: Props) {
  const section = useRef<HTMLElement>(null);
  const char = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);
  const onUpRef = useRef(onUp);
  onUpRef.current = onUp;
  const onEngineRef = useRef(onEngine);
  onEngineRef.current = onEngine;

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
    let m: MascotEngine | undefined, cancelled = false;
    import(/* webpackIgnore: true */ ENGINE).then((mod: { createMascot(el: HTMLElement): MascotEngine }) => {
      if (!cancelled && char.current) { m = mod.createMascot(char.current); onEngineRef.current?.(m); }
    }).catch(() => { /* sin motor: queda la imagen quieta */ });
    return () => { cancelled = true; m?.destroy(); onEngineRef.current?.(null); };
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
      {line && (
        <div className={s.line}>
          <span /><span /><span /><span /><span /><span />
        </div>
      )}
      {children}
    </section>
  );
}
