// Compara la caja de cada nodo .n<id> de una página generada con la medida del original
// (_inventory/extract/<slug>.json) y lista los primeros nodos donde aparece una diferencia.
// Uso: node tools/nodediff.mjs <slug> <ancho> [máx=25]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');
const [slug, w, max = '25'] = process.argv.slice(2);
const W = Number(w);
const ex = JSON.parse(fs.readFileSync(path.join(ROOT, '_inventory/extract', `${slug}.json`), 'utf8'));
const orig = ex.styles[W];
const meta = {};
(function walk(n, dep, par) { if (typeof n === 'string' || n.t === 'br') return; meta[n.id] = { t: n.t, dep, par }; (n.kids ?? []).forEach(k => walk(k, dep + 1, n.id)); })(ex.tree, 0, null);

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(OUT, p); if (p.endsWith('/')) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }[path.extname(f)] ?? '' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
await page.route(/googletagmanager/, r => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}${ex.path}`, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
await page.waitForTimeout(800);
const rep = await page.evaluate(() => {
  const r0 = document.querySelector('.n0').getBoundingClientRect();
  const o = {};
  for (const el of document.querySelectorAll('[class^="n"], [class*=" n"]')) {
    const m = (el.getAttribute('class') ?? '').match(/(?:^|\s)n(\d+)(?:\s|$)/); if (!m) continue;
    const r = el.getBoundingClientRect();
    o[m[1]] = { x: +(r.left - r0.left).toFixed(2), y: +(r.top - r0.top).toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2), d: getComputedStyle(el).display };
  }
  return o;
});
await browser.close(); server.close();

let shown = 0;
for (const id of Object.keys(orig).sort((a, b) => a - b)) {
  const o = orig[id], r = rep[id];
  if (!o || o.display === 'none') continue;
  if (!r) { continue; }
  const dy = r.y - o.y, dh = r.h - o.h, dx = r.x - o.x, dw = r.w - o.w;
  if (Math.abs(dh) > 1 || Math.abs(dw) > 1 || Math.abs(dx) > 1) {
    const m = meta[id];
    console.log(`${'  '.repeat(Math.min(m?.dep ?? 0, 20))}${m?.t}#n${id} y${o.y} dy${dy.toFixed(1)} dx${dx.toFixed(1)} w${o.w}→${r.w} h${o.h}→${r.h} disp ${o.display}→${r.d}`);
    if (++shown >= Number(max)) break;
  }
}
