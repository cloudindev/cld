// Prueba el rebote de las piezas de gominola al pasar el ratón por su tarjeta (home, «Hosting Web» y
// «Hosting VPS»; NOTAS.md, punto 34): rebota la pieza de esa tarjeta, vuelve a su sitio, no se acumula,
// no rebota en táctil ni con «movimiento reducido».
// Uso: node tools/jelly/rebote.mjs [firefox]   (web servida en :3000)
import { chromium, firefox } from 'playwright';

const BASE = 'http://localhost:3000/';
const useFx = process.argv[2] === 'firefox';
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);
const errors = [];

async function open(ctxOpts, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...ctxOpts });
  await ctx.route('**/video/hero-cloudin.mp4', r => r.abort());   // el vídeo hero no hace falta aquí
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/google|olabrain|Failed to load resource|RSC payload/i.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => { const r = document.querySelector('[aria-label="Tipo de hosting"]').getBoundingClientRect(); scrollBy(0, r.top - 120); });
  await p.waitForFunction(() => [...document.querySelectorAll('[role=tab] .jelly')].every(j => j.__jelly3d), null, { timeout: 15000 });
  await p.mouse.move(700, 40);
  await p.waitForTimeout(700);
  return { ctx, p };
}
// punto de la zona del texto de la tarjeta (lejos de la pieza)
const textPoint = async (p, id) => { const b = await p.locator('#pp-tab-' + id).boundingBox(); return [b.x + 110, b.y + b.height - 50]; };
// sigue el rebote de una pieza durante `ms`: altura máxima, si ha terminado y cuánto ha durado
const follow = (p, id, ms) => p.evaluate(([id, ms]) => new Promise(res => {
  const j = document.querySelector(`#pp-tab-${id} .jelly`).__jelly3d, t0 = performance.now();
  let max = 0, seen = !!j.hopping, end = 0;
  const f = () => {
    const s = j.hopping;
    if (s) { seen = true; max = Math.max(max, s.h); } else if (seen && !end) end = performance.now() - t0;
    if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ seen, max: +max.toFixed(3), end: Math.round(end), moved: j.moved });
  };
  requestAnimationFrame(f);
}), [id, ms]);
const hopping = (p, id) => p.evaluate(id => !!document.querySelector(`#pp-tab-${id} .jelly`).__jelly3d.hopping, id);

// ---------------- Ratón ----------------
{
  const { ctx, p } = await open({}, 'ratón');
  for (const id of ['web', 'vps']) {
    const other = id === 'web' ? 'vps' : 'web';
    const [x, y] = await textPoint(p, id);
    const run = follow(p, id, 1400);
    await p.mouse.move(x, y, { steps: 2 });
    const r = await run;
    ok(`Ratón en «${id}»: su pieza rebota y vuelve a quedarse quieta`, r.seen && r.max > 0.05 && r.end > 400 && r.end < 1300 && !r.moved, JSON.stringify(r));
    ok(`Ratón en «${id}»: la otra pieza no se mueve`, !(await hopping(p, other)));
    await p.mouse.move(700, 40);
    await p.waitForTimeout(800);
  }
  // salir y volver a entrar enseguida: no se acumula (un solo rebote, que sigue su curso)
  const [x, y] = await textPoint(p, 'web');
  await p.mouse.move(x, y);
  await p.waitForTimeout(120);
  const t1 = await p.evaluate(() => document.querySelector('#pp-tab-web .jelly').__jelly3d.hopping?.t ?? -1);
  await p.mouse.move(700, 40); await p.mouse.move(x, y);
  await p.waitForTimeout(120);
  const t2 = await p.evaluate(() => document.querySelector('#pp-tab-web .jelly').__jelly3d.hopping?.t ?? -1);
  ok('Entrar y salir deprisa no acumula rebotes', t1 > 0 && t2 > t1 + 0.1, `t ${t1} → ${t2}`);
  await ctx.close();
}

// ---------------- Táctil y movimiento reducido: sin rebote ----------------
{
  const { ctx, p } = await open({ hasTouch: true }, 'táctil');
  const [x, y] = await textPoint(p, 'vps');
  const run = follow(p, 'vps', 700);
  await p.touchscreen.tap(x, y);
  ok('Táctil: al tocar la tarjeta no rebota (se elige)', !(await run).seen && await p.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').id) === 'pp-tab-vps');
  await ctx.close();
}
{
  const { ctx, p } = await open({ reducedMotion: 'reduce' }, 'reducido');
  const [x, y] = await textPoint(p, 'web');
  const run = follow(p, 'web', 700);
  await p.mouse.move(x, y, { steps: 2 });
  ok('Movimiento reducido: no rebota', !(await run).seen);
  await ctx.close();
}

ok('Sin errores en consola', !errors.length, errors.join(' | '));
await browser.close();
for (const r of results) console.log(r[0], r[1], r[2] ? `· ${r[2]}` : '');
console.log(results.some(r => r[0] === 'MAL') ? 'HAY FALLOS' : 'TODO OK');
