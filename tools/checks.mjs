// Fase 3 · Comprueba en out/: enlaces internos rotos, recursos cargados desde cloudin.pro y dominios
// externos de los que se cargan recursos (HTML + CSS + JS exportados). Escribe _inventory/checks.json.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else files.push(p); } })(OUT);
const exists = href => {
  const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  if (!clean || clean === '/') return fs.existsSync(path.join(OUT, 'index.html'));
  const f = path.join(OUT, clean);
  return fs.existsSync(f) && fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html'));
};
const broken = [], fromOrigin = new Set(), external = new Set();
for (const f of files.filter(f => /\.(html|css|js)$/.test(f))) {
  const txt = fs.readFileSync(f, 'utf8');
  const rel = '/' + path.relative(OUT, f);
  if (f.endsWith('.html')) {
    for (const m of txt.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
      const h = m[1].replace(/&amp;/g, '&');
      if (h.startsWith('/') && !h.startsWith('//') && !exists(h)) broken.push({ from: rel, href: h });
    }
    // Recursos que el navegador carga: src, srcset, <link href> (excepto canonical/alternate), poster
    for (const m of txt.matchAll(/\s(?:src|poster)="([^"]+)"/g)) classify(m[1], rel);
    for (const m of txt.matchAll(/\ssrcset="([^"]+)"/g)) m[1].split(',').forEach(s => classify(s.trim().split(/\s+/)[0], rel));
    for (const m of txt.matchAll(/<link\b([^>]*)>/g)) { const rl = /rel="([^"]+)"/.exec(m[1])?.[1] ?? ''; const h = /href="([^"]+)"/.exec(m[1])?.[1]; if (h && /stylesheet|preload|icon|apple-touch-icon|manifest|modulepreload/.test(rl)) classify(h, rel); }
  }
  for (const m of txt.matchAll(/url\(["']?([^"')]+)["']?\)/g)) classify(m[1], rel);
}
function classify(u, from) {
  if (!u || u.startsWith('data:') || u.startsWith('/') && !u.startsWith('//')) return;
  try {
    const x = new URL(u.startsWith('//') ? 'https:' + u : u);
    if (/(^|\.)cloudin\.pro$/.test(x.hostname)) fromOrigin.add(`${u} (en ${from})`);
    else if (/^https?:$/.test(x.protocol)) external.add(x.hostname);
  } catch { /* relativo */ }
}
const res = { broken, fromOrigin: [...fromOrigin], external: [...external].sort() };
fs.writeFileSync(path.join(ROOT, '_inventory/checks.json'), JSON.stringify(res, null, 1));
console.log('enlaces rotos', broken.length, '| desde cloudin.pro', res.fromOrigin.length, '| externos', res.external.join(', '));
if (broken.length) console.log(broken.slice(0, 20));
