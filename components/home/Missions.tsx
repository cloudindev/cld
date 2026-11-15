'use client';
// Home · «¿Qué hacemos hoy?»: las misiones de Cloudy, debajo del personaje asomado sobre la raya.
// Contenido en content/misiones.ts (los planes son simulados). Ver NOTAS.md, punto 39.
//
// Al elegir una tarjeta:
//   1. Cloudy se zambulle detrás de la raya (que se ondula al pasar);
//   2. las otras dos tarjetas caen y la elegida se queda solo con su ventana;
//   3. la ventana se abre hasta ser el panel de la misión (clip-path) mientras Cloudy, en vídeo, viaja de
//      la ventana a su sitio (FLIP); después entran el título, el texto y los dos planes, y los precios cuentan.
// Al cerrar (×, Esc) se deshace el camino y Cloudy vuelve a asomarse. Cloudy no habla: sin burbuja, a
// petición del cliente. Con «movimiento reducido» no hay coreografía: se cambia de vista sin animaciones
// y los vídeos no arrancan solos.
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { desde, euros, misiones, type Mision, type MisionId, type Plan } from '@/content/misiones';
import { Mascot } from './Mascot';
import s from './Missions.module.css';

type Phase = 'grid' | 'out' | 'open' | 'closing' | 'back';
type Box = { top: number; left: number; width: number; height: number };

const ITEMS: Mision[] = misiones.items;
const byId = (id: MisionId) => ITEMS.find(m => m.id === id)!;
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
const OUT_MS = 420, OPEN_MS = 780, CLOSE_MS = 540, BACK_MS = 760;
const vars = (m: Mision) => ({ '--accent': m.accent, '--soft': m.soft }) as React.CSSProperties;

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Check = () => (
  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
);

/** Rectángulo de un elemento relativo a otro */
const rel = (el: Element, to: Element): Box => {
  const a = el.getBoundingClientRect(), b = to.getBoundingClientRect();
  return { top: a.top - b.top, left: a.left - b.left, width: a.width, height: a.height };
};

