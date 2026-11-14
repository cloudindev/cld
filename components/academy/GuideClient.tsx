'use client';
// Partes interactivas de las guías: índice con la sección activa, pestañas por plataforma,
// «¿Te ha servido esta guía?» y el botón de copiar de los bloques de código.
import { useEffect, useRef, useState } from 'react';
import s from './Guide.module.css';

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

/** Índice «En esta guía»: marca la sección que se está leyendo */
export function Toc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = Math.min(window.innerHeight * 0.3, 200);   // la sección activa es la última que ha pasado esta altura
      let current = items[0]?.id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= line) current = it.id;
      }
      setActive(current);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <nav className={s.toc} aria-labelledby="toc-titulo">
      <p id="toc-titulo" className={s.tocTitle}>En esta guía</p>
      <ol>
        {items.map(it => (
          <li key={it.id}>
            <a href={`#${it.id}`} aria-current={active === it.id ? 'location' : undefined}>{it.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Pestañas (iPhone / Android…): flechas del teclado para cambiar, como indica ARIA */
export function Tabs({ id, labels, panels }: { id: string; labels: string[]; panels: React.ReactNode[] }) {
  const [sel, setSel] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = labels.length;
    const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setSel(to);
    tabs.current[to]?.focus();
  };
  return (
    <div className={s.tabs}>
      <div role="tablist" aria-label="Elige tu plataforma" className={s.tablist}>
        {labels.map((l, i) => (
          <button
            key={l} ref={el => { tabs.current[i] = el; }} type="button" role="tab"
            id={`${id}-tab-${i}`} aria-controls={`${id}-panel-${i}`} aria-selected={sel === i} tabIndex={sel === i ? 0 : -1}
            onClick={() => setSel(i)} onKeyDown={e => onKey(e, i)}
          >{l}</button>
        ))}
      </div>
      {panels.map((p, i) => (
        <div key={i} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={sel !== i}>{p}</div>
      ))}
    </div>
  );
}

/** «¿Te ha servido esta guía?»: la respuesta se envía a Google Analytics (si está cargado) */
export function Feedback({ guide, ticket, phone, phoneHref }: { guide: string; ticket: string; phone: string; phoneHref: string }) {
  const [vote, setVote] = useState<'si' | 'no' | null>(null);
  const send = (v: 'si' | 'no') => {
    setVote(v);
    window.gtag?.('event', 'valoracion_guia', { guia: guide, util: v });
  };
  return (
    <section className={s.feedback} aria-label="Valora esta guía">
      <div aria-live="polite" className={s.fbText}>
        {vote === null && <h2 className={s.fbTitle}>¿Te ha servido esta guía?</h2>}
        {vote === 'si' && <p className={s.fbTitle}>¡Gracias! Nos alegra que lo hayas resuelto.</p>}
        {vote === 'no' && (
          <>
            <p className={s.fbTitle}>Vaya, lo sentimos. Te ayudamos nosotros:</p>
            <p className={s.fbHelp}>
              <a href={ticket} target="_blank" rel="noopener nofollow">abre un ticket</a> o llámanos gratis al <a href={phoneHref}>{phone}</a>.
            </p>
          </>
        )}
      </div>
      {vote === null && (
        <div className={s.fbBtns}>
          <button type="button" className={s.fbYes} onClick={() => send('si')}>sí, resuelto</button>
          <button type="button" className={s.fbNo} onClick={() => send('no')}>todavía no</button>
        </div>
      )}
    </section>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch { /* sin permiso de portapapeles: no pasa nada, el texto se puede seleccionar */ }
  };
  return (
    <button type="button" className={s.copy} onClick={copy} aria-live="polite">{done ? 'Copiado' : 'Copiar'}</button>
  );
}
