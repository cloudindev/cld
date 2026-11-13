// Fase 1 · Rastreo del original: HTML renderizado, metadatos, enlaces, recursos y capturas.
// Uso: node tools/crawl.mjs [--only=slug1,slug2] [--no-shots] [--concurrency=3]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, '_inventory');
const ORIGIN = 'https://cloudin.pro';
const WIDTHS = [1440, 1024, 768, 390];
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const CONC = Number(args.concurrency || 3);
const MAX_URLS = 300;

const slugOf = u => { const p = new URL(u).pathname.replace(/^\/|\/$/g, ''); return p ? p.replace(/\//g, '__') : 'home'; };

function normalize(href) {
  try {
    const u = new URL(href, ORIGIN);
    if (u.hostname !== 'cloudin.pro' && u.hostname !== 'www.cloudin.pro') return null;
    if (/^\/(wp-admin|wp-json|wp-login|wp-content|wp-includes|xmlrpc|feed)|\/feed\/?$|\/comments\/feed/.test(u.pathname)) return null;
    if (/\.(jpe?g|png|gif|webp|svg|pdf|zip|xml|css|js|mp4|webm|ico)$/i.test(u.pathname)) return null;
    if (u.search) return null;
    let p = u.pathname; if (!p.endsWith('/')) p += '/';
    return ORIGIN + p;
  } catch { return null; }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(innerHeight * 0.6));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
    }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 800));
    scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 600));
  });
}

async function extract(page) {
  return page.evaluate(() => {
    const q = s => document.querySelector(s);
    const metas = {};
    document.querySelectorAll('meta').forEach(m => {
      const k = m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv') || m.getAttribute('charset') && 'charset';
      if (k) (metas[k] ??= []).push(m.getAttribute('content') ?? m.getAttribute('charset'));
    });
    const links = [...document.querySelectorAll('link[rel]')].map(l => ({ rel: l.rel.value, href: l.getAttribute('href'), type: l.type || undefined, sizes: l.getAttribute('sizes') || undefined, hreflang: l.hreflang || undefined }))
      .filter(l => !/stylesheet|preload|preconnect|dns-prefetch|modulepreload/.test(l.rel));
    const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent); } catch { return s.textContent; } });
    const anchors = [...document.querySelectorAll('a[href]')].map(a => ({ href: a.getAttribute('href'), abs: a.href, text: (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 120), target: a.target || undefined, rel: a.rel || undefined }));
    const imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, attrSrc: i.getAttribute('src'), dataSrc: i.dataset.src || i.dataset.lazySrc || undefined, srcset: i.getAttribute('srcset') || i.dataset.srcset || undefined, alt: i.getAttribute('alt'), w: i.naturalWidth, h: i.naturalHeight, width: i.getAttribute('width'), height: i.getAttribute('height') }));
    const bgs = new Set();
    document.querySelectorAll('*').forEach(el => { const b = getComputedStyle(el).backgroundImage; if (b && b !== 'none') (b.match(/url\(["']?([^"')]+)/g) || []).forEach(m => bgs.add(m.replace(/^url\(["']?/, ''))); });
    const videos = [...document.querySelectorAll('video, video source, iframe')].map(v => ({ tag: v.tagName, src: v.currentSrc || v.src || v.getAttribute('src'), poster: v.poster }));
    const forms = [...document.querySelectorAll('form')].map(f => ({ action: f.getAttribute('action'), method: f.method, id: f.id, cls: f.className, fields: [...f.querySelectorAll('input,select,textarea,button')].map(e => ({ tag: e.tagName.toLowerCase(), type: e.type, name: e.name, required: e.required || e.getAttribute('aria-required') === 'true', placeholder: e.placeholder, value: e.tagName === 'SELECT' ? [...e.options].map(o => o.text) : (e.type === 'submit' || e.tagName === 'BUTTON' ? (e.value || e.innerText) : undefined), label: e.labels?.[0]?.innerText?.trim() })) }));
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({ tag: h.tagName, text: h.innerText.trim().replace(/\s+/g, ' ') }));
    return {
      title: document.title, lang: document.documentElement.lang,
      description: q('meta[name="description"]')?.content ?? null,
      canonical: q('link[rel="canonical"]')?.href ?? null,
      robots: q('meta[name="robots"]')?.content ?? null,
      metas, links, jsonld, anchors, imgs, bgs: [...bgs], videos, forms, headings,
      bodyClass: document.body.className,
      docHeight: document.documentElement.scrollHeight,
    };
  });
}

