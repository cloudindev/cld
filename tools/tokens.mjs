// Fase 1 · Extrae tokens de diseño de estilos COMPUTADOS en el navegador.
// Uso: node tools/tokens.mjs  -> _inventory/tokens-raw.json
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGES = ['/', '/hosting/', '/dominios/', '/cloud/', '/contacto/', '/unete/', '/data-center-espana/', '/diseno-paginas-web-asturias/', '/blog/', '/blog/que-es-la-nube/', '/aviso-legal/'];
const WIDTHS = [1440, 1024, 768, 390];

const browser = await chromium.launch();
const out = { pages: {}, containers: {}, fontsLoaded: null, mediaQueries: {}, cssVars: {} };

for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://cloudin.pro' + p, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } scrollTo(0, 0); });
  await page.waitForTimeout(1500);
  for (const w of WIDTHS) {
    if (w !== 1440) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(800); }
    const r = await page.evaluate(() => {
      const tally = {}; const add = (k, v, ex) => { if (v == null || v === '') return; tally[k] ??= {}; const e = (tally[k][v] ??= { n: 0, ex: [] }); e.n++; if (e.ex.length < 3 && ex) e.ex.push(ex); };
      const desc = el => { const t = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40); return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}${t ? ' «' + t + '»' : ''}`; };
      const texty = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (el.closest('.sb-main,.sb-chat,script,style,noscript,svg')) continue;
        const cs = getComputedStyle(el); const rect = el.getBoundingClientRect();
        if (cs.display === 'none' || cs.visibility === 'hidden' || rect.width === 0) continue;
        const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (ownText) {
          const key = `${cs.fontFamily.split(',')[0].replace(/["']/g, '')} | ${cs.fontWeight} | ${cs.fontSize} / ${cs.lineHeight} | ls ${cs.letterSpacing} | ${cs.textTransform}`;
          add('typeStyles', key, desc(el));
          add('fontFamily', cs.fontFamily, desc(el)); add('fontWeight', cs.fontWeight); add('fontSize', cs.fontSize); add('textColor', cs.color, desc(el));
          if (/^H[1-6]$/.test(el.tagName)) add('headings', `${el.tagName} ${key}`, desc(el));
        }
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') add('bgColor', cs.backgroundColor, desc(el));
        if (cs.backgroundImage.includes('gradient')) add('gradients', cs.backgroundImage, desc(el));
        if (cs.borderRadius !== '0px') add('radius', cs.borderRadius, desc(el));
        if (cs.boxShadow !== 'none') add('shadow', cs.boxShadow, desc(el));
        if (cs.borderTopWidth !== '0px' && cs.borderTopStyle !== 'none') add('border', `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, desc(el));
        if (cs.transitionDuration !== '0s') add('transition', `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`, desc(el));
        if (el.matches('a.elementor-button, .btn, button, input[type=submit], a[class*=btn]')) add('buttons', `${cs.fontFamily.split(',')[0]} ${cs.fontWeight} ${cs.fontSize} | pad ${cs.padding} | r ${cs.borderRadius} | bg ${cs.backgroundColor} | c ${cs.color} | h ${rect.height.toFixed(0)}`, desc(el));
        if (el.matches('.e-con, .elementor-section, section, .e-con-inner, .elementor-container')) { add('sectionPadding', `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`, desc(el)); add('gap', cs.gap); }
      }
      const cont = {};
      for (const sel of ['.container', '.e-con-inner', '.elementor-container', '.lqd-head-container', '.main-header .container', '#lqd-site-content .container', '.elementor-section-boxed > .elementor-container']) {
        const el = document.querySelector(sel); if (el) { const cs = getComputedStyle(el); cont[sel] = { width: el.getBoundingClientRect().width, maxWidth: cs.maxWidth, padding: cs.paddingLeft + ' ' + cs.paddingRight }; }
      }
      const root = getComputedStyle(document.documentElement); const vars = {};
      for (const s of document.styleSheets) { try { for (const r of s.cssRules) if (r.selectorText === ':root' || r.selectorText === 'body') for (const prop of r.style) if (prop.startsWith('--')) vars[prop] = root.getPropertyValue(prop).trim() || r.style.getPropertyValue(prop).trim(); } catch {} }
      const fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight} ${f.style}`);
      return { tally, cont, vars, fonts: [...new Set(fonts)], scrollWidth: document.documentElement.scrollWidth };
    });
    out.pages[`${p} @${w}`] = r.tally; out.containers[`${p} @${w}`] = { ...r.cont, scrollWidth: r.scrollWidth };
    if (w === 1440) { Object.assign(out.cssVars, r.vars); out.fontsLoaded = [...new Set([...(out.fontsLoaded || []), ...r.fonts])]; }
  }
  // Media queries de todas las hojas propias
  const mq = await page.evaluate(async () => {
    const res = {};
    for (const s of document.styleSheets) {
      let rules; try { rules = s.cssRules; } catch { continue; }
      const walk = rs => { for (const r of rs) { if (r.media && r.conditionText) { res[r.conditionText] = (res[r.conditionText] || 0) + 1; } if (r.cssRules) walk(r.cssRules); } };
      walk(rules);
    }
    return res;
  });
  for (const [k, v] of Object.entries(mq)) out.mediaQueries[k] = Math.max(out.mediaQueries[k] || 0, v);
  await ctx.close();
  console.log('tokens', p);
}
await browser.close();

// Agregado global
const agg = {};
for (const [pk, tally] of Object.entries(out.pages)) for (const [k, vals] of Object.entries(tally)) for (const [v, e] of Object.entries(vals)) { agg[k] ??= {}; const a = (agg[k][v] ??= { n: 0, ex: [] }); a.n += e.n; if (a.ex.length < 4) a.ex.push(`${pk}: ${e.ex[0] ?? ''}`); }
const sorted = Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, Object.entries(v).sort((a, b) => b[1].n - a[1].n).slice(0, 80)]));
await fs.writeFile(path.join(ROOT, '_inventory/tokens-raw.json'), JSON.stringify({ aggregate: sorted, containers: out.containers, fontsLoaded: out.fontsLoaded, mediaQueries: out.mediaQueries, cssVars: out.cssVars }, null, 1));
console.log('DONE');
