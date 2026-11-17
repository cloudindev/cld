// Prueba la sección «Hosting para IA» de la home (NOTAS.md, punto 42): sitio en la home, textos y enlace, chip de
// gominola en 3D, placa de circuito (pistas, almohadillas, serigrafía) con la misma cámara que el motor, pulsos solo
// a la vista, saludo al llegar, ráfaga al tocar el chip, arrastre sin ráfaga, movimiento reducido, móvil y consola.
// Uso: node tools/ia/hosting-ia.mjs [firefox]   (web servida en :3000)
import { chromium, firefox } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:3000/';
const useFx = process.argv[2] === 'firefox';
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);
const errors = [];
fs.mkdirSync('_inventory/ia', { recursive: true });

// 1 · los números de la cámara y de las patitas son los mismos en el motor 3D y en la placa
{
  const eng = fs.readFileSync(new URL('../../public/jelly/jelly3d.js', import.meta.url), 'utf8');
  const brd = fs.readFileSync(new URL('../../components/home/aiBoard.ts', import.meta.url), 'utf8');
  const chip = eng.slice(eng.indexOf('  chip: {'), eng.indexOf('\n  },\n', eng.indexOf('  chip: {')));
  const num = (src, re) => { const m = src.match(re); return m ? +m[1] : NaN; };
  const pairs = [
    ['yaw', /yaw: ([-\d.]+)/, /yaw: ([-\d.]+)/], ['elevation', /elevation: ([-\d.]+)/, /elevation: ([-\d.]+)/],
    ['distance', /distance: ([-\d.]+)/, /distance: ([-\d.]+)/], ['scale', /scale: ([-\d.]+)/, /scale: ([-\d.]+)/],
    ['cx', /cx: ([-\d.]+)/, /cx: ([-\d.]+)/], ['cy', /cy: ([-\d.]+)/, /cy: ([-\d.]+)/],
    ['grosor', /thickness: ([-\d.]+)/, /thickness: ([-\d.]+)/], ['fondo', /depth: ([-\d.]+)/, /depth: ([-\d.]+)/],
    ['radio', /radius: ([-\d.]+)/, /radius: ([-\d.]+)/],
    ['separación de patitas', /pitch: ([-\d.]+)/, /pitch: ([-\d.]+)/], ['ancho de patita', /pins: \{[^}]*width: ([-\d.]+)/, /CHIP_PINS = \{[^}]*width: ([-\d.]+)/],
    ['saliente de patita', /pins: \{[^}]*out: ([-\d.]+)/, /CHIP_PINS = \{[^}]*out: ([-\d.]+)/],
  ];
  const bad = pairs.filter(([, a, b]) => !(num(chip, a) === num(brd, b))).map(([n, a, b]) => `${n}: motor ${num(chip, a)} · placa ${num(brd, b)}`);
  ok('La placa usa la misma cámara y las mismas patitas que el motor 3D (SHAPES.chip)', !bad.length && chip.length > 100, bad.join(' | '));
}

async function open(ctxOpts, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...ctxOpts });
  await ctx.route('**/video/hero-cloudin.mp4', r => r.abort());   // el vídeo hero no hace falta aquí
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/google|olabrain|Failed to load resource|RSC payload/i.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  return { ctx, p };
}
// la web usa scroll-behavior: smooth; aquí el salto es instantáneo para medir tiempos
const toSection = p => p.evaluate(() => { const r = document.getElementById('hosting-ia').getBoundingClientRect(); scrollBy({ top: r.top - 70, behavior: 'instant' }); });
const BOARD = '#hosting-ia [class*="_board__"]';
const state = p => p.evaluate(() => {
  const sec = document.getElementById('hosting-ia'), svg = sec.querySelector('[class*="_board__"]'), j = sec.querySelector('.jelly');
  // solo las animaciones de la placa (el lienzo 3D entra con un fundido que no cuenta)
  const anims = document.getAnimations().filter(a => a.playState === 'running' && svg.contains(a.effect?.target ?? null)).length;
  return { live: svg.hasAttribute('data-live'), burst: !!sec.querySelector('[data-burst]'), anims, hop: j.__jelly3d?.hopping ?? null, moved: j.__jelly3d?.moved ?? null };
});

