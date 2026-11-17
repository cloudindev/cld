'use client';
// «Hosting para IA» (home, debajo de las misiones de Cloudy; ver NOTAS.md, punto 42).
// Tarjeta lila: a la izquierda el titular («HOSTING PARA» e «IA» enorme con el resaltado turquesa de la home), el
// texto, cuatro ventajas y el botón; a la derecha el chip de gominola en 3D (se arrastra y se toca como las piezas
// de los planes) sobre una placa de circuito impreso dibujada en perspectiva en el suelo de la tarjeta.
// Mientras la sección está a la vista corren pulsos de luz por las pistas hacia el chip; al tocarlo, una ráfaga.
// Al llegar la primera vez, y al volver el ratón tras un rato fuera, el chip saluda con un rebote.
// Con «movimiento reducido» la placa queda quieta y el chip no rebota.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { hostingIA as c } from '@/content/home';
import { JellyCloud } from './JellyCloud';
import { board, BOARD_VIEWBOX, type Board as BoardData } from './aiBoard';
import s from './AiHosting.module.css';

const HOP_REST = 3000;   // ms fuera del escenario para que el chip vuelva a saludar al llegar el ratón (como en los planes)
const BURST_MS = 1400;   // duración de la ráfaga de pulsos al tocar el chip

type IconName = (typeof c.features)[number]['icon'];
const ICONS: Record<IconName, React.ReactNode> = {
  gpu: <><rect x="6" y="6" width="12" height="12" rx="2.5" /><path d="M10 2.5V6M14 2.5V6M10 18v3.5M14 18v3.5M2.5 10H6M2.5 14H6M18 10h3.5M18 14h3.5" /><path d="M12 9.2c.3 1.5 1.3 2.5 2.8 2.8-1.5.3-2.5 1.3-2.8 2.8-.3-1.5-1.3-2.5-2.8-2.8 1.5-.3 2.5-1.3 2.8-2.8Z" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2" /></>,
  api: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></>,
  help: <><path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.5A8.5 8.5 0 1 1 20.5 12Z" /><path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 1.9-2.4 3.4M12 16.6h.01" /></>,
};
const Sparkle = () => <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M8 0c.6 3.9 4.1 7.4 8 8-3.9.6-7.4 4.1-8 8-.6-3.9-4.1-7.4-8-8 3.9-.6 7.4-4.1 8-8Z" fill="currentColor" /></svg>;
const Arrow = () => <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** La placa: zócalo, almohadillas, pistas, taladros, componentes, serigrafía y los pulsos que corren hacia el chip. */
function Board({ b, live, burst }: { b: BoardData; live: boolean; burst: number }) {
  return (
    <svg className={s.board} viewBox={BOARD_VIEWBOX} aria-hidden="true" focusable="false" data-live={live ? '' : undefined}>
      <path className={s.socket} d={b.socket} />
      {b.traces.map((d, i) => <path key={i} className={s.trace} d={d} />)}
      {b.pads.map((d, i) => <path key={i} className={s.pad} d={d} />)}
      {b.parts.map((d, i) => <path key={i} className={s.part} d={d} />)}
      {b.vias.map((d, i) => <path key={i} className={s.via} d={d} />)}
      {b.silk.map(t => <text key={t.text} className={s.silk} transform={t.transform} fontSize={t.size}>{t.text}</text>)}
      {/* key: cada toque vuelve a montar los pulsos para que la ráfaga empiece de cero */}
      <g key={burst} className={s.pulses} data-burst={burst > 0 ? '' : undefined}>
        {b.traces.map((d, i) => (
          <g key={i} style={{ '--i': i, '--k': (i * 7) % b.traces.length } as CSSProperties}>
            <path className={s.glow} d={d} pathLength={1} />
            <path className={s.pulse} d={d} pathLength={1} />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function AiHosting() {
  const b = useMemo(() => board(c.silk), []);
  const stage = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);     // a la vista: corren los pulsos
  const [burst, setBurst] = useState(0);       // ráfaga en curso (0 = ninguna); cambia con cada toque
  const [hop, setHop] = useState(0);
  const away = useRef(-Infinity), greeted = useRef(false), burstT = useRef(0);

  const fire = useCallback(() => {
    setBurst(n => n + 1);
    window.clearTimeout(burstT.current);
    burstT.current = window.setTimeout(() => setBurst(0), BURST_MS);
  }, []);

  useEffect(() => {
    const el = stage.current; if (!el) return;
    const io = new IntersectionObserver(entries => {
      const en = entries[0]; if (!en) return;
      setLive(en.isIntersecting);
      // primera vez a la vista: saludo (rebote del chip y ráfaga por las pistas). Cuenta como una llegada: el ratón no
      // vuelve a hacerlo rebotar hasta pasados HOP_REST
      if (en.isIntersecting && !greeted.current) { greeted.current = true; away.current = performance.now(); fire(); setHop(n => n + 1); }
    }, { threshold: 0.45 });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(burstT.current); };
  }, [fire]);

  const arrive = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || performance.now() - away.current < HOP_REST) return;
    setHop(n => n + 1);
  };
  const leave = (e: PointerEvent<HTMLDivElement>) => { if (e.pointerType !== 'touch') away.current = performance.now(); };

  return (
    <section id={c.id} className={s.section} aria-labelledby={`${c.id}-title`}>
      <div className={s.card}>
        <div className={s.copy}>
          <p className={s.badge}><Sparkle /> {c.badge}</p>
          <h2 id={`${c.id}-title`} className={s.title}>
            <span className={s.kicker}>{c.kicker}</span> <span className={s.mark}>{c.title}</span>
          </h2>
          <p className={s.text}>{c.text}</p>
          <ul className={s.features}>
            {c.features.map(f => (
              <li key={f.title} className={s.feature}>
                <span className={s.icon}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[f.icon]}</svg>
                </span>
                <span><strong className={s.fTitle}>{f.title}</strong> <span className={s.fText}>{f.text}</span></span>
              </li>
            ))}
          </ul>
          <Link href={c.cta.href} className={`btn-sm ${s.btn}`}>{c.cta.label} <Arrow /></Link>
        </div>
        <div ref={stage} className={s.stage} onPointerEnter={arrive} onPointerLeave={leave}>
          <JellyCloud image="chip" alt={c.chip.alt} className={s.jelly} hop={hop} onPoke={fire} under={<Board b={b} live={live} burst={burst} />} />
        </div>
      </div>
    </section>
  );
}
