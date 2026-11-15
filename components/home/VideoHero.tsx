'use client';
// Tarjeta hero con el vídeo de Cloudin (un solo vídeo en bucle; ver NOTAS.md, punto 35). Cuenta la historia
// en 4 capítulos: abajo, cada uno con su barra, que avanza con el vídeo; al pulsar uno, salta a su inicio.
// - Solo empieza a descargar al acercarse a la pantalla y se pausa fuera de ella.
// - Con prefers-reduced-motion no arranca solo: se ve el póster y el botón de reproducir.
import { useEffect, useRef, useState } from 'react';
import { videoHero as c } from '@/content/home';
import s from './VideoHero.module.css';

const STARTS: number[] = c.chapters.map(ch => ch.start);

export function VideoHero() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);  // ya se puede cargar
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number>(c.duration);

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

  useEffect(() => {
    const v = video.current;
    if (!near || !v) return;
    if (playing && visible) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [near, visible, playing]);

  // Capítulo actual (el último que ya ha empezado) y cuánto se ha visto de cada uno
  let idx = 0;
  STARTS.forEach((start, j) => { if (time >= start) idx = j; });
  const seen = (j: number) => {
    if (j !== idx) return j < idx ? 1 : 0;
    const start = STARTS[j]!, end = STARTS[j + 1] ?? duration;
    return Math.min(1, Math.max(0, (time - start) / (end - start)));
  };

  const jump = (j: number) => {
    const v = video.current;
    if (v) v.currentTime = STARTS[j]!;
    setTime(STARTS[j]!); setPlaying(true);
  };

  return (
    <section ref={root} className={s.section} aria-label={c.label}>
      <div className={s.card}>
        <video
          ref={video}
          className={s.video}
          src={near ? c.src : undefined}
          poster={c.poster}
          muted loop playsInline preload={near ? 'auto' : 'none'}
          onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={e => { if (e.currentTarget.duration) setDuration(e.currentTarget.duration); }}
        />

        <div className={s.overlay}>
          <ol className={s.chapters}>
            {c.chapters.map((ch, j) => (
              <li key={ch.title}>
                <button type="button" className={`${s.chapter} ${j === idx ? s.current : ''}`} aria-current={j === idx ? 'step' : undefined} onClick={() => jump(j)}>
                  <span className={s.bar}>
                    <span className={s.fill} style={{ transform: `scaleX(${seen(j)})` }} />
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
