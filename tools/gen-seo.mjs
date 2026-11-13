// Genera content/seo.json: metadatos SEO literales de cada URL del original (desde _inventory/pages/*/data.json).
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, '_inventory/crawl-index.json'), 'utf8'));
const KEEP = /^(og:|article:|twitter:|author$|google-site-verification$|apple-mobile-web-app-title$)/;
const out = {};
for (const slug of fs.readdirSync(path.join(ROOT, '_inventory/pages'))) {
  const u = new URL('https://cloudin.pro/' + (slug === 'home' ? '' : slug.replace(/__/g, '/') + '/'));
  const r = idx.results[u.href] ?? (slug === 'no-existe-xyz' ? { status: 404, finalUrl: u.href } : { status: 200, finalUrl: u.href });
  const f = path.join(ROOT, '_inventory/pages', slug, 'data.json');
  if (!fs.existsSync(f)) continue;
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const metas = Object.fromEntries(Object.entries(d.metas).filter(([k]) => KEEP.test(k)));
  out[u.pathname] = { slug, status: r.status, finalUrl: r.finalUrl, title: d.title, description: d.description, canonical: d.canonical, robots: d.robots, metas, jsonld: d.jsonld, bodyClass: d.bodyClass };
}
fs.writeFileSync(path.join(ROOT, 'content/seo.json'), JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, 'rutas');