async function processUrl(browser, url, opts) {
  const slug = slugOf(url);
  const dir = path.join(OUT, 'pages', slug);
  const shots = path.join(OUT, 'screens', slug);
  await fs.mkdir(dir, { recursive: true }); await fs.mkdir(shots, { recursive: true });
  const resources = new Map();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'es-ES', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' });
  const page = await ctx.newPage();
  page.on('response', r => { const t = r.request().resourceType(); if (['image', 'font', 'media', 'stylesheet', 'script', 'fetch', 'xhr', 'other'].includes(t)) resources.set(r.url(), { type: t, status: r.status(), ct: r.headers()['content-type'] }); });
  let status = null;
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    status = resp?.status() ?? null;
    const finalUrl = page.url();
    await autoScroll(page);
    await page.waitForTimeout(1500);
    const data = await extract(page);
    data.url = url; data.finalUrl = finalUrl; data.status = status;
    await fs.writeFile(path.join(dir, 'rendered.html'), await page.content());
    if (!opts.noShots) {
      for (const w of WIDTHS) {
        if (w !== 1440) { await page.setViewportSize({ width: w, height: w < 500 ? 844 : 900 }); await page.reload({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await autoScroll(page); await page.waitForTimeout(1500); }
        await page.addStyleTag({ content: '.sb-main,.sb-chat,.grecaptcha-badge{display:none!important}' }).catch(() => {});
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.screenshot({ path: path.join(shots, `${w}.png`), fullPage: true, clip: { x: 0, y: 0, width: w, height: h }, timeout: 120000 }).catch(e => console.log('shot fail', slug, w, e.message));
      }
    }
    data.resources = [...resources].map(([u, v]) => ({ url: u, ...v }));
    await fs.writeFile(path.join(dir, 'data.json'), JSON.stringify(data, null, 1));
    console.log('OK', status, slug, data.title);
    return data;
  } catch (e) {
    console.log('FAIL', slug, e.message.split('\n')[0]);
    await fs.writeFile(path.join(dir, 'error.txt'), String(e.stack));
    return null;
  } finally { await ctx.close(); }
}

const sitemapUrls = [];
for (const s of ['page', 'post']) {
  const x = await fs.readFile(path.join(OUT, `${s}-sitemap.xml`), 'utf8');
  for (const m of x.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)) sitemapUrls.push(m[1]);
}
let queue = [...new Set(sitemapUrls)];
if (args.only) queue = args.only.split(',').map(s => s === 'home' ? ORIGIN + '/' : `${ORIGIN}/${s.replace(/__/g, '/')}/`);
const seen = new Set(queue);
const discovered = {}; // url -> found on
const browser = await chromium.launch();
const results = {};
async function worker() {
  while (queue.length) {
    const url = queue.shift();
    const d = await processUrl(browser, url, { noShots: !!args['no-shots'] });
    results[url] = d ? { title: d.title, status: d.status, finalUrl: d.finalUrl } : { error: true };
    if (d && !args.only) for (const a of d.anchors) {
      const n = normalize(a.abs);
      if (n && !seen.has(n) && seen.size < MAX_URLS) { seen.add(n); queue.push(n); discovered[n] = url; }
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
await browser.close();
if (!args.only) await fs.writeFile(path.join(OUT, 'crawl-index.json'), JSON.stringify({ sitemapUrls, discovered, results }, null, 1));
console.log('DONE', Object.keys(results).length);
