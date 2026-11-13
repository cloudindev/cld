// Fase 2 · Extrae el contenido de una página del ORIGINAL a content/pages/<slug>.json:
// árbol DOM de <main> (textos literales, enlaces, imágenes locales) + estilos COMPUTADOS por ancho
// (1440 / 1024 / 768 / 390). No se copia ninguna hoja de estilos de Elementor/Bootstrap: solo valores.
// Uso: node tools/extract.mjs <slug> [<slug> ...]   (o --all)
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const WIDTHS = [1440, 1024, 768, 390];
const seo = JSON.parse(await fs.readFile(path.join(ROOT, 'content/seo.json'), 'utf8'));
let slugs = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (process.argv.includes('--all')) slugs = Object.values(seo).map(e => e.slug);
const pathOf = s => s === 'home' ? '/' : '/' + s.replace(/__/g, '/') + '/';

const browser = await chromium.launch();

async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(innerHeight * 0.6));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 1000));
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 1500));
  });
}

// ---------- Código que se ejecuta en el navegador ----------
function tagTree() {
  const SKIP = 'script,style,noscript,template,link,meta,.sb-main,.sb-chat,#modal-1473,.lity,.screen-reader-text,.elementor-screen-only,.grecaptcha-badge,rs-module-wrap';
  const root = document.querySelector('#lqd-site-content') || document.querySelector('main') || document.body;
  // La barra de título de los archivos de categoría está justo antes de <main>: se incorpora al contenido.
  const tb = document.querySelector('.titlebar');
  if (tb && !root.contains(tb)) root.prepend(tb);
  let n = 0;
  const walk = el => {
    if (el.matches(SKIP)) { el.setAttribute('data-x-skip', ''); return; }
    el.setAttribute('data-xid', String(n++));
    if (el.tagName === 'svg' || el.tagName === 'IFRAME' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
    // Texto partido en letras/palabras (SplitText): se trata como texto plano.
    if (el.classList.contains('split-text-applied') || el.querySelector(':scope > .split-inner, :scope > .lqd-words, :scope > .lqd-chars')) { el.setAttribute('data-x-plain', ''); return; }
    for (const c of el.children) walk(c);
  };
  walk(root);
  return n;
}

function snapshot() {
  const root = document.querySelector('[data-xid="0"]');
  const r0 = root.getBoundingClientRect();
  const out = {};
  const px = v => { const f = parseFloat(v); return Number.isFinite(f) ? Math.round(f * 100) / 100 : 0; };
  const fam = f => f.split(',')[0].replace(/["']/g, '').trim();
  const PSEUDO_PROPS = ['content', 'display', 'position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'margin', 'padding', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-radius', 'box-shadow', 'opacity', 'transform', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'text-align', 'z-index', 'vertical-align', 'inset'];
  const pseudo = (el, which) => {
    const cs = getComputedStyle(el, which);
    const c = cs.content;
    if (!c || c === 'none' || c === 'normal') return null;
    if (cs.display === 'none') return null;
    const o = {};
    for (const p of PSEUDO_PROPS) { const v = cs.getPropertyValue(p); if (v) o[p] = v; }
    o['font-family'] = fam(cs.fontFamily);
    return o;
  };
  for (const el of document.querySelectorAll('[data-xid]')) {
    const id = el.dataset.xid;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const parent = el.parentElement;
    const pcs = parent ? getComputedStyle(parent) : null;
    const pcw = parent ? parent.getBoundingClientRect().width - px(pcs.paddingLeft) - px(pcs.paddingRight) - px(pcs.borderLeftWidth) - px(pcs.borderRightWidth) : r.width;
    const s = {
      display: cs.display, position: cs.position, visibility: cs.visibility,
      x: px(r.left - r0.left), y: px(r.top - r0.top), w: px(r.width), h: px(r.height), pcw: px(pcw),
      ow: el.offsetWidth, oh: el.offsetHeight,
      top: cs.top, left: cs.left, right: cs.right, bottom: cs.bottom, zIndex: cs.zIndex,
      flexDirection: cs.flexDirection, flexWrap: cs.flexWrap, justifyContent: cs.justifyContent, alignItems: cs.alignItems,
      alignSelf: cs.alignSelf, alignContent: cs.alignContent, flexGrow: cs.flexGrow, flexShrink: cs.flexShrink, flexBasis: cs.flexBasis, order: cs.order,
      rowGap: cs.rowGap, columnGap: cs.columnGap, gridTemplateColumns: cs.gridTemplateColumns, gridTemplateRows: cs.gridTemplateRows, gridColumn: cs.gridColumn, gridRow: cs.gridRow,
      margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(px),
      padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px),
      border: ['Top', 'Right', 'Bottom', 'Left'].map(k => cs['border' + k + 'Style'] === 'none' || px(cs['border' + k + 'Width']) === 0 ? null : `${px(cs['border' + k + 'Width'])}px ${cs['border' + k + 'Style']} ${cs['border' + k + 'Color']}`),
      radius: cs.borderRadius, bg: cs.backgroundColor, bgImage: cs.backgroundImage, bgSize: cs.backgroundSize, bgPos: cs.backgroundPosition, bgRepeat: cs.backgroundRepeat, bgClip: cs.webkitBackgroundClip || cs.backgroundClip, textFill: cs.webkitTextFillColor,
      shadow: cs.boxShadow, opacity: cs.opacity, overflowX: cs.overflowX, overflowY: cs.overflowY, transform: cs.transform, transformOrigin: cs.transformOrigin, filter: cs.filter, backdrop: cs.backdropFilter, blend: cs.mixBlendMode,
      objectFit: cs.objectFit, objectPosition: cs.objectPosition, float: cs.float, clear: cs.clear, boxSizing: cs.boxSizing,
      font: fam(cs.fontFamily), fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, wordSpacing: cs.wordSpacing,
      color: cs.color, textAlign: cs.textAlign, textTransform: cs.textTransform, textDecoration: cs.textDecorationLine, textDecorationColor: cs.textDecorationColor, textDecorationStyle: cs.textDecorationStyle,
      whiteSpace: cs.whiteSpace, verticalAlign: cs.verticalAlign, listStyle: cs.listStyleType, listStylePos: cs.listStylePosition, textIndent: cs.textIndent, wordBreak: cs.wordBreak, overflowWrap: cs.overflowWrap, textOverflow: cs.textOverflow, columnCount: cs.columnCount, cursor: cs.cursor, outline: cs.outlineStyle !== 'none' ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : null,
      fill: el.tagName === 'svg' || el.closest('svg') ? cs.fill : null, stroke: el.tagName === 'svg' ? cs.stroke : null,
      tableLayout: cs.tableLayout, borderCollapse: cs.borderCollapse,
      perspective: cs.perspective, perspectiveOrigin: cs.perspectiveOrigin, transformStyle: cs.transformStyle, backface: cs.backfaceVisibility,
      before: pseudo(el, '::before'), after: pseudo(el, '::after'),
      ph: el.matches('input,textarea') ? (() => { const p = getComputedStyle(el, '::placeholder'); return { color: p.color, font: fam(p.fontFamily), fontSize: p.fontSize, fontWeight: p.fontWeight }; })() : null,
    };
    out[id] = s;
  }
  return out;
}

function structure() {
  const ORIGIN = location.origin;
  const local = u => {
    if (!u || u.startsWith('#')) return u;
    try {
      const x = new URL(u, location.href);
      if (/^(www\.)?cloudin\.pro$/.test(x.hostname) || x.origin === ORIGIN) return x.pathname + x.search + x.hash;
      return x.href;
    } catch { return u; }
  };
  const KEEP_ATTR = ['id', 'href', 'target', 'rel', 'alt', 'title', 'name', 'type', 'placeholder', 'value', 'required', 'aria-required', 'maxlength', 'minlength', 'size', 'rows', 'cols', 'method', 'action', 'for', 'role', 'aria-label', 'aria-hidden', 'checked', 'selected', 'multiple', 'accept', 'autocomplete', 'pattern', 'min', 'max', 'step', 'datetime', 'colspan', 'rowspan', 'viewBox', 'xmlns', 'width', 'height', 'loading', 'allow', 'allowfullscreen', 'frameborder', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'poster', 'start', 'reversed'];
  const node = el => {
    if (el.hasAttribute('data-x-skip')) return null;
    const tag = el.tagName.toLowerCase();
    const o = { t: tag, id: el.dataset.xid };
    const a = {};
    for (const k of KEEP_ATTR) if (el.hasAttribute(k)) a[k] = el.getAttribute(k);
    if (a.href) a.href = local(a.href);
    if (a.action) a.action = local(a.action);
    if (tag === 'img') {
      const src = el.currentSrc || el.getAttribute('data-src') || el.getAttribute('src');
      a.src = local(src && !src.startsWith('data:') ? src : (el.getAttribute('data-src') || src));
      a.nw = el.naturalWidth; a.nh = el.naturalHeight;
      delete a.loading; delete a.width; delete a.height;
    }
    if (tag === 'source' || tag === 'video' || tag === 'iframe') { const s = el.getAttribute('src') || el.getAttribute('data-src'); if (s) a.src = local(s); }
    if (tag === 'video' && el.currentSrc) a.src = local(el.currentSrc);
    // Comportamientos interactivos
    const cls = typeof el.className === 'string' ? el.className : '';
    if (/\bcollapse\b/.test(cls) && !/navbar-collapse/.test(cls)) { o.b = 'collapse'; if (el.classList.contains('show')) o.open = 1; }
    if (el.matches('[data-bs-toggle="collapse"], [data-toggle="collapse"]')) { o.b = 'toggle'; a['data-target'] = el.getAttribute('data-bs-target') || el.getAttribute('data-target') || el.getAttribute('href'); }
    if (el.matches('.lqd-tabs-nav a, [data-bs-toggle="tab"], [data-toggle="tab"]')) { o.b = 'tab'; }
    if (/\blqd-tabs-pane\b|\btab-pane\b/.test(cls)) { o.b = 'tabpane'; if (/\b(active|show)\b/.test(cls)) o.open = 1; }
    if (el.matches('.lqd-counter-element, [data-enable-counter] .lqd-counter-element span, .lqd-counter-element-value')) o.b = 'counter';
    if (el.matches('.wpcf7-form, form.comment-form')) o.b = 'form';
    if (el.getAttribute('data-parallax') === 'true') { o.b = 'parallax'; a['data-px-from'] = el.getAttribute('data-parallax-from') || '{}'; a['data-px-to'] = el.getAttribute('data-parallax-to') || '{}'; a['data-px-opts'] = el.getAttribute('data-parallax-options') || '{}'; }
    if (el.matches('.wpcf7-response-output')) o.b = 'formout';
    if (el.matches('.g-recaptcha, .wpcf7-recaptcha, [data-sitekey]')) { o.b = 'recaptcha'; return o; }
    if (el.matches('time, .lqd-lp-date, .entry-date, .published')) { o.b = 'date'; a.datetime = el.getAttribute('datetime') || ''; }
    if (Object.keys(a).length) o.a = a;
    if (tag === 'svg') { o.html = el.innerHTML; return o; }
    if (tag === 'select') { o.opts = [...el.options].map(op => [op.value, op.text, op.selected]); return o; }
    if (tag === 'textarea') { o.text = el.value; return o; }
    if (el.hasAttribute('data-x-plain')) { o.kids = [el.textContent.replace(/\s+/g, ' ')]; return o; }
    const kids = [];
    for (const c of el.childNodes) {
      if (c.nodeType === 3) { const t = c.textContent.replace(/\s+/g, ' '); if (t) kids.push(t); }
      else if (c.nodeType === 1) { if (c.tagName === 'BR') kids.push({ t: 'br' }); else { const k = node(c); if (k) kids.push(k); } }
    }
    if (kids.length) o.kids = kids;
    return o;
  };
  const root = document.querySelector('[data-xid="0"]');
  return { tree: node(root), bodyClass: document.body.className };
}

for (const slug of slugs) {
  const t0 = Date.now();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'es-ES', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' });
  const page = await ctx.newPage();
  await page.goto('https://cloudin.pro' + pathOf(slug), { waitUntil: 'networkidle', timeout: 90000 });
  await page.addStyleTag({ content: '.sb-main,.sb-chat,.grecaptcha-badge{display:none!important}' }).catch(() => {});
  await settle(page);
  const count = await page.evaluate(tagTree);
  const styles = {};
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
    await page.waitForTimeout(1200);
    await settle(page);
    await page.evaluate(() => { const st = document.createElement('style'); st.id = 'x-noparallax'; st.textContent = '[data-parallax="true"]{transform:none!important;translate:none!important;scale:none!important;rotate:none!important}'; document.head.append(st); });
    styles[w] = await page.evaluate(snapshot);
    await page.evaluate(() => document.getElementById('x-noparallax')?.remove());
  }
  const { tree, bodyClass } = await page.evaluate(structure);
  await ctx.close();
  const outDir = path.join(ROOT, '_inventory/extract');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, `${slug}.json`), JSON.stringify({ slug, path: pathOf(slug), bodyClass, tree, styles }));
  console.log(slug, count, 'nodos', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await browser.close();
