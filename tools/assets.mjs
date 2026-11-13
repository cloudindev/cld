// Fase 1 · Descarga TODOS los recursos propios a /public conservando la ruta original.
// Para imágenes de /wp-content/uploads intenta la versión original (sin sufijo -WxH ni -scaled).
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUB = path.join(ROOT, 'public');
const PAGES = path.join(ROOT, '_inventory/pages');
const ASSET_RE = /\.(jpe?g|png|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|ogg|mp3|json|lottie)(\?|$)/i;

const found = new Map(); // url -> Set(pages)
const add = (u, slug) => {
  if (!u) return;
  try {
    const x = new URL(u.trim(), 'https://cloudin.pro/');
    if (!/^(www\.)?cloudin\.pro$/.test(x.hostname) && x.hostname !== 'fonts.gstatic.com') return;
    if (!ASSET_RE.test(x.pathname)) return;
    if (/\/wp-json\/|admin-ajax/.test(x.pathname)) return;
    const k = x.origin + x.pathname; (found.get(k) ?? found.set(k, new Set()).get(k)).add(slug);
  } catch {}
};

for (const slug of await fs.readdir(PAGES)) {
  let d; try { d = JSON.parse(await fs.readFile(path.join(PAGES, slug, 'data.json'), 'utf8')); } catch { continue; }
  for (const i of d.imgs) { add(i.src, slug); add(i.attrSrc, slug); add(i.dataSrc, slug); (i.srcset || '').split(',').forEach(s => add(s.trim().split(/\s+/)[0], slug)); }
  d.bgs.forEach(b => add(b, slug));
  d.resources.forEach(r => add(r.url, slug));
  d.links.forEach(l => add(l.href, slug));
  Object.entries(d.metas).forEach(([k, v]) => k.includes('image') && v.forEach(x => add(x, slug)));
  // Recursos referenciados en el HTML renderizado (data-src, lottie, json, etc.)
  const html = await fs.readFile(path.join(PAGES, slug, 'rendered.html'), 'utf8');
  for (const m of html.matchAll(/(?:https?:)?\/\/(?:www\.)?cloudin\.pro\/wp-content\/[^"'\s)<>,]+/g)) add(m[0].startsWith('//') ? 'https:' + m[0] : m[0], slug);
  for (const m of html.matchAll(/["'(](\/wp-content\/uploads\/[^"'\s)<>,]+)/g)) add(m[1], slug);
}

const originalOf = u => u.replace(/-\d{2,5}x\d{2,5}(?=\.(jpe?g|png|gif|webp)$)/i, '').replace(/-scaled(?=\.(jpe?g|png|webp)$)/i, '');
const manifest = []; const failed = [];
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/143 Safari/537.36' } });
  if (!r.ok) throw new Error(String(r.status));
  return Buffer.from(await r.arrayBuffer());
}
async function save(url) {
  const u = new URL(url);
  const rel = u.hostname === 'fonts.gstatic.com' ? path.join('fonts/gstatic', u.pathname) : decodeURIComponent(u.pathname);
  const dest = path.join(PUB, rel);
  try { await fs.access(dest); return { rel, cached: true }; } catch {}
  const buf = await get(url);
  await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, buf);
  return { rel, bytes: buf.length };
}

const urls = [...found.keys()];
const extra = new Set();
for (const u of urls) { const o = originalOf(u); if (o !== u && !found.has(o)) extra.add(o); }
const all = [...urls, ...extra];
console.log('candidatos', urls.length, '+ originales', extra.size);
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < all.length) {
    const url = all[i++];
    try { const r = await save(url); manifest.push({ url, ...r, pages: [...(found.get(url) ?? found.get(url.replace(/(\.\w+)$/, '') ) ?? [])], derivedOriginal: extra.has(url) || undefined }); }
    catch (e) { (extra.has(url) ? manifest : failed).push(extra.has(url) ? { url, derivedOriginal: true, missing: e.message } : { url, error: e.message, pages: [...(found.get(url) ?? [])] }); }
  }
}));
manifest.sort((a, b) => a.url.localeCompare(b.url));
await fs.writeFile(path.join(ROOT, '_inventory/assets-manifest.json'), JSON.stringify({ manifest, failed }, null, 1));
console.log('ok', manifest.filter(m => !m.missing).length, 'fallidos', failed.length);
