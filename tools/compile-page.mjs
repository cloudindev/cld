// Fase 2 · Convierte _inventory/extract/<slug>.json en:
//   content/pages/<slug>.json  → árbol de contenido literal (textos, enlaces, imágenes, comportamientos)
//   styles/pages/<slug>.css    → CSS propio generado con los valores medidos (1440 base, ≤1199, ≤1023, ≤767)
// Uso: node tools/compile-page.mjs <slug> [...] | --all
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const EX = path.join(ROOT, '_inventory/extract');
let slugs = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (process.argv.includes('--all')) slugs = fs.readdirSync(EX).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));

const LEVELS = [[1440, null], [1024, '(max-width: 1199px)'], [768, '(max-width: 1023px)'], [390, '(max-width: 767px)']];
const INLINE = new Set(['span', 'a', 'b', 'strong', 'em', 'i', 'small', 'u', 'sup', 'sub', 'label', 'abbr', 'mark', 'code', 'time', 'cite', 'q', 's', 'del', 'ins', 'font']);
const DEF_DISPLAY = t => t === 'li' ? 'list-item' : t === 'img' || t === 'svg' || t === 'input' || t === 'select' || t === 'textarea' || t === 'button' || t === 'iframe' || t === 'video' ? 'inline-block' : t === 'table' ? 'table' : t === 'tr' ? 'table-row' : t === 'td' || t === 'th' ? 'table-cell' : t === 'tbody' ? 'table-row-group' : t === 'thead' ? 'table-header-group' : INLINE.has(t) ? 'inline' : 'block';
const FONT = { Poppins: 'var(--font-poppins)', Chivo: 'var(--font-chivo)', Oswald: 'var(--font-oswald)', Montserrat: 'var(--font-montserrat)', 'lqd-essentials': 'var(--ff-lqd-icons)' };
const font = f => FONT[f] ?? (f ? `"${f}", sans-serif` : 'inherit');
const r2 = n => Math.round(n * 100) / 100;
const pxs = n => `${r2(n)}px`;
const TRANSPARENT = new Set(['rgba(0, 0, 0, 0)', 'transparent']);
const localUrl = v => v.replace(/url\("?https?:\/\/(?:www\.)?cloudin\.pro(\/[^")]*)"?\)/g, 'url("$1")');
const RESET = { display: null, position: 'static', top: 'auto', left: 'auto', right: 'auto', bottom: 'auto', 'z-index': 'auto', width: 'auto', 'min-height': '0', height: 'auto', 'margin-top': '0', 'margin-right': '0', 'margin-bottom': '0', 'margin-left': '0', 'padding-top': '0', 'padding-right': '0', 'padding-bottom': '0', 'padding-left': '0', 'border-top': 'none', 'border-right': 'none', 'border-bottom': 'none', 'border-left': 'none', 'border-radius': '0', 'background-color': 'transparent', 'background-image': 'none', 'background-size': 'auto', 'background-position': '0% 0%', 'background-repeat': 'repeat', 'box-shadow': 'none', opacity: '1', 'overflow-x': 'visible', 'overflow-y': 'visible', transform: 'none', filter: 'none', 'backdrop-filter': 'none', 'flex-direction': 'row', 'flex-wrap': 'nowrap', 'justify-content': 'normal', 'align-items': 'normal', 'align-content': 'normal', 'align-self': 'auto', 'flex-grow': '0', 'flex-shrink': '1', 'flex-basis': 'auto', order: '0', 'row-gap': 'normal', 'column-gap': 'normal', 'grid-template-columns': 'none', 'grid-template-rows': 'none', 'object-fit': 'fill', float: 'none', clear: 'none', visibility: 'visible', 'vertical-align': 'baseline', 'text-decoration-line': 'none', 'margin-inline': '0', '-webkit-background-clip': 'border-box', 'background-clip': 'border-box', '-webkit-text-fill-color': 'currentcolor', 'mix-blend-mode': 'normal', 'column-count': 'auto', 'table-layout': 'auto' };
const INHERITED = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'color', 'text-align', 'text-transform', 'white-space', 'text-indent', 'word-break', 'overflow-wrap', 'list-style-type', 'list-style-position', 'border-collapse', 'visibility'];

