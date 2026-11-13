// Fase 2 · Vuelca el árbol de layout (cajas + estilos computados relevantes) de una URL del ORIGINAL
// o de la réplica, para poder escribir CSS limpio con valores reales y comparar.
// Uso: node tools/measure.mjs <url> <ancho> [salida.txt] [--json]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const [url, w = '1440', out] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const asJson = process.argv.includes('--json');
const W = Number(w);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, deviceScaleFactor: 1, locale: 'es-ES', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate(async () => {
  const step = Math.max(200, Math.floor(innerHeight * 0.6));
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 800));
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 1500));
});
await page.addStyleTag({ content: '.sb-main,.sb-chat,.grecaptcha-badge{display:none!important}' }).catch(() => {});

const rows = await page.evaluate(() => {
  const SKIP = 'script,style,noscript,link,meta,template,.sb-main,.sb-chat,#modal-1473,.lity';
  const px = v => { const n = parseFloat(v); return Number.isFinite(n) ? +n.toFixed(2) : v; };
  const box4 = (cs, p) => { const a = ['Top', 'Right', 'Bottom', 'Left'].map(s => px(cs[p + s] ?? cs[p.replace('-', '') + s])); return a.every(x => x === 0) ? null : a.join(' '); };
  const rgb = c => { if (!c || c === 'rgba(0, 0, 0, 0)') return null; const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c; const [r, g, b, a] = m[1].split(',').map(s => +s.trim()); const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); return a != null && a < 1 ? `${hex}/${a}` : hex; };
  const out = [];
  const walk = (el, depth, parentCs) => {
    if (el.matches(SKIP)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const r = el.getBoundingClientRect();
    const ownText = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(c => !/^elementor-(element-[0-9a-f]+|repeater|widget-container)$/.test(c)).slice(0, 4).join('.') : '';
    const isEl = el.matches('[data-element_type], .e-con, .e-con-inner, section, header, footer, nav, ul, li, a, button, input, textarea, select, label, form, img, svg, video, canvas, iframe, figure, h1, h2, h3, h4, h5, h6, p, span, i, rs-layer, rs-slide, rs-module');
    const show = (r.width > 0 && r.height > 0) && (isEl || ownText || cs.backgroundImage !== 'none' || rgb(cs.backgroundColor));
    const d = {};
    if (show) {
      d.tag = el.tagName.toLowerCase(); if (el.id) d.id = el.id; if (cls) d.cls = cls;
      d.box = [px(r.left + scrollX), px(r.top + scrollY), px(r.width), px(r.height)];
      const s = [];
      if (ownText || el.matches('input,textarea,button,select,a')) {
        if (!parentCs || ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'color', 'textTransform', 'textAlign', 'fontStyle'].some(k => cs[k] !== parentCs[k]) || ownText)
          s.push(`font:${cs.fontFamily.split(',')[0].replace(/"/g, '')} ${cs.fontWeight} ${px(cs.fontSize)}/${cs.lineHeight === 'normal' ? 'n' : px(cs.lineHeight)}${cs.letterSpacing !== 'normal' && px(cs.letterSpacing) !== 0 ? ' ls' + px(cs.letterSpacing) : ''} ${rgb(cs.color)}${cs.textTransform !== 'none' ? ' ' + cs.textTransform : ''}${cs.textAlign !== 'start' && cs.textAlign !== 'left' ? ' ta-' + cs.textAlign : ''}${cs.fontStyle !== 'normal' ? ' ' + cs.fontStyle : ''}${cs.textDecorationLine !== 'none' ? ' td-' + cs.textDecorationLine : ''}`);
      }
      const bg = rgb(cs.backgroundColor); if (bg) s.push('bg:' + bg);
      if (cs.backgroundImage !== 'none') s.push('bgi:' + cs.backgroundImage.replace(/https?:\/\/(www\.)?cloudin\.pro/g, '').slice(0, 160) + (cs.backgroundSize !== 'auto' ? ` sz:${cs.backgroundSize}` : '') + (cs.backgroundPosition !== '0% 0%' ? ` pos:${cs.backgroundPosition}` : ''));
      const pad = box4(cs, 'padding'); if (pad) s.push('pad:' + pad);
      const mar = box4(cs, 'margin'); if (mar) s.push('mar:' + mar);
      const bw = ['Top', 'Right', 'Bottom', 'Left'].map(k => cs['border' + k + 'Width'] !== '0px' && cs['border' + k + 'Style'] !== 'none' ? `${px(cs['border' + k + 'Width'])} ${cs['border' + k + 'Style']} ${rgb(cs['border' + k + 'Color'])}` : '0');
      if (bw.some(x => x !== '0')) s.push('bd:' + (new Set(bw).size === 1 ? bw[0] : bw.join(' | ')));
      if (cs.borderRadius !== '0px') s.push('r:' + cs.borderRadius);
      if (cs.boxShadow !== 'none') s.push('sh:' + cs.boxShadow);
      if (cs.display.includes('flex') || cs.display.includes('grid')) s.push(`${cs.display} ${cs.flexDirection !== 'row' ? cs.flexDirection : ''} ${cs.flexWrap === 'wrap' ? 'wrap' : ''} jc:${cs.justifyContent} ai:${cs.alignItems}${cs.gap !== 'normal' && cs.gap !== '0px' ? ' gap:' + cs.gap : ''}${cs.display.includes('grid') ? ' cols:' + cs.gridTemplateColumns : ''}`.replace(/\s+/g, ' '));
      if (cs.position !== 'static') s.push(`pos:${cs.position}${cs.position !== 'relative' ? ` t${cs.top} r${cs.right} b${cs.bottom} l${cs.left}` : ''}${cs.zIndex !== 'auto' ? ' z' + cs.zIndex : ''}`);
      if (cs.maxWidth !== 'none') s.push('maxw:' + cs.maxWidth);
      if (cs.opacity !== '1') s.push('op:' + cs.opacity);
      if (cs.transform !== 'none') s.push('tf:' + cs.transform);
      if (cs.overflow !== 'visible') s.push('ov:' + cs.overflow);
      if (cs.objectFit !== 'fill' && el.tagName === 'IMG') s.push('fit:' + cs.objectFit);
      if (cs.visibility !== 'visible') s.push('vis:' + cs.visibility);
      if (cs.filter !== 'none') s.push('filter:' + cs.filter);
      if (el.tagName === 'IMG') s.push('src:' + (el.getAttribute('src') || '').replace(/https?:\/\/(www\.)?cloudin\.pro/, '') + (el.alt ? ` alt="${el.alt}"` : ''));
      if (el.tagName === 'A') s.push('href:' + el.getAttribute('href') + (el.target ? ' target=' + el.target : ''));
      if (el.matches('input,textarea')) s.push(`[${el.type} name=${el.name} ph="${el.placeholder}"]`);
      d.s = s.join(' | ');
      if (ownText) d.t = ownText.slice(0, 140);
      d.depth = depth;
      out.push(d);
    }
    for (const c of el.children) walk(c, show ? depth + 1 : depth, show ? cs : parentCs);
    if (el.shadowRoot) for (const c of el.shadowRoot.children) walk(c, depth + 1, cs);
  };
  walk(document.body, 0, null);
  return { rows: out, h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth };
});
await browser.close();

if (asJson) { await fs.writeFile(out, JSON.stringify(rows)); }
else {
  const txt = [`# ${url} @${W}  docH=${rows.h} scrollW=${rows.sw}`, ...rows.rows.map(r => `${'  '.repeat(r.depth)}${r.tag}${r.id ? '#' + r.id : ''}${r.cls ? '.' + r.cls : ''} @${r.box.join(',')}${r.s ? ' | ' + r.s : ''}${r.t ? ` «${r.t}»` : ''}`)].join('\n');
  if (out) await fs.writeFile(out, txt); else console.log(txt);
}
