// Fase 3 · Captura la réplica (out/) en las mismas condiciones que el original y calcula el % de
// píxeles distintos con pixelmatch. Uso:
//   node tools/compare.mjs [--only=home,hosting] [--widths=1440,390] [--threshold=0.1]
// Resultados: _inventory/replica/<slug>/<ancho>.png, diff-<ancho>.png y _inventory/compare.json
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const WIDTHS = (args.widths ? String(args.widths).split(',') : ['1440', '1024', '768', '390']).map(Number);
const THRESHOLD = Number(args.threshold ?? 0.1);
const seo = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/seo.json'), 'utf8'));
let slugs = Object.values(seo).map(e => e.slug);
if (args.only) slugs = String(args.only).split(',');

// ---------- Servidor estático mínimo de out/ (como un hosting con trailingSlash) ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(OUT, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  if (!f.startsWith(OUT) || !fs.existsSync(f)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    return res.end(fs.existsSync(path.join(OUT, '404.html')) ? fs.readFileSync(path.join(OUT, '404.html')) : 'not found');
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}`;

async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(innerHeight * 0.6));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 800));
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 600));
  });
}

function diff(aPath, bPath, outPath) {
  const a = PNG.sync.read(fs.readFileSync(aPath));
  const b = PNG.sync.read(fs.readFileSync(bPath));
  const w = Math.min(a.width, b.width);
  const h = Math.max(a.height, b.height);
  const crop = (img) => { const o = new PNG({ width: w, height: h }); o.data.fill(255); for (let y = 0; y < Math.min(h, img.height); y++) img.data.copy(o.data, y * w * 4, y * img.width * 4, y * img.width * 4 + w * 4); return o; };
  const A = crop(a), B = crop(b), D = new PNG({ width: w, height: h });
  const n = pixelmatch(A.data, B.data, D.data, w, h, { threshold: THRESHOLD, includeAA: false });
  // Píxeles sin contrapartida (diferencia de altura) cuentan como distintos.
  fs.writeFileSync(outPath, PNG.sync.write(D));
  return { pct: +(100 * n / (w * h)).toFixed(2), hOrig: a.height, hRep: b.height };
}

const browser = await chromium.launch();
const results = fs.existsSync(path.join(ROOT, '_inventory/compare.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, '_inventory/compare.json'), 'utf8')) : {};
const pathOf = slug => slug === 'home' ? '/' : '/' + slug.replace(/__/g, '/') + '/';
for (const slug of slugs) {
  const dir = path.join(ROOT, '_inventory/replica', slug);
  await fsp.mkdir(dir, { recursive: true });
  results[slug] ??= {};
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, locale: 'es-ES' });
    const page = await ctx.newPage();
    // Bloquea analítica para que la captura sea determinista y no cuente visitas.
    await page.route(/googletagmanager|google-analytics/, r => r.abort());
    await page.goto(BASE + pathOf(slug), { waitUntil: 'networkidle', timeout: 90000 });
    await autoScroll(page);
    await page.waitForTimeout(2500);
    // Las animaciones CSS de entrada ya han terminado; se quitan antes de capturar porque Chromium
    // no pinta capas animadas fuera del viewport en las capturas a página completa.
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await page.waitForTimeout(200);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const shot = path.join(dir, `${w}.png`);
    await page.screenshot({ path: shot, fullPage: true, clip: { x: 0, y: 0, width: w, height: h }, timeout: 120000 });
    await ctx.close();
    const orig = path.join(ROOT, '_inventory/screens', slug, `${w}.png`);
    if (!fs.existsSync(orig)) { console.log(slug, w, 'sin captura original'); continue; }
    const r = diff(orig, shot, path.join(dir, `diff-${w}.png`));
    results[slug][w] = r;
    console.log(`${slug.padEnd(50)} ${String(w).padStart(5)}  ${String(r.pct).padStart(6)} %  (alto orig ${r.hOrig} / réplica ${r.hRep})`);
  }
}
await browser.close();
server.close();
await fsp.writeFile(path.join(ROOT, '_inventory/compare.json'), JSON.stringify(results, null, 1));
