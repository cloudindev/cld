'use client';
// Buscador de dominios de la home con Cloudy asomado por encima (antes estaba sobre la raya, encima de las
// misiones). Cloudy sigue el ratón; al escribir mira lo que escribes y lo comenta en su burbuja; al buscar
// dice «¡Voy a buscarlo!», se zambulle detrás del buscador (el borde de colores se ondula) y vuelve a salir.
// El formulario es el de siempre: POST a panel.cloudin.pro en otra pestaña. Ver NOTAS.md, punto 40.
// (/hosting-y-dominios-cloud-empresas/ sigue usando DomainSearch, sin Cloudy.)
import { useCallback, useEffect, useRef, useState } from 'react';
import { domainSearch } from '@/content/home';
import { Mascot, type MascotEngine } from './Mascot';
import d from './DomainSearch.module.css';
import s from './CloudySearch.module.css';

const SAY = {
  hola: '¿Cómo se llamará tu web?',
  foco: '¡Escríbelo aquí! Yo miro.',
  vacio: 'Primero escribe un nombre, ¿vale?',
  voy: '¡Voy a buscarlo!',
  vuelta: 'Te lo he abierto en otra pestaña.',
};
const short = (t: string, n = 24) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

/** Lo que dice Cloudy según lo escrito (la clave cambia solo cuando cambia el tipo de comentario) */
function comment(raw: string): { key: string; text: string } {
  const v = raw.trim().toLowerCase();
  if (!v) return { key: 'foco', text: SAY.foco };
  if (/\s/.test(v)) return { key: 'espacios', text: `Sin espacios: mejor «${short(v.replace(/\s+/g, '-'))}»` };
  return { key: 'nombre', text: `«${short(v.includes('.') ? v : `${v}.com`)}»… ¡suena genial!` };
}

export function CloudySearch() {
  const [say, setSay] = useState<{ key: string; text: string } | null>(null);
  const [down, setDown] = useState(false);
  const engine = useRef<MascotEngine | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => { const t = timers.current; return () => t.forEach(clearTimeout); }, []);

  // Cloudy mira al cursor de texto: posición del carácter donde se escribe (medido con la fuente del campo)
  const lookAtCaret = useCallback(() => {
    const el = input.current, m = engine.current;
    if (!el || !m) return;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const ctx = (canvas.current ??= document.createElement('canvas')).getContext('2d');
    if (!ctx) return;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const pad = parseFloat(cs.paddingLeft) || 0;
    const w = ctx.measureText(el.value.slice(0, el.selectionStart ?? el.value.length)).width - el.scrollLeft;
    m.look(r.left + pad + Math.max(0, Math.min(w, r.width - pad - 8)), r.top + r.height / 2);
  }, []);

  const onType = () => { setSay(comment(input.current?.value ?? '')); lookAtCaret(); };
  const onBlur = () => {
    if (!input.current?.value.trim()) setSay({ key: 'hola', text: SAY.hola });
    engine.current?.look(null);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!input.current?.value.trim()) {
      e.preventDefault();
      input.current?.focus();                      // (el foco dispara su propio comentario: este va después)
      setSay({ key: 'vacio', text: SAY.vacio });
      return;
    }
    // el formulario se envía (otra pestaña) y Cloudy se va «a buscarlo»
    setSay({ key: 'voy', text: SAY.voy });
    later(() => setDown(true), 450);
    later(() => { setDown(false); setSay({ key: 'vuelta', text: SAY.vuelta }); }, 2100);
  };

  return (
    <section className={`${d.section} ${s.section}`} aria-label="Buscar dominio">
      <div className={s.band}>
        {/* titular a la izquierda de Cloudy; es la etiqueta del campo: al pulsarlo se escribe en el buscador */}
        <label htmlFor="dominio-home" className={s.title}>Encuentra tu <span className={s.mark}>dominio</span></label>
        <Mascot
          align="right" line={false} down={down} className={s.mascot}
          onUp={() => later(() => setSay(v => v ?? { key: 'hola', text: SAY.hola }), 900)}
          onEngine={m => { engine.current = m; }}
        >
          <span className={s.bubble} data-show={say ? 'true' : 'false'}>
            <span key={say?.key} className={s.bubbleText}>{say?.text}</span>
          </span>
        </Mascot>
      </div>
      <div className={`${d.box} ${s.box}`} data-splash={down || undefined}>
        <span className={s.line} aria-hidden="true"><span /><span /><span /><span /><span /><span /></span>
        <form className={d.form} action={domainSearch.action} method="post" target="_blank" onSubmit={onSubmit}>
          <input
            ref={input} id="dominio-home" className={d.input} type="text" name="query" size={20}
            placeholder={domainSearch.placeholder} aria-label="Dominio" autoComplete="off" spellCheck={false}
            onFocus={onType} onInput={onType} onKeyUp={lookAtCaret} onClick={lookAtCaret} onBlur={onBlur}
          />{' '}
          <input className={d.submit} type="submit" value={domainSearch.submit} />
        </form>
      </div>
    </section>
  );
}