// 2 · escritorio
{
  const { ctx, p } = await open({}, 'escritorio');
  const order = await p.evaluate(() => [...document.querySelectorAll('main > *, body > div > *')].map(e => e.id || (e.className?.toString() ?? '')).filter(Boolean));
  const iM = order.findIndex(c => /Missions_missions/.test(c)), iA = order.indexOf('hosting-ia'), iT = order.findIndex(c => /Think_section/.test(c));
  ok('Va justo después de las misiones y antes de «Piensa como los grandes»', iM >= 0 && iA === iM + 1 && iT === iA + 1, `${iM} ${iA} ${iT}`);
  const t = await p.evaluate(() => {
    const sec = document.getElementById('hosting-ia');
    return {
      h2: sec.querySelector('h2').textContent.replace(/\s+/g, ' ').trim(), labelled: sec.getAttribute('aria-labelledby') === sec.querySelector('h2').id,
      badge: sec.querySelector('p').textContent.trim(), feats: sec.querySelectorAll('li').length,
      cta: sec.querySelector('a.btn-sm')?.getAttribute('href'), alt: sec.querySelector('.jelly-img')?.getAttribute('alt'),
    };
  });
  ok('Titular «Hosting para IA», «Nuevo», 4 ventajas y botón a /contacto/', t.h2 === 'Hosting para IA' && t.labelled && t.badge === 'Nuevo' && t.feats === 4 && t.cta === '/contacto/' && !!t.alt, JSON.stringify(t));
  await p.waitForFunction(() => document.querySelector('#hosting-ia .jelly')?.__jelly3d, null, { timeout: 15000 });
  const b = await p.evaluate(() => {
    const sec = document.getElementById('hosting-ia'), svg = sec.querySelector('[class*="_board__"]'), j = sec.querySelector('.jelly');
    const cls = n => svg.querySelectorAll(`[class*="_${n}__"]`).length;
    const sr = svg.getBoundingClientRect(), jr = j.getBoundingClientRect();
    return { kind: j.__jelly3d.kind, traces: cls('trace'), pads: cls('pad'), vias: cls('via'), silk: svg.querySelectorAll('text').length, pulses: cls('pulse'),
      w: +(sr.width / jr.width).toFixed(3), h: +(sr.height / jr.height).toFixed(3), cx: Math.round(sr.left + sr.width / 2 - (jr.left + jr.width / 2)), cy: Math.round(sr.top + sr.height / 2 - (jr.top + jr.height / 2)) };
  });
  ok('Chip en 3D', b.kind === '3d', b.kind);
  ok('Placa: 16 pistas, almohadillas, taladros y pulsos, y serigrafía', b.traces === 16 && b.pads === 16 && b.vias === 16 && b.pulses === 16 && b.silk === 3, JSON.stringify(b));
  ok('La placa cubre 4 × 3 huecos de la pieza, centrada en ella', b.w === 4 && b.h === 3 && Math.abs(b.cx) <= 1 && Math.abs(b.cy) <= 1, JSON.stringify(b));
  // fuera de pantalla: sin pulsos
  let st = await state(p);
  ok('Fuera de pantalla no corre ningún pulso', !st.live && st.anims === 0, JSON.stringify(st));
  // llegar: saludo (rebote + ráfaga) y pulsos
  await toSection(p); await p.waitForTimeout(250);
  st = await state(p);
  ok('Al llegar a la sección: el chip saluda y corre una ráfaga por las pistas', !!st.hop && st.burst && st.live, JSON.stringify(st));
  await p.waitForTimeout(1700);
  st = await state(p);
  ok('…y luego los pulsos siguen corriendo mientras está a la vista', !st.burst && st.live && st.anims > 0, JSON.stringify(st));
  // tocar el chip (sin arrastrar): ráfaga
  const jb = await p.locator('#hosting-ia .jelly').boundingBox();
  const cxy = [jb.x + jb.width * 0.5, jb.y + jb.height * 0.42];
  await p.mouse.move(...cxy, { steps: 4 }); await p.waitForTimeout(200);
  const hopIn = (await state(p)).hop;
  ok('Llegar con el ratón justo después del saludo no lo repite', !hopIn, JSON.stringify(hopIn));
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(150);
  st = await state(p);
  ok('Al tocar el chip, ráfaga de pulsos', st.burst, JSON.stringify(st));
  await p.waitForTimeout(1600);
  ok('…que se acaba sola', !(await state(p)).burst);
  // arrastrar: se mueve y no hay ráfaga
  await p.mouse.move(...cxy); await p.mouse.down();
  for (let i = 1; i <= 12; i++) { await p.mouse.move(cxy[0] - i * 12, cxy[1] + i * 4); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(200);
  st = await state(p);
  ok('Arrastrar el chip lo mueve y no lanza la ráfaga', st.moved === true && !st.burst, JSON.stringify(st));
  // salir de la sección: se paran los pulsos
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(400);
  st = await state(p);
  ok('Al salir de la vista se paran los pulsos', !st.live && st.anims === 0, JSON.stringify(st));
  await toSection(p); await p.waitForTimeout(600);
  await p.screenshot({ path: '_inventory/ia/escritorio.png' });
  await ctx.close();
}

// 3 · movimiento reducido: placa quieta y sin saludo
{
  const { ctx, p } = await open({ reducedMotion: 'reduce' }, 'reducido');
  await p.waitForFunction(() => document.querySelector('#hosting-ia .jelly')?.__jelly3d, null, { timeout: 15000 });
  await toSection(p); await p.waitForTimeout(300);
  const st = await state(p);
  const shown = await p.evaluate(() => [...document.querySelectorAll('#hosting-ia [class*="_pulse__"]')].some(e => getComputedStyle(e).display !== 'none'));
  ok('Movimiento reducido: sin pulsos ni rebote', st.anims === 0 && !shown && !st.hop, JSON.stringify({ ...st, shown }));
  await ctx.close();
}

// 4 · móvil: apilado (texto y debajo el chip), sin desbordar
{
  const { ctx, p } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: !useFx }, 'móvil');
  await p.waitForFunction(() => document.querySelector('#hosting-ia .jelly')?.__jelly3d, null, { timeout: 15000 });
  await toSection(p); await p.waitForTimeout(500);
  const m = await p.evaluate(() => {
    const sec = document.getElementById('hosting-ia'), copy = sec.querySelector('h2').parentElement, stage = sec.querySelector('.jelly').parentElement;
    const r = sec.getBoundingClientRect(), c = copy.getBoundingClientRect(), s = stage.getBoundingClientRect(), j = sec.querySelector('.jelly').getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, stacked: s.top >= c.bottom - 1, chipInside: j.left >= r.left - 1 && j.right <= r.right + 1, stageH: Math.round(s.height) };
  });
  ok('Móvil: texto arriba, chip debajo y dentro de la tarjeta', m.stacked && m.chipInside && m.left >= 0 && m.right <= m.vw && m.stageH >= 300, JSON.stringify(m));
  await p.screenshot({ path: '_inventory/ia/movil.png', fullPage: false });
  await ctx.close();
}

ok('Sin errores en consola', !errors.length, errors.join(' | '));
await browser.close();
for (const r of results) console.log(r[0], r[1], r[2] ? `· ${r[2]}` : '');
console.log(results.some(r => r[0] === 'MAL') ? 'HAY FALLOS' : 'TODO OK');