function declsFor(node, s, ps, parentNode) {
  const d = {};
  const t = node.t;
  if (!s) return d;
  if (s.display === 'none') return { display: 'none' };
  const def = DEF_DISPLAY(t);
  const REPLACED = new Set(['img', 'svg', 'video', 'iframe', 'input', 'select', 'textarea', 'button', 'canvas']);
  const inline = s.display === 'inline' && !REPLACED.has(t);
  if (s.display !== def) d.display = s.display;
  if (s.position !== 'static') {
    d.position = s.position;
    for (const k of ['top', 'left', 'right', 'bottom']) if (s[k] !== 'auto' && !(s.position === 'relative' && s[k] === '0px')) d[k] = s[k];
  }
  if (s.zIndex !== 'auto') d['z-index'] = s.zIndex;
  if (s.float !== 'none') d.float = s.float;
  if (s.clear !== 'none') d.clear = s.clear;
  if (s.visibility !== 'visible' && (!ps || ps.visibility !== s.visibility)) d.visibility = s.visibility;
  if (/flex/.test(s.display)) {
    if (s.flexDirection !== 'row') d['flex-direction'] = s.flexDirection;
    if (s.flexWrap !== 'nowrap') d['flex-wrap'] = s.flexWrap;
    if (s.justifyContent !== 'normal') d['justify-content'] = s.justifyContent;
    if (s.alignItems !== 'normal') d['align-items'] = s.alignItems;
    if (s.alignContent !== 'normal') d['align-content'] = s.alignContent;
  }
  if (/flex|grid/.test(s.display)) {
    if (s.rowGap !== 'normal' && s.rowGap !== '0px') d['row-gap'] = s.rowGap;
    if (s.columnGap !== 'normal' && s.columnGap !== '0px') d['column-gap'] = s.columnGap;
  }
  if (/grid/.test(s.display)) { d['grid-template-columns'] = s.gridTemplateColumns; if (s.gridTemplateRows !== 'none') d['grid-template-rows'] = s.gridTemplateRows; if (s.justifyContent !== 'normal') d['justify-content'] = s.justifyContent; if (s.alignItems !== 'normal') d['align-items'] = s.alignItems; }
  const flexItem = ps && /flex/.test(ps.display) && s.position !== 'absolute';
  if (flexItem) {
    if (s.flexGrow !== '0') d['flex-grow'] = s.flexGrow;
    if (s.flexShrink !== '1') d['flex-shrink'] = s.flexShrink;
    if (s.flexBasis !== 'auto') d['flex-basis'] = /%$/.test(s.flexBasis) ? s.flexBasis : s.flexBasis;
    if (s.alignSelf !== 'auto') d['align-self'] = s.alignSelf;
    if (s.order !== '0') d.order = s.order;
  }
  if (ps && /grid/.test(ps.display)) { if (s.gridColumn !== 'auto' && s.gridColumn !== 'auto / auto') d['grid-column'] = s.gridColumn; if (s.gridRow !== 'auto' && s.gridRow !== 'auto / auto') d['grid-row'] = s.gridRow; }

  // Geometría
  const hasBox = !(s.w === 0 && s.h === 0);
  if (!inline && hasBox && !/^table-(row|row-group|header-group)$/.test(s.display)) {
    const abs = s.position === 'absolute' || s.position === 'fixed';
    const shrink = /^inline-(block|flex|grid)$/.test(s.display) || abs || (ps && (/^inline/.test(ps.display) || ps.position === 'absolute'));
    // Tamaño sin transformaciones: rect fraccional salvo si el elemento está transformado.
    const tr = s.transform !== 'none';
    const w = Math.ceil((tr ? s.ow : s.w) * 100) / 100;
    const h = Math.round((tr ? s.oh : s.h) * 100) / 100;
    if (t === 'img' || t === 'svg' || t === 'iframe' || t === 'video' || t === 'input' || t === 'select' || t === 'textarea' || t === 'button' || abs) { d.width = pxs(w); d.height = pxs(h); }
    else {
      const pct = s.pcw > 0 ? Math.ceil((w / s.pcw) * 1000000) / 10000 : 100;
      const fills = Math.abs(w - s.pcw) < 0.6;
      const textual = (node.kids ?? []).some(k => typeof k === 'string' && k.trim());
      if (flexItem && textual && s.flexGrow === '0' && s.flexBasis === 'auto') { /* tamaño por contenido */ }
      else if (shrink && textual && /^inline-/.test(s.display) && s.position !== 'absolute') { /* ancho por contenido: evita saltos de línea por subpíxeles */ }
      else if (shrink) d.width = pxs(w);
      else if (!(fills && !flexItem && /block|list-item|flex|grid|table/.test(s.display))) d.width = `${pct}%`;
      d['min-height'] = pxs(h);
    }
  }
  const [mt, mr, mb, ml] = s.margin;
  // Centrado: por márgenes simétricos o por posición (algunos contenedores del tema reportan margen 0)
  const offL = ps ? s.x - ps.x - ps.padding[3] - (parseFloat((ps.border[3] ?? '0')) || 0) : 0;
  const colFlexChild = flexItem && ps && /column/.test(ps.flexDirection) && /normal|stretch/.test(ps.alignItems) && s.alignSelf === 'auto';
  const posCentered = ps && !inline && (!flexItem || colFlexChild) && /static|relative/.test(s.position) && s.pcw - s.w > 2 && Math.abs(offL - (s.pcw - s.w) / 2) < 1 && ml === 0 && mr === 0 && !/^inline/.test(s.display) && (!/flex|grid/.test(ps.display) || colFlexChild);
  const centered = posCentered || (!inline && !flexItem && ml > 0 && Math.abs(ml - mr) < 0.6 && s.pcw > 0 && Math.abs(s.pcw - s.w - ml - mr) < 1.2 && s.position !== 'absolute');
  if (mt) d['margin-top'] = pxs(mt);
  if (mb) d['margin-bottom'] = pxs(mb);
  if (centered) { d['margin-left'] = 'auto'; d['margin-right'] = 'auto'; }
  else { if (mr) d['margin-right'] = pxs(mr); if (ml) d['margin-left'] = pxs(ml); }
  const P = ['top', 'right', 'bottom', 'left'];
  s.padding.forEach((v, i) => { if (v) d['padding-' + P[i]] = pxs(v); });
  s.border.forEach((v, i) => { if (v) d['border-' + P[i]] = v; });
  if (s.radius !== '0px') d['border-radius'] = s.radius;
  if (!TRANSPARENT.has(s.bg)) d['background-color'] = s.bg;
  if (s.bgImage !== 'none') {
    d['background-image'] = localUrl(s.bgImage);
    if (s.bgSize !== 'auto') d['background-size'] = s.bgSize;
    if (s.bgPos !== '0% 0%') d['background-position'] = s.bgPos;
    if (s.bgRepeat !== 'repeat') d['background-repeat'] = s.bgRepeat;
  }
  if (s.bgClip === 'text') { d['-webkit-background-clip'] = 'text'; d['background-clip'] = 'text'; }
  if (s.textFill && s.textFill !== s.color && (!ps || ps.textFill !== s.textFill)) d['-webkit-text-fill-color'] = s.textFill;
  if (s.shadow !== 'none') d['box-shadow'] = s.shadow;
  if (s.opacity !== '1') d.opacity = s.opacity;
  if (s.overflowX !== 'visible') d['overflow-x'] = s.overflowX;
  if (s.overflowY !== 'visible') d['overflow-y'] = s.overflowY;
  if (s.transform !== 'none') { d.transform = s.transform; if (s.transformOrigin && !/^50% 50%/.test(s.transformOrigin)) d['transform-origin'] = s.transformOrigin; }
  if (s.perspective && s.perspective !== 'none') { d.perspective = s.perspective; if (s.perspectiveOrigin) d['perspective-origin'] = s.perspectiveOrigin; }
  if (s.transformStyle && s.transformStyle !== 'flat') d['transform-style'] = s.transformStyle;
  if (s.backface && s.backface !== 'visible') { d['backface-visibility'] = s.backface; d['-webkit-backface-visibility'] = s.backface; }
  if (s.filter !== 'none') d.filter = s.filter;
  if (s.backdrop && s.backdrop !== 'none') { d['backdrop-filter'] = s.backdrop; d['-webkit-backdrop-filter'] = s.backdrop; }
  if (s.blend !== 'normal') d['mix-blend-mode'] = s.blend;
  if (t === 'img') { if (s.objectFit !== 'fill') d['object-fit'] = s.objectFit; if (s.objectPosition !== '50% 50%') d['object-position'] = s.objectPosition; }
  if (s.verticalAlign !== 'baseline' && !/^(block|flex|grid|list-item)$/.test(s.display)) d['vertical-align'] = s.verticalAlign;
  if (s.columnCount !== 'auto') d['column-count'] = s.columnCount;
  if (s.tableLayout && s.tableLayout !== 'auto') d['table-layout'] = s.tableLayout;
  if (s.fill && (!ps || ps.fill !== s.fill)) d.fill = s.fill;
  if (s.stroke && s.stroke !== 'none') d.stroke = s.stroke;

  // Tipografía (solo lo que no se hereda igual del padre)
  const typo = {
    'font-family': font(s.font), 'font-size': s.fontSize, 'font-weight': s.fontWeight, 'font-style': s.fontStyle,
    'line-height': s.lineHeight, 'letter-spacing': s.letterSpacing, 'word-spacing': s.wordSpacing, color: s.color, 'text-align': s.textAlign,
    'text-transform': s.textTransform, 'white-space': s.whiteSpace, 'text-indent': s.textIndent, 'word-break': s.wordBreak, 'overflow-wrap': s.overflowWrap,
    'list-style-type': s.listStyle, 'list-style-position': s.listStylePos, 'border-collapse': s.borderCollapse,
  };
  const ptypo = ps ? {
    'font-family': font(ps.font), 'font-size': ps.fontSize, 'font-weight': ps.fontWeight, 'font-style': ps.fontStyle,
    'line-height': ps.lineHeight, 'letter-spacing': ps.letterSpacing, 'word-spacing': ps.wordSpacing, color: ps.color, 'text-align': ps.textAlign,
    'text-transform': ps.textTransform, 'white-space': ps.whiteSpace, 'text-indent': ps.textIndent, 'word-break': ps.wordBreak, 'overflow-wrap': ps.overflowWrap,
    'list-style-type': ps.listStyle, 'list-style-position': ps.listStylePos, 'border-collapse': ps.borderCollapse,
  } : null;
  for (const [k, v] of Object.entries(typo)) if (!ptypo || ptypo[k] !== v) d[k] = v;
  if (s.textDecoration !== 'none') { d['text-decoration-line'] = s.textDecoration; d['text-decoration-color'] = s.textDecorationColor; d['text-decoration-style'] = s.textDecorationStyle; }
  return d;
}

