// Renderizador de páginas extraídas del original (content/pages/<slug>.json).
// Cada nodo conserva su etiqueta semántica, textos, enlaces e imágenes; el aspecto lo da el CSS
// generado en styles/pages/<slug>.css (clases .n<id> dentro de .pg-<slug>).
import Image from 'next/image';
import Link from 'next/link';
import { createElement, type ReactNode } from 'react';
import { Behaviors } from './Behaviors';

export type GNode = {
  t: string; c: string; a?: Record<string, string | number>; b?: string; open?: number;
  kids?: (GNode | string | { t: 'br' })[]; html?: string; opts?: [string, string, boolean][]; text?: string;
};
export type GPage = { slug: string; path: string; scope: string; tree: GNode };

// Formularios: validación nativa (required/type/maxlength) y envío a submitContact() en Behaviors.

const ATTR_MAP: Record<string, string> = { for: 'htmlFor', maxlength: 'maxLength', minlength: 'minLength', colspan: 'colSpan', rowspan: 'rowSpan', allowfullscreen: 'allowFullScreen', frameborder: 'frameBorder', autocomplete: 'autoComplete', playsinline: 'playsInline', autoplay: 'autoPlay', readonly: 'readOnly', viewbox: 'viewBox' };
const BOOL = new Set(['required', 'checked', 'selected', 'multiple', 'allowfullscreen', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'reversed']);
const VOID = new Set(['img', 'input', 'hr', 'source', 'col', 'wbr', 'area', 'embed', 'track']);

function props(n: GNode) {
  const p: Record<string, unknown> = { className: n.c };
  for (const [k, v] of Object.entries(n.a ?? {})) {
    if (k === 'nw' || k === 'nh' || k === 'data-target') continue;
    if (k.startsWith('data-px-')) { p[k] = v; continue; }
    const key = ATTR_MAP[k] ?? (k === 'class' ? 'className' : k);
    if (BOOL.has(k)) { if (k === 'checked') p.defaultChecked = true; else if (k === 'selected') continue; else p[key] = true; continue; }
    if (k === 'value' && (n.t === 'input' && n.a?.type !== 'submit' && n.a?.type !== 'button' && n.a?.type !== 'hidden')) { p.defaultValue = v; continue; }
    p[key] = v;
  }
  if (n.b) p['data-b'] = n.b;
  if (n.a?.['data-target']) p['data-target'] = n.a['data-target'];
  if (n.b === 'date' && n.a?.datetime) p['data-datetime'] = n.a.datetime;
  if (n.b === 'collapse' || n.b === 'tabpane') { p.hidden = !n.open; if (n.open) p['data-open'] = '1'; }
  if (n.b === 'formout') p.hidden = true;
  return p;
}

function render(n: GNode | string | { t: 'br' }, key: number | string): ReactNode {
  if (typeof n === 'string') return n;
  if (n.t === 'br') return <br key={key} />;
  const g = n as GNode;
  const p = props(g);
  p.key = key;
  if (g.b === 'recaptcha') {
    // Marcador del mismo tamaño que reCAPTCHA v2 (304×78): sin backend no se carga el widget real.
    return <div key={key} className={g.c} data-b="recaptcha" role="img" aria-label="reCAPTCHA (marcador)" style={{ width: 304, height: 78, border: '1px solid #d3d3d3', borderRadius: 3, background: '#f9f9f9', display: 'flex', alignItems: 'center', padding: '0 12px', font: '14px Roboto, Arial, sans-serif', color: '#555' }}>reCAPTCHA</div>;
  }
  switch (g.t) {
    case 'img': {
      const src = String(g.a?.src ?? '');
      const w = Number(g.a?.nw) || 1; const h = Number(g.a?.nh) || 1;
      return <Image key={key} className={g.c} src={src} alt={String(g.a?.alt ?? '')} width={w} height={h} title={g.a?.title ? String(g.a.title) : undefined} />;
    }
    case 'svg':
      return createElement('svg', { ...p, dangerouslySetInnerHTML: { __html: g.html ?? '' } });
    case 'select':
      return <select {...(p as object)} key={key} defaultValue={g.opts?.find(o => o[2])?.[0]}>{g.opts?.map(([v, t], i) => <option key={i} value={v}>{t}</option>)}</select>;
    case 'textarea':
      return <textarea {...(p as object)} key={key} defaultValue={g.text ?? ''} />;
    case 'main':
      return <div {...(p as object)} key={key}>{g.kids?.map(render)}</div>;
    case 'a': {
      const href = g.a?.href != null ? String(g.a.href) : undefined;
      if (href && href.startsWith('/') && !href.startsWith('//') && !/\.(jpe?g|png|webp|pdf|mp4|svg)$/i.test(href) && !g.b) {
        const { key: _k, ...rest } = p as Record<string, unknown>;
        return <Link key={key} {...(rest as object)} href={href}>{g.kids?.map(render)}</Link>;
      }
      return createElement('a', p, g.kids?.map(render));
    }
  }
  if (VOID.has(g.t)) return createElement(g.t, p);
  return createElement(g.t, p, g.kids?.map(render));
}

export function GenericPage({ page, before }: { page: GPage; before?: ReactNode }) {
  return (
    <div className={page.scope}>
      {before}
      {render(page.tree, 'root')}
      <Behaviors scope={page.scope} />
    </div>
  );
}
