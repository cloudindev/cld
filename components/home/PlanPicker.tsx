'use client';
// Selector Hosting Web / Hosting VPS (tarjetas pastel) + planes de WHMCS debajo.
// Por defecto está seleccionada la primera opción. Los planes llegan ya resueltos desde el build.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { planPicker as c } from '@/content/home';
import type { Plan, PlansResult } from '@/lib/whmcs';
import { JellyCloud } from './JellyCloud';
import s from './PlanPicker.module.css';

type Key = (typeof c.options)[number]['key'];
type Cycle = 'monthly' | 'annually';

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PlanPicker({ plans }: { plans: Record<Key, PlansResult> }) {
  const [sel, setSel] = useState<Key>('web');
  const [cycle, setCycle] = useState<Cycle>('annually');
  // Al elegir una tarjeta, las piezas jelly de las demás vuelven a su sitio
  const [resets, setResets] = useState<Record<Key, number>>({ web: 0, vps: 0 });
  const tabs = useRef<(HTMLDivElement | null)[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const res = plans[sel];
  const opt = c.options.find(o => o.key === sel)!;

  // Ahorro máximo del pago anual frente a 12 mensualidades (para la etiqueta «-X %»)
  const saving = res.ok ? Math.max(0, ...res.plans.map(p => (p.monthly && p.annually ? 1 - p.annually / (p.monthly * 12) : 0))) : 0;
  const hasAnnual = res.ok && res.plans.some(p => p.annually != null);

  const choose = (k: Key, scroll = false) => {
    setSel(k);
    setResets(r => Object.fromEntries(Object.entries(r).map(([key, n]) => [key, key === k ? n : n + 1])) as Record<Key, number>);
    if (scroll) requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const n = (i + (e.key === 'ArrowRight' ? 1 : c.options.length - 1)) % c.options.length;
      choose(c.options[n]!.key); tabs.current[n]?.focus(); e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') { choose(c.options[i]!.key); e.preventDefault(); }
  };

  return (
    <section className={s.section} aria-label="Planes de hosting">
      <div className={s.cards} role="tablist" aria-label="Tipo de hosting">
        {c.options.map((o, i) => (
          <div
            key={o.key}
            ref={el => { tabs.current[i] = el; }}
            role="tab"
            id={`pp-tab-${o.key}`}
            aria-selected={sel === o.key}
            aria-controls="pp-panel"
            tabIndex={sel === o.key ? 0 : -1}
            className={`${s.card} ${s[o.key]} ${sel === o.key ? s.active : ''}`}
            onClick={() => choose(o.key)}
            onKeyDown={e => onKey(e, i)}
          >
            <div className={s.cardBody}>
              <h2 className={s.title}><span className={s.eyebrow}>{o.eyebrow}</span> {o.title}</h2>
              <p className={s.text}>{o.text}</p>
              <span className={`btn-sm ${s.btn}`} onClick={e => { e.stopPropagation(); choose(o.key, true); }}>{o.button}</span>
            </div>
            {o.key === 'web' && <JellyCloud image="web" alt={c.web.alt} className={s.jelly} reset={resets.web} />}
            {o.key === 'vps' && <JellyCloud alt={c.cloud.alt} className={s.jelly} reset={resets.vps} />}
          </div>
        ))}
      </div>

      <div ref={panel} id="pp-panel" role="tabpanel" aria-labelledby={`pp-tab-${sel}`} className={`${s.panel} ${s[sel]}`}>
        <div className={s.panelHead}>
          <div>
            <h3 className={s.panelTitle}>{opt.plansTitle}</h3>
            <p className={s.vat}>{c.vat}</p>
          </div>
          {hasAnnual && (
            <div className={s.toggle} role="radiogroup" aria-label="Ciclo de pago">
              {(['monthly', 'annually'] as const).map(cy => (
                <button key={cy} type="button" role="radio" aria-checked={cycle === cy} className={cycle === cy ? s.on : undefined} onClick={() => setCycle(cy)}>
                  {c.cycles[cy]}
                  {cy === 'annually' && saving >= 0.01 && <span className={s.save}>-{Math.round(saving * 100)} %</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {res.ok && res.plans.length > 0 ? (
          <PlanSlider key={sel} plans={res.plans} cycle={cycle} />
        ) : (
          <p className={s.error}>
            {c.error} <a href={c.errorLink.href} target="_blank" rel="noopener">{c.errorLink.label}</a>
          </p>
        )}
      </div>
    </section>
  );
}

// Carrusel: 4 planes visibles en escritorio; si hay más, se desplaza con flechas (scroll-snap nativo).
function PlanSlider({ plans, cycle }: { plans: Plan[]; cycle: Cycle }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const update = useCallback(() => {
    const t = track.current; if (!t) return;
    setEdge({ start: t.scrollLeft <= 2, end: t.scrollLeft + t.clientWidth >= t.scrollWidth - 2 });
  }, []);
  useEffect(() => {
    update();
    const ro = new ResizeObserver(update);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [update]);
  const go = (dir: 1 | -1) => {
    const t = track.current; if (!t) return;
    const item = t.querySelector('li');
    const step = item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(t).columnGap || '0') : t.clientWidth;
    t.scrollBy({ left: dir * step, behavior: 'smooth' });
  };
  const scrollable = !(edge.start && edge.end);
  return (
    <div className={s.slider}>
      <ul ref={track} className={s.track} onScroll={update}>
        {plans.map(p => <PlanCard key={p.pid} plan={p} cycle={cycle} />)}
      </ul>
      {scrollable && (
        <div className={s.nav}>
          <button type="button" className={s.arrow} aria-label={c.prev} disabled={edge.start} onClick={() => go(-1)}>←</button>
          <button type="button" className={s.arrow} aria-label={c.next} disabled={edge.end} onClick={() => go(1)}>→</button>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan: p, cycle }: { plan: Plan; cycle: Cycle }) {
  const price = cycle === 'monthly' ? p.monthly : p.annually;
  // Primeras líneas de la descripción de WHMCS («Etiqueta: valor» y resto, en su orden)
  const lines = [...p.specs.map(x => `${x.label}: ${x.value}`), ...p.features].slice(0, c.maxFeatures);
  return (
    <li className={s.plan}>
      <h4 className={s.planName}>{p.name}</h4>
      {price != null ? (
        <p className={s.price}>
          <span className={`${s.amount} ${price >= 1000 ? s.long : ''}`}>{p.currency.prefix}{fmt(price)}{p.currency.suffix.trim() ? ` ${p.currency.suffix.trim()}` : ''}</span>
          <span className={s.per}>{cycle === 'monthly' ? c.perMonth : c.perYear}</span>
        </p>
      ) : (
        <p className={s.na}>{c.unavailable}</p>
      )}
      {lines.length > 0 && <ul className={s.features}>{lines.map(f => <li key={f}>{f}</li>)}</ul>}
      <a className={s.order} href={`${p.orderUrl}&billingcycle=${cycle}`} rel="nofollow">{c.order}</a>
    </li>
  );
}