function pseudoDecls(p) {
  if (!p) return null;
  const d = {};
  // Clearfix (content vacío + display table): solo hace falta lo estructural
  if ((p.content === '""' || p.content === '" "') && p.display === 'table') return { content: p.content, display: 'table' };
  const SKIP = { display: 'inline', position: 'static', top: 'auto', left: 'auto', right: 'auto', bottom: 'auto', width: 'auto', height: 'auto', margin: '0px', padding: '0px', 'background-color': 'rgba(0, 0, 0, 0)', 'background-image': 'none', 'background-size': 'auto', 'background-position': '0% 0%', 'background-repeat': 'repeat', 'border-radius': '0px', 'box-shadow': 'none', opacity: '1', transform: 'none', 'z-index': 'auto', 'vertical-align': 'baseline', inset: 'auto' };
  for (const [k, v] of Object.entries(p)) {
    if (k === 'font-family') { d[k] = font(v); continue; }
    if (/^border(-top|-right|-bottom|-left)?$/.test(k) && /^0px|none/.test(v)) continue;
    if (k === 'inset') continue;
    if (SKIP[k] === v) continue;
    d[k] = k === 'background-image' ? localUrl(v) : v;
  }
  return d;
}

const css = d => Object.entries(d).map(([k, v]) => `${k}:${v}`).join(';');
const diff = (prev, cur) => {
  const o = {};
  for (const [k, v] of Object.entries(cur)) if (prev[k] !== v) o[k] = v;
  for (const k of Object.keys(prev)) if (!(k in cur)) { if (k === 'display') o.display = cur.display ?? 'revert'; else if (k in RESET) o[k] = RESET[k]; else if (INHERITED.includes(k)) o[k] = 'inherit'; }
  return o;
};

