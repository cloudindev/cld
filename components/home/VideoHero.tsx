'use client';
// Tarjeta hero con los 4 clips encadenados. Dos <video> alternan: mientras uno se ve, el otro ya
// tiene cargado el siguiente clip, así el salto entre clips no tiene cortes.
// - Solo empieza a descargar al acercarse a la pantalla y se pausa fuera de ella.
// - Con prefers-reduced-motion no arranca solo: se ve el póster y el botón de reproducir.
import { useCallback, useEffect, useRef, useState } from 'react';
import { videoHero as c } from '@/content/home';
import s from './VideoHero.module.css';

const N = c.chapters.length;

export function VideoHero() {
  const root = useRef<HTMLElement>(null);
  const vids = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const [idx, setIdx] = useState(0);        // capítulo visible
  const [slot, setSlot] = useState(0);      // <video> que lo muestra (0/1)
  const [near, setNear] = useState(false);  // ya se puede cargar
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // El vídeo activo muestra idx; el otro precarga el siguiente
  const srcOf = (sl: number) => (sl === slot ? c.chapters[idx]! : c.chapters[(idx + 1) % N]!);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
    const el = root.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e!.isIntersecting) setNear(true);
      setVisible(e!.intersectionRatio > 0.15);
    }, { rootMargin: '300px 0px', threshold: [0, 0.15] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reproduce / pausa el activo; el otro queda parado al principio
  useEffect(() => {
    if (!near) return;
    const a = vids[slot]!.current, b = vids[1 - slot]!.current;
    if (b) { b.pause(); b.currentTime = 0; }
    if (!a) return;
    if (playing && visible) a.play().catch(() => setPlaying(false));
    else a.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, visible, playing, idx, slot]);

  const onEnded = useCallback((sl: number) => {
    if (sl !== slot) return;
    setIdx(i => (i + 1) % N); setSlot(x => 1 - x); setProgress(0);
  }, [slot]);

  const onTime = (sl: number) => {
    const v = vids[sl]!.current;
    if (sl === slot && v && v.duration) setProgress(v.currentTime / v.duration);
  };

  const jump = (j: number) => {
    if (j === idx) { const v = vids[slot]!.current; if (v) v.currentTime = 0; }
    setIdx(j); setProgress(0); setPlaying(true);
  };

  return (
    <section ref={root} className={s.section} aria-label={c.label}>
      <div className={s.card}>
        {[0, 1].map(sl => {
          const ch = srcOf(sl);
          return (
            <video
              key={sl}
              ref={vids[sl]}
              className={`${s.video} ${sl === slot ? s.on : ''}`}
              src={near ? ch.src : undefined}
              poster={sl === slot ? ch.poster : undefined}
              muted playsInline preload={near ? 'auto' : 'none'}
              aria-hidden={sl !== slot}
              onEnded={() => onEnded(sl)}
              onTimeUpdate={() => onTime(sl)}
            />
          );
        })}

        <div className={s.overlay}>
          <ol className={s.chapters}>
            {c.chapters.map((ch, j) => (
              <li key={ch.src}>
                <button type="button" className={`${s.chapter} ${j === idx ? s.current : ''}`} aria-current={j === idx ? 'step' : undefined} onClick={() => jump(j)}>
                  <span className={s.bar}>
                    <span className={s.fill} style={{ transform: `scaleX(${j < idx ? 1 : j === idx ? progress : 0})` }} />
                  </span>
                  <span className={s.num}>0{j + 1}</span>
                  <span className={s.title}>{ch.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className={s.toggle} aria-label={playing ? c.pause : c.play} onClick={() => setPlaying(p => !p)}>
            {playing
              ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>}
          </button>
        </div>
      </div>
    </section>
  );
}
