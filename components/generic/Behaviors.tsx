'use client';
// Interacciones de las páginas extraídas: acordeones (collapse), pestañas, contadores,
// fechas relativas y envío de formularios a submitContact(). Sin librerías.
import { useEffect } from 'react';
import { submitContact } from '@/lib/submitContact';
import { relativeDate } from '@/lib/relativeDate';

export function Behaviors({ scope }: { scope: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`.${scope}`);
    if (!root) return;
    const cleanups: (() => void)[] = [];
    const on = (el: Element, ev: string, fn: (e: Event) => void) => { el.addEventListener(ev, fn); cleanups.push(() => el.removeEventListener(ev, fn)); };

    // ---- Acordeones: el disparador apunta a #id del panel ----
    const panels = [...root.querySelectorAll<HTMLElement>('[data-b="collapse"]')];
    const initiallyOpen = new Set(panels.filter(p => p.dataset.open === '1'));
    panels.forEach(p => { p.hidden = !initiallyOpen.has(p); });
    root.querySelectorAll<HTMLElement>('[data-b="toggle"]').forEach(tg => {
      const sel = tg.dataset.target ?? '';
      const panel = sel.startsWith('#') ? root.querySelector<HTMLElement>(sel) : null;
      if (!panel) return;
      tg.setAttribute('aria-expanded', String(!panel.hidden));
      tg.setAttribute('aria-controls', panel.id);
      on(tg, 'click', e => {
        e.preventDefault();
        const open = panel.hidden;
        // Comportamiento de acordeón: al abrir uno se cierran los demás del mismo grupo
        const group = tg.closest('[class]')?.parentElement?.parentElement;
        group?.querySelectorAll<HTMLElement>('[data-b="collapse"]').forEach(o => { if (o !== panel && !o.hidden) { o.hidden = true; root.querySelector(`[data-target="#${o.id}"]`)?.setAttribute('aria-expanded', 'false'); } });
        panel.hidden = !open;
        tg.setAttribute('aria-expanded', String(open));
        tg.classList.toggle('is-open', open);
      });
    });

    // ---- Pestañas ----
    root.querySelectorAll<HTMLElement>('[data-b="tab"]').forEach(tab => {
      on(tab, 'click', e => {
        const href = tab.getAttribute('href');
        if (!href?.startsWith('#')) return;
        const pane = root.querySelector<HTMLElement>(href);
        if (!pane) return;
        e.preventDefault();
        pane.parentElement?.querySelectorAll<HTMLElement>(':scope > [data-b="tabpane"]').forEach(p => { p.hidden = p !== pane; });
        tab.closest('ul')?.querySelectorAll('[data-b="tab"]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      });
    });

    // ---- Contadores: cuentan hasta el valor al entrar en pantalla ----
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        const el = en.target as HTMLElement;
        const target = el.textContent ?? '';
        const m = target.match(/[\d.,]+/);
        if (!m || window.matchMedia('(prefers-reduced-motion: reduce)').matches) continue;
        const num = parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / 1500);
          el.textContent = target.replace(m[0], String(Math.round(num * (1 - Math.pow(1 - k, 3)))));
          if (k < 1) requestAnimationFrame(step); else el.textContent = target;
        };
        requestAnimationFrame(step);
      }
    });
    root.querySelectorAll('[data-b="counter"]').forEach(el => io.observe(el));
    cleanups.push(() => io.disconnect());

    // ---- Parallax con scroll (GSAP ScrollTrigger en el original): interpola from → to ----
    type Tf = { y?: string; x?: string; scaleX?: number; scaleY?: number; rotationZ?: number };
    const pxv = (v?: string) => (v ? parseFloat(v) : 0);
    const edge = (spec: string, rect: DOMRect, vh: number) => {
      // «top bottom», «bottom-=650px top», «bottom+=0px top»
      const [el = 'top', vp = 'bottom'] = spec.split(' ');
      const m = el.match(/^(top|bottom|center)([+-]=)?(-?[\d.]+)?/);
      const base = m?.[1] === 'bottom' ? rect.bottom : m?.[1] === 'center' ? rect.top + rect.height / 2 : rect.top;
      const off = m?.[2] ? (m[2] === '-=' ? -1 : 1) * parseFloat(m[3] ?? '0') : 0;
      const vpPos = vp === 'top' ? 0 : vp === 'center' ? vh / 2 : vh;
      return base + off - vpPos; // >0: aún no alcanzado
    };
    const pxEls = [...root.querySelectorAll<HTMLElement>('[data-b="parallax"]')];
    if (pxEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const items = pxEls.map(el => ({ el, from: JSON.parse(el.dataset.pxFrom || '{}') as Tf, to: JSON.parse(el.dataset.pxTo || '{}') as Tf, opts: JSON.parse(el.dataset.pxOpts || '{}') as { start?: string; end?: string } }));
      let raf = 0;
      const update = () => {
        raf = 0;
        const vh = window.innerHeight;
        for (const { el, from, to, opts } of items) {
          const prev = el.style.transform; el.style.transform = 'none';
          const rect = el.getBoundingClientRect();
          el.style.transform = prev;
          const a = edge(opts.start ?? 'top bottom', rect, vh);
          const b = edge(opts.end ?? 'bottom top', rect, vh);
          const p = a <= 0 ? Math.min(1, a / (a - b || 1)) : 0;
          const lerp = (f = 0, t = 0) => f + (t - f) * p;
          const y = lerp(pxv(from.y), pxv(to.y)), x = lerp(pxv(from.x), pxv(to.x));
          const sx = lerp(from.scaleX ?? 1, to.scaleX ?? 1), sy = lerp(from.scaleY ?? 1, to.scaleY ?? 1), rz = lerp(from.rotationZ ?? 0, to.rotationZ ?? 0);
          el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rz.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
        }
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); });
    }

    // ---- Fechas relativas («2 semanas ago»), calculadas en el navegador ----
    root.querySelectorAll<HTMLElement>('[data-b="date"][data-datetime]').forEach(el => {
      if (!/ago\s*$/.test(el.textContent ?? '')) return; // solo las fechas que el original muestra relativas
      const txt = relativeDate(el.dataset.datetime!, el.textContent ?? '');
      if (txt) el.textContent = txt;
    });

    // ---- Formularios → submitContact() ----
    root.querySelectorAll<HTMLFormElement>('form[data-b="form"]').forEach(form => {
      on(form, 'submit', async e => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        const out = form.querySelector<HTMLElement>('[data-b="formout"]');
        const res = await submitContact(Object.fromEntries(new FormData(form) as unknown as Iterable<[string, string]>));
        if (out) { out.hidden = false; out.textContent = res.message; }
      });
    });
    return () => cleanups.forEach(f => f());
  }, [scope]);
  return null;
}