function compile(slug) {
  const raw = JSON.parse(fs.readFileSync(path.join(EX, `${slug}.json`), 'utf8'));
  const { tree, styles } = raw;
  const scope = `.pg-${slug.replace(/[^a-z0-9-]/gi, '-')}`;
  const rules = { 1440: [], 1024: [], 768: [], 390: [] };
  const hiddenEverywhere = n => LEVELS.every(([w]) => styles[w][n.id]?.display === 'none') && n.b !== 'collapse' && n.b !== 'tabpane' && n.b !== 'formout';
  const prune = n => {
    if (typeof n === 'string' || n.t === 'br') return n;
    if (hiddenEverywhere(n)) return null;
    const o = { t: n.t, c: `n${n.id}` };
    if (n.a) { o.a = { ...n.a }; for (const k of ['href', 'data-target']) { const v = o.a[k]; if (typeof v === 'string' && v.startsWith(raw.path + '#')) o.a[k] = v.slice(raw.path.length); } }
    if (n.b) o.b = n.b;
    if (n.open) o.open = 1;
    if (n.html) o.html = n.html;
    if (n.opts) o.opts = n.opts;
    if (n.text != null) o.text = n.text;
    if (n.kids) { const k = n.kids.map(prune).filter(x => x != null); if (k.length) o.kids = k; }
    return o;
  };
  const walk = (n, parent) => {
    if (typeof n === 'string' || n.t === 'br') return;
    let prev = null; let prevB = null; let prevA = null; let prevPh = null;
    for (const [w] of LEVELS) {
      const s = styles[w][n.id];
      const ps = parent ? styles[w][parent.id] : null;
      let d = declsFor(n, s, ps, parent);
      // Paneles colapsados: el estado inicial (abierto/cerrado) lo controla el runtime
      if (n.b === 'collapse' || n.b === 'tabpane') { delete d.display; delete d['min-height']; delete d.height; }
      const sel = `${scope} .n${n.id}`;
      const out = prev ? diff(prev, d) : d;
      if (Object.keys(out).length) rules[w].push(`${sel}{${css(out)}}`);
      prev = d;
      for (const [which, key] of [['before', 'B'], ['after', 'A']]) {
        const pd = pseudoDecls(s?.[which]);
        const pv = key === 'B' ? prevB : prevA;
        if (pd) { const o = pv ? diff(pv, pd) : pd; if (Object.keys(o).length) rules[w].push(`${sel}::${which}{${css(o)}}`); }
        else if (pv) rules[w].push(`${sel}::${which}{content:none}`);
        if (key === 'B') prevB = pd; else prevA = pd;
      }
      if (s?.ph) { const pd = { color: s.ph.color, 'font-family': font(s.ph.font), 'font-size': s.ph.fontSize, 'font-weight': s.ph.fontWeight }; const o = prevPh ? diff(prevPh, pd) : pd; if (Object.keys(o).length) rules[w].push(`${sel}::placeholder{${css(o)};opacity:1}`); prevPh = pd; }
    }
    for (const k of n.kids ?? []) walk(k, n);
  };
  walk(tree, null);
  let out = `/* Generado por tools/compile-page.mjs a partir de estilos computados del original (${raw.path}). No editar a mano. */\n`;
  for (const [w, mq] of LEVELS) {
    if (!rules[w].length) continue;
    out += mq ? `@media ${mq}{\n${rules[w].join('\n')}\n}\n` : rules[w].join('\n') + '\n';
  }
  fs.mkdirSync(path.join(ROOT, 'styles/pages'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'content/pages'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'styles/pages', `${slug}.css`), out);
  const content = { slug, path: raw.path, scope: scope.slice(1), tree: prune(tree) };
  fs.writeFileSync(path.join(ROOT, 'content/pages', `${slug}.json`), JSON.stringify(content));
  console.log(slug, 'css', (out.length / 1024).toFixed(0) + 'KB', 'json', (JSON.stringify(content).length / 1024).toFixed(0) + 'KB');
}
for (const s of slugs) compile(s);
