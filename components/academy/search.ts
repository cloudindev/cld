// Buscador de Academy (en el navegador, sin servidor): puntúa cada guía según dónde aparecen las palabras
// buscadas (título > palabras clave > tema > entradilla > texto). Sin tildes ni mayúsculas, y por comienzo
// de palabra: «migr» encuentra «migrar» y «migración».
import type { SearchDoc } from '@/content/academy';

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const STOP = new Set(
  'de la el en y a o u e mi tu su mis tus sus como con por para un una unos unas los las lo le les del al que se me te es esta este esto hay muy mas sin ya quiero puedo hacer cloudin'.split(' '),
);

export const terms = (q: string) =>
  [...new Set(norm(q).split(/[^a-z0-9@._-]+/).map(t => t.replace(/^[._-]+|[._-]+$/g, '')).filter(t => t.length > 1 && !STOP.has(t)))];

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FIELDS = [['title', 10], ['keywords', 6], ['catLabel', 5], ['summary', 3], ['body', 1]] as const;

type Prepared = { doc: SearchDoc } & Record<(typeof FIELDS)[number][0], string>;
export const prepare = (docs: SearchDoc[]): Prepared[] =>
  docs.map(d => ({ doc: d, title: norm(d.title), keywords: norm(d.keywords), catLabel: norm(d.catLabel), summary: norm(d.summary), body: norm(d.body) }));

function termScore(p: Prepared, t: string) {
  const start = new RegExp(`(^|[^a-z0-9])${esc(t)}`, 'g');
  let score = 0;
  for (const [field, weight] of FIELDS) {
    const hits = p[field].match(start)?.length ?? 0;
    if (hits) score += weight * (1 + Math.min(hits - 1, 3) * 0.25);
    else if (t.length >= 4 && p[field].includes(t)) score += weight * 0.4;   // dentro de una palabra
  }
  return score;
}

export type Result = { doc: SearchDoc; score: number };

/** Guías que contienen todas las palabras; si ninguna las tiene todas, las que tienen alguna (`partial`) */
export function search(index: Prepared[], q: string): { results: Result[]; partial: boolean; terms: string[] } {
  const ts = terms(q);
  if (!ts.length) return { results: [], partial: false, terms: ts };
  const scored = index.map(p => {
    const per = ts.map(t => termScore(p, t));
    return { doc: p.doc, all: per.every(x => x > 0), score: per.reduce((x, y) => x + y, 0) };
  });
  const all = scored.filter(r => r.all);
  const pick = all.length ? all : scored.filter(r => r.score > 0);
  return { results: pick.sort((x, y) => y.score - x.score).map(({ doc, score }) => ({ doc, score })), partial: !all.length && pick.length > 0, terms: ts };
}

/** Trocea un texto marcando los comienzos de palabra que coinciden con lo buscado */
export function highlight(text: string, ts: string[]): { text: string; hit: boolean }[] {
  const n = norm(text);
  if (n.length !== text.length || !ts.length) return [{ text, hit: false }];   // sin correspondencia 1:1, sin marcas
  const re = new RegExp(`(^|[^a-z0-9])(${ts.map(esc).sort((x, y) => y.length - x.length).join('|')})`, 'g');
  const out: { text: string; hit: boolean }[] = [];
  let last = 0;
  for (const m of n.matchAll(re)) {
    const from = m.index + m[1]!.length, to = from + m[2]!.length;
    if (from > last) out.push({ text: text.slice(last, from), hit: false });
    out.push({ text: text.slice(from, to), hit: true });
    last = to;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out;
}
