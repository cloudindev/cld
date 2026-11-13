// Compara la posición (x, y, ancho) de los textos del original (volcado de measure.mjs) con la réplica.
// Uso: node tools/landmarks.mjs <slug> <ancho> [--all]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');
const [slug, w] = process.argv.slice(2);
const W = Number(w);
const all = process.argv.includes('--all');
const pathOf = s => s === 'home' ? '/' : '/' + s.replace(/__/g, '/') + '/';

// Original: filas «texto» del volcado
const orig = [];
for (const line of fs.readFileSync(path.join(ROOT, '_inventory/measure', slug, `${W}.txt`), 'utf8').split('\n')) {
  if (line.includes('vis:hidden') || line.includes('split-inner')) continue;
  const m = line.match(/@(-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+).*«(.+)»/);
  if (!m) continue;
  const [, x, y, ww, h, t] = m;
  if (+y < 0) continue;
  orig.push({ t: t.trim().slice(0, 40).toLowerCase(), x: +x, y: +y, w: +ww, h: +h });
}

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(OUT, p); if (p.endsWith('/')) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const ext = path.extname(f);
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }[ext] ?? '' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: W < 500 ? 844 : 900 } });
await page.route(/googletagmanager/, r => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}${pathOf(slug)}`, { waitUntil: 'networkidle' });
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 1500)); });
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
await page.waitForTimeout(600);
const rep = await page.evaluate(() => {
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    if (!own) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    out.push({ t: own.slice(0, 40).toLowerCase(), x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height });
  }
  return out;
});
await browser.close(); server.close();

const used = new Set();
let prev = null;
for (const o of orig) {
  let best = null;
  for (let i = 0; i < rep.length; i++) {
    if (used.has(i)) continue;
    const r = rep[i];
    if (r.t !== o.t && !(o.t.length > 6 && (r.t.startsWith(o.t.slice(0, 12)) || o.t.startsWith(r.t.slice(0, 12))))) continue;
    if (!best || Math.abs(r.y - o.y) < Math.abs(best.r.y - o.y)) best = { r, i };
  }
  if (!best) { console.log(`  ¿?  ${o.t.padEnd(40)} orig y=${o.y.toFixed(1)}`); continue; }
  used.add(best.i);
  const dy = best.r.y - o.y, dx = best.r.x - o.x, dw = best.r.w - o.w;
  const flag = Math.abs(dy) > 1.5 || Math.abs(dx) > 1.5 || Math.abs(dw) > 2 ? '!!' : '  ';
  if (all || flag === '!!' || prev === null || Math.abs(dy - prev) > 1.5)
    console.log(`${flag} ${o.t.padEnd(40)} y ${o.y.toFixed(1).padStart(8)} dy ${dy.toFixed(1).padStart(7)}  dx ${dx.toFixed(1).padStart(6)}  dw ${dw.toFixed(1).padStart(6)}  dh ${(best.r.h - o.h).toFixed(1)}`);
  prev = dy;
}
