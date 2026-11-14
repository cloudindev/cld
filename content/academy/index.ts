// Academy (Centro de Ayuda): todas las guías y utilidades para las páginas. Ver NOTAS.md, punto 38.
import { categorias, catBySlug, populares } from './categorias';
import { datos, isDato } from './datos';
import { dominios } from './guias/dominios';
import { hosting } from './guias/hosting';
import { vps } from './guias/vps';
import { correo } from './guias/correo';
import { wordpress } from './guias/wordpress';
import { primerosPasos } from './guias/primeros-pasos';
import type { Block, Category, CatSlug, Guide } from './types';

export * from './types';
export { categorias, categoria, catBySlug, masBuscado, populares } from './categorias';
export { datos } from './datos';

export const guias: Guide[] = [...dominios, ...hosting, ...vps, ...correo, ...wordpress, ...primerosPasos];

export const BASE = '/academy/';
export const SITE = 'https://cloudin.pro';
export const catHref = (c: Category | CatSlug) => `${BASE}${typeof c === 'string' ? c : c.slug}/`;
export const guiaHref = (g: Guide) => `${BASE}${g.cat}/${g.slug}/`;
export const searchHref = (q: string) => `${BASE}buscar/?q=${encodeURIComponent(q)}`;

export const guia = (cat: string, slug: string) => guias.find(g => g.cat === cat && g.slug === slug);
export const guiaBySlug = (slug: string) => guias.find(g => g.slug === slug);
export const guiasDe = (cat: CatSlug) => guias.filter(g => g.cat === cat);

/** Sustituye {dato} por su valor */
export const fill = (text: string) => text.replace(/\{(\w+)\}/g, (m, k: string) => (isDato(k) ? datos[k] : m));

/** Texto sin marcas (buscador, descripciones) */
export const plain = (text: string) =>
  fill(text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1'));

const blockText = (b: Block): string[] => {
  switch (b.type) {
    case 'p': case 'note': return [b.text];
    case 'list': return b.items;
    case 'table': return [...b.head, ...b.rows.flat(), b.note ?? ''];
    case 'steps': return b.steps;
    case 'tabs': return b.tabs.flatMap(t => [t.label, ...t.steps]);
    case 'issues': return b.items.flatMap(i => [i.title, i.text]);
    case 'code': return [b.code];
  }
};

/** Fecha «14 de noviembre de 2026» (se calcula al generar la página) */
export const fecha = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

/** Índice del buscador: lo que necesita la página /academy/buscar/ para buscar en el navegador */
export type SearchDoc = { href: string; title: string; cat: CatSlug; catLabel: string; summary: string; keywords: string; body: string };
export const searchIndex = (): SearchDoc[] =>
  guias.map(g => ({
    href: guiaHref(g),
    title: g.title,
    cat: g.cat,
    catLabel: catBySlug(g.cat).short,
    summary: g.summary,
    keywords: g.keywords.join(' '),
    body: g.sections.flatMap(s => [s.title, ...s.blocks.flatMap(blockText)]).map(plain).join(' '),
  }));

// Comprobaciones al generar el sitio: un enlace roto o un dato que falta en las guías rompe el build
// (así un error al editar el contenido no llega a publicarse).
(function check() {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const hrefs = new Set([BASE, ...categorias.map(catHref), ...guias.map(guiaHref)]);
  for (const g of guias) {
    if (slugs.has(g.slug)) errors.push(`slug repetido: ${g.slug}`);
    slugs.add(g.slug);
    if (!categorias.some(c => c.slug === g.cat)) errors.push(`${g.slug}: categoría ${g.cat} no existe`);
    const ids = g.sections.map(s => s.id);
    if (new Set(ids).size !== ids.length) errors.push(`${g.slug}: ids de sección repetidos`);
    for (const r of g.related) if (!guias.some(x => x.slug === r)) errors.push(`${g.slug}: relacionada ${r} no existe`);
    const text = [g.summary, ...g.sections.flatMap(s => s.blocks.flatMap(blockText))].join('\n');
    for (const [, k = ''] of text.matchAll(/\{(\w+)\}/g)) if (!isDato(k)) errors.push(`${g.slug}: dato {${k}} no existe`);
    for (const [, href = ''] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (href.startsWith('/academy/') && !hrefs.has(href)) errors.push(`${g.slug}: enlace roto ${href}`);
    }
  }
  for (const p of populares) if (!slugs.has(p)) errors.push(`populares: ${p} no existe`);
  if (errors.length) throw new Error(`Academy · contenido con errores:\n${errors.join('\n')}`);
})();
