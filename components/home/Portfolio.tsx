'use client';
// «Casos de éxito» (RevSlider slider-7 tipo carrusel en el original): 3 diapositivas, sin autoplay,
// flechas laterales (ocultas por debajo de 778px), arrastre táctil y zoom «Ken Burns» al entrar.
import { useEffect, useRef, useState } from 'react';
import { portfolio } from '@/content/home';
import { ChevronRight } from '@/components/layout/icons';
import s from './Portfolio.module.css';

const N = portfolio.slides.length;

export function Portfolio() {
  const [index, setIndex] = useState(0);
  const [kb, setKb] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number } | null>(null);

  // Altura «fullscreen» de RevSlider: alto del viewport al cargar.
  useEffect(() => {
    wrap.current?.style.setProperty('--rs-h', `${window.innerHeight}px`);
  }, []);

  const go = (d: number) => { setIndex(i => (i + d + N) % N); setKb(k => k + 1); };
  const rel = (i: number) => { const r = (i - index + N) % N; return r === N - 1 ? -1 : r; };

  return (
    <div className={s.module} ref={wrap}
      onPointerDown={e => { drag.current = { x: e.clientX }; }}
      onPointerUp={e => { if (drag.current) { const dx = e.clientX - drag.current.x; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); } drag.current = null; }}
      aria-roledescription="carrusel" aria-label="Casos de éxito"
    >
      {portfolio.slides.map((sl, i) => {
        const r = rel(i);
        return (
          <div key={sl.id} className={`${s.slide} ${s[`n${sl.images.length}`]}`} data-rel={r} aria-hidden={r !== 0} role="group" aria-roledescription="diapositiva">
            {sl.images.map(src => (
              <div key={src} className={s.layer}>
                <span key={r === 0 ? kb : 'static'} className={`${s.bg} ${r === 0 ? s.kenburns : ''}`} style={{ backgroundImage: `url(${src})` }} />
              </div>
            ))}
          </div>
        );
      })}
      <span className={s.frame} aria-hidden="true" />
      <button type="button" className={`${s.arrow} ${s.left}`} aria-label="Anterior" onClick={() => go(-1)}><ChevronRight /></button>
      <button type="button" className={`${s.arrow} ${s.right}`} aria-label="Siguiente" onClick={() => go(1)}><ChevronRight /></button>
    </div>
  );
}