export function Missions() {
  const [phase, setPhase] = useState<Phase>('grid');
  const [active, setActive] = useState<MisionId | null>(null);   // misión abierta
  const [picked, setPicked] = useState<MisionId | null>(null);   // tarjeta que se abrió (para ir y volver)
  const [down, setDown] = useState(false);
  const [paused, setPaused] = useState(false);
  const [first, setFirst] = useState(true);                      // primera entrada del panel (con espera)

  const stage = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const windows = useRef(new Map<MisionId, HTMLElement>());
  const cards = useRef(new Map<MisionId, HTMLButtonElement>());
  const gridH = useRef(0);
  const stageAnim = useRef<Animation | null>(null);
  const flip = useRef<'open' | null>(null);
  const refocus = useRef<MisionId | null>(null);       // tarjeta que recibe el foco al volver
  const timers = useRef<number[]>([]);
  const reduced = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); }, []);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    setPaused(mq.matches);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // ---------- Elegir una misión ----------
  const choose = (id: MisionId) => {
    if (phase !== 'grid') return;
    window.gtag?.('event', 'mision_cloudy', { mision: id });
    setPicked(id);
    if (reduced.current) {
      setActive(id); setPhase('open'); setDown(true);
      return;
    }
    gridH.current = stage.current?.offsetHeight ?? 0;
    setPhase('out');                                  // las otras tarjetas caen
    later(() => setDown(true), 380);                  // Cloudy se zambulle
    later(() => { flip.current = 'open'; setFirst(true); setActive(id); setPhase('open'); }, OUT_MS);
  };

  /** Recorte del panel y transformación del vídeo que los hacen coincidir con la ventana de una tarjeta.
   *  Las tarjetas siguen montadas (ocultas) mientras el panel está abierto: se mide su posición real. */
  const toWindow = (id: MisionId, center = false) => {
    const st = stage.current, pn = panel.current, sl = slot.current, win = windows.current.get(id), g = grid.current;
    if (!st || !pn || !sl || !win || !g) return null;
    // al volver, en el carrusel del móvil la tarjeta se centra antes de medir (no se ve: el carrusel está oculto)
    if (center && g.scrollWidth > g.clientWidth) {
      const card = win.parentElement as HTMLElement;
      g.scrollLeft = card.offsetLeft - (g.clientWidth - card.offsetWidth) / 2;
    }
    const w = rel(win, st), p = rel(pn, st), v = rel(sl, st);
    const t = w.top - p.top, l = w.left - p.left;
    return {
      clip: `inset(${t}px ${p.width - l - w.width}px ${p.height - t - w.height}px ${l}px round 16px)`,
      move: `translate(${w.left - v.left}px, ${w.top - v.top}px) scale(${w.width / v.width})`,
    };
  };

  // La ventana se abre hasta ser el panel y el vídeo viaja a su sitio (antes de pintar: sin parpadeos)
  useLayoutEffect(() => {
    const st = stage.current, pn = panel.current, sl = slot.current;
    const to = phase === 'open' && flip.current === 'open' && active ? toWindow(active) : null;
    if (to && st && pn && sl) {
      flip.current = null;
      const opts = { duration: OPEN_MS, easing: EASE };
      stageAnim.current?.cancel();
      stageAnim.current = st.animate([{ height: `${gridH.current}px` }, { height: `${st.offsetHeight}px` }], opts);
      pn.animate([{ clipPath: to.clip }, { clipPath: 'inset(0px 0px 0px 0px round 28px)' }], opts);
      sl.animate([{ transform: to.move }, { transform: 'none' }], opts);
      // en móvil el panel puede quedar por encima de la pantalla: se lleva a la vista
      later(() => {
        const top = pn.getBoundingClientRect().top;
        if (top < 70 || top > window.innerHeight * 0.6) window.scrollBy({ top: top - 90, behavior: 'smooth' });
      }, OPEN_MS);
    }
    if (phase === 'back' && st) {
      stageAnim.current?.cancel();                   // la altura vuelve a ser la de las tarjetas
      stageAnim.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de fase
  }, [phase]);

  // Al abrir, el foco va al título del panel (sin mover la página); al cambiar de misión se queda donde está.
  // Al volver, a la tarjeta de la misión que estaba abierta (cuando ya está habilitada otra vez).
  useEffect(() => {
    if (phase === 'open') titleRef.current?.focus({ preventScroll: true });
    if (phase === 'grid' && refocus.current) {
      cards.current.get(refocus.current)?.focus({ preventScroll: true });
      refocus.current = null;
    }
  }, [phase]);

  // ---------- Volver a las tarjetas ----------
  const close = useCallback(() => {
    if (phase !== 'open') return;
    const id = picked;
    const back = () => {
      setActive(null); setDown(false); setPhase('back');
      refocus.current = id;
      later(() => { setPhase('grid'); setPicked(null); }, BACK_MS);
    };
    const st = stage.current, pn = panel.current, sl = slot.current, g = grid.current;
    const to = !reduced.current && active ? toWindow(active, true) : null;
    if (!to || !st || !pn || !sl || !g) { back(); return; }   // sin coreografía
    setPhase('closing');                            // el contenido se desvanece
    const opts = { duration: CLOSE_MS, easing: EASE, fill: 'forwards' as const };
    stageAnim.current?.cancel();
    stageAnim.current = st.animate([{ height: `${st.offsetHeight}px` }, { height: `${g.offsetHeight}px` }], opts);
    pn.animate([{ clipPath: 'inset(0px 0px 0px 0px round 28px)' }, { clipPath: to.clip }], opts);
    sl.animate([{ transform: 'none' }, { transform: to.move }], opts).finished.then(back, back);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toWindow solo lee refs
  }, [phase, picked, active, later]);

  useEffect(() => {
    if (phase !== 'open') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, close]);

  // Cambiar de misión sin cerrar el panel (el contenido entra otra vez, sin espera). Al cerrar, el panel
  // vuelve a la tarjeta de la misión que esté abierta en ese momento.
  const switchTo = (id: MisionId) => {
    if (id === active) return;
    window.gtag?.('event', 'mision_cloudy', { mision: id });
    setFirst(false); setActive(id); setPicked(id);
  };

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); } else { v.pause(); setPaused(true); }
  };

  const m = active ? byId(active) : null;
  const open = phase === 'open' || phase === 'closing';

  return (
    <div className={s.missions}>
      <Mascot down={down} />

      <div className={s.head}>
        <div>
          <p className={s.eyebrow}>{misiones.eyebrow}</p>
          <h2 className={s.title}>{misiones.title} <span className={s.mark}>{misiones.highlight}</span></h2>
        </div>
        <p className={s.lead}>{misiones.text}</p>
      </div>

      <div ref={stage} className={s.stage}>
        {/* las tarjetas no se desmontan: con el panel abierto quedan ocultas detrás (para volver a su sitio) */}
        <div ref={grid} className={s.grid} data-phase={phase} data-hidden={open || undefined} aria-hidden={open || undefined}>
            {ITEMS.map((it, i) => {
              const k = ITEMS.filter(x => x.id !== picked).findIndex(x => x.id === it.id);
              return (
                <Card
                  key={it.id} m={it} i={i} k={k} picked={picked === it.id}
                  disabled={phase !== 'grid'} hidden={open}
                  onChoose={() => choose(it.id)}
                  windowRef={el => { if (el) windows.current.set(it.id, el); else windows.current.delete(it.id); }}
                  buttonRef={el => { if (el) cards.current.set(it.id, el); else cards.current.delete(it.id); }}
                  canPreview={() => !reduced.current && window.matchMedia('(hover: hover) and (pointer: fine)').matches}
                />
              );
            })}
        </div>

        {m && open && (
          <div
            ref={panel} id="mision-panel" className={s.panel} style={vars(m)}
            data-phase={phase} role="region" aria-labelledby="mision-titulo"
          >
            <div className={s.bar}>
              <div className={s.pills} role="group" aria-label="Elige otra misión">
                {ITEMS.map(it => (
                  <button
                    key={it.id} type="button" className={s.pill} style={vars(it)}
                    aria-pressed={it.id === m.id} onClick={() => switchTo(it.id)}
                  ><span className={s.long}>{it.card.title}</span><span className={s.short}>{it.short}</span></button>
                ))}
              </div>
              <button type="button" className={s.close} onClick={close} aria-label={misiones.close}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <div className={s.media}>
              <div ref={slot} className={s.slot}>
                <video
                  key={m.id} ref={video} className={s.video} src={m.video.src} poster={m.video.poster}
                  muted loop playsInline autoPlay={!paused} preload="auto" aria-label={m.video.label}
                  width={1284} height={716}
                />
              </div>
              <button type="button" className={s.pp} onClick={togglePlay} aria-label={paused ? 'Reproducir el vídeo' : 'Pausar el vídeo'}>
                {paused
                  ? <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
                  : <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>}
              </button>
            </div>

            <div key={m.id} className={s.content} data-enter style={{ ['--d0' as string]: first ? '0.42s' : '0.04s' }}>
              <p className={`${s.dEyebrow} ${s.reveal}`} style={{ ['--i' as string]: 0 }}>{m.detail.eyebrow}</p>
              <h3 id="mision-titulo" ref={titleRef} tabIndex={-1} className={s.dTitle}>
                {m.detail.title.map((l, i) => <span key={l} className={s.ln}><span style={{ ['--i' as string]: i + 1 }}>{l}</span></span>)}
                <span className={s.ln}><span className={s.mark} style={{ ['--i' as string]: m.detail.title.length + 1 }}>{m.detail.highlight}</span></span>
              </h3>
              <p className={`${s.dText} ${s.reveal}`} style={{ ['--i' as string]: 4 }}>{m.detail.text}</p>
              <div className={s.plans}>
                {m.plans.map((p, i) => <PlanCard key={p.name} p={p} i={i} delay={first ? 900 : 300} animate={!reduced.current} />)}
              </div>
              <p className={`${s.foot} ${s.reveal}`} style={{ ['--i' as string]: 8 }}>
                <span>{misiones.note}</span>
                <Link href={m.detail.more.href}>{m.detail.more.label} <Arrow /></Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Tarjeta de misión ----------
type CardProps = {
  m: Mision; i: number; k: number; picked: boolean; disabled: boolean; hidden: boolean;
  onChoose: () => void;
  windowRef: (el: HTMLElement | null) => void; buttonRef: (el: HTMLButtonElement | null) => void;
  canPreview: () => boolean;
};

function Card({ m, i, k, picked, disabled, hidden, onChoose, windowRef, buttonRef, canPreview }: CardProps) {
  const vid = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (hidden) vid.current?.pause(); }, [hidden]);
  // al pasar el ratón, la ventana se anima con el vídeo de la misión (se descarga la primera vez)
  const enter = () => {
    const v = vid.current;
    if (!v || !canPreview()) return;
    if (!v.getAttribute('src')) v.src = m.video.src;
    v.play().catch(() => {});
  };
  const leave = () => { vid.current?.pause(); };
  return (
    <button
      ref={buttonRef} type="button" className={`${s.card} ${picked ? s.picked : ''}`}
      style={{ ...vars(m), ['--k' as string]: Math.max(k, 0), ['--rot' as string]: i === 0 ? '-6deg' : i === 2 ? '6deg' : '0deg' }}
      onClick={onChoose} onPointerEnter={enter} onPointerLeave={leave}
      aria-controls="mision-panel" aria-describedby={`mision-${m.id}-texto`} aria-disabled={disabled || undefined} tabIndex={hidden ? -1 : undefined}
    >
      <span ref={windowRef} className={s.window}>
        {/* eslint-disable-next-line @next/next/no-img-element -- la portada es el primer fotograma del vídeo: mismo tamaño y recorte */}
        <img src={m.video.poster} alt="" width={1284} height={716} loading="lazy" decoding="async" />
        <video ref={vid} muted loop playsInline preload="none" aria-hidden="true" className={playing ? s.on : ''}
          onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        <span className={s.num}>Misión {m.num}</span>
      </span>
      <span className={s.body}>
        <span className={s.cardTitle}>{m.card.title}</span>
        <span className={s.go} aria-hidden="true"><Arrow /></span>
        <span id={`mision-${m.id}-texto`} className={s.cardText}>{m.card.text}</span>
        <span className={s.teaser}>2 planes · desde {euros(desde(m))} €</span>
      </span>
    </button>
  );
}

// ---------- Plan (el precio cuenta hasta su valor al aparecer) ----------
function PlanCard({ p, i, delay, animate }: { p: Plan; i: number; delay: number; animate: boolean }) {
  const [n, setN] = useState(animate ? 0 : p.price);
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    const t0 = performance.now() + delay + i * 120, dur = 900;
    const tick = (t: number) => {
      const x = Math.min(1, Math.max(0, (t - t0) / dur));
      setN(p.price * (1 - Math.pow(1 - x, 3)));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, delay, i, p.price]);
  const dec = Number.isInteger(p.price) ? 0 : 2;
  const shown = new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  return (
    <article className={`${s.plan} ${p.featured ? s.featured : ''}`} style={{ ['--i' as string]: i }}>
      <div className={s.planHead}>
        <h4 className={s.planName}>{p.name}</h4>
        {p.tag && <span className={s.tag}>{p.tag}</span>}
      </div>
      <p className={s.planText}>{p.text}</p>
      <p className={s.price} aria-label={`${p.from ? 'Desde ' : ''}${euros(p.price)} € ${p.unit.replace('/', 'por ')}`}>
        {p.from && <span className={s.from} aria-hidden="true">desde</span>}
        <span className={s.amount} aria-hidden="true">{shown}<small> €</small></span>
        <span className={s.unit} aria-hidden="true">{p.unit}</span>
      </p>
      <ul className={s.feats}>
        {p.features.map(f => <li key={f}><span className={s.check}><Check /></span>{f}</li>)}
      </ul>
      <Link href={p.cta.href} className={s.cta}>{p.cta.label}</Link>
    </article>
  );
}
